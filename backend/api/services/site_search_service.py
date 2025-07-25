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
    خدمة البحث الجديدة للأبراج - النسخة المحدثة
    """
    
    def __init__(self):
        # خريطة تحويل السكتورات للأرقام (للـ 2G/4G وcell_id في 3G فقط)
        self.sector_to_number = {
            'A1': '1', 'B1': '2', 'C1': '3',
            'A2': '4', 'B2': '5', 'C2': '6',
            'A3': '7', 'B3': '8', 'C3': '9'
        }
    
    def simplified_search(self, site_id: str, sector: str = None, format_type: str = 'ALL') -> Dict:
        """
        البحث المبسط - النظام الجديد
        """
        try:
            # تحليل المدخلات
            search_info = self._parse_search_input(site_id, sector)
            
            results = []
            
            # البحث في كل تقنية حسب النوع المطلوب
            if format_type in ['2G', 'ALL']:
                results.extend(self._search_2g_new(search_info))
            
            if format_type in ['3G', 'ALL']:
                results.extend(self._search_3g_new(search_info))
            
            if format_type in ['4G', 'ALL']:
                results.extend(self._search_4g_new(search_info))
            
            if format_type in ['Z', 'ALL']:
                results.extend(self._search_z_new(search_info))
            
            # ترتيب النتائج حسب الثقة والتقنية
            results.sort(key=lambda x: (
                -x['match_confidence'],
                x['technology'],
                x['site_id'],
                x['cell_id']
            ))
            
            return {
                'success': True,
                'results': results,
                'total_found': len(results),
                'search_info': {
                    'original_input': site_id,
                    'sector_input': sector,
                    'parsed_site': search_info['site_number'],
                    'parsed_sector': search_info['sector'],
                    'format_type': format_type,
                    'search_type': 'exact_sector' if search_info['sector'] else 'all_sectors'
                }
            }
            
        except Exception as e:
            logger.error(f"خطأ في البحث المبسط: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'results': [],
                'total_found': 0
            }
    
    def search_sites(self, search_params: Dict) -> Dict:
        """
        البحث المتقدم - يستخدم نفس منطق البحث المبسط
        """
        try:
            site_id = search_params.get('site_id', '').strip()
            sector = search_params.get('sector', '').strip() or None
            format_type = search_params.get('format_type', 'ALL').upper()
            
            # استخدام البحث المبسط كأساس
            if site_id:
                return self.simplified_search(site_id, sector, format_type)
            
            # البحث بالاسم فقط
            site_name = search_params.get('site_name', '').strip()
            cell_name = search_params.get('cell_name', '').strip()
            city = search_params.get('city', '').strip()
            
            results = []
            
            if format_type in ['2G', 'ALL']:
                results.extend(self._search_2g_by_name(site_name, cell_name, city))
            
            if format_type in ['3G', 'ALL']:
                results.extend(self._search_3g_by_name(site_name, cell_name, city))
            
            if format_type in ['4G', 'ALL']:
                results.extend(self._search_4g_by_name(site_name, cell_name, city))
            
            if format_type in ['Z', 'ALL']:
                results.extend(self._search_z_by_name(site_name, cell_name, city))
            
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
            logger.error(f"خطأ في البحث المتقدم: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'results': [],
                'total_found': 0
            }
    
    def _parse_search_input(self, site_id: str, sector: str = None) -> Dict:
        """
        تحليل المدخلات لاستخراج رقم البرج والسكتر
        
        أمثلة:
        - "2199" → site_number="2199", sector=None
        - "21997" → site_number="2199", sector="7"
        - "BAG2199" → site_number="2199", sector=None
        - "2199-A3" → site_number="2199", sector="A3"
        """
        site_id = site_id.strip()
        
        # إذا كان هناك سكتر منفصل
        if sector and sector.strip():
            site_number = self._extract_site_number(site_id)
            return {
                'site_number': site_number,
                'sector': sector.strip().upper(),
                'is_letter_sector': self._is_letter_sector(sector.strip()),
                'original_input': site_id
            }
        
        # البحث عن نمط "رقم-حرف" مثل "2199-A3"
        pattern_match = re.search(r'(\d+)-([A-Z]\d)', site_id.upper())
        if pattern_match:
            return {
                'site_number': pattern_match.group(1),
                'sector': pattern_match.group(2),
                'is_letter_sector': True,
                'original_input': site_id
            }
        
        # استخراج الأرقام من المدخل
        site_number = self._extract_site_number(site_id)
        
        # التحقق من وجود سكتر رقمي في النهاية
        # مثال: "21997" → site="2199", sector="7"
        if len(site_number) >= 5:
            potential_site = site_number[:-1]
            potential_sector = site_number[-1]
            
            # التحقق من أن السكتر منطقي (1-9)
            if potential_sector in '123456789':
                return {
                    'site_number': potential_site,
                    'sector': potential_sector,
                    'is_letter_sector': False,
                    'original_input': site_id
                }
        
        # إذا لم يجد سكتر، يعتبر الكل رقم برج
        return {
            'site_number': site_number,
            'sector': None,
            'is_letter_sector': False,
            'original_input': site_id
        }
    
    def _extract_site_number(self, site_id: str) -> str:
        """استخراج الأرقام من رقم البرج"""
        numbers = re.findall(r'\d+', site_id)
        return numbers[-1] if numbers else site_id
    
    def _is_letter_sector(self, sector: str) -> bool:
        """التحقق من أن السكتر يحتوي على حروف"""
        return bool(re.match(r'[A-Z]\d', sector.upper()))
    
    def _search_2g_new(self, search_info: Dict) -> List[Dict]:
        """البحث في 2G بالمنطق الجديد"""
        results = []
        site_number = search_info['site_number']
        sector = search_info.get('sector')
        
        try:
            if sector:
                # تحويل السكتر للرقم إذا كان بحروف
                if search_info.get('is_letter_sector'):
                    numeric_sector = self.sector_to_number.get(sector, sector[-1])
                else:
                    numeric_sector = sector
                
                # حساب Cell ID المتوقع: site + sector
                expected_cell_id = f"{site_number}{numeric_sector}"
                
                # البحث بـ Cell ID المحسوب
                sites = TwoGSiteInformation.objects.filter(
                    cell_id=expected_cell_id
                )
                
                for site in sites:
                    results.append(self._format_2g_result(site, 'calculated_cell_id', 1.0))
                
                # البحث الاحتياطي
                if not results:
                    sites = TwoGSiteInformation.objects.filter(
                        Q(site_id__icontains=site_number) & 
                        Q(cell_id__endswith=numeric_sector)
                    )
                    for site in sites:
                        results.append(self._format_2g_result(site, 'pattern_match', 0.8))
            else:
                # البحث العام - جميع سكتورات البرج
                sites = TwoGSiteInformation.objects.filter(
                    Q(site_id__icontains=site_number) |
                    Q(cell_id__icontains=site_number)
                ).order_by('cell_id')
                
                for site in sites:
                    confidence = 1.0 if site_number in site.site_id else 0.8
                    results.append(self._format_2g_result(site, 'site_search', confidence))
                    
        except Exception as e:
            logger.error(f"خطأ في البحث في 2G: {str(e)}")
        
        return results
    
    def _search_3g_new(self, search_info: Dict) -> List[Dict]:
        """البحث في 3G بالمنطق الجديد - معالجة خاصة للحروف"""
        results = []
        site_number = search_info['site_number']
        sector = search_info.get('sector')
        
        try:
            if sector:
                if search_info.get('is_letter_sector'):
                    # للسكتورات بالحروف - البحث المزدوج
                    
                    # 1. البحث في cell_name بالحرف مباشرة
                    cell_name_patterns = [
                        f"{site_number}-{sector}",
                        f"*{site_number}-{sector}",
                    ]
                    
                    for pattern in cell_name_patterns:
                        sites = ThreeGSiteInformation.objects.filter(
                            cell_name__icontains=pattern.replace('*', '')
                        )
                        for site in sites:
                            results.append(self._format_3g_result(site, 'cell_name_match', 1.0))
                    
                    # 2. البحث في cell_id بالرقم المحول
                    numeric_sector = self.sector_to_number.get(sector, sector[-1])
                    expected_cell_id = f"{site_number}{numeric_sector}"
                    
                    sites = ThreeGSiteInformation.objects.filter(
                        cell_id=expected_cell_id
                    )
                    for site in sites:
                        results.append(self._format_3g_result(site, 'cell_id_converted', 0.9))
                
                else:
                    # للسكتورات الرقمية - البحث في cell_id فقط
                    expected_cell_id = f"{site_number}{sector}"
                    
                    sites = ThreeGSiteInformation.objects.filter(
                        cell_id=expected_cell_id
                    )
                    for site in sites:
                        results.append(self._format_3g_result(site, 'cell_id_numeric', 1.0))
            else:
                # البحث العام - جميع سكتورات البرج
                sites = ThreeGSiteInformation.objects.filter(
                    Q(site_id__icontains=site_number) |
                    Q(cell_id__icontains=site_number) |
                    Q(cell_name__icontains=site_number)
                ).order_by('cell_id')
                
                for site in sites:
                    confidence = 1.0 if site_number in site.site_id else 0.8
                    results.append(self._format_3g_result(site, 'site_search', confidence))
                    
        except Exception as e:
            logger.error(f"خطأ في البحث في 3G: {str(e)}")
        
        return results
    
    def _search_4g_new(self, search_info: Dict) -> List[Dict]:
        """البحث في 4G بالمنطق الجديد"""
        results = []
        site_number = search_info['site_number']
        sector = search_info.get('sector')
        
        try:
            if sector:
                # تحويل السكتر للرقم إذا كان بحروف
                if search_info.get('is_letter_sector'):
                    numeric_sector = self.sector_to_number.get(sector, sector[-1])
                else:
                    numeric_sector = sector
                
                # حساب 4G Cell ID: 81 + site(4 digits) + 00 + sector
                # مثال: 81 + 2199 + 00 + 7 = 812199007
                site_padded = site_number.zfill(4)
                sector_padded = numeric_sector.zfill(3)
                expected_cell_id = f"81{site_padded}{sector_padded}"
                
                # البحث بالـ Cell ID المحسوب
                sites = FourGSiteInformation.objects.filter(
                    Q(cell_id=expected_cell_id) |
                    Q(cell_id__endswith=expected_cell_id)
                )
                
                for site in sites:
                    results.append(self._format_4g_result(site, 'calculated_cell_id', 1.0))
                
                # البحث الاحتياطي
                if not results:
                    sites = FourGSiteInformation.objects.filter(
                        Q(site_id__icontains=site_number) &
                        Q(cell_name__icontains=f"-{numeric_sector}")
                    )
                    for site in sites:
                        results.append(self._format_4g_result(site, 'pattern_match', 0.8))
            else:
                # البحث العام - جميع سكتورات البرج
                sites = FourGSiteInformation.objects.filter(
                    Q(site_id__icontains=site_number) |
                    Q(cell_id__icontains=site_number)
                ).order_by('cell_id')
                
                for site in sites:
                    confidence = 1.0 if site_number in site.site_id else 0.8
                    results.append(self._format_4g_result(site, 'site_search', confidence))
                    
        except Exception as e:
            logger.error(f"خطأ في البحث في 4G: {str(e)}")
        
        return results
    
    def _search_z_new(self, search_info: Dict) -> List[Dict]:
        """البحث في Z Format بالمنطق الجديد"""
        results = []
        site_number = search_info['site_number']
        
        try:
            # Z Format بسيط - البحث بالرقم مباشرة
            sites = SiteInformation.objects.filter(
                Q(site_enb_id__icontains=site_number) |
                Q(cell_id__icontains=site_number) |
                Q(lac_cell_id_ecgi__icontains=site_number)
            ).order_by('cell_id')
            
            for site in sites:
                confidence = 1.0 if site_number == site.site_enb_id else 0.8
                results.append(self._format_z_result(site, 'z_search', confidence))
                
        except Exception as e:
            logger.error(f"خطأ في البحث في Z Format: {str(e)}")
        
        return results
    
    # البحث بالأسماء
    def _search_2g_by_name(self, site_name: str, cell_name: str, city: str) -> List[Dict]:
        """البحث في 2G بالأسماء"""
        queryset = TwoGSiteInformation.objects.all()
        
        if site_name:
            queryset = queryset.filter(site_name__icontains=site_name)
        if city:
            queryset = queryset.filter(geo_city__icontains=city)
        
        results = []
        for site in queryset[:20]:
            results.append(self._format_2g_result(site, 'name_search', 0.6))
        
        return results
    
    def _search_3g_by_name(self, site_name: str, cell_name: str, city: str) -> List[Dict]:
        """البحث في 3G بالأسماء"""
        queryset = ThreeGSiteInformation.objects.all()
        
        if site_name:
            queryset = queryset.filter(full_site_name__icontains=site_name)
        if cell_name:
            queryset = queryset.filter(cell_name__icontains=cell_name)
        if city:
            queryset = queryset.filter(geo_city__icontains=city)
        
        results = []
        for site in queryset[:20]:
            results.append(self._format_3g_result(site, 'name_search', 0.6))
        
        return results
    
    def _search_4g_by_name(self, site_name: str, cell_name: str, city: str) -> List[Dict]:
        """البحث في 4G بالأسماء"""
        queryset = FourGSiteInformation.objects.all()
        
        if site_name:
            queryset = queryset.filter(full_site_name__icontains=site_name)
        if cell_name:
            queryset = queryset.filter(cell_name__icontains=cell_name)
        if city:
            queryset = queryset.filter(geo_city__icontains=city)
        
        results = []
        for site in queryset[:20]:
            results.append(self._format_4g_result(site, 'name_search', 0.6))
        
        return results
    
    def _search_z_by_name(self, site_name: str, cell_name: str, city: str) -> List[Dict]:
        """البحث في Z Format بالأسماء"""
        queryset = SiteInformation.objects.all()
        
        if site_name:
            queryset = queryset.filter(site_name__icontains=site_name)
        if city:
            queryset = queryset.filter(governorate__icontains=city)
        
        results = []
        for site in queryset[:20]:
            results.append(self._format_z_result(site, 'name_search', 0.6))
        
        return results
    
    # Format Methods
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
            'coordinates': {
                'latitude': float(site.latitude), 
                'longitude': float(site.longitude)
            },
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
            'coordinates': {
                'latitude': float(site.latitude), 
                'longitude': float(site.longitude)
            },
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
            'coordinates': {
                'latitude': float(site.rf_plan_latitude), 
                'longitude': float(site.rf_plan_longitude)
            },
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
            'coordinates': {
                'latitude': float(site.latitude), 
                'longitude': float(site.longitude)
            },
            'technical_info': {
                'bore': float(site.bore) if site.bore else None,
                'lac_cell_id_ecgi': site.lac_cell_id_ecgi
            },
            'match_type': match_type,
            'match_confidence': confidence,
            'created_at': None
        }
    
    def get_statistics(self) -> Dict:
        """الحصول على إحصائيات قواعد البيانات"""
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
            return {
                'success': False, 
                'error': str(e), 
                'statistics': {}, 
                'total_sites': 0
            }
    
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