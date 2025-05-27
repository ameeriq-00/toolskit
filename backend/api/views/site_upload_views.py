# backend/api/views/site_upload_views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db import transaction
import pandas as pd
from ..models import TwoGSiteInformation, ThreeGSiteInformation, FourGSiteInformation, SiteInformation
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def upload_2g_sites(request):
    """رفع معلومات أبراج 2G"""
    try:
        if 'file' not in request.FILES:
            return Response({"error": "الملف مطلوب"}, status=400)

        file = request.FILES['file']
        df = pd.read_excel(file)
        
        # التحقق من الأعمدة المطلوبة
        required_columns = [
            'BSC', 'SiteName', 'SiteID', 'CellID', 'Geo-City', 'LAC', 
            'MCC', 'MNC', 'Longitude', 'Latitude', 'Mtilt', 'Etilt', 
            'Azimuth(Degree)', 'Antennaheight', 'Ant_BeamWidth'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return Response({
                "error": f"الأعمدة التالية مفقودة: {', '.join(missing_columns)}"
            }, status=400)

        success_count = 0
        error_count = 0
        errors = []

        with transaction.atomic():
            # مسح البيانات القديمة
            TwoGSiteInformation.objects.all().delete()
            
            for index, row in df.iterrows():
                try:
                    TwoGSiteInformation.objects.create(
                        bsc=str(row['BSC']).strip(),
                        site_name=str(row['SiteName']).strip(),
                        site_id=str(row['SiteID']).strip(),
                        cell_id=str(row['CellID']).strip(),
                        geo_city=str(row['Geo-City']).strip(),
                        lac=str(row['LAC']).strip(),
                        mcc=str(row['MCC']).strip(),
                        mnc=str(row['MNC']).strip(),
                        longitude=float(row['Longitude']),
                        latitude=float(row['Latitude']),
                        mechanical_tilt=float(row['Mtilt']) if pd.notna(row['Mtilt']) else None,
                        electrical_tilt=float(row['Etilt']) if pd.notna(row['Etilt']) else None,
                        azimuth=float(row['Azimuth(Degree)']) if pd.notna(row['Azimuth(Degree)']) else None,
                        antenna_height=float(row['Antennaheight']) if pd.notna(row['Antennaheight']) else None,
                        antenna_beam_width=float(row['Ant_BeamWidth']) if pd.notna(row['Ant_BeamWidth']) else None,
                    )
                    success_count += 1
                except Exception as e:
                    error_count += 1
                    errors.append(f"الصف {index + 1}: {str(e)}")
                    if len(errors) < 10:  # احتفظ بأول 10 أخطاء فقط
                        continue

        return Response({
            "message": f"تم رفع {success_count} برج 2G بنجاح",
            "success_count": success_count,
            "error_count": error_count,
            "errors": errors[:10] if errors else []
        })

    except Exception as e:
        logger.error(f"خطأ في رفع أبراج 2G: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def upload_3g_sites(request):
    """رفع معلومات أبراج 3G"""
    try:
        if 'file' not in request.FILES:
            return Response({"error": "الملف مطلوب"}, status=400)

        file = request.FILES['file']
        df = pd.read_excel(file)
        
        # التحقق من الأعمدة المطلوبة
        required_columns = [
            'RNC Site ID', 'Site ID', 'Cell ID', 'Full Site Name', 'Cell_Name', 
            'LAC', 'Geo-City', 'Longitude', 'Latitude', 'Azimuth', 
            'Mechanical Tilt', 'Elect. Tilt', 'Antenna Height'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return Response({
                "error": f"الأعمدة التالية مفقودة: {', '.join(missing_columns)}"
            }, status=400)

        success_count = 0
        error_count = 0
        errors = []

        with transaction.atomic():
            # مسح البيانات القديمة
            ThreeGSiteInformation.objects.all().delete()
            
            for index, row in df.iterrows():
                try:
                    ThreeGSiteInformation.objects.create(
                        rnc=str(row['RNC']).strip(),
                        site_id=str(row['Site ID']).strip(),
                        cell_id=str(row['Cell ID']).strip(),
                        full_site_name=str(row['Full Site Name']).strip(),
                        cell_name=str(row['Cell_Name']).strip(),
                        lac=str(row['LAC']).strip(),
                        geo_city=str(row['Geo-City']).strip(),
                        longitude=float(row['Longitude']),
                        latitude=float(row['Latitude']),
                        azimuth=float(row['Azimuth']) if pd.notna(row['Azimuth']) else None,
                        mechanical_tilt=float(row['Mechanical Tilt']) if pd.notna(row['Mechanical Tilt']) else None,
                        electrical_tilt=float(row['Elect. Tilt']) if pd.notna(row['Elect. Tilt']) else None,
                        antenna_height=float(row['Antenna Height']) if pd.notna(row['Antenna Height']) else None,
                    )
                    success_count += 1
                except Exception as e:
                    error_count += 1
                    errors.append(f"الصف {index + 1}: {str(e)}")
                    if len(errors) < 10:
                        continue

        return Response({
            "message": f"تم رفع {success_count} برج 3G بنجاح",
            "success_count": success_count,
            "error_count": error_count,
            "errors": errors[:10] if errors else []
        })

    except Exception as e:
        logger.error(f"خطأ في رفع أبراج 3G: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def upload_4g_sites(request):
    """رفع معلومات أبراج 4G"""
    try:
        if 'file' not in request.FILES:
            return Response({"error": "الملف مطلوب"}, status=400)

        file = request.FILES['file']
        df = pd.read_excel(file)
        
        # التحقق من الأعمدة المطلوبة
        required_columns = [
            'SiteID', 'CellID', 'Province ID', 'GEOCity', 'FullSiteName', 
            'CellName', 'Technology', 'LAC/TAC', 'AntennaHeight', 'Azimuth', 
            'RFPlanLongitude', 'RFPlanLatitude'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return Response({
                "error": f"الأعمدة التالية مفقودة: {', '.join(missing_columns)}"
            }, status=400)

        success_count = 0
        error_count = 0
        errors = []

        with transaction.atomic():
            # مسح البيانات القديمة
            FourGSiteInformation.objects.all().delete()
            
            for index, row in df.iterrows():
                try:
                    FourGSiteInformation.objects.create(
                        site_id=str(row['SiteID']).strip(),
                        cell_id=str(row['CellID']).strip(),
                        province_id=str(row['Province ID']).strip(),
                        geo_city=str(row['GEOCity']).strip(),
                        full_site_name=str(row['FullSiteName']).strip(),
                        cell_name=str(row['CellName']).strip(),
                        technology=str(row['Technology']).strip(),
                        lac_tac=str(row['LAC/TAC']).strip(),
                        antenna_height=float(row['AntennaHeight']) if pd.notna(row['AntennaHeight']) else None,
                        azimuth=float(row['Azimuth']) if pd.notna(row['Azimuth']) else None,
                        rf_plan_longitude=float(row['RFPlanLongitude']),
                        rf_plan_latitude=float(row['RFPlanLatitude']),
                    )
                    success_count += 1
                except Exception as e:
                    error_count += 1
                    errors.append(f"الصف {index + 1}: {str(e)}")
                    if len(errors) < 10:
                        continue

        return Response({
            "message": f"تم رفع {success_count} برج 4G بنجاح",
            "success_count": success_count,
            "error_count": error_count,
            "errors": errors[:10] if errors else []
        })

    except Exception as e:
        logger.error(f"خطأ في رفع أبراج 4G: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def upload_z_format_sites(request):
    """رفع معلومات أبراج Z Format (النموذج الموجود)"""
    try:
        if 'file' not in request.FILES:
            return Response({"error": "الملف مطلوب"}, status=400)

        file = request.FILES['file']
        df = pd.read_excel(file)
        
        # التحقق من الأعمدة المطلوبة للـ Z Format
        required_columns = [
            'Governorate', 'Site/eNBId', 'Cell ID', 'Site Name', 
            'lat', 'Long', 'Bore', 'LAC_Cell ID/ECGI'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return Response({
                "error": f"الأعمدة التالية مفقودة: {', '.join(missing_columns)}"
            }, status=400)

        success_count = 0
        error_count = 0
        errors = []

        with transaction.atomic():
            # مسح البيانات القديمة
            SiteInformation.objects.all().delete()
            
            for index, row in df.iterrows():
                try:
                    SiteInformation.objects.create(
                        governorate=str(row['Governorate']).strip(),
                        site_enb_id=str(row['Site/eNBId']).strip(),
                        cell_id=str(row['Cell ID']).strip(),
                        site_name=str(row['Site Name']).strip(),
                        latitude=float(row['lat']),
                        longitude=float(row['Long']),
                        bore=float(row['Bore']) if pd.notna(row['Bore']) else 0,
                        lac_cell_id_ecgi=str(row['LAC_Cell ID/ECGI']).strip(),
                    )
                    success_count += 1
                except Exception as e:
                    error_count += 1
                    errors.append(f"الصف {index + 1}: {str(e)}")
                    if len(errors) < 10:
                        continue

        return Response({
            "message": f"تم رفع {success_count} برج Z Format بنجاح",
            "success_count": success_count,
            "error_count": error_count,
            "errors": errors[:10] if errors else []
        })

    except Exception as e:
        logger.error(f"خطأ في رفع أبراج Z Format: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_upload_statistics(request):
    """الحصول على إحصائيات الرفع"""
    try:
        stats = {
            '2G': TwoGSiteInformation.objects.count(),
            '3G': ThreeGSiteInformation.objects.count(),
            '4G': FourGSiteInformation.objects.count(),
            'Z_Format': SiteInformation.objects.count(),
        }
        
        total = sum(stats.values())
        
        return Response({
            "statistics": stats,
            "total_sites": total,
            "message": f"إجمالي {total} برج مرفوع في النظام"
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)