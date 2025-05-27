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
from ..services.comparison_analyzer import ComparisonAnalyzer

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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def compare_excel_sheets(request):
    """Compare multiple Excel sheets for overlap analysis"""
    try:
        # Validate that we have files
        if not request.FILES:
            return Response({"error": "No files uploaded"}, status=400)
        
        # Parse the files and their metadata
        files_data = []
        
        # Get files from request
        for key, file in request.FILES.items():
            # Extract file info from form data
            file_name = request.data.get(f'{key}_name', f'Sheet {len(files_data) + 1}')
            file_format = request.data.get(f'{key}_format', 'standard')
            
            files_data.append({
                'file': file,
                'name': file_name,
                'format': file_format
            })
        
        if len(files_data) < 2:
            return Response({"error": "Need at least 2 files for comparison"}, status=400)
        
        # Perform comparison analysis
        analyzer = ComparisonAnalyzer()
        results = analyzer.analyze_multiple_sheets(files_data)
        
        return Response(results)
        
    except Exception as e:
        print(f"Error in compare_excel_sheets: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)