# backend/api/services/site_search_service.py

import re
import logging
from typing import Dict, List, Optional
from django.db.models import Q
from ..models import (
    TwoGSiteInformation, 
    ThreeGSiteInformation, 
    FourGSiteInformation, 
    SiteInformation
)

logger = logging.getLogger(__name__)


class UnifiedSiteSearchService:
    """خدمة البحث الموحدة للأبراج - نظيفة وفعالة"""
    
    def search_sites(self, search_params: Dict) -> Dict:
        """البحث الرئيسي عن الأبراج"""
        try:
            format_type = search_params.get('format_type', 'ALL').upper()
            results = []
            
            if format_type in ['2G', 'ALL']:
                results.extend(self._search_2g(search_params))
            
            if format_type in ['3G', 'ALL']:
                results.extend(self._search_3g(search_params))
            
            if format_type in ['4G', 'ALL']:
                results.extend(self._search_4g(search_params))
            
            if format_type in ['Z', 'ALL']:
                results.extend(self._search_z(search_params))
            
            # ترتيب النتائج حسب الثقة
            results.sort(key=lambda x: x['match_confidence'], reverse=True)
            
            return {
                'success': True,
                'results': results[:50],  # حد أقصى 50 نتيجة
                'total_found': len(results),
                'search_info': {
                    'format_type': format_type,
                    'search_params': search_params
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

    def _search_2g(self, params: Dict) -> List[Dict]:
        """البحث في أبراج 2G"""
        results = []
        
        # استخراج معاملات البحث
        site_id, sector, site_name, cell_name, cell_id = self._extract_params(params)
        
        # البحث بـ Cell ID أولاً
        if cell_id:
            sites = TwoGSiteInformation.objects.filter(cell_id=cell_id)
            for site in sites:
                results.append(self._format_2g_result(site, 'direct_cell_id', 1.0))
            if results:
                return results
        
        # البحث المرحلي
        if cell_name:
            # استخراج Site ID + Sector من Cell Name
            extracted = self._extract_2g_info(cell_name)
            if extracted:
                site_id = extracted.get('site_id', site_id)
                sector = extracted.get('sector', sector)
        
        # حساب Cell ID إذا توفر Site + Sector
        if site_id and sector:
            calculated_cell_id = self._calculate_2g_cell_id(site_id, sector)
            if calculated_cell_id:
                sites = TwoGSiteInformation.objects.filter(cell_id=calculated_cell_id)
                for site in sites:
                    results.append(self._format_2g_result(site, 'calculated', 0.9))
        
        # البحث العام
        if not results and (site_id or site_name):
            queryset = TwoGSiteInformation.objects.all()
            
            if site_id:
                queryset = queryset.filter(site_id__icontains=site_id)
            if site_name:
                queryset = queryset.filter(site_name__icontains=site_name)
            
            for site in queryset[:20]:
                results.append(self._format_2g_result(site, 'general', 0.6))
        
        return results

    def _search_3g(self, params: Dict) -> List[Dict]:
        """البحث في أبراج 3G"""
        results = []
        
        # استخراج معاملات البحث
        site_id, sector, site_name, cell_name, cell_id = self._extract_params(params)
        
        # البحث بـ Cell ID أولاً (أعلى ثقة)
        if cell_id:
            sites = ThreeGSiteInformation.objects.filter(cell_id=cell_id)
            for site in sites:
                results.append(self._format_3g_result(site, 'direct_cell_id', 1.0))
            if results:
                return results
        
        # البحث بـ Cell Name
        if cell_name:
            # البحث المباشر
            sites = ThreeGSiteInformation.objects.filter(cell_name__iexact=cell_name)
            for site in sites:
                results.append(self._format_3g_result(site, 'exact_cell_name', 1.0))
            
            # إذا لم يجد، استخرج Site ID + Sector
            if not results:
                extracted = self._extract_3g_info(cell_name)
                if extracted:
                    site_id = extracted.get('site_id', site_id)
                    sector = extracted.get('sector', sector)
        
        # البحث بـ Site + Sector
        if not results and site_id and sector:
            # الحساب الذكي للسكتر
            calculated_cell_id = self._calculate_3g_cell_id(site_id, sector)
            if calculated_cell_id:
                sites = ThreeGSiteInformation.objects.filter(cell_id=calculated_cell_id)
                for site in sites:
                    results.append(self._format_3g_result(site, 'calculated', 0.9))
            
            # البحث بالنمط إذا لم يجد الحساب
            if not results:
                sites = ThreeGSiteInformation.objects.filter(
                    site_id__icontains=site_id,
                    cell_name__icontains=f'-{sector}'
                )
                for site in sites:
                    results.append(self._format_3g_result(site, 'pattern_match', 0.8))
        
        # البحث العام بـ Site ID
        if not results and site_id:
            sites = ThreeGSiteInformation.objects.filter(site_id__icontains=site_id)
            for site in sites[:20]:
                results.append(self._format_3g_result(site, 'site_fallback', 0.7))
        
        # البحث بـ Site Name
        if not results and site_name:
            sites = ThreeGSiteInformation.objects.filter(full_site_name__icontains=site_name)
            for site in sites[:20]:
                results.append(self._format_3g_result(site, 'name_search', 0.6))
        
        return results

    def _search_4g(self, params: Dict) -> List[Dict]:
        """البحث في أبراج 4G"""
        results = []
        
        # استخراج معاملات البحث
        site_id, sector, site_name, cell_name, cell_id = self._extract_params(params)
        
        # البحث بـ Cell ID أولاً
        if cell_id:
            sites = FourGSiteInformation.objects.filter(
                Q(cell_id=cell_id) |
                Q(cell_id__endswith=cell_id)  # تجاهل رقم المحافظة
            )
            for site in sites:
                results.append(self._format_4g_result(site, 'direct_cell_id', 1.0))
            if results:
                return results
        
        # البحث بـ Cell Name
        if cell_name:
            sites = FourGSiteInformation.objects.filter(cell_name__iexact=cell_name)
            for site in sites:
                results.append(self._format_4g_result(site, 'exact_cell_name', 1.0))
            
            # استخراج Site ID + Sector
            if not results:
                extracted = self._extract_4g_info(cell_name)
                if extracted:
                    site_id = extracted.get('site_id', site_id)
                    sector = extracted.get('sector', sector)
        
        # الحساب الرياضي للـ 4G
        if not results and site_id and sector:
            calculated_cell_id = self._calculate_4g_cell_id(site_id, sector)
            if calculated_cell_id:
                sites = FourGSiteInformation.objects.filter(
                    Q(cell_id=calculated_cell_id) |
                    Q(cell_id__endswith=calculated_cell_id)  # تجاهل رقم المحافظة
                )
                for site in sites:
                    results.append(self._format_4g_result(site, 'calculated', 0.9))
        
        # البحث العام
        if not results and (site_id or site_name):
            queryset = FourGSiteInformation.objects.all()
            
            if site_id:
                queryset = queryset.filter(site_id__icontains=site_id)
            if site_name:
                queryset = queryset.filter(full_site_name__icontains=site_name)
            
            for site in queryset[:20]:
                results.append(self._format_4g_result(site, 'general', 0.6))
        
        return results

    def _search_z(self, params: Dict) -> List[Dict]:
        """البحث في أبراج Z Format"""
        results = []
        
        # استخدام النظام الموجود للـ Z Format
        try:
            from .site_service import SiteService
            
            site_id = params.get('site_id', '').strip()
            if site_id:
                site_info_dict = SiteService.get_site_info_dict()
                site_data, match_type = SiteService.find_site_info(site_id, site_info_dict)
                
                if site_data and match_type != "no_match":
                    sites = SiteInformation.objects.filter(
                        Q(site_enb_id__icontains=site_id) |
                        Q(lac_cell_id_ecgi__icontains=site_id)
                    )
                    
                    confidence_map = {
                        'full_match': 1.0,
                        'zero_padded_match': 0.9,
                        '5_digit_match': 0.8,
                        '4_digit_match': 0.7
                    }
                    
                    for site in sites:
                        confidence = confidence_map.get(match_type, 0.5)
                        results.append(self._format_z_result(site, match_type, confidence))
            
            # البحث العام إذا لم يجد نتائج
            if not results:
                site_name = params.get('site_name', '').strip()
                queryset = SiteInformation.objects.all()
                
                if site_id:
                    queryset = queryset.filter(
                        Q(site_enb_id__icontains=site_id) |
                        Q(lac_cell_id_ecgi__icontains=site_id)
                    )
                if site_name:
                    queryset = queryset.filter(site_name__icontains=site_name)
                
                for site in queryset[:20]:
                    results.append(self._format_z_result(site, 'general', 0.6))
                    
        except ImportError:
            logger.warning("site_service غير متوفر للـ Z Format")
        
        return results

    # Helper Methods - مبسطة
    def _extract_params(self, params: Dict) -> tuple:
        """استخراج المعاملات الأساسية مع دعم cell_id"""
        return (
            params.get('site_id', '').strip(),
            params.get('sector', '').strip(),
            params.get('site_name', '').strip(),
            params.get('cell_name', '').strip(),
            params.get('cell_id', '').strip()
        )

    def _extract_2g_info(self, cell_name: str) -> Optional[Dict]:
        """استخراج معلومات 2G من Cell Name"""
        # نمط: Raniyah7_0810-3
        match = re.search(r'([A-Za-z0-9_]+)_(\d+)-(\d+)', cell_name)
        if match:
            return {
                'site_name': match.group(1),
                'site_id': match.group(2),
                'sector': match.group(3)
            }
        return None

    def _extract_3g_info(self, cell_name: str) -> Optional[Dict]:
        """استخراج معلومات 3G من Cell Name"""
        # نمط 1: U9_IshikUniversity_SUL3874-B1
        match1 = re.search(r'U9?_([A-Za-z0-9_]+)_([A-Za-z0-9]+)-([A-Za-z0-9]+)', cell_name)
        if match1:
            return {
                'site_name': match1.group(1),
                'site_id': match1.group(2),
                'sector': match1.group(3)
            }
        
        # نمط 2: U_Kanyaw_SUL3874-B2
        match2 = re.search(r'U_([A-Za-z0-9_]+)_([A-Za-z0-9]+)-([A-Za-z0-9]+)', cell_name)
        if match2:
            return {
                'site_name': match2.group(1),
                'site_id': match2.group(2),
                'sector': match2.group(3)
            }
        return None

    def _extract_4g_info(self, cell_name: str) -> Optional[Dict]:
        """استخراج معلومات 4G من Cell Name"""
        # نمط: L_NewAlwa_SUL0499-4
        match = re.search(r'L_([A-Za-z0-9_]+)_([A-Za-z0-9]+)-(\d+)', cell_name)
        if match:
            return {
                'site_name': match.group(1),
                'site_id': match.group(2),
                'sector': match.group(3)
            }
        return None

    # Calculation Methods - مبسطة
    def _calculate_2g_cell_id(self, site_id: str, sector: str) -> Optional[str]:
        """حساب Cell ID للـ 2G: حذف الأصفار الأولى + إضافة السكتر"""
        site_numbers = re.findall(r'\d+', site_id)
        if site_numbers:
            clean_site = site_numbers[-1].lstrip('0') or '0'
            return f"{clean_site}{sector}"
        return None

    def _calculate_3g_cell_id(self, site_id: str, sector: str) -> Optional[str]:
        """
        حساب Cell ID للـ 3G مع دعم السكتورات الموسعة
        A1=1, B1=2, C1=3, A2=4, B2=5, C2=6, D1=7, D2=8, E1=9, E2=10, etc.
        """
        site_numbers = re.findall(r'\d+', site_id)
        if site_numbers:
            base_number = site_numbers[-1]
            if len(base_number) > 4:
                base_number = base_number[-4:]
            
            # خريطة السكتورات الموسعة
            sector_map = {
                'A1': '1', 'B1': '2', 'C1': '3', 'D1': '7', 'E1': '9', 'F1': '11',
                'A2': '4', 'B2': '5', 'C2': '6', 'D2': '8', 'E2': '10', 'F2': '12'
            }
            
            sector_digit = sector_map.get(sector.upper())
            
            # إذا لم يجد في الخريطة، حاول حساب ديناميكي
            if not sector_digit:
                letter_match = re.match(r'([A-F])(\d+)', sector.upper())
                if letter_match:
                    letter = letter_match.group(1)
                    number = int(letter_match.group(2))
                    
                    # حساب بسيط: A=1, B=2, C=3, D=7, E=9, F=11 للرقم 1
                    # A=4, B=5, C=6, D=8, E=10, F=12 للرقم 2
                    base_values = {'A': 1, 'B': 2, 'C': 3, 'D': 7, 'E': 9, 'F': 11}
                    if letter in base_values:
                        if number == 1:
                            sector_digit = str(base_values[letter])
                        else:  # number == 2
                            if letter in ['A', 'B', 'C']:
                                sector_digit = str(base_values[letter] + 3)
                            else:
                                sector_digit = str(base_values[letter] + 1)
            
            if sector_digit:
                result = f"{base_number}{sector_digit}"
                logger.info(f"3G حساب: {site_id} + {sector} = {result}")
                return result
                
        return None

    def _calculate_4g_cell_id(self, site_id: str, sector: str) -> Optional[str]:
        """حساب Cell ID للـ 4G: حفظ الأصفار + padding للسكتر"""
        site_numbers = re.findall(r'\d+', site_id)
        if site_numbers:
            clean_site = site_numbers[-1]
            if len(clean_site) < 4:
                clean_site = clean_site.zfill(4)
            elif len(clean_site) > 4:
                clean_site = clean_site[-4:]
            
            try:
                sector_padded = f"{int(sector):03d}"
                return f"{clean_site}{sector_padded}"
            except ValueError:
                pass
        return None

    # Format Methods - مبسطة
    def _format_2g_result(self, site: TwoGSiteInformation, match_type: str, confidence: float) -> Dict:
        """تنسيق نتائج 2G"""
        return {
            'id': site.id,
            'technology': '2G',
            'site_id': site.site_id,
            'cell_id': site.cell_id,
            'site_name': site.site_name,
            'cell_name': f"2G_{site.site_name}_{site.site_id}-{site.cell_id}",
            'city': site.geo_city,
            'coordinates': {'latitude': float(site.latitude), 'longitude': float(site.longitude)},
            'technical_info': {
                'bsc': site.bsc,
                'lac': site.lac,
                'azimuth': float(site.azimuth) if site.azimuth else None,
                'antenna_height': float(site.antenna_height) if site.antenna_height else None
            },
            'match_type': match_type,
            'match_confidence': confidence,
            'created_at': site.created_at.isoformat() if site.created_at else None
        }

    def _format_3g_result(self, site: ThreeGSiteInformation, match_type: str, confidence: float) -> Dict:
        """تنسيق نتائج 3G"""
        return {
            'id': site.id,
            'technology': '3G',
            'site_id': site.site_id,
            'cell_id': site.cell_id,
            'site_name': site.full_site_name,
            'cell_name': site.cell_name,
            'city': site.geo_city,
            'coordinates': {'latitude': float(site.latitude), 'longitude': float(site.longitude)},
            'technical_info': {
                'rnc': site.rnc,
                'lac': site.lac,
                'azimuth': float(site.azimuth) if site.azimuth else None,
                'antenna_height': float(site.antenna_height) if site.antenna_height else None
            },
            'match_type': match_type,
            'match_confidence': confidence,
            'created_at': site.created_at.isoformat() if site.created_at else None
        }

    def _format_4g_result(self, site: FourGSiteInformation, match_type: str, confidence: float) -> Dict:
        """تنسيق نتائج 4G"""
        return {
            'id': site.id,
            'technology': '4G',
            'site_id': site.site_id,
            'cell_id': site.cell_id,
            'site_name': site.full_site_name,
            'cell_name': site.cell_name,
            'city': site.geo_city,
            'coordinates': {'latitude': float(site.rf_plan_latitude), 'longitude': float(site.rf_plan_longitude)},
            'technical_info': {
                'province_id': site.province_id,
                'lac_tac': site.lac_tac,
                'azimuth': float(site.azimuth) if site.azimuth else None,
                'antenna_height': float(site.antenna_height) if site.antenna_height else None
            },
            'match_type': match_type,
            'match_confidence': confidence,
            'created_at': site.created_at.isoformat() if site.created_at else None
        }

    def _format_z_result(self, site: SiteInformation, match_type: str, confidence: float) -> Dict:
        """تنسيق نتائج Z Format"""
        return {
            'id': site.id,
            'technology': 'Z_Format',
            'site_id': site.site_enb_id,
            'cell_id': site.cell_id,
            'site_name': site.site_name,
            'cell_name': f"Z_{site.site_name}_{site.site_enb_id}",
            'city': site.governorate,
            'coordinates': {'latitude': float(site.latitude), 'longitude': float(site.longitude)},
            'technical_info': {
                'bore': float(site.bore) if site.bore else None,
                'lac_cell_id_ecgi': site.lac_cell_id_ecgi
            },
            'match_type': match_type,
            'match_confidence': confidence,
            'created_at': None
        }

    # Public Methods
    def quick_search(self, keyword: str, format_type: str = 'ALL') -> Dict:
        """بحث سريع مبسط مع تحليل ذكي للأنماط"""
        if not keyword.strip():
            return {'success': False, 'error': 'الكلمة المفتاحية مطلوبة', 'results': [], 'total_found': 0}
        
        # تحليل ذكي للكلمة المفتاحية
        search_params = {'format_type': format_type.upper()}
        
        # نمط عام: Site-Sector (مثل SUL0499-D2)
        general_pattern = re.match(r'^([A-Z]{2,4}\d{1,4})-([A-Z]?\d+)$', keyword)
        if general_pattern:
            site_id = general_pattern.group(1)
            sector = general_pattern.group(2)
            search_params.update({
                'site_id': site_id,
                'sector': sector,
                'cell_name': keyword  # للبحث المباشر أيضاً
            })
            logger.info(f"تحليل نمط عام: {keyword} → Site: {site_id}, Sector: {sector}")
        
        # نمط Cell Name كامل (يحتوي على _ و -)
        elif '_' in keyword and '-' in keyword:
            search_params['cell_name'] = keyword
            # محاولة استخراج Site ID للبحث الاحتياطي
            extracted = self._extract_any_site_info(keyword)
            if extracted:
                search_params.update(extracted)
        
        # نمط Site ID بسيط
        elif re.match(r'^[A-Z]{2,4}\d{1,4}$', keyword):
            search_params['site_id'] = keyword
        
        # نمط Cell ID رقمي
        elif re.match(r'^\d{3,7}$', keyword):
            search_params['cell_id'] = keyword
        
        # البحث العام
        else:
            search_params.update({
                'site_id': keyword,
                'site_name': keyword,
                'cell_name': keyword
            })
        
        return self.search_sites(search_params)

    def _extract_any_site_info(self, keyword: str) -> Optional[Dict]:
        """استخراج معلومات من أي نمط ممكن"""
        # جرب جميع طرق الاستخراج
        for extract_func in [self._extract_3g_info, self._extract_4g_info, self._extract_2g_info]:
            result = extract_func(keyword)
            if result:
                return result
        
        # نمط عام بسيط: أي شيء يحتوي على site-sector
        match = re.search(r'([A-Z]{2,4}\d{1,4})-([A-Z]?\d+)', keyword)
        if match:
            return {
                'site_id': match.group(1),
                'sector': match.group(2)
            }
        
        return None

    def get_statistics(self) -> Dict:
        """إحصائيات بسيطة"""
        try:
            stats = {
                '2G': TwoGSiteInformation.objects.count(),
                '3G': ThreeGSiteInformation.objects.count(),
                '4G': FourGSiteInformation.objects.count(),
                'Z_Format': SiteInformation.objects.count()
            }
            
            return {
                'success': True,
                'statistics': stats,
                'total_sites': sum(stats.values())
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'statistics': {}, 'total_sites': 0}

    def get_site_details(self, site_id: int, technology: str) -> Optional[Dict]:
        """الحصول على تفاصيل برج محدد"""
        try:
            if technology == '2G':
                site = TwoGSiteInformation.objects.get(id=site_id)
                return self._format_2g_result(site, 'direct_access', 1.0)
            elif technology == '3G':
                site = ThreeGSiteInformation.objects.get(id=site_id)
                return self._format_3g_result(site, 'direct_access', 1.0)
            elif technology == '4G':
                site = FourGSiteInformation.objects.get(id=site_id)
                return self._format_4g_result(site, 'direct_access', 1.0)
            elif technology in ['Z', 'Z_Format']:
                site = SiteInformation.objects.get(id=site_id)
                return self._format_z_result(site, 'direct_access', 1.0)
        except Exception as e:
            logger.error(f"خطأ في الحصول على تفاصيل البرج: {str(e)}")
        return None