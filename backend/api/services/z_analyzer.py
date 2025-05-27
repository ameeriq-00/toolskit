"""
Z Format Excel Analyzer
Handles analysis of Z format files (main + IMEI) with site matching
"""
import pandas as pd
import numpy as np
from .site_service import SiteService
from ..time_analysis import analyze_time_patterns_z
from ..geographic_analysis import analyze_movement_patterns_z


class ZFormatAnalyzer:
    def __init__(self):
        self.site_service = SiteService()

    def analyze(self, main_file, imei_file):
        """Main analysis function for Z format"""
        try:
            # Get site information first
            site_info_dict = self.site_service.get_site_info_dict()
            
            # Process files and get initial results
            results = self.process_excel_files(main_file, imei_file)
            
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
            
            return results
        except Exception as e:
            print(f"Error in ZFormatAnalyzer.analyze: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    def process_excel_files(self, main_file, imei_file):
        """Process Z format Excel files"""
        main_df = pd.read_excel(main_file, skiprows=5)
        imei_df = pd.read_excel(imei_file, skiprows=8)
        print("Available columns in Z format:", main_df.columns.tolist())  # Debug print
        
        # Get sheet owner number from most frequent number in calls with is_z_format=True
        sheet_owner_number = self.site_service.find_sheet_owner_number(main_df, is_z_format=True)
        print(f"Detected sheet owner number: {sheet_owner_number}")

        # Get site info dictionary
        site_info = self.site_service.get_site_info_dict()

        # Get movement analysis for Z template
        movement_analysis = analyze_movement_patterns_z(main_df, sheet_owner_number, site_info)

        # Get call patterns analysis
        call_patterns = self.analyze_call_patterns(main_df, sheet_owner_number, is_z_format=True)

        return {
            "filtered_calls": self.filter_and_aggregate_calls_new(main_df),
            "imei_usage": self.aggregate_imei_usage_new(imei_df, sheet_owner_number),
            "most_visited_sites": self.summarize_most_visited_sites_new(main_df, sheet_owner_number),
            "time_analysis": analyze_time_patterns_z(main_df, sheet_owner_number),
            "movement_analysis": movement_analysis,
            "call_patterns": call_patterns,
            "sheet_owner_number": sheet_owner_number
        }

    def filter_and_aggregate_calls_new(self, df):
        """Filter and aggregate calls for Z format with simple, general filtering"""
        
        def process_number(number):
            """Process and clean phone numbers"""
            number_str = str(number).strip()
            
            # Remove country code 964 for Iraqi numbers only
            if number_str.startswith('964'):
                return number_str[3:]
            
            # Keep all other numbers as they are
            return number_str
        
        def is_valid_phone_number(number):
            """Simple and general phone number validation"""
            number_str = str(number).strip()
            
            # Must be digits only
            if not number_str.isdigit():
                return False
            
            # Service numbers (short codes) - reject numbers with 4 digits or less
            if len(number_str) <= 4:
                return False
            
            # Very long numbers (suspicious) - reject numbers longer than 15 digits
            if len(number_str) > 15:
                return False
            
            # Accept all numbers between 5-15 digits
            # This covers:
            # - Iraqi mobile numbers: 10 digits (after removing 964)
            # - International numbers: varies by country (5-15 digits)
            # - Landline numbers: varies by country (5-15 digits)
            if 5 <= len(number_str) <= 15:
                return True
            
            return False
    
        # Convert columns to string and process
        df['Calling Number'] = df['Calling Number'].astype(str).apply(process_number)
        df['Called Number'] = df['Called Number'].astype(str).apply(process_number)
    
        # Filter for valid phone numbers only
        filtered_df = df[
            (df['Calling Number'].apply(is_valid_phone_number)) | 
            (df['Called Number'].apply(is_valid_phone_number))
        ]
    
        # Count calls for valid numbers
        calling_counts = filtered_df[filtered_df['Calling Number'].apply(is_valid_phone_number)]['Calling Number'].value_counts()
        called_counts = filtered_df[filtered_df['Called Number'].apply(is_valid_phone_number)]['Called Number'].value_counts()
        
        # Combine counts
        all_call_counts = calling_counts.add(called_counts, fill_value=0)
    
        # Convert to DataFrame
        result_df = all_call_counts.reset_index()
        result_df.columns = ['Number', 'Number_of_Calls']
        
        # Sort by count (descending)
        result_df = result_df.sort_values('Number_of_Calls', ascending=False)
        
        # Convert counts to integers
        result_df['Number_of_Calls'] = result_df['Number_of_Calls'].astype(int)
        
        # Convert to dict
        result = result_df.to_dict('records')
        
        print(f"Z-Format: Found {len(result)} valid phone numbers with call counts")
        print(f"Top 5 numbers: {result[:5] if len(result) >= 5 else result}")
        
        # Debug: Show filtered numbers
        all_numbers = set(df['Calling Number'].tolist() + df['Called Number'].tolist())
        invalid_numbers = [num for num in all_numbers if not is_valid_phone_number(num)]
        print(f"Z-Format: Filtered out {len(invalid_numbers)} invalid/service numbers")
        print(f"Examples of filtered numbers: {list(invalid_numbers)[:10]}")
        
        return result
    


    

    def aggregate_imei_usage_new(self, df, sheet_owner_number):
        """Aggregate IMEI usage for Z format"""
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

    def summarize_most_visited_sites_new(self, df, sheet_owner_number):
        """Summarize most visited sites for Z format with site matching"""
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

        # Get site info dictionary for matching
        site_info_dict = self.site_service.get_site_info_dict()

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
            site_data, match_type = self.site_service.find_site_info(site_id, site_info_dict)
            match_stats[match_type] += 1
            
            if site_data:
                site_visits.at[index, 'Site Name'] = site_data['name']
                site_visits.at[index, 'LAT'] = site_data['lat']
                site_visits.at[index, 'LON'] = site_data['long']
                site_visits.at[index, 'CITY'] = site_data['governorate']  # Added governorate as CITY
            else:
                site_visits.at[index, 'Site Name'] = 'Unknown'
                site_visits.at[index, 'LAT'] = None
                site_visits.at[index, 'LON'] = None
                site_visits.at[index, 'CITY'] = 'Unknown'

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