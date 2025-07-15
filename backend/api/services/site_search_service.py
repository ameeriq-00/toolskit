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
    """خدمة البحث الموحدة للأبراج مع البحث المبسط والمتقدم"""
    
    def simplified_search(self, site_id: str, sector: str = None, format_type: str = 'ALL') -> Dict:
        """
        البحث المبسط - رقم البرج والسكتر فقط
        - site_id: رقم البرج (مطلوب)
        - sector: رقم السكتر (اختياري لتحديد النتيجة)
        - format_type: نوع التقنية
        """
        try:
            results = []
            
            if format_type in ['2G', 'ALL']:
                results.extend(self._search_2g_simplified(site_id, sector))
            
            if format_type in ['3G', 'ALL']:
                results.extend(self._search_3g_simplified(site_id, sector))
            
            if format_type in ['4G', 'ALL']:
                results.extend(self._search_4g_simplified(site_id, sector))
            
            if format_type in ['Z', 'ALL']:
                results.extend(self._search_z_simplified(site_id, sector))
            
            # ترتيب: المطابقة الدقيقة أولاً، ثم حسب التقنية
            results.sort(key=lambda x: (
                -x['match_confidence'],  # الثقة العالية أولاً
                x['technology'],         # ترتيب التقنيات
                x['site_id'],           # ترتيب أرقام الأبراج
                x['cell_id']            # ترتيب أرقام الخلايا
            ))
            
            return {
                'success': True,
                'results': results,
                'total_found': len(results),
                'search_info': {
                    'site_id': site_id,
                    'sector': sector,
                    'format_type': format_type,
                    'search_type': 'exact_sector' if sector else 'all_sectors'
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

    def _search_2g_simplified(self, site_id: str, sector: str = None) -> List[Dict]:
        """بحث مبسط في 2G"""
        results = []
        clean_site_id = self._clean_site_id(site_id)
        
        if sector:
            # بحث محدد: رقم البرج + السكتر
            calculated_cell_id = f"{clean_site_id}{sector}"
            sites = TwoGSiteInformation.objects.filter(
                Q(cell_id=calculated_cell_id) |
                Q(site_id__iexact=site_id, cell_id__endswith=sector)
            )
            for site in sites:
                confidence = 1.0 if site.cell_id == calculated_cell_id else 0.9
                results.append(self._format_2g_result(site, 'exact_sector_match', confidence))
        else:
            # بحث عام: جميع سكتورات البرج
            sites = TwoGSiteInformation.objects.filter(
                Q(site_id__iexact=site_id) |
                Q(site_id__icontains=clean_site_id)
            ).order_by('cell_id')
            for site in sites:
                confidence = 1.0 if site.site_id.upper() == site_id.upper() else 0.8
                results.append(self._format_2g_result(site, 'all_sectors', confidence))
        
        return results

    def _search_3g_simplified(self, site_id: str, sector: str = None) -> List[Dict]:
        """بحث مبسط في 3G"""
        results = []
        
        if sector:
            calculated_cell_id = self._calculate_3g_cell_id(site_id, sector)
            sites = ThreeGSiteInformation.objects.filter(
                Q(cell_id=calculated_cell_id) |
                Q(site_id__iexact=site_id, cell_name__icontains=f'-{sector}')
            )
            for site in sites:
                confidence = 1.0 if site.cell_id == calculated_cell_id else 0.9
                results.append(self._format_3g_result(site, 'exact_sector_match', confidence))
        else:
            sites = ThreeGSiteInformation.objects.filter(
                Q(site_id__iexact=site_id) |
                Q(site_id__icontains=site_id)
            ).order_by('cell_id')
            for site in sites:
                confidence = 1.0 if site.site_id.upper() == site_id.upper() else 0.8
                results.append(self._format_3g_result(site, 'all_sectors', confidence))
        
        return results

    def _search_4g_simplified(self, site_id: str, sector: str = None) -> List[Dict]:
        """بحث مبسط في 4G"""
        results = []
        
        if sector:
            calculated_cell_id = self._calculate_4g_cell_id(site_id, sector)
            sites = FourGSiteInformation.objects.filter(
                Q(cell_id=calculated_cell_id) |
                Q(cell_id__endswith=calculated_cell_id) |
                Q(site_id__iexact=site_id, cell_name__icontains=f'-{sector}')
            )
            for site in sites:
                confidence = 1.0 if calculated_cell_id in site.cell_id else 0.9
                results.append(self._format_4g_result(site, 'exact_sector_match', confidence))
        else:
            sites = FourGSiteInformation.objects.filter(
                Q(site_id__iexact=site_id) |
                Q(site_id__icontains=site_id)
            ).order_by('cell_id')
            for site in sites:
                confidence = 1.0 if site.site_id.upper() == site_id.upper() else 0.8
                results.append(self._format_4g_result(site, 'all_sectors', confidence))
        
        return results

    def _search_z_simplified(self, site_id: str, sector: str = None) -> List[Dict]:
        """بحث مبسط في Z Format"""
        results = []
        
        try:
            if sector:
                sites = SiteInformation.objects.filter(
                    Q(site_enb_id__iexact=site_id) |
                    Q(site_enb_id__icontains=site_id)
                )
            else:
                sites = SiteInformation.objects.filter(
                    Q(site_enb_id__iexact=site_id) |
                    Q(site_enb_id__icontains=site_id) |
                    Q(lac_cell_id_ecgi__icontains=site_id)
                ).order_by('cell_id')
            
            for site in sites:
                confidence = 1.0 if site.site_enb_id.upper() == site_id.upper() else 0.8
                match_type = 'exact_sector_match' if sector else 'all_sectors'
                results.append(self._format_z_result(site, match_type, confidence))
                
        except Exception as e:
            logger.warning(f"خطأ في البحث في Z Format: {str(e)}")
        
        return results

    # البحث المتقدم الأصلي
    def search_sites(self, search_params: Dict) -> Dict:
        """البحث عن الأبراج - الطريقة الأصلية المتقدمة"""
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
            
            results.sort(key=lambda x: x['match_confidence'], reverse=True)
            
            return {
                'success': True,
                'results': results[:50],
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
        """البحث في أبراج 2G - الطريقة الأصلية"""
        results = []
        site_id, sector, site_name, cell_name, cell_id = self._extract_params(params)
        
        if cell_id:
            sites = TwoGSiteInformation.objects.filter(cell_id=cell_id)
            for site in sites:
                results.append(self._format_2g_result(site, 'direct_cell_id', 1.0))
            if results:
                return results
        
        if cell_name:
            extracted = self._extract_2g_info(cell_name)
            if extracted:
                site_id = extracted.get('site_id', site_id)
                sector = extracted.get('sector', sector)
        
        if site_id and sector:
            calculated_cell_id = self._calculate_2g_cell_id(site_id, sector)
            if calculated_cell_id:
                sites = TwoGSiteInformation.objects.filter(cell_id=calculated_cell_id)
                for site in sites:
                    results.append(self._format_2g_result(site, 'calculated', 0.9))
        
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
        """البحث في أبراج 3G - الطريقة الأصلية"""
        results = []
        site_id, sector, site_name, cell_name, cell_id = self._extract_params(params)
        
        if cell_id:
            sites = ThreeGSiteInformation.objects.filter(cell_id=cell_id)
            for site in sites:
                results.append(self._format_3g_result(site, 'direct_cell_id', 1.0))
            if results:
                return results
        
        if cell_name:
            sites = ThreeGSiteInformation.objects.filter(cell_name__iexact=cell_name)
            for site in sites:
                results.append(self._format_3g_result(site, 'exact_cell_name', 1.0))
            
            if not results:
                extracted = self._extract_3g_info(cell_name)
                if extracted:
                    site_id = extracted.get('site_id', site_id)
                    sector = extracted.get('sector', sector)
        
        if not results and site_id and sector:
            calculated_cell_id = self._calculate_3g_cell_id(site_id, sector)
            if calculated_cell_id:
                sites = ThreeGSiteInformation.objects.filter(cell_id=calculated_cell_id)
                for site in sites:
                    results.append(self._format_3g_result(site, 'calculated', 0.9))
            
            if not results:
                sites = ThreeGSiteInformation.objects.filter(
                    site_id__icontains=site_id,
                    cell_name__icontains=f'-{sector}'
                )
                for site in sites:
                    results.append(self._format_3g_result(site, 'pattern_match', 0.8))
        
        if not results and site_id:
            sites = ThreeGSiteInformation.objects.filter(site_id__icontains=site_id)
            for site in sites[:20]:
                results.append(self._format_3g_result(site, 'site_fallback', 0.7))
        
        if not results and site_name:
            sites = ThreeGSiteInformation.objects.filter(full_site_name__icontains=site_name)
            for site in sites[:20]:
                results.append(self._format_3g_result(site, 'name_search', 0.6))
        
        return results

    def _search_4g(self, params: Dict) -> List[Dict]:
        """البحث في أبراج 4G - الطريقة الأصلية"""
        results = []
        site_id, sector, site_name, cell_name, cell_id = self._extract_params(params)
        
        if cell_id:
            sites = FourGSiteInformation.objects.filter(
                Q(cell_id=cell_id) |
                Q(cell_id__endswith=cell_id)
            )
            for site in sites:
                results.append(self._format_4g_result(site, 'direct_cell_id', 1.0))
            if results:
                return results
        
        if cell_name:
            sites = FourGSiteInformation.objects.filter(cell_name__iexact=cell_name)
            for site in sites:
                results.append(self._format_4g_result(site, 'exact_cell_name', 1.0))
            
            if not results:
                extracted = self._extract_4g_info(cell_name)
                if extracted:
                    site_id = extracted.get('site_id', site_id)
                    sector = extracted.get('sector', sector)
        
        if not results and site_id and sector:
            calculated_cell_id = self._calculate_4g_cell_id(site_id, sector)
            if calculated_cell_id:
                sites = FourGSiteInformation.objects.filter(
                    Q(cell_id=calculated_cell_id) |
                    Q(cell_id__endswith=calculated_cell_id)
                )
                for site in sites:
                    results.append(self._format_4g_result(site, 'calculated', 0.9))
        
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
        """البحث في أبراج Z Format - الطريقة الأصلية"""
        results = []
        
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

    # Helper Methods
    def _extract_params(self, params: Dict) -> tuple:
        return (
            params.get('site_id', '').strip(),
            params.get('sector', '').strip(),
            params.get('site_name', '').strip(),
            params.get('cell_name', '').strip(),
            params.get('cell_id', '').strip()
        )

    def _extract_2g_info(self, cell_name: str) -> Optional[Dict]:
        match = re.search(r'([A-Za-z0-9_]+)_(\d+)-(\d+)', cell_name)
        if match:
            return {
                'site_name': match.group(1),
                'site_id': match.group(2),
                'sector': match.group(3)
            }
        return None

    def _extract_3g_info(self, cell_name: str) -> Optional[Dict]:
        match1 = re.search(r'U9?_([A-Za-z0-9_]+)_([A-Za-z0-9]+)-([A-Za-z0-9]+)', cell_name)
        if match1:
            return {
                'site_name': match1.group(1),
                'site_id': match1.group(2),
                'sector': match1.group(3)
            }
        
        match2 = re.search(r'U_([A-Za-z0-9_]+)_([A-Za-z0-9]+)-([A-Za-z0-9]+)', cell_name)
        if match2:
            return {
                'site_name': match2.group(1),
                'site_id': match2.group(2),
                'sector': match2.group(3)
            }
        return None

    def _extract_4g_info(self, cell_name: str) -> Optional[Dict]:
        match = re.search(r'L_([A-Za-z0-9_]+)_([A-Za-z0-9]+)-(\d+)', cell_name)
        if match:
            return {
                'site_name': match.group(1),
                'site_id': match.group(2),
                'sector': match.group(3)
            }
        return None

    def _clean_site_id(self, site_id: str) -> str:
        numbers = re.findall(r'\d+', site_id)
        return numbers[-1].lstrip('0') if numbers else site_id

    def _calculate_2g_cell_id(self, site_id: str, sector: str) -> Optional[str]:
        site_numbers = re.findall(r'\d+', site_id)
        if site_numbers:
            clean_site = site_numbers[-1].lstrip('0') or '0'
            return f"{clean_site}{sector}"
        return None

    def _calculate_3g_cell_id(self, site_id: str, sector: str) -> Optional[str]:
        site_numbers = re.findall(r'\d+', site_id)
        if site_numbers:
            base_number = site_numbers[-1]
            if len(base_number) > 4:
                base_number = base_number[-4:]
            
            sector_map = {
                'A1': '1', 'B1': '2', 'C1': '3', 'D1': '7', 'E1': '9', 'F1': '11',
                'A2': '4', 'B2': '5', 'C2': '6', 'D2': '8', 'E2': '10', 'F2': '12'
            }
            
            sector_digit = sector_map.get(sector.upper())
            
            if not sector_digit:
                letter_match = re.match(r'([A-F])(\d+)', sector.upper())
                if letter_match:
                    letter = letter_match.group(1)
                    number = int(letter_match.group(2))
                    base_values = {'A': 1, 'B': 2, 'C': 3, 'D': 7, 'E': 9, 'F': 11}
                    if letter in base_values:
                        if number == 1:
                            sector_digit = str(base_values[letter])
                        else:
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

    # Format Methods
    def _format_2g_result(self, site: TwoGSiteInformation, match_type: str, confidence: float) -> Dict:
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

    def get_statistics(self) -> Dict:
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