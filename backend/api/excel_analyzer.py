import pandas as pd
import numpy as np
from .models import SiteInformation
from .time_analysis import analyze_time_patterns_z
from .geographic_analysis import analyze_movement_patterns_z


def process_excel_files(main_file, imei_file):
    main_df = pd.read_excel(main_file, skiprows=5)
    imei_df = pd.read_excel(imei_file, skiprows=8)
    print("Available columns in Z format:", main_df.columns.tolist())  # Debug print
    
    # Get sheet owner number from most frequent number in calls with is_z_format=True
    sheet_owner_number = find_sheet_owner_number(main_df, is_z_format=True)
    print(f"Detected sheet owner number: {sheet_owner_number}")

    # Get site info dictionary
    site_info = get_site_info_dict()

    # Get movement analysis for Z template
    movement_analysis = analyze_movement_patterns_z(main_df, sheet_owner_number, site_info)

    # Get call patterns analysis
    call_patterns = analyze_call_patterns(main_df, sheet_owner_number, is_z_format=True)

    return {
        "filtered_calls": filter_and_aggregate_calls_new(main_df),
        "aggregated_caller_numbers": aggregate_by_caller_number_new(main_df),
        "imei_usage": aggregate_imei_usage_new(imei_df, sheet_owner_number),
        "most_visited_sites": summarize_most_visited_sites_new(main_df, sheet_owner_number),
        "time_analysis": analyze_time_patterns_z(main_df, sheet_owner_number),
        "movement_analysis": movement_analysis,
        "call_patterns": call_patterns,

    }

def get_site_info_dict():
    """Get site information as a dictionary using the same matching logic"""
    site_info = {}
    try:
        # Get all site information from database
        site_info_objects = SiteInformation.objects.all()
        
        # Create different lookup dictionaries for each matching strategy
        ecgi_dict = {}
        for site in site_info_objects:
            # Store both the original and stripped versions of lac_cell_id_ecgi
            ecgi_str = str(site.lac_cell_id_ecgi).strip()
            site_data = {
                'name': site.site_name,
                'lat': site.latitude,
                'long': site.longitude,
                'governorate': site.governorate  # Added governorate
            }
            ecgi_dict[ecgi_str] = site_data  # Original version
            if ecgi_str.startswith('0'):  # Store version without leading zero
                ecgi_dict[ecgi_str[1:]] = site_data
        
        # Create dictionaries for cell_id matches
        cell_id_dict_5 = {}
        cell_id_dict_4 = {}
        for site in site_info_objects:
            cell_id = str(site.cell_id).strip()
            site_data = {
                'name': site.site_name,
                'lat': site.latitude,
                'long': site.longitude,
                'governorate': site.governorate  # Added governorate
            }
            if len(cell_id) >= 5:
                cell_id_dict_5[cell_id[-5:]] = site_data
            if len(cell_id) >= 4:
                cell_id_dict_4[cell_id[-4:]] = site_data

        print(f"\nPrepared site info lookup dictionaries:")
        print(f"- ECGI matches possible: {len(ecgi_dict)}")
        print(f"- 5-digit cell ID matches possible: {len(cell_id_dict_5)}")
        print(f"- 4-digit cell ID matches possible: {len(cell_id_dict_4)}")

        # Debug print for first few entries of each dictionary
        print("\nSample ECGI entries:")
        for key in list(ecgi_dict.keys())[:2]:
            print(f"ECGI {key}: {ecgi_dict[key]}")

        print("\nSample 5-digit entries:")
        for key in list(cell_id_dict_5.keys())[:2]:
            print(f"5-digit {key}: {cell_id_dict_5[key]}")

        # Combine all dictionaries - ecgi_dict takes precedence, then 5-digit, then 4-digit
        site_info.update(cell_id_dict_4)  # Base layer
        site_info.update(cell_id_dict_5)  # Overwrite with more specific 5-digit matches
        site_info.update(ecgi_dict)       # Overwrite with most specific ECGI matches

        # Verify final dictionary has governorate information
        sample_key = next(iter(site_info), None)
        if sample_key:
            print(f"\nSample entry from final dictionary:")
            print(f"Key: {sample_key}")
            print(f"Data: {site_info[sample_key]}")

        return site_info
    except Exception as e:
        print(f"Error getting site info: {str(e)}")
        import traceback
        traceback.print_exc()
        return {}

def find_sheet_owner_number(df, is_z_format=False):
    """Get sheet owner number from most frequent number in calls"""
    try:
        # Get correct column names based on format
        calling_col = 'Calling Number' if is_z_format else 'CALLER_NUMBER'
        called_col = 'Called Number' if is_z_format else 'CALLED_NUMBER'
        
        # Combine Calling and Called Numbers into a single series
        all_numbers = pd.concat([
            df[calling_col].astype(str),
            df[called_col].astype(str)
        ])
        
        # Count occurrences of each number and find the most frequent
        number_counts = all_numbers.value_counts()
        
        if not number_counts.empty:
            most_frequent_number = number_counts.index[0]
            count = number_counts.iloc[0]
            print(f"Most frequent number {most_frequent_number} appears {count} times")
            return most_frequent_number
        
        return None
    except Exception as e:
        print(f"Error in find_sheet_owner_number: {str(e)}")
        return None

def filter_and_aggregate_calls_new(df):
    def is_valid_number(number):
        # Check if all characters are digits
        return str(number).strip().isdigit()

    # Convert both columns to string type
    df['Calling Number'] = df['Calling Number'].astype(str)
    df['Called Number'] = df['Called Number'].astype(str)

    # Filter for numbers that contain only digits
    filtered_df = df[
        (df['Calling Number'].apply(is_valid_number)) | 
        (df['Called Number'].apply(is_valid_number))
    ]

    # Count calls for valid numbers only
    calling_counts = filtered_df[filtered_df['Calling Number'].apply(is_valid_number)]['Calling Number'].value_counts()
    called_counts = filtered_df[filtered_df['Called Number'].apply(is_valid_number)]['Called Number'].value_counts()
    
    # Combine counts
    call_counts = calling_counts.add(called_counts, fill_value=0)
    
    # Filter to ensure only numeric values
    call_counts = call_counts[call_counts.index.map(is_valid_number)]

    # Convert to final format and sort
    return call_counts.sort_values(ascending=False)\
        .reset_index()\
        .rename(columns={'index': 'Number', 0: 'Number_of_Calls'})\
        .to_dict('records')


def aggregate_by_caller_number_new(df):
    def is_valid_number(number):
        return isinstance(number, str) and not number.startswith('964') and not number.startswith('7')
    
    valid_numbers = df[(df['Calling Number'].apply(is_valid_number)) | (df['Called Number'].apply(is_valid_number))]
    aggregated = valid_numbers['Calling Number'].value_counts().reset_index()
    aggregated.columns = ['Number', 'Number_of_Calls']
    return aggregated.sort_values('Number_of_Calls', ascending=False).to_dict('records')

def aggregate_imei_usage_new(df, sheet_owner_number):
    if not sheet_owner_number:
        print("Warning: Sheet owner number is None. Cannot aggregate IMEI usage.")
        return []

    print(f"Aggregating IMEI usage for sheet owner: {sheet_owner_number}")
    
    # Convert owner number and DataFrame numbers to string
    df['Calling Number'] = df['Calling Number'].astype(str)
    df['Called Number'] = df['Called Number'].astype(str)
    sheet_owner_number = str(sheet_owner_number)
    
    owner_imeis = df[
        ((df['Calling Number'] == sheet_owner_number) & (df['Calling IMEI'].notna())) |
        ((df['Called Number'] == sheet_owner_number) & (df['Called IMEI'].notna()))
    ]['Calling IMEI'].fillna(df['Called IMEI'])

    if owner_imeis.empty:
        print("Warning: No matching IMEI data found for sheet owner")
        return []

    imei_usage = owner_imeis.value_counts().reset_index()
    imei_usage.columns = ['IMEI', 'Usage_Count']
    
    # Calculate first and last use dates
    owner_calls = df[
        (df['Calling Number'] == sheet_owner_number) |
        (df['Called Number'] == sheet_owner_number)
    ]
    
    imei_dates = pd.DataFrame()
    for idx, row in imei_usage.iterrows():
        imei = row['IMEI']
        imei_calls = owner_calls[
            (owner_calls['Calling IMEI'] == imei) |
            (owner_calls['Called IMEI'] == imei)
        ]
        if not imei_calls.empty:
            first_use = imei_calls['Date'].min()
            last_use = imei_calls['Date'].max()
            imei_dates = pd.concat([imei_dates, pd.DataFrame({
                'IMEI': [imei],
                'First_Use': [first_use],
                'Last_Use': [last_use]
            })])

    # Merge usage counts with dates
    imei_usage = pd.merge(imei_usage, imei_dates, on='IMEI')
    
    # Sort by Last_Use date
    imei_usage = imei_usage.sort_values('Last_Use')
    
    imei_usage['Usage_Period'] = imei_usage.apply(
        lambda row: f"{row['First_Use'].strftime('%Y-%m-%d')} to {row['Last_Use'].strftime('%Y-%m-%d')}" 
        if not pd.isna(row['First_Use']) else "Unknown",
        axis=1
    )

    return imei_usage[['IMEI', 'Usage_Count', 'Usage_Period']].to_dict('records')


def normalize_call_type(value):
    """Normalize CALL_TYPE values to handle different formats"""
    if pd.isna(value):
        return None
    
    value = str(value).strip()
    # Add leading zeros if needed
    if value == '1':
        return '001'
    elif value == '2':
        return '002'
    return value

def summarize_most_visited_sites_new(df, sheet_owner_number):
    if not sheet_owner_number:
        print("Warning: Sheet owner number is None. Cannot summarize most visited sites.")
        return []

    # Convert the owner number and DataFrame numbers to string for comparison
    df['Calling Number'] = df['Calling Number'].astype(str)
    df['Called Number'] = df['Called Number'].astype(str)
    df['CALL_TYPE'] = df['CALL_TYPE'].astype(str).str.strip()
    sheet_owner_number = str(sheet_owner_number)

    # Modified relevant calls filtering
    relevant_calls = pd.concat([
        df[(df['Calling Number'] == sheet_owner_number) & df['CALL_TYPE'].str.contains('1', na=False)],
        df[(df['Called Number'] == sheet_owner_number) & df['CALL_TYPE'].str.contains('2', na=False)]
    ])

    if relevant_calls.empty:
        print("Warning: No relevant calls found for sheet owner")
        return []

    site_visits = relevant_calls['Site ID'].value_counts().reset_index()
    site_visits.columns = ['Site ID', 'Number_of_Visits']

    # Clean up Site IDs - convert from float to clean string
    site_visits['Site ID'] = site_visits['Site ID'].apply(lambda x: str(int(float(x))) if pd.notnull(x) else '')

    # Get all site information from database
    site_info = SiteInformation.objects.all()
    
    # Create different lookup dictionaries for each matching strategy
    ecgi_dict = {}
    for site in site_info:
        # Store both the original and stripped versions of lac_cell_id_ecgi
        ecgi_str = str(site.lac_cell_id_ecgi).strip()
        site_data = {
            'name': site.site_name,
            'lat': site.latitude,
            'long': site.longitude,
            'governorate': site.governorate  # Added governorate to site_data
        }
        ecgi_dict[ecgi_str] = site_data  # Original version
        if ecgi_str.startswith('0'):  # Store version without leading zero
            ecgi_dict[ecgi_str[1:]] = site_data
        
    # Create dictionaries for cell_id matches
    cell_id_dict_5 = {}
    cell_id_dict_4 = {}
    for site in site_info:
        cell_id = str(site.cell_id).strip()
        site_data = {
            'name': site.site_name,
            'lat': site.latitude,
            'long': site.longitude,
            'governorate': site.governorate  # Added governorate to site_data
        }
        if len(cell_id) >= 5:
            cell_id_dict_5[cell_id[-5:]] = site_data
        if len(cell_id) >= 4:
            cell_id_dict_4[cell_id[-4:]] = site_data

    print(f"\nPrepared lookup dictionaries:")
    print(f"- ECGI matches possible: {len(ecgi_dict)}")
    print(f"- 5-digit cell ID matches possible: {len(cell_id_dict_5)}")
    print(f"- 4-digit cell ID matches possible: {len(cell_id_dict_4)}")

    def find_site_info(site_id):
        site_id = str(site_id).strip()
        match_type = None
        
        # Debug print for specific site
        if site_id == "507119219":
            print(f"\nDEBUG - Processing site ID: {site_id}")
            print(f"Step 1: Checking if '{site_id}' exists in ecgi_dict")
            print(f"Step 2: Checking if '0{site_id}' exists in ecgi_dict")
            if f"0{site_id}" in ecgi_dict:
                print(f"Found match with '0{site_id}'!")
        
        # Step 1: Check full site ID match
        if site_id in ecgi_dict:
            print(f"Found full match for {site_id}")
            match_type = "full_match"
            return ecgi_dict[site_id], match_type
            
        # Step 2: Check with leading zero
        zero_padded = f"0{site_id}"
        if zero_padded in ecgi_dict:
            print(f"Found zero-padded match for {site_id} using {zero_padded}")
            match_type = "zero_padded_match"
            return ecgi_dict[zero_padded], match_type
            
        # Step 3: Check last 5 digits
        if len(site_id) >= 5:
            last_5 = site_id[-5:]
            if last_5 in cell_id_dict_5:
                print(f"Found 5-digit match for {site_id} using {last_5}")
                match_type = "5_digit_match"
                return cell_id_dict_5[last_5], match_type
                
        # Step 4: Check last 4 digits
        if len(site_id) >= 4:
            last_4 = site_id[-4:]
            if last_4 in cell_id_dict_4:
                print(f"Found 4-digit match for {site_id} using {last_4}")
                match_type = "4_digit_match"
                return cell_id_dict_4[last_4], match_type
        
        print(f"No match found for {site_id} in any step")
        return {'name': 'Unknown', 'lat': None, 'long': None, 'governorate': 'Unknown'}, "no_match"

    # Track matching statistics
    match_stats = {
        "full_match": 0,
        "zero_padded_match": 0,
        "5_digit_match": 0,
        "4_digit_match": 0,
        "no_match": 0
    }

    # Add location information to site_visits
    for index, row in site_visits.iterrows():
        site_id = row['Site ID']  # Already cleaned above
        site_data, match_type = find_site_info(site_id)
        match_stats[match_type] += 1
        
        site_visits.at[index, 'Site Name'] = site_data['name']
        site_visits.at[index, 'LAT'] = site_data['lat']
        site_visits.at[index, 'LON'] = site_data['long']
        site_visits.at[index, 'CITY'] = site_data['governorate']  # Added governorate as CITY

    # Print matching statistics
    print("\nMatching Statistics:")
    print(f"- Full matches: {match_stats['full_match']}")
    print(f"- Zero-padded matches: {match_stats['zero_padded_match']}")
    print(f"- 5-digit matches: {match_stats['5_digit_match']}")
    print(f"- 4-digit matches: {match_stats['4_digit_match']}")
    print(f"- Unmatched sites: {match_stats['no_match']}")

    result = site_visits[['Site ID', 'Site Name', 'LAT', 'LON', 'CITY', 'Number_of_Visits']].to_dict('records')
    print(f"\nReturning {len(result)} site records")
    
    return result


def analyze_call_patterns(df, sheet_owner_number, is_z_format=False):
    """Analyze detailed call patterns including reciprocal calls and duration analysis"""
    try:
        print(f"Starting call pattern analysis for number: {sheet_owner_number}")
        
        # Get the correct column names based on format
        calling_number_col = 'Calling Number' if is_z_format else 'CALLER_NUMBER'
        called_number_col = 'Called Number' if is_z_format else 'CALLED_NUMBER'
        date_col = 'Date' if is_z_format else 'CALL_INITIAL_TIME'
        
        print(f"Using columns: Calling={calling_number_col}, Called={called_number_col}, Date={date_col}")
        
        # Convert numbers to string and normalize
        df[calling_number_col] = df[calling_number_col].astype(str)
        df[called_number_col] = df[called_number_col].astype(str)
        sheet_owner_number = str(sheet_owner_number)
        
        print(f"Data types - Calling Number: {df[calling_number_col].dtype}, Called Number: {df[called_number_col].dtype}")
        
        # Filter owner's calls
        owner_calls = df[
            (df[calling_number_col] == sheet_owner_number) |
            (df[called_number_col] == sheet_owner_number)
        ]
        
        print(f"Found {len(owner_calls)} calls for the owner")
        
        if owner_calls.empty:
            print("Warning: No calls found for the owner")
            return {
                'reciprocal_patterns': [],
                'timing_patterns': {
                    'morning_calls': 0,
                    'afternoon_calls': 0,
                    'evening_calls': 0,
                    'night_calls': 0,
                    'weekday_distribution': {}
                }
            }
        
        # Analyze reciprocal calling patterns
        reciprocal_patterns = []
        unique_numbers = set(owner_calls[calling_number_col].tolist() + owner_calls[called_number_col].tolist())
        unique_numbers.discard(sheet_owner_number)
        
        print(f"Found {len(unique_numbers)} unique contact numbers")
        
        for number in unique_numbers:
            calls_made = owner_calls[
                (owner_calls[calling_number_col] == sheet_owner_number) &
                (owner_calls[called_number_col] == number)
            ].shape[0]
            
            calls_received = owner_calls[
                (owner_calls[called_number_col] == sheet_owner_number) &
                (owner_calls[calling_number_col] == number)
            ].shape[0]
            
            if calls_made + calls_received >= 3:  # Minimum threshold for significant contact
                reciprocal_patterns.append({
                    'contact_number': number,
                    'calls_made': calls_made,
                    'calls_received': calls_received,
                    'total_calls': calls_made + calls_received,
                    'call_ratio': round(calls_made / (calls_received if calls_received > 0 else 1), 2)
                })
        
        print(f"Found {len(reciprocal_patterns)} significant reciprocal patterns")
        
        # Analyze call timing patterns
        owner_calls['Hour'] = pd.to_datetime(owner_calls[date_col]).dt.hour
        owner_calls['Weekday'] = pd.to_datetime(owner_calls[date_col]).dt.day_name()
        
        timing_patterns = {
            'morning_calls': len(owner_calls[owner_calls['Hour'].between(6, 11)]),
            'afternoon_calls': len(owner_calls[owner_calls['Hour'].between(12, 17)]),
            'evening_calls': len(owner_calls[owner_calls['Hour'].between(18, 23)]),
            'night_calls': len(owner_calls[owner_calls['Hour'].between(0, 5)]),
            'weekday_distribution': owner_calls['Weekday'].value_counts().to_dict()
        }
        
        print("Call pattern analysis completed successfully")
        
        return {
            'reciprocal_patterns': sorted(reciprocal_patterns, key=lambda x: x['total_calls'], reverse=True),
            'timing_patterns': timing_patterns
        }
    except Exception as e:
        print(f"Error in analyze_call_patterns: {str(e)}")
        import traceback
        traceback.print_exc()
        return None
