"""
Site Information Service
Handles all site-related operations and Z-format site matching
"""
import pandas as pd
from ..models import SiteInformation


class SiteService:
    @staticmethod
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

    @staticmethod
    def find_site_info(site_id, site_info):
        """Find site information using multiple matching strategies (Z format only)"""
        try:
            site_id = str(site_id).strip()
            
            # Print sample of what we're looking for
            print(f"Looking up site ID: {site_id} in site_info")
            
            if site_id in site_info:
                print(f"Found full match for {site_id}")
                return site_info[site_id], "full_match"
                
            zero_padded = f"0{site_id}"
            if zero_padded in site_info:
                print(f"Found zero-padded match for {site_id}")
                return site_info[zero_padded], "zero_padded_match"
            
            # Try last 5 digits
            if len(site_id) >= 5:
                last_5 = site_id[-5:]
                for key, value in site_info.items():
                    if key.endswith(last_5):
                        print(f"Found 5-digit match for {site_id} using {last_5}")
                        return value, "5_digit_match"
            
            # Try last 4 digits
            if len(site_id) >= 4:
                last_4 = site_id[-4:]
                for key, value in site_info.items():
                    if key.endswith(last_4):
                        print(f"Found 4-digit match for {site_id} using {last_4}")
                        return value, "4_digit_match"
                        
            print(f"No match found for {site_id}")
            return None, "no_match"
            
        except Exception as e:
            print(f"Error in find_site_info for site_id {site_id}: {str(e)}")
            return None, "error"

    @staticmethod
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