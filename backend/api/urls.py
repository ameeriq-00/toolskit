# backend/api/urls.py

from django.urls import path
from .views import analysis_views, auth_views
from .views.site_upload_views import (
    upload_2g_sites, upload_3g_sites, upload_4g_sites, 
    upload_z_format_sites, get_upload_statistics
)
from .views.site_search_views import (
    simplified_site_search, search_sites, get_site_details, 
    get_search_statistics, quick_site_search, advanced_site_search, 
    get_available_cities
)
from .views.nearby_sites_views import (
    find_nearby_sites, find_nearby_asia_sites, find_nearby_zain_sites,
    get_nearby_sites_in_radius, test_nearby_search
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Authentication endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user-info/', auth_views.get_user_info, name='user_info'),
    
    # Analysis endpoints (existing)
    path('analyze-excel/', analysis_views.analyze_excel, name='analyze_excel'),
    path('analyze-excel-z/', analysis_views.analyze_excel_z, name='analyze_excel_z'),
    path('compare-sheets/', analysis_views.compare_excel_sheets, name='compare_sheets'),
    
    # Site Upload endpoints (existing)
    path('sites/upload/2g/', upload_2g_sites, name='upload_2g_sites'),
    path('sites/upload/3g/', upload_3g_sites, name='upload_3g_sites'),
    path('sites/upload/4g/', upload_4g_sites, name='upload_4g_sites'),
    path('sites/upload/z/', upload_z_format_sites, name='upload_z_sites'),
    path('sites/upload/statistics/', get_upload_statistics, name='upload_statistics'),
    
    # Site Search endpoints - EXISTING SYSTEM
    path('sites/simplified-search/', simplified_site_search, name='simplified_site_search'),
    path('sites/search/', search_sites, name='search_sites'),
    path('sites/quick-search/', quick_site_search, name='quick_site_search'),
    path('sites/advanced-search/', advanced_site_search, name='advanced_site_search'),
    path('sites/<int:site_id>/<str:technology>/details/', get_site_details, name='get_site_details'),
    path('sites/statistics/', get_search_statistics, name='search_statistics'),
    path('sites/cities/', get_available_cities, name='available_cities'),
    
    # Nearby Sites endpoints - NEW SYSTEM
    path('sites/nearby/', find_nearby_sites, name='find_nearby_sites'),
    path('sites/nearby/asia/', find_nearby_asia_sites, name='find_nearby_asia_sites'),
    path('sites/nearby/zain/', find_nearby_zain_sites, name='find_nearby_zain_sites'),
    path('sites/nearby/radius/', get_nearby_sites_in_radius, name='get_nearby_sites_in_radius'),
    path('sites/nearby/test/', test_nearby_search, name='test_nearby_search'),  # للاختبار فقط
    
    # Other endpoints (existing)
    path('number-lookup/', auth_views.number_lookup, name='number_lookup'),
]