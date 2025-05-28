# backend/api/services/site_search_service.py

import re
import logging
from typing import Dict, List, Optional, Tuple
from django.db.models import Q
from ..models import (
    TwoGSiteInformation, 
    ThreeGSiteInformation, 
    FourGSiteInformation, 
    SiteInformation
)

logger = logging.getLogger(__name__)


class UnifiedSiteSearchService:
    """
    خدمة البحث الموحدة للأبراج
    تدعم البحث في جميع أنواع الأبراج (2G, 3G, 4G, Z Format)
    """
    
    def __init__(self):
        self.search_strategies = {
            '2G': self._search_2g_sites,
            '3G': self._search_3g_sites,
            '4G': self._search_4g_sites,
            'Z': self._search_z_sites,
            'ALL': self._search_all_sites
        }
    
    def search_sites(self, search_params: Dict) -> Dict:
        """
        البحث الرئيسي عن الأبراج
        
        Args:
            search_params: {
                'format_type': '2G'|'3G'|'4G'|'Z'|'ALL',
                'site_id': 'ANB0001',
                'sector': '1' (اختياري),
                'site_name': 'Alzawayah' (اختياري),
                'cell_name': 'U9_zawayah_ANB0001-A1' (اختياري),
                'city': 'Al-Anbar' (اختياري)
            }
        
        Returns:
            {
                'success': bool,
                'results': List[Dict],
                'total_found': int,
                'search_info': Dict
            }
        """
        try:
            format_type = search_params.get('format_type', 'ALL').upper()
            
            if format_type not in self.search_strategies:
                return {
                    'success': False,
                    'error': f'نوع البحث غير مدعوم: {format_type}',
                    'results': [],
                    'total_found': 0
                }
            
            # تنفيذ البحث
            search_func = self.search_strategies[format_type]
            results = search_func(search_params)
            
            # ترتيب النتائج حسب مستوى التطابق
            sorted_results = self._sort_results_by_relevance(results, search_params)
            
            return {
                'success': True,
                'results': sorted_results,
                'total_found': len(sorted_results),
                'search_info': {
                    'format_type': format_type,
                    'search_params': search_params,
                    'technologies_searched': self._get_searched_technologies(format_type)
                }
            }
            
        except Exception as e:
            logger.error(f"خطأ في البحث: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'results': [],
                'total_found': 0
            }
    
    def _search_2g_sites(self, params: Dict) -> List[Dict]:
        """البحث في أبراج 2G"""
        queryset = TwoGSiteInformation.objects.all()
        results = []
        
        site_id = params.get('site_id', '').strip()
        sector = params.get('sector', '').strip()
        site_name = params.get('site_name', '').strip()
        city = params.get('city', '').strip()
        
        # بناء الاستعلام
        if site_id:
            queryset = queryset.filter(site_id__icontains=site_id)
        
        if site_name:
            queryset = queryset.filter(full_site_name__icontains=site_name)
        
        if cell_name:
            queryset = queryset.filter(cell_name__icontains=cell_name)
        
        if city:
            queryset = queryset.filter(geo_city__icontains=city)
        
        # البحث بـ Sector للـ 4G
        if sector and site_id:
            # حساب Cell ID المتوقع للـ 4G
            calculated_cell_id = self._calculate_4g_cell_id(site_id, sector)
            if calculated_cell_id:
                queryset = queryset.filter(cell_id=calculated_cell_id)
            
            # أو البحث في اسم الخلية
            sector_patterns = [
                f"-{sector}",   # مثل L_zawayah_ANB0001-1
                f"_{sector}"    # أنماط أخرى
            ]
            
            sector_q = Q()
            for pattern in sector_patterns:
                sector_q |= Q(cell_name__icontains=pattern)
            
            queryset = queryset.filter(sector_q)
        
        # تحويل النتائج
        for site in queryset[:50]:
            result = self._format_4g_result(site, params)
            results.append(result)
        
        return results
    
    def _search_z_sites(self, params: Dict) -> List[Dict]:
        """البحث في أبراج Z Format"""
        queryset = SiteInformation.objects.all()
        results = []
        
        site_id = params.get('site_id', '').strip()
        site_name = params.get('site_name', '').strip()
        city = params.get('city', '').strip()
        
        # بناء الاستعلام
        if site_id:
            # البحث في site_enb_id و lac_cell_id_ecgi
            queryset = queryset.filter(
                Q(site_enb_id__icontains=site_id) |
                Q(lac_cell_id_ecgi__icontains=site_id)
            )
        
        if site_name:
            queryset = queryset.filter(site_name__icontains=site_name)
        
        if city:
            queryset = queryset.filter(governorate__icontains=city)
        
        # تحويل النتائج
        for site in queryset[:50]:
            result = self._format_z_result(site, params)
            results.append(result)
        
        return results
    
    def _search_all_sites(self, params: Dict) -> List[Dict]:
        """البحث في جميع أنواع الأبراج"""
        all_results = []
        
        # البحث في كل نوع
        for tech in ['2G', '3G', '4G', 'Z']:
            tech_results = self.search_strategies[tech](params)
            all_results.extend(tech_results)
        
        return all_results
    
    def _calculate_2g_cell_id(self, site_id: str, sector: str) -> Optional[str]:
        """حساب Cell ID للـ 2G"""
        try:
            # استخراج الأرقام من Site ID
            site_numbers = re.findall(r'\d+', site_id)
            if not site_numbers:
                return None
            
            site_number = site_numbers[-1]  # آخر رقم
            return f"{site_number}{sector}"
            
        except Exception:
            return None
    
    def _calculate_4g_cell_id(self, site_id: str, sector: str) -> Optional[str]:
        """حساب Cell ID للـ 4G"""
        try:
            # استخراج الأرقام من Site ID
            site_numbers = re.findall(r'\d+', site_id)
            if not site_numbers:
                return None
            
            site_number = site_numbers[-1].zfill(4)  # آخر رقم مع إضافة أصفار
            sector_padded = sector.zfill(3)  # السكتر مع أصفار
            return f"{site_number}{sector_padded}"
            
        except Exception:
            return None
    
    def _format_2g_result(self, site: TwoGSiteInformation, params: Dict) -> Dict:
        """تنسيق نتائج 2G"""
        return {
            'id': site.id,
            'technology': '2G',
            'site_id': site.site_id,
            'cell_id': site.cell_id,
            'site_name': site.site_name,
            'cell_name': f"2G_{site.site_name}_{site.site_id}-{site.cell_id}",
            'city': site.geo_city,
            'coordinates': {
                'latitude': float(site.latitude),
                'longitude': float(site.longitude)
            },
            'technical_info': {
                'bsc': site.bsc,
                'lac': site.lac,
                'mcc': site.mcc,
                'mnc': site.mnc,
                'azimuth': float(site.azimuth) if site.azimuth else None,
                'mechanical_tilt': float(site.mechanical_tilt) if site.mechanical_tilt else None,
                'electrical_tilt': float(site.electrical_tilt) if site.electrical_tilt else None,
                'antenna_height': float(site.antenna_height) if site.antenna_height else None,
                'antenna_beam_width': float(site.antenna_beam_width) if site.antenna_beam_width else None
            },
            'match_confidence': self._calculate_match_confidence(site, params, '2G'),
            'created_at': site.created_at.isoformat() if site.created_at else None
        }
    
    def _format_3g_result(self, site: ThreeGSiteInformation, params: Dict) -> Dict:
        """تنسيق نتائج 3G - محدث"""
        return {
            'id': site.id,
            'technology': '3G',
            'site_id': site.site_id,
            'cell_id': site.cell_id,
            'site_name': site.full_site_name,
            'cell_name': site.cell_name,
            'city': site.geo_city,
            'coordinates': {
                'latitude': float(site.latitude),
                'longitude': float(site.longitude)
            },
            'technical_info': {
                'rnc': site.rnc,  # تم تغييره إلى rnc
                'lac': site.lac,
                'azimuth': float(site.azimuth) if site.azimuth else None,
                'mechanical_tilt': float(site.mechanical_tilt) if site.mechanical_tilt else None,
                'electrical_tilt': float(site.electrical_tilt) if site.electrical_tilt else None,
                'antenna_height': float(site.antenna_height) if site.antenna_height else None
            },
            'match_type': params.get('match_type', 'unknown'),
            'created_at': site.created_at.isoformat() if site.created_at else None,
            'updated_at': site.updated_at.isoformat() if site.updated_at else None
        }
    
    
    def _format_4g_result(self, site: FourGSiteInformation, params: Dict) -> Dict:
        """تنسيق نتائج 4G"""
        return {
            'id': site.id,
            'technology': '4G',
            'site_id': site.site_id,
            'cell_id': site.cell_id,
            'site_name': site.full_site_name,
            'cell_name': site.cell_name,
            'city': site.geo_city,
            'coordinates': {
                'latitude': float(site.rf_plan_latitude),
                'longitude': float(site.rf_plan_longitude)
            },
            'technical_info': {
                'province_id': site.province_id,
                'lac_tac': site.lac_tac,
                'technology': site.technology,
                'azimuth': float(site.azimuth) if site.azimuth else None,
                'antenna_height': float(site.antenna_height) if site.antenna_height else None
            },
            'match_confidence': self._calculate_match_confidence(site, params, '4G'),
            'created_at': site.created_at.isoformat() if site.created_at else None
        }
    
    def _format_z_result(self, site: SiteInformation, params: Dict) -> Dict:
        """تنسيق نتائج Z Format"""
        return {
            'id': site.id,
            'technology': 'Z_Format',
            'site_id': site.site_enb_id,
            'cell_id': site.cell_id,
            'site_name': site.site_name,
            'cell_name': f"Z_{site.site_name}_{site.site_enb_id}",
            'city': site.governorate,
            'coordinates': {
                'latitude': float(site.latitude),
                'longitude': float(site.longitude)
            },
            'technical_info': {
                'bore': float(site.bore) if site.bore else None,
                'lac_cell_id_ecgi': site.lac_cell_id_ecgi
            },
            'match_confidence': self._calculate_match_confidence(site, params, 'Z'),
            'created_at': None  # Z Format doesn't have created_at
        }
    
    def _calculate_match_confidence(self, site, params: Dict, technology: str) -> float:
        """حساب مستوى الثقة في التطابق"""
        confidence = 0.5  # قيمة أساسية
        
        site_id = params.get('site_id', '').strip().lower()
        site_name = params.get('site_name', '').strip().lower()
        
        # زيادة الثقة حسب نوع التطابق
        if technology == '2G':
            if site_id and site_id in site.site_id.lower():
                confidence += 0.3
            if site_name and site_name in site.site_name.lower():
                confidence += 0.2
        
        elif technology == '3G':
            if site_id and site_id in site.site_id.lower():
                confidence += 0.3
            if site_name and site_name in site.full_site_name.lower():
                confidence += 0.2
        
        elif technology == '4G':
            if site_id and site_id in site.site_id.lower():
                confidence += 0.3
            if site_name and site_name in site.full_site_name.lower():
                confidence += 0.2
        
        elif technology == 'Z':
            if site_id and (site_id in site.site_enb_id.lower() or site_id in site.lac_cell_id_ecgi.lower()):
                confidence += 0.3
            if site_name and site_name in site.site_name.lower():
                confidence += 0.2
        
        return min(confidence, 1.0)  # حد أقصى 1.0
    
    def _sort_results_by_relevance(self, results: List[Dict], params: Dict) -> List[Dict]:
        """ترتيب النتائج حسب الصلة"""
        return sorted(results, key=lambda x: x['match_confidence'], reverse=True)
    
    def _get_searched_technologies(self, format_type: str) -> List[str]:
        """الحصول على قائمة التقنيات التي تم البحث فيها"""
        if format_type == 'ALL':
            return ['2G', '3G', '4G', 'Z_Format']
        else:
            return [format_type]
    
    def get_site_details(self, site_id: int, technology: str) -> Optional[Dict]:
        """الحصول على تفاصيل برج محدد"""
        try:
            if technology == '2G':
                site = TwoGSiteInformation.objects.get(id=site_id)
                return self._format_2g_result(site, {})
            
            elif technology == '3G':
                site = ThreeGSiteInformation.objects.get(id=site_id)
                return self._format_3g_result(site, {})
            
            elif technology == '4G':
                site = FourGSiteInformation.objects.get(id=site_id)
                return self._format_4g_result(site, {})
            
            elif technology in ['Z', 'Z_Format']:
                site = SiteInformation.objects.get(id=site_id)
                return self._format_z_result(site, {})
            
            return None
            
        except Exception as e:
            logger.error(f"خطأ في الحصول على تفاصيل البرج: {str(e)}")
            return None
    
    def get_statistics(self) -> Dict:
        """الحصول على إحصائيات الأبراج"""
        try:
            stats = {
                '2G': TwoGSiteInformation.objects.count(),
                '3G': ThreeGSiteInformation.objects.count(),
                '4G': FourGSiteInformation.objects.count(),
                'Z_Format': SiteInformation.objects.count()
            }
            
            total = sum(stats.values())
            
            return {
                'success': True,
                'statistics': stats,
                'total_sites': total,
                'databases_status': {
                    tech: 'active' if count > 0 else 'empty' 
                    for tech, count in stats.items()
                }
            }
            
        except Exception as e:
            logger.error(f"خطأ في الحصول على الإحصائيات: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'statistics': {},
                'total_sites': 0
            }.filter(site_name__icontains=site_name)
        
        if city:
            queryset = queryset.filter(geo_city__icontains=city)
        
        # البحث بـ Sector
        if sector:
            # حساب Cell ID المتوقع للـ 2G
            if site_id:
                calculated_cell_id = self._calculate_2g_cell_id(site_id, sector)
                if calculated_cell_id:
                    queryset = queryset.filter(cell_id=calculated_cell_id)
        
        # تحويل النتائج
        for site in queryset[:50]:  # حد أقصى 50 نتيجة
            result = self._format_2g_result(site, params)
            results.append(result)
        
        return results
    
    def _search_3g_sites(self, params: Dict) -> List[Dict]:
        """البحث في أبراج 3G"""
        queryset = ThreeGSiteInformation.objects.all()
        results = []
        
        site_id = params.get('site_id', '').strip()
        sector = params.get('sector', '').strip()
        site_name = params.get('site_name', '').strip()
        cell_name = params.get('cell_name', '').strip()
        city = params.get('city', '').strip()
        
        # بناء الاستعلام
        if site_id:
            queryset = queryset.filter(site_id__icontains=site_id)
        
        if site_name:
            queryset = queryset.filter(full_site_name__icontains=site_name)
        
        if cell_name:
            queryset = queryset.filter(cell_name__icontains=cell_name)
        
        if city:
            queryset = queryset.filter(geo_city__icontains=city)
        
        # البحث بـ Sector للـ 3G
        if sector and site_id:
            # البحث عن الخلايا التي تحتوي على السكتر المطلوب
            sector_patterns = [
                f"-A{sector}",  # مثل U9_zawayah_ANB0001-A1
                f"-{sector}",   # مثل U9_zawayah_ANB0001-1
                f"_{sector}"    # أنماط أخرى
            ]
            
            sector_q = Q()
            for pattern in sector_patterns:
                sector_q |= Q(cell_name__icontains=pattern)
            
            queryset = queryset.filter(sector_q)
        
        # تحويل النتائج
        for site in queryset[:50]:
            result = self._format_3g_result(site, params)
            results.append(result)
        
        return results
    
    def _search_4g_sites(self, params: Dict) -> List[Dict]:
        """البحث في أبراج 4G"""
        queryset = FourGSiteInformation.objects.all()
        results = []
        
        site_id = params.get('site_id', '').strip()
        sector = params.get('sector', '').strip()
        site_name = params.get('site_name', '').strip()
        cell_name = params.get('cell_name', '').strip()
        city = params.get('city', '').strip()
        
        # بناء الاستعلام
        if site_id:
            queryset = queryset.filter(site_id__icontains=site_id)
        
        if site_name:
            queryset = queryset