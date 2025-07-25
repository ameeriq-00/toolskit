# backend/api/views/site_search_views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..services.site_search_service import UnifiedSiteSearchService
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simplified_site_search(request):
    """
    البحث المبسط الجديد بالبرج والسكتر
    
    Body:
    {
        "site_id": "2199",              // مطلوب - رقم البرج
        "sector": "A3",                 // اختياري - السكتر
        "format_type": "ALL"            // اختياري - نوع التقنية
    }
    
    أمثلة المدخلات المدعومة:
    - "2199" (جميع سكتورات البرج 2199)
    - "21997" (البرج 2199 السكتر 7)
    - "BAG2199" (البرج 2199 مع الكود)
    - "2199-A3" (البرج 2199 السكتر A3)
    """
    try:
        site_id = request.data.get('site_id', '').strip()
        sector = request.data.get('sector', '').strip() or None
        format_type = request.data.get('format_type', 'ALL').upper()
        
        if not site_id:
            return Response({
                "success": False,
                "error": "رقم البرج مطلوب"
            }, status=400)
        
        # استخدام الخدمة الجديدة
        search_service = UnifiedSiteSearchService()
        result = search_service.simplified_search(site_id, sector, format_type)
        
        if result['success']:
            total_found = result['total_found']
            search_info = result['search_info']
            
            # إنشاء رسالة وصفية
            if search_info.get('parsed_sector'):
                if search_info.get('search_type') == 'exact_sector':
                    message = f"تم العثور على {total_found} نتيجة للبرج {search_info['parsed_site']} السكتر {search_info['parsed_sector']}"
                else:
                    message = f"تم العثور على {total_found} نتيجة للبرج {search_info['parsed_site']}"
            else:
                message = f"تم العثور على {total_found} نتيجة لجميع سكتورات البرج {search_info['parsed_site']}"
            
            return Response({
                "success": True,
                "message": message,
                "data": result
            })
        else:
            return Response({
                "success": False,
                "error": result.get('error', 'لم يتم العثور على نتائج'),
                "data": {
                    "results": [],
                    "total_found": 0
                }
            }, status=404)
    
    except Exception as e:
        logger.error(f"خطأ في البحث المبسط: {str(e)}")
        return Response({
            "success": False,
            "error": f"خطأ في المعالجة: {str(e)}"
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_sites(request):
    """
    البحث المتقدم في الأبراج
    
    Body:
    {
        "format_type": "2G|3G|4G|Z|ALL",
        "site_id": "2199",
        "sector": "A3",
        "site_name": "Salhiya",
        "cell_name": "U9_Salhiya_BAG2199-A3",
        "city": "Baghdad"
    }
    """
    try:
        search_service = UnifiedSiteSearchService()
        search_params = request.data
        
        # التحقق من البيانات الأساسية
        if not any([
            search_params.get('site_id'),
            search_params.get('site_name'),
            search_params.get('cell_name')
        ]):
            return Response({
                "success": False,
                "error": "يجب إدخال واحد على الأقل من: رقم البرج، اسم البرج، أو اسم الخلية"
            }, status=400)
        
        # تنفيذ البحث
        result = search_service.search_sites(search_params)
        
        if result['success']:
            return Response({
                "success": True,
                "message": f"تم العثور على {result['total_found']} نتيجة",
                "data": result
            })
        else:
            return Response({
                "success": False,
                "error": result.get('error', 'خطأ غير معروف'),
                "data": {
                    "results": [],
                    "total_found": 0
                }
            }, status=400)
    
    except Exception as e:
        logger.error(f"خطأ في بحث الأبراج: {str(e)}")
        return Response({
            "success": False,
            "error": f"خطأ في المعالجة: {str(e)}"
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_site_details(request, site_id, technology):
    """
    الحصول على تفاصيل برج محدد
    
    URL: /api/sites/{site_id}/{technology}/details/
    """
    try:
        search_service = UnifiedSiteSearchService()
        
        # التحقق من صحة التقنية
        valid_technologies = ['2G', '3G', '4G', 'Z', 'Z_Format']
        if technology.upper() not in valid_technologies:
            return Response({
                "success": False,
                "error": f"نوع التقنية غير صالح. الأنواع المدعومة: {', '.join(valid_technologies)}"
            }, status=400)
        
        # الحصول على التفاصيل
        site_details = search_service.get_site_details(site_id, technology.upper())
        
        if site_details:
            return Response({
                "success": True,
                "data": site_details,
                "message": "تم الحصول على تفاصيل البرج بنجاح"
            })
        else:
            return Response({
                "success": False,
                "error": "لم يتم العثور على البرج المطلوب",
                "data": None
            }, status=404)
    
    except Exception as e:
        logger.error(f"خطأ في الحصول على تفاصيل البرج: {str(e)}")
        return Response({
            "success": False,
            "error": f"خطأ في المعالجة: {str(e)}"
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_search_statistics(request):
    """
    الحصول على إحصائيات قواعد بيانات الأبراج
    """
    try:
        search_service = UnifiedSiteSearchService()
        stats = search_service.get_statistics()
        
        return Response(stats)
    
    except Exception as e:
        logger.error(f"خطأ في الحصول على الإحصائيات: {str(e)}")
        return Response({
            "success": False,
            "error": f"خطأ في المعالجة: {str(e)}"
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quick_site_search(request):
    """
    بحث سريع بكلمة مفتاحية واحدة
    
    Body:
    {
        "keyword": "2199",
        "format_type": "ALL"  // اختياري
    }
    """
    try:
        keyword = request.data.get('keyword', '').strip()
        format_type = request.data.get('format_type', 'ALL')
        
        if not keyword:
            return Response({
                "success": False,
                "error": "الكلمة المفتاحية مطلوبة"
            }, status=400)
        
        # تحضير معاملات البحث للبحث المتقدم
        search_params = {
            'format_type': format_type,
            'site_id': keyword,
            'site_name': keyword,
            'cell_name': keyword
        }
        
        search_service = UnifiedSiteSearchService()
        result = search_service.search_sites(search_params)
        
        if result['success']:
            return Response({
                "success": True,
                "message": f"تم العثور على {result['total_found']} نتيجة للكلمة المفتاحية: {keyword}",
                "data": result
            })
        else:
            return Response({
                "success": False,
                "error": result.get('error', 'لم يتم العثور على نتائج'),
                "data": {
                    "results": [],
                    "total_found": 0
                }
            })
    
    except Exception as e:
        logger.error(f"خطأ في البحث السريع: {str(e)}")
        return Response({
            "success": False,
            "error": f"خطأ في المعالجة: {str(e)}"
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def advanced_site_search(request):
    """
    بحث متقدم مع خيارات إضافية
    
    Body:
    {
        "format_type": "ALL",
        "search_criteria": {
            "site_id": "2199",
            "sector": "A3",
            "site_name": "Salhiya",
            "city": "Baghdad"
        },
        "filters": {
            "min_confidence": 0.7,
            "max_results": 20,
            "sort_by": "confidence"  // confidence|technology|site_name
        }
    }
    """
    try:
        search_criteria = request.data.get('search_criteria', {})
        filters = request.data.get('filters', {})
        format_type = request.data.get('format_type', 'ALL')
        
        # إضافة format_type إلى معايير البحث
        search_params = {
            'format_type': format_type,
            **search_criteria
        }
        
        search_service = UnifiedSiteSearchService()
        result = search_service.search_sites(search_params)
        
        if result['success']:
            # تطبيق الفلاتر
            filtered_results = result['results']
            
            # فلترة الثقة الدنيا
            min_confidence = filters.get('min_confidence', 0.0)
            if min_confidence > 0:
                filtered_results = [
                    r for r in filtered_results 
                    if r['match_confidence'] >= min_confidence
                ]
            
            # تحديد عدد النتائج
            max_results = filters.get('max_results', 50)
            filtered_results = filtered_results[:max_results]
            
            # الترتيب
            sort_by = filters.get('sort_by', 'confidence')
            if sort_by == 'technology':
                filtered_results.sort(key=lambda x: x['technology'])
            elif sort_by == 'site_name':
                filtered_results.sort(key=lambda x: x['site_name'])
            # الافتراضي هو confidence (مرتب مسبقاً)
            
            return Response({
                "success": True,
                "message": f"تم العثور على {len(filtered_results)} نتيجة بعد التصفية",
                "data": {
                    **result,
                    "results": filtered_results,
                    "total_found": len(filtered_results),
                    "filters_applied": filters
                }
            })
        else:
            return Response({
                "success": False,
                "error": result.get('error', 'لم يتم العثور على نتائج'),
                "data": {
                    "results": [],
                    "total_found": 0
                }
            })
    
    except Exception as e:
        logger.error(f"خطأ في البحث المتقدم: {str(e)}")
        return Response({
            "success": False,
            "error": f"خطأ في المعالجة: {str(e)}"
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_cities(request):
    """
    الحصول على قائمة المدن المتاحة في جميع قواعد البيانات
    """
    try:
        from ..models import TwoGSiteInformation, ThreeGSiteInformation, FourGSiteInformation, SiteInformation
        
        cities = set()
        
        # جمع المدن من جميع قواعد البيانات
        cities.update(TwoGSiteInformation.objects.values_list('geo_city', flat=True).distinct())
        cities.update(ThreeGSiteInformation.objects.values_list('geo_city', flat=True).distinct())
        cities.update(FourGSiteInformation.objects.values_list('geo_city', flat=True).distinct())
        cities.update(SiteInformation.objects.values_list('governorate', flat=True).distinct())
        
        # تنظيف وترتيب القائمة
        clean_cities = sorted([city.strip() for city in cities if city and city.strip()])
        
        return Response({
            "success": True,
            "cities": clean_cities,
            "total_cities": len(clean_cities),
            "message": f"تم العثور على {len(clean_cities)} مدينة"
        })
    
    except Exception as e:
        logger.error(f"خطأ في الحصول على المدن: {str(e)}")
        return Response({
            "success": False,
            "error": f"خطأ في المعالجة: {str(e)}"
        }, status=500)