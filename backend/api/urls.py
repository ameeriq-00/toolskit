# backend/api/urls.py - مُصحح ومتطابق مع Frontend

from django.urls import path
from .views import analysis_views, auth_views, user_management_views
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
    # ===== Authentication endpoints =====
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Enhanced Authentication
    path('auth/login/', auth_views.login, name='enhanced_login'),
    path('auth/logout/', auth_views.logout, name='enhanced_logout'),
    path('auth/user-info/', auth_views.get_user_info, name='enhanced_user_info'),
    path('auth/change-password/', auth_views.change_my_password, name='change_my_password'),
    path('auth/my-sessions/', auth_views.get_my_sessions, name='my_sessions'),
    path('auth/my-activities/', auth_views.get_my_activities, name='my_activities'),
    path('auth/security-dashboard/', auth_views.get_security_dashboard, name='security_dashboard'),
    path('auth/unlock-account/', auth_views.unlock_my_account, name='unlock_my_account'),
    path('auth/refresh-session/', auth_views.refresh_session, name='refresh_session'),
    path('auth/report-suspicious/', auth_views.report_suspicious_activity, name='report_suspicious'),
    
    # Validation endpoints
    path('auth/check-username/', auth_views.check_username_availability, name='check_username'),
    path('auth/validate-password/', auth_views.validate_password_strength, name='validate_password'),
    
    # Legacy auth endpoint (للتوافق مع الكود الموجود)
    path('user-info/', auth_views.get_user_info, name='user_info'),
    path('number-lookup/', auth_views.number_lookup, name='number_lookup'),
    
    # ===== User Management endpoints =====
    # Users CRUD
    path('admin/users/', user_management_views.list_users, name='list_users'),
    path('admin/users/create/', user_management_views.create_user, name='create_user'),
    path('admin/users/<int:user_id>/', user_management_views.get_user_details, name='get_user_details'),
    path('admin/users/<int:user_id>/update/', user_management_views.update_user, name='update_user'),
    path('admin/users/<int:user_id>/delete/', user_management_views.delete_user, name='delete_user'),
    
    # User Actions
    path('admin/users/<int:user_id>/activate/', user_management_views.activate_user, name='activate_user'),
    path('admin/users/<int:user_id>/deactivate/', user_management_views.deactivate_user, name='deactivate_user'),
    path('admin/users/<int:user_id>/change-password/', user_management_views.change_password, name='admin_change_password'),
    path('admin/users/<int:user_id>/activities/', user_management_views.get_user_activities, name='get_user_activities'),
    
    # Roles Management
    path('admin/roles/', user_management_views.list_roles, name='list_roles'),
    path('admin/permissions/', user_management_views.get_user_permissions, name='get_user_permissions'),
    
    # System Activities & Security
    path('admin/activities/', user_management_views.get_system_activities, name='get_system_activities'),
    path('admin/security-alerts/', user_management_views.get_security_alerts, name='get_security_alerts'),
    path('admin/security-alerts/<int:alert_id>/resolve/', user_management_views.resolve_security_alert, name='resolve_security_alert'),
    path('admin/dashboard-stats/', user_management_views.get_dashboard_statistics, name='dashboard_statistics'),
    
    # Session Management
    path('admin/sessions/<int:session_id>/terminate/', user_management_views.terminate_session, name='terminate_session'),
    
    # ===== Analysis endpoints (existing) =====
    path('analyze-excel/', analysis_views.analyze_excel, name='analyze_excel'),
    path('analyze-excel-z/', analysis_views.analyze_excel_z, name='analyze_excel_z'),
    path('compare-sheets/', analysis_views.compare_excel_sheets, name='compare_sheets'),
    
    # ===== Site Upload endpoints - CORRECTED PATHS =====
    # ✅ مسارات الرفع المُصححة لتتطابق مع Frontend
    path('sites/upload/2g/', upload_2g_sites, name='upload_2g_sites'),
    path('sites/upload/3g/', upload_3g_sites, name='upload_3g_sites'),
    path('sites/upload/4g/', upload_4g_sites, name='upload_4g_sites'),
    path('sites/upload/z/', upload_z_format_sites, name='upload_z_sites'),
    path('sites/upload/statistics/', get_upload_statistics, name='upload_statistics'),
    
    # ===== LEGACY Upload endpoints - للتوافق مع الكود القديم =====
    # ⚠️ هذه المسارات للتوافق مع الكود القديم - يمكن حذفها لاحقاً
    path('upload-2g-sites/', upload_2g_sites, name='legacy_upload_2g_sites'),
    path('upload-3g-sites/', upload_3g_sites, name='legacy_upload_3g_sites'),
    path('upload-4g-sites/', upload_4g_sites, name='legacy_upload_4g_sites'),
    path('upload-z-format-sites/', upload_z_format_sites, name='legacy_upload_z_sites'),
    path('upload-statistics/', get_upload_statistics, name='legacy_upload_statistics'),
    
    # ===== Site Search endpoints - EXISTING SYSTEM =====
    path('sites/simplified-search/', simplified_site_search, name='simplified_site_search'),
    path('sites/search/', search_sites, name='search_sites'),
    path('sites/quick-search/', quick_site_search, name='quick_site_search'),
    path('sites/advanced-search/', advanced_site_search, name='advanced_site_search'),
    path('sites/<int:site_id>/<str:technology>/details/', get_site_details, name='get_site_details'),
    path('sites/statistics/', get_search_statistics, name='search_statistics'),
    path('sites/cities/', get_available_cities, name='available_cities'),
    
    # ===== Nearby Sites endpoints - NEW SYSTEM =====
    path('sites/nearby/', find_nearby_sites, name='find_nearby_sites'),
    path('sites/nearby/asia/', find_nearby_asia_sites, name='find_nearby_asia_sites'),
    path('sites/nearby/zain/', find_nearby_zain_sites, name='find_nearby_zain_sites'),
    path('sites/nearby/radius/', get_nearby_sites_in_radius, name='get_nearby_sites_in_radius'),
    path('sites/nearby/test/', test_nearby_search, name='test_nearby_search'),  # للاختبار فقط
]
