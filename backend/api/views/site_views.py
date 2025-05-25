"""
Site Management API Views
Handles site information upload and management
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db import transaction
import pandas as pd
from ..models import SiteInformation


@api_view(['POST'])
@permission_classes([IsAdminUser])
def upload_site_info(request):
    """Upload site information file"""
    if 'site_info_file' not in request.FILES:
        return Response({"error": "Site information file is required"}, status=400)

    site_info_file = request.FILES['site_info_file']
    
    try:
        df = pd.read_excel(site_info_file)
        
        with transaction.atomic():
            SiteInformation.objects.all().delete()
            
            for _, row in df.iterrows():
                SiteInformation.objects.create(
                    governorate=row['Governorate'],
                    site_enb_id=row['Site/eNBId'],
                    cell_id=row['Cell ID'],
                    site_name=row['Site Name'],
                    latitude=row['lat'],
                    longitude=row['Long'],
                    bore=row['Bore'],
                    lac_cell_id_ecgi=row['LAC_Cell ID/ECGI']
                )
        
        return Response({"message": "Site information uploaded and saved successfully"})
    except Exception as e:
        return Response({"error": str(e)}, status=400)