"""
Authentication API Views
Handles user authentication and information
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    """Get current user information"""
    return Response({
        'username': request.user.username,
        'is_staff': request.user.is_staff
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def number_lookup(request):
    """Number lookup endpoint"""
    number = request.GET.get('number', '')
    info = f"Information for number: {number}"
    return Response({"number": number, "info": info})