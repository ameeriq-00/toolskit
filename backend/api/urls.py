# backend/api/urls.py

from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Authentication endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user-info/', views.get_user_info, name='user_info'),
    
    # Existing endpoints
    path('analyze-excel/', views.analyze_excel, name='analyze_excel'),
    path('analyze-excel-z/', views.analyze_excel_z, name='analyze_excel_z'),
    path('upload-site-info/', views.upload_site_info, name='upload_site_info'),
    path('number-lookup/', views.number_lookup, name='number_lookup'),
]