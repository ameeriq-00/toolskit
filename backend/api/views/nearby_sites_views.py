# backend/api/views/nearby_sites_views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..services.nearby_sites_service import NearbySitesService
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def find_nearby_sites(request):
    """
    البحث عن الأبراج القريبة
    
    Body:
    {
        "site_id": 123,
        "technology": "2G|3G|4G|Z",
        "search_type": "asia|zain",
        "limit": 2
    }
    """
    try:
        site_id = request.data.get('site_id')
        technology = request.data.get('technology', '').upper()
        search_type = request.data.get('search_type', 'asia').lower()
        limit = request.data.get('limit', 2)
        
        print(f"طلب البحث عن الأبراج القريبة: site_id={site_id}, tech={technology}, type={search_type}")
        
        if not site_id or not technology:
            return Response({
                "success": False,
                "error": "معرف البرج والتقنية مطلوبان"
            }, status=400)
        
        # الحصول على تفاصيل البرج الحالي
        current_site = NearbySitesService.get_site_details_for_nearby_search(
            site_id, technology
        )
        
        if not current_site:
            return Response({
                "success": False,
                "error": "لم يتم العثور على البرج المحدد"
            }, status=404)
        
        print(f"البرج الحالي: {current_site}")
        
        # البحث عن الأبراج القريبة
        nearby_sites = NearbySitesService.find_nearby_sites_by_type(
            current_site, search_type, limit
        )
        
        print(f"تم العثور على {len(nearby_sites)} أبراج قريبة")
        for i, site in enumerate(nearby_sites):
            print(f"  {i+1}. {site['site_name']} - {site['distance']:.2f} كم")
        
        return Response({
            "success": True,
            "data": {
                "current_site": current_site,
                "nearby_sites": nearby_sites,
                "search_type": search_type,
                "total_found": len(nearby_sites)
            },
            "message": f"تم العثور على {len(nearby_sites)} برج قريب"
        })
        
    except Exception as e:
        logger.error(f"خطأ في البحث عن الأبراج القريبة: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "success": False,
            "error": f"خطأ في المعالجة: {str(e)}"
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def find_nearby_asia_sites(request):
    """
    البحث عن أقرب أبراج آسيا (2G, 3G, 4G)
    
    Body:
    {
        "site_data": {
            "site_id": "2199",
            "coordinates": {
                "latitude": 33.3152,
                "longitude": 44.3661
            }
        },
        "limit": 2
    }
    """
    try:
        site_data = request.data.get('site_data')
        limit = request.data.get('limit', 2)
        
        print(f"طلب البحث عن أبراج آسيا: {site_data}")
        
        if not site_data or not site_data.get('coordinates'):
            return Response({
                "success": False,
                "error": "بيانات البرج والإحداثيات مطلوبة"
            }, status=400)
        
        print(f"البحث عن أبراج آسيا للبرج: {site_data['site_id']}")
        print(f"الإحداثيات: {site_data['coordinates']}")
        
        nearby_sites = NearbySitesService.find_nearby_asia_sites(site_data, limit)
        
        print(f"نتائج البحث عن أبراج آسيا: {len(nearby_sites)} أبراج")
        for i, site in enumerate(nearby_sites):
            print(f"  آسيا {i+1}: {site['site_name']} ({site['technology']}) - {site['distance']:.2f} كم")
        
        return Response({
            "success": True,
            "data": {
                "nearby_sites": nearby_sites,
                "search_type": "asia",
                "total_found": len(nearby_sites)
            },
            "message": f"تم العثور على {len(nearby_sites)} برج آسيا قريب"
        })
        
    except Exception as e:
        logger.error(f"خطأ في البحث عن أبراج آسيا القريبة: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "success": False,
            "error": f"خطأ في المعالجة: {str(e)}"
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def find_nearby_zain_sites(request):
    """
    البحث عن أقرب أبراج زين (Z Format)
    
    Body:
    {
        "site_data": {
            "site_id": "2199",
            "coordinates": {
                "latitude": 33.3152,
                "longitude": 44.3661
            }
        },
        "limit": 2
    }
    """
    try:
        site_data = request.data.get('site_data')
        limit = request.data.get('limit', 2)
        
        print(f"طلب البحث عن أبراج زين: {site_data}")
        
        if not site_data or not site_data.get('coordinates'):
            return Response({
                "success": False,
                "error": "بيانات البرج والإحداثيات مطلوبة"
            }, status=400)
        
        print(f"البحث عن أبراج زين للبرج: {site_data['site_id']}")
        print(f"الإحداثيات: {site_data['coordinates']}")
        
        nearby_sites = NearbySitesService.find_nearby_zain_sites(site_data, limit)
        
        print(f"نتائج البحث عن أبراج زين: {len(nearby_sites)} أبراج")
        for i, site in enumerate(nearby_sites):
            print(f"  زين {i+1}: {site['site_name']} ({site['technology']}) - {site['distance']:.2f} كم")
        
        return Response({
            "success": True,
            "data": {
                "nearby_sites": nearby_sites,
                "search_type": "zain",
                "total_found": len(nearby_sites)
            },
            "message": f"تم العثور على {len(nearby_sites)} برج زين قريب"
        })
        
    except Exception as e:
        logger.error(f"خطأ في البحث عن أبراج زين القريبة: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "success": False,
            "error": f"خطأ في المعالجة: {str(e)}"
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_nearby_sites_in_radius(request):
    """
    الحصول على جميع الأبراج في نطاق معين
    
    Query Parameters:
    - lat: خط العرض
    - lon: خط الطول
    - radius: نصف القطر بالكيلومتر (افتراضي 5)
    - technology: نوع التقنية (اختياري)
    """
    try:
        lat = float(request.GET.get('lat', 0))
        lon = float(request.GET.get('lon', 0))
        radius = float(request.GET.get('radius', 5))
        technology = request.GET.get('technology', 'all').upper()
        
        print(f"البحث في النطاق: lat={lat}, lon={lon}, radius={radius}, tech={technology}")
        
        if not lat or not lon:
            return Response({
                "success": False,
                "error": "خط العرض وخط الطول مطلوبان"
            }, status=400)
        
        sites_in_radius = []
        
        # البحث في جميع قواعد البيانات أو التقنية المحددة
        if technology in ['2G', 'ALL']:
            from ..models import TwoGSiteInformation
            for site in TwoGSiteInformation.objects.all():
                distance = NearbySitesService.calculate_distance(
                    lat, lon, float(site.latitude), float(site.longitude)
                )
                if distance <= radius:
                    sites_in_radius.append({
                        'site_id': site.site_id,
                        'site_name': site.site_name,
                        'technology': '2G',
                        'distance': round(distance, 2),
                        'coordinates': {
                            'latitude': float(site.latitude),
                            'longitude': float(site.longitude)
                        }
                    })
        
        if technology in ['3G', 'ALL']:
            from ..models import ThreeGSiteInformation
            for site in ThreeGSiteInformation.objects.all():
                distance = NearbySitesService.calculate_distance(
                    lat, lon, float(site.latitude), float(site.longitude)
                )
                if distance <= radius:
                    sites_in_radius.append({
                        'site_id': site.site_id,
                        'site_name': site.full_site_name,
                        'technology': '3G',
                        'distance': round(distance, 2),
                        'coordinates': {
                            'latitude': float(site.latitude),
                            'longitude': float(site.longitude)
                        }
                    })
        
        if technology in ['4G', 'ALL']:
            from ..models import FourGSiteInformation
            for site in FourGSiteInformation.objects.all():
                distance = NearbySitesService.calculate_distance(
                    lat, lon, float(site.rf_plan_latitude), float(site.rf_plan_longitude)
                )
                if distance <= radius:
                    sites_in_radius.append({
                        'site_id': site.site_id,
                        'site_name': site.full_site_name,
                        'technology': '4G',
                        'distance': round(distance, 2),
                        'coordinates': {
                            'latitude': float(site.rf_plan_latitude),
                            'longitude': float(site.rf_plan_longitude)
                        }
                    })
        
        if technology in ['Z', 'Z_FORMAT', 'ALL']:
            from ..models import SiteInformation
            for site in SiteInformation.objects.all():
                distance = NearbySitesService.calculate_distance(
                    lat, lon, float(site.latitude), float(site.longitude)
                )
                if distance <= radius:
                    sites_in_radius.append({
                        'site_id': site.site_enb_id,
                        'site_name': site.site_name,
                        'technology': 'Z_Format',
                        'distance': round(distance, 2),
                        'coordinates': {
                            'latitude': float(site.latitude),
                            'longitude': float(site.longitude)
                        }
                    })
        
        # ترتيب حسب المسافة
        sites_in_radius.sort(key=lambda x: x['distance'])
        
        print(f"تم العثور على {len(sites_in_radius)} برج في النطاق")
        
        return Response({
            "success": True,
            "data": {
                "sites": sites_in_radius,
                "center_coordinates": {"latitude": lat, "longitude": lon},
                "radius_km": radius,
                "technology_filter": technology,
                "total_found": len(sites_in_radius)
            },
            "message": f"تم العثور على {len(sites_in_radius)} برج في نطاق {radius} كم"
        })
        
    except Exception as e:
        logger.error(f"خطأ في البحث في النطاق: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "success": False,
            "error": f"خطأ في المعالجة: {str(e)}"
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_nearby_search(request):
    """
    endpoint للاختبار فقط
    """
    try:
        print("=== اختبار البحث عن الأبراج القريبة ===")
        
        # بيانات اختبار
        test_site_data = {
            'site_id': '2199',
            'coordinates': {
                'latitude': 33.3152,
                'longitude': 44.3661
            }
        }
        
        print(f"بيانات الاختبار: {test_site_data}")
        
        # اختبار البحث عن أبراج آسيا
        asia_sites = NearbySitesService.find_nearby_asia_sites(test_site_data, 2)
        print(f"أبراج آسيا القريبة: {len(asia_sites)}")
        
        # اختبار البحث عن أبراج زين
        zain_sites = NearbySitesService.find_nearby_zain_sites(test_site_data, 2)
        print(f"أبراج زين القريبة: {len(zain_sites)}")
        
        return Response({
            "success": True,
            "data": {
                "test_site": test_site_data,
                "asia_sites": asia_sites,
                "zain_sites": zain_sites
            },
            "message": "تم الاختبار بنجاح"
        })
        
    except Exception as e:
        print(f"خطأ في الاختبار: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "success": False,
            "error": f"خطأ في الاختبار: {str(e)}"
        }, status=500)