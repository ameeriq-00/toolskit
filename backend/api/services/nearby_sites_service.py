# backend/api/services/nearby_sites_service.py

import math
from typing import List, Dict, Optional
from django.db.models import Q


class NearbySitesService:
    """خدمة البحث عن الأبراج القريبة"""
    
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """حساب المسافة بين نقطتين بالكيلومتر"""
        # Haversine formula
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) * math.sin(delta_lat / 2) +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lon / 2) * math.sin(delta_lon / 2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        
        return distance
    
    @staticmethod
    def find_nearby_asia_sites(site_data: Dict, limit: int = 2) -> List[Dict]:
        """البحث عن أقرب أبراج آسيا (2G, 3G, 4G) - مصحح لإرجاع أقرب برجين"""
        try:
            # استيراد النماذج محلياً لتجنب الاستيراد الدائري
            from ..models import TwoGSiteInformation, ThreeGSiteInformation, FourGSiteInformation
            
            current_lat = float(site_data['coordinates']['latitude'])
            current_lon = float(site_data['coordinates']['longitude'])
            current_site_id = str(site_data['site_id'])
            
            print(f"البحث عن أبراج آسيا القريبة للبرج: {current_site_id}")
            print(f"الإحداثيات: {current_lat}, {current_lon}")
            
            all_nearby_sites = []
            
            # البحث في أبراج 2G
            for site in TwoGSiteInformation.objects.all():
                # تجنب البرج نفسه
                if str(site.site_id) == current_site_id:
                    continue
                    
                try:
                    distance = NearbySitesService.calculate_distance(
                        current_lat, current_lon,
                        float(site.latitude), float(site.longitude)
                    )
                    
                    all_nearby_sites.append({
                        'site_id': site.site_id,
                        'site_name': site.site_name,
                        'technology': '2G',
                        'city': site.geo_city,
                        'coordinates': {
                            'latitude': float(site.latitude),
                            'longitude': float(site.longitude)
                        },
                        'distance': distance,
                        'technical_info': {
                            'bsc': site.bsc,
                            'cell_id': site.cell_id,
                            'azimuth': float(site.azimuth) if site.azimuth else None
                        }
                    })
                except (ValueError, TypeError) as e:
                    print(f"خطأ في معالجة برج 2G {site.site_id}: {e}")
                    continue
            
            # البحث في أبراج 3G
            for site in ThreeGSiteInformation.objects.all():
                # تجنب البرج نفسه
                if str(site.site_id) == current_site_id:
                    continue
                    
                try:
                    distance = NearbySitesService.calculate_distance(
                        current_lat, current_lon,
                        float(site.latitude), float(site.longitude)
                    )
                    
                    all_nearby_sites.append({
                        'site_id': site.site_id,
                        'site_name': site.full_site_name,
                        'technology': '3G',
                        'city': site.geo_city,
                        'coordinates': {
                            'latitude': float(site.latitude),
                            'longitude': float(site.longitude)
                        },
                        'distance': distance,
                        'technical_info': {
                            'rnc': site.rnc,
                            'cell_id': site.cell_id,
                            'azimuth': float(site.azimuth) if site.azimuth else None
                        }
                    })
                except (ValueError, TypeError) as e:
                    print(f"خطأ في معالجة برج 3G {site.site_id}: {e}")
                    continue
            
            # البحث في أبراج 4G
            for site in FourGSiteInformation.objects.all():
                # تجنب البرج نفسه
                if str(site.site_id) == current_site_id:
                    continue
                    
                try:
                    distance = NearbySitesService.calculate_distance(
                        current_lat, current_lon,
                        float(site.rf_plan_latitude), float(site.rf_plan_longitude)
                    )
                    
                    all_nearby_sites.append({
                        'site_id': site.site_id,
                        'site_name': site.full_site_name,
                        'technology': '4G',
                        'city': site.geo_city,
                        'coordinates': {
                            'latitude': float(site.rf_plan_latitude),
                            'longitude': float(site.rf_plan_longitude)
                        },
                        'distance': distance,
                        'technical_info': {
                            'cell_id': site.cell_id,
                            'azimuth': float(site.azimuth) if site.azimuth else None
                        }
                    })
                except (ValueError, TypeError) as e:
                    print(f"خطأ في معالجة برج 4G {site.site_id}: {e}")
                    continue
            
            # ترتيب حسب المسافة وإرجاع أقرب المواقع
            all_nearby_sites.sort(key=lambda x: x['distance'])
            
            # التأكد من وجود مواقع
            if not all_nearby_sites:
                print("لم يتم العثور على أي أبراج آسيا قريبة")
                return []
            
            # أخذ أقرب موقعين
            closest_sites = all_nearby_sites[:limit]
            
            print(f"تم العثور على {len(closest_sites)} برج آسيا قريب:")
            for i, site in enumerate(closest_sites):
                print(f"  {i+1}. {site['site_name']} ({site['technology']}) - {site['distance']:.2f} كم")
            
            return closest_sites
            
        except Exception as e:
            print(f"خطأ في البحث عن أبراج آسيا القريبة: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
    
    @staticmethod
    def find_nearby_zain_sites(site_data: Dict, limit: int = 2) -> List[Dict]:
        """البحث عن أقرب أبراج زين (Z Format) - مصحح لإرجاع أقرب برجين"""
        try:
            # استيراد النماذج محلياً لتجنب الاستيراد الدائري
            from ..models import SiteInformation
            
            current_lat = float(site_data['coordinates']['latitude'])
            current_lon = float(site_data['coordinates']['longitude'])
            current_site_id = str(site_data['site_id'])
            
            print(f"البحث عن أبراج زين القريبة للبرج: {current_site_id}")
            print(f"الإحداثيات: {current_lat}, {current_lon}")
            
            all_nearby_sites = []
            
            # البحث في أبراج Z Format
            for site in SiteInformation.objects.all():
                # تجنب البرج نفسه
                if str(site.site_enb_id) == current_site_id:
                    continue
                    
                try:
                    distance = NearbySitesService.calculate_distance(
                        current_lat, current_lon,
                        float(site.latitude), float(site.longitude)
                    )
                    
                    all_nearby_sites.append({
                        'site_id': site.site_enb_id,
                        'site_name': site.site_name,
                        'technology': 'Z_Format',
                        'city': site.governorate,
                        'coordinates': {
                            'latitude': float(site.latitude),
                            'longitude': float(site.longitude)
                        },
                        'distance': distance,
                        'technical_info': {
                            'cell_id': site.cell_id,
                            'lac_cell_id_ecgi': site.lac_cell_id_ecgi,
                            'bore': float(site.bore) if site.bore else None
                        }
                    })
                except (ValueError, TypeError) as e:
                    print(f"خطأ في معالجة برج زين {site.site_enb_id}: {e}")
                    continue
            
            # ترتيب حسب المسافة وإرجاع أقرب المواقع
            all_nearby_sites.sort(key=lambda x: x['distance'])
            
            # التأكد من وجود مواقع
            if not all_nearby_sites:
                print("لم يتم العثور على أي أبراج زين قريبة")
                return []
            
            # أخذ أقرب موقعين
            closest_sites = all_nearby_sites[:limit]
            
            print(f"تم العثور على {len(closest_sites)} برج زين قريب:")
            for i, site in enumerate(closest_sites):
                print(f"  {i+1}. {site['site_name']} ({site['technology']}) - {site['distance']:.2f} كم")
            
            return closest_sites
            
        except Exception as e:
            print(f"خطأ في البحث عن أبراج زين القريبة: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
    
    @staticmethod
    def find_nearby_sites_by_type(site_data: Dict, site_type: str, limit: int = 2) -> List[Dict]:
        """البحث عن الأبراج القريبة حسب النوع"""
        print(f"البحث عن الأبراج القريبة من نوع: {site_type}")
        
        if site_type.lower() == 'asia':
            return NearbySitesService.find_nearby_asia_sites(site_data, limit)
        elif site_type.lower() in ['zain', 'z']:
            return NearbySitesService.find_nearby_zain_sites(site_data, limit)
        else:
            print(f"نوع البحث غير مدعوم: {site_type}")
            return []
    
    @staticmethod
    def get_site_details_for_nearby_search(site_id: int, technology: str) -> Optional[Dict]:
        """الحصول على تفاصيل برج للبحث عن الأبراج القريبة"""
        try:
            # استيراد النماذج محلياً لتجنب الاستيراد الدائري
            from ..models import TwoGSiteInformation, ThreeGSiteInformation, FourGSiteInformation, SiteInformation
            
            if technology == '2G':
                site = TwoGSiteInformation.objects.get(id=site_id)
                return {
                    'site_id': site.site_id,
                    'site_name': site.site_name,
                    'technology': '2G',
                    'city': site.geo_city,
                    'coordinates': {
                        'latitude': float(site.latitude),
                        'longitude': float(site.longitude)
                    }
                }
            elif technology == '3G':
                site = ThreeGSiteInformation.objects.get(id=site_id)
                return {
                    'site_id': site.site_id,
                    'site_name': site.full_site_name,
                    'technology': '3G',
                    'city': site.geo_city,
                    'coordinates': {
                        'latitude': float(site.latitude),
                        'longitude': float(site.longitude)
                    }
                }
            elif technology == '4G':
                site = FourGSiteInformation.objects.get(id=site_id)
                return {
                    'site_id': site.site_id,
                    'site_name': site.full_site_name,
                    'technology': '4G',
                    'city': site.geo_city,
                    'coordinates': {
                        'latitude': float(site.rf_plan_latitude),
                        'longitude': float(site.rf_plan_longitude)
                    }
                }
            elif technology in ['Z', 'Z_Format']:
                site = SiteInformation.objects.get(id=site_id)
                return {
                    'site_id': site.site_enb_id,
                    'site_name': site.site_name,
                    'technology': 'Z_Format',
                    'city': site.governorate,
                    'coordinates': {
                        'latitude': float(site.latitude),
                        'longitude': float(site.longitude)
                    }
                }
        except Exception as e:
            print(f"خطأ في الحصول على تفاصيل البرج: {str(e)}")
        
        return None