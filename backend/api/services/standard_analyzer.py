"""
Standard Format Excel Analyzer
Handles analysis of standard format Excel files (single file with CITY column)
"""
import pandas as pd
import numpy as np
from .site_service import SiteService
from ..time_analysis import analyze_time_patterns_original
from ..geographic_analysis import analyze_movement_patterns_original


class StandardAnalyzer:
    def __init__(self):
        self.site_service = SiteService()

    def analyze(self, file):
        """Main analysis function for standard format"""
        try:
            df = pd.read_excel(file)
            print("Available columns:", df.columns.tolist())  # Debug print
            
            # Get sheet owner number
            sheet_owner_number = self.site_service.find_sheet_owner_number(df, is_z_format=False)
            print(f"Detected sheet owner number: {sheet_owner_number}")

            # Get time analysis results
            time_analysis = analyze_time_patterns_original(df)
            print("Time analysis result:", time_analysis is not None)  # Debug print
            if time_analysis is None:
                print("Time analysis returned None")

            # Get movement analysis results
            movement_analysis = analyze_movement_patterns_original(df)

            # Get call patterns analysis
            call_patterns = self.analyze_call_patterns(df, sheet_owner_number, is_z_format=False)
            
            results = {
                "filtered_calls": self.filter_and_aggregate_calls(df),
                "aggregated_caller_numbers": self.aggregate_by_caller_number(df),
                "imei_usage": self.aggregate_imei_usage(df),
                "most_visited_sites": self.summarize_most_visited_sites(df),
                "time_analysis": time_analysis,
                "movement_analysis": movement_analysis,
                "call_patterns": call_patterns
            }
            
            return results
        except Exception as e:
            print(f"Error in StandardAnalyzer.analyze: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    def filter_and_aggregate_calls(self, df):
        """Filter and aggregate calls for standard format"""
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

    def aggregate_by_caller_number(self, df):
        """Aggregate by caller number for standard format"""
        def is_valid_number(number):
            return isinstance(number, str) and not number.startswith('964') and not number.startswith('7')

        valid_numbers = df[df['CALLER_NUMBER'].apply(is_valid_number) | 
                           df['CALLED_NUMBER'].apply(is_valid_number)]

        aggregated = valid_numbers.groupby('CALLER_NUMBER').size().reset_index(name='Number_of_Calls')
        return aggregated.sort_values('Number_of_Calls', ascending=False).to_dict('records')

    def aggregate_imei_usage(self, df):
        """Aggregate IMEI usage for standard format"""
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

    def summarize_most_visited_sites(self, df):
        """For the standard format where CITY is directly available in the Excel sheet"""
        site_visits = df.groupby(['SITE_ID', 'SITE_NAME', 'LAT', 'LON', 'CITY']).size().reset_index(name='Number_of_Visits')
        return site_visits.sort_values('Number_of_Visits', ascending=False).to_dict('records')

    def analyze_call_patterns(self, df, sheet_owner_number, is_z_format=False):
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