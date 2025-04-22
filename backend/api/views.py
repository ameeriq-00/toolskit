from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db import transaction
from .models import SiteInformation
from .excel_analyzer import process_excel_files , get_site_info_dict, find_sheet_owner_number, analyze_call_patterns
from .time_analysis import (
    analyze_time_patterns_original,
    analyze_time_patterns_z
)
from .geographic_analysis import analyze_movement_patterns_original, analyze_movement_patterns_z
import pandas as pd
import numpy as np


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    return Response({
        'username': request.user.username,
        'is_staff': request.user.is_staff
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_excel(request):
    if 'file' not in request.FILES:
        return Response({"error": "No file uploaded"}, status=400)

    file = request.FILES['file']
    
    try:
        df = pd.read_excel(file)
        print("Available columns:", df.columns.tolist())  # Debug print
        
        # Get sheet owner number
        sheet_owner_number = find_sheet_owner_number(df, is_z_format=False)
        print(f"Detected sheet owner number: {sheet_owner_number}")

        # Get time analysis results
        time_analysis = analyze_time_patterns_original(df)
        print("Time analysis result:", time_analysis is not None)  # Debug print
        if time_analysis is None:
            print("Time analysis returned None")

        # Get movement analysis results
        movement_analysis = analyze_movement_patterns_original(df)

        # Get call patterns analysis
        call_patterns = analyze_call_patterns(df, sheet_owner_number, is_z_format=False)
        
        results = {
            "filtered_calls": filter_and_aggregate_calls(df),
            "aggregated_caller_numbers": aggregate_by_caller_number(df),
            "imei_usage": aggregate_imei_usage(df),
            "most_visited_sites": summarize_most_visited_sites(df),
            "time_analysis": time_analysis,
            "movement_analysis": movement_analysis,
            "call_patterns": call_patterns
        }
        
        return Response(results)
    except Exception as e:
        print(f"Error in analyze_excel: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_excel_z(request):
    if 'main_file' not in request.FILES or 'imei_file' not in request.FILES:
        return Response({"error": "Both main file and IMEI file are required"}, status=400)

    main_file = request.FILES['main_file']
    imei_file = request.FILES['imei_file']
    
    try:
        # Get site information first
        site_info_dict = get_site_info_dict()  # This function is already defined in excel_analyzer.py
        
        # Process files and get initial results
        results = process_excel_files(main_file, imei_file)
        
        # Get the sheet owner number from the results
        main_df = pd.read_excel(main_file, skiprows=5)
        sheet_owner_number = results.get('sheet_owner_number')
        
        if sheet_owner_number:
            # Pass both sheet_owner_number and site_info_dict
            movement_analysis = analyze_movement_patterns_z(main_df, sheet_owner_number, site_info_dict)
            results['movement_analysis'] = movement_analysis
        
        # Handle NaN values
        def handle_nan(obj):
            if isinstance(obj, dict):
                return {k: handle_nan(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [handle_nan(v) for v in obj]
            elif isinstance(obj, float) and np.isnan(obj):
                return None
            return obj
        
        results = handle_nan(results)
        
        return Response(results)
    except Exception as e:
        print(f"Error in analyze_excel_z: {str(e)}")  # Add debug print
        return Response({"error": str(e)}, status=500)
    
@api_view(['POST'])
@permission_classes([IsAdminUser])
def upload_site_info(request):
    if 'site_info_file' not in request.FILES:
        return Response({"error": "Site information file is required"}, status=400)

    site_info_file = request.FILES['site_info_file']
    
    try:
        df = pd.read_excel(site_info_file)
        
        with transaction.atomic():
            SiteInformation.objects.all().delete()
            
            for _, row in df.iterrows():
                SiteInformation.objects.create(
                    governorate=row['Governorate'],
                    site_enb_id=row['Site/eNBId'],
                    cell_id=row['Cell ID'],
                    site_name=row['Site Name'],
                    latitude=row['lat'],
                    longitude=row['Long'],
                    bore=row['Bore'],
                    lac_cell_id_ecgi=row['LAC_Cell ID/ECGI']
                )
        
        return Response({"message": "Site information uploaded and saved successfully"})
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def number_lookup(request):
    number = request.GET.get('number', '')
    info = f"Information for number: {number}"
    return Response({"number": number, "info": info})



# Helper functions for ExcelAnalyzer
def filter_and_aggregate_calls(df):
    def process_number(number):
        # Convert to string and strip any whitespace
        number_str = str(number).strip()
        # If starts with 964, remove it
        return number_str[3:] if number_str.startswith('964') else number_str

    def is_valid_number(number):
        # Check if all characters are digits
        return str(number).strip().isdigit()

    # First, process all numbers
    df['CALLER_NUMBER'] = df['CALLER_NUMBER'].apply(process_number)
    df['CALLED_NUMBER'] = df['CALLED_NUMBER'].apply(process_number)

    # Filter for numbers that contain only digits
    filtered_df = df[
        (df['CALLER_NUMBER'].apply(is_valid_number)) | 
        (df['CALLED_NUMBER'].apply(is_valid_number))
    ]

    # Aggregate and sort
    call_counts = filtered_df.groupby('CALLER_NUMBER').size().reset_index(name='Number_of_Calls')
    
    # Filter the results again to ensure only numeric values
    call_counts = call_counts[call_counts['CALLER_NUMBER'].apply(is_valid_number)]
    
    # Sort by Number_of_Calls in descending order
    return call_counts.sort_values('Number_of_Calls', ascending=False).to_dict('records')


def aggregate_by_caller_number(df):
    def is_valid_number(number):
        return isinstance(number, str) and not number.startswith('964') and not number.startswith('7')

    valid_numbers = df[df['CALLER_NUMBER'].apply(is_valid_number) | 
                       df['CALLED_NUMBER'].apply(is_valid_number)]

    aggregated = valid_numbers.groupby('CALLER_NUMBER').size().reset_index(name='Number_of_Calls')
    return aggregated.sort_values('Number_of_Calls', ascending=False).to_dict('records')





def aggregate_imei_usage(df):
    try:
        if not pd.api.types.is_datetime64_any_dtype(df['CALL_INITIAL_TIME']):
            df['CALL_INITIAL_TIME'] = pd.to_datetime(df['CALL_INITIAL_TIME'], format='%d/%m/%Y %H:%M:%S', errors='coerce')
        
        # Group by IMEI and count occurrences
        imei_counts = df['CHARGED_MOBILE_USER_IMEI'].value_counts().reset_index()
        imei_counts.columns = ['CHARGED_MOBILE_USER_IMEI', 'Usage_Count']
        
        # Get first and last usage dates for each IMEI
        imei_dates = df.groupby('CHARGED_MOBILE_USER_IMEI').agg({
            'CALL_INITIAL_TIME': ['min', 'max']
        }).reset_index()
        
        imei_dates.columns = ['CHARGED_MOBILE_USER_IMEI', 'First_Use', 'Last_Use']
        
        # Merge counts with dates
        imei_usage = pd.merge(
            imei_counts,
            imei_dates,
            on='CHARGED_MOBILE_USER_IMEI'
        )
        
        # Format the usage period
        imei_usage['Usage_Period'] = imei_usage.apply(
            lambda row: f"{row['First_Use'].strftime('%Y-%m-%d')} to {row['Last_Use'].strftime('%Y-%m-%d')}" 
            if pd.notnull(row['First_Use']) and pd.notnull(row['Last_Use']) 
            else "Unknown", 
            axis=1
        )
        
        # Sort by Last_Use date (most recent first)
        imei_usage = imei_usage.sort_values('Last_Use')
        
        result = imei_usage[['CHARGED_MOBILE_USER_IMEI', 'Usage_Count', 'Usage_Period']].to_dict('records')
        print(f"Found {len(result)} IMEI records with usage counts")
        print("Sample IMEI data:", result[0] if result else "No data")
        
        return result
        
    except Exception as e:
        print(f"Error in aggregate_imei_usage: {str(e)}")
        import traceback
        traceback.print_exc()
        return []



def summarize_most_visited_sites(df):
    """For the original format where CITY is directly available in the Excel sheet"""
    site_visits = df.groupby(['SITE_ID', 'SITE_NAME', 'LAT', 'LON', 'CITY']).size().reset_index(name='Number_of_Visits')
    return site_visits.sort_values('Number_of_Visits', ascending=False).to_dict('records')