"""
Site Information Service
Handles all site-related operations and Z-format site matching
"""
import pandas as pd
from ..models import SiteInformation


class SiteService:
    @staticmethod
    def get_site_info_dict():
        """Get site information - مع دعم Z-Format"""
        from ..models import TwoGSiteInformation, ThreeGSiteInformation, FourGSiteInformation, SiteInformation
        
        site_info = {
            '2g': {},
            '3g': {},
            '4g': {},
            'z': {}
        }
        
        try:
            print("\n📡 Loading site information from database...")
            
            # ===== Z-Format Sites =====
            sites_z = SiteInformation.objects.all()
            for site in sites_z:
                site_id = str(site.site_enb_id).strip()
                site_info['z'][site_id] = {
                    'name': site.site_name,
                    'lat': site.latitude,
                    'long': site.longitude,
                    'governorate': site.governorate
                }
                
                cell_id = str(site.cell_id).strip()
                if cell_id and cell_id != site_id:
                    site_info['z'][cell_id] = {
                        'name': site.site_name,
                        'lat': site.latitude,
                        'long': site.longitude,
                        'governorate': site.governorate
                    }
                
                ecgi = str(site.lac_cell_id_ecgi).strip()
                if ecgi:
                    site_info['z'][ecgi] = {
                        'name': site.site_name,
                        'lat': site.latitude,
                        'long': site.longitude,
                        'governorate': site.governorate
                    }
            
            print(f"✅ Loaded {len(sites_z)} Z-Format sites (with {len(site_info['z'])} lookup keys)")
            
            # ===== 2G Sites =====
            sites_2g = TwoGSiteInformation.objects.all()
            for site in sites_2g:
                site_id = str(site.site_id).strip()
                site_info['2g'][site_id] = {
                    'name': site.site_name,
                    'lat': site.latitude,
                    'long': site.longitude,
                    'governorate': site.geo_city
                }
            
            print(f"✅ Loaded {len(site_info['2g'])} 2G sites")
            
            # ===== 3G Sites =====
            sites_3g = ThreeGSiteInformation.objects.all()
            for site in sites_3g:
                site_id = str(site.site_id).strip()
                site_info['3g'][site_id] = {
                    'name': site.full_site_name,
                    'lat': site.latitude,
                    'long': site.longitude,
                    'governorate': site.geo_city
                }
            
            print(f"✅ Loaded {len(site_info['3g'])} 3G sites")
            
            # ===== 4G Sites =====
            sites_4g = FourGSiteInformation.objects.all()
            for site in sites_4g:
                site_id = str(site.site_id).strip()
                site_info['4g'][site_id] = {
                    'name': site.full_site_name,
                    'lat': site.rf_plan_latitude,
                    'long': site.rf_plan_longitude,
                    'governorate': site.geo_city
                }
            
            print(f"✅ Loaded {len(site_info['4g'])} 4G sites")
            
            total = sum(len(site_info[k]) for k in site_info)
            print(f"📊 Total lookup keys: {total}")
            
            return site_info
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'2g': {}, '3g': {}, '4g': {}, 'z': {}}



    @staticmethod
    def find_site_info(site_id, site_info_dict):
        """Find site information using multiple matching strategies"""
        try:
            site_id = str(site_id).strip()
            
            # ✅ إذا كان الـ dict جديد (nested)
            if isinstance(site_info_dict, dict) and ('2g' in site_info_dict or 'z' in site_info_dict):
                # ✅ البحث بالترتيب: Z أولاً (للزين)، ثم باقي الأنواع
                for site_type in ['z', '2g', '3g', '4g']:
                    if site_type in site_info_dict:
                        if site_id in site_info_dict[site_type]:
                            return site_info_dict[site_type][site_id], "full_match"
                
                # لم يُعثر على مطابقة
                return None, "no_match"

            # ✅ إذا كان الـ dict قديم (flat) - للتوافق مع الكود القديم
            if site_id in site_info_dict:
                return site_info_dict[site_id], "full_match"

            # محاولات أخرى للمطابقة
            zero_padded = f"0{site_id}"
            if zero_padded in site_info_dict:
                return site_info_dict[zero_padded], "zero_padded_match"

            # آخر 5 أرقام
            if len(site_id) >= 5:
                last_5 = site_id[-5:]
                for key, value in site_info_dict.items():
                    if str(key).endswith(last_5):
                        return value, "5_digit_match"

            # آخر 4 أرقام
            if len(site_id) >= 4:
                last_4 = site_id[-4:]
                for key, value in site_info_dict.items():
                    if str(key).endswith(last_4):
                        return value, "4_digit_match"

            return None, "no_match"

        except Exception as e:
            print(f"Error in find_site_info: {str(e)}")
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