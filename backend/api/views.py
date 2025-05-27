# backend/api/views.py
# This file is kept for backwards compatibility but all views have been moved to views/ package
# Import all views to maintain existing URL structure

from .views.analysis_views import analyze_excel, analyze_excel_z
from .views.site_views import upload_site_info
from .views.auth_views import get_user_info, number_lookup

# All views are now imported from their respective modules
# This ensures existing URL patterns continue to work
