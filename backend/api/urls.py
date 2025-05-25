# backend/api/urls.py

from django.urls import path
from .views import analysis_views, site_views, auth_views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Authentication endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user-info/', auth_views.get_user_info, name='user_info'),
    
    # Analysis endpoints
    path('analyze-excel/', analysis_views.analyze_excel, name='analyze_excel'),
    path('analyze-excel-z/', analysis_views.analyze_excel_z, name='analyze_excel_z'),
    
    # Site management endpoints
    path('upload-site-info/', site_views.upload_site_info, name='upload_site_info'),
    
    # Other endpoints
    path('number-lookup/', auth_views.number_lookup, name='number_lookup'),
]