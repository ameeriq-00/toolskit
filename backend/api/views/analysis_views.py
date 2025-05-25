"""
Analysis API Views
Clean API endpoints - only handle HTTP requests/responses
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..services.standard_analyzer import StandardAnalyzer
from ..services.z_analyzer import ZFormatAnalyzer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_excel(request):
    """Standard format analysis endpoint"""
    if 'file' not in request.FILES:
        return Response({"error": "No file uploaded"}, status=400)

    file = request.FILES['file']
    
    try:
        # Use service instead of inline logic
        analyzer = StandardAnalyzer()
        results = analyzer.analyze(file)
        return Response(results)
    except Exception as e:
        print(f"Error in analyze_excel: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_excel_z(request):
    """Z format analysis endpoint"""
    if 'main_file' not in request.FILES or 'imei_file' not in request.FILES:
        return Response({"error": "Both main file and IMEI file are required"}, status=400)

    main_file = request.FILES['main_file']
    imei_file = request.FILES['imei_file']
    
    try:
        # Use service instead of inline logic
        analyzer = ZFormatAnalyzer()
        results = analyzer.analyze(main_file, imei_file)
        return Response(results)
    except Exception as e:
        print(f"Error in analyze_excel_z: {str(e)}")
        return Response({"error": str(e)}, status=500)