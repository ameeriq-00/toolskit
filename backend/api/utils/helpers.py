"""
دوال مساعدة عامة للنظام
"""
import pandas as pd
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def find_site_info(site_identifier: str) -> Optional[Dict[str, Any]]:
    """
    البحث عن معلومات الموقع حسب المعرف
    هذه الدالة مطلوبة للتوافق مع الكود الموجود
    """
    try:
        from ..models import SiteInformation, TwoGSiteInformation, ThreeGSiteInformation, FourGSiteInformation
        
        # البحث في جميع أنواع المواقع
        site_info = None
        
        # البحث في مواقع Z-Format
        try:
            site = SiteInformation.objects.filter(
                site_enb_id__icontains=site_identifier
            ).first()
            if site:
                return {
                    'name': site.site_name,
                    'lat': site.latitude,
                    'long': site.longitude,
                    'governorate': site.governorate,
                    'type': 'Z-Format'
                }
        except:
            pass
        
        # البحث في مواقع 2G
        try:
            site = TwoGSiteInformation.objects.filter(
                site_id__icontains=site_identifier
            ).first()
            if site:
                return {
                    'name': site.site_name,
                    'lat': site.latitude,
                    'long': site.longitude,
                    'city': site.geo_city,
                    'type': '2G'
                }
        except:
            pass
        
        # البحث في مواقع 3G
        try:
            site = ThreeGSiteInformation.objects.filter(
                site_id__icontains=site_identifier
            ).first()
            if site:
                return {
                    'name': site.full_site_name,
                    'lat': site.latitude,
                    'long': site.longitude,
                    'city': site.geo_city,
                    'type': '3G'
                }
        except:
            pass
        
        # البحث في مواقع 4G
        try:
            site = FourGSiteInformation.objects.filter(
                site_id__icontains=site_identifier
            ).first()
            if site:
                return {
                    'name': site.full_site_name,
                    'lat': site.rf_plan_latitude,
                    'long': site.rf_plan_longitude,
                    'city': site.geo_city,
                    'type': '4G'
                }
        except:
            pass
        
        return None
        
    except Exception as e:
        logger.error(f"خطأ في البحث عن معلومات الموقع {site_identifier}: {str(e)}")
        return None


def clean_phone_number(phone_number: str) -> str:
    """تنظيف رقم الهاتف"""
    if not phone_number:
        return ""
    
    # إزالة المسافات والرموز غير المرغوبة
    cleaned = str(phone_number).strip().replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
    
    # إزالة الأصفار البادئة
    cleaned = cleaned.lstrip('0')
    
    # إزالة رمز البلد العراقي إذا وجد
    if cleaned.startswith('964'):
        cleaned = cleaned[3:]
    elif cleaned.startswith('+964'):
        cleaned = cleaned[4:]
    
    return cleaned


def is_valid_iraqi_number(phone_number: str) -> bool:
    """التحقق من صحة رقم الهاتف العراقي"""
    cleaned = clean_phone_number(phone_number)
    
    if not cleaned:
        return False
    
    # أرقام الهواتف العراقية تبدأ بـ 7 وتتكون من 10 أرقام
    if len(cleaned) == 10 and cleaned.startswith('7'):
        return True
    
    return False


def format_file_size(size_bytes: int) -> str:
    """تنسيق حجم الملف"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    import math
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"


def safe_int_convert(value: Any, default: int = 0) -> int:
    """تحويل آمن إلى رقم صحيح"""
    try:
        if pd.isna(value):
            return default
        return int(float(value))
    except (ValueError, TypeError):
        return default


def safe_float_convert(value: Any, default: float = 0.0) -> float:
    """تحويل آمن إلى رقم عشري"""
    try:
        if pd.isna(value):
            return default
        return float(value)
    except (ValueError, TypeError):
        return default


def safe_str_convert(value: Any, default: str = "") -> str:
    """تحويل آمن إلى نص"""
    try:
        if pd.isna(value):
            return default
        return str(value).strip()
    except (ValueError, TypeError):
        return default


def validate_excel_file(file) -> tuple[bool, str]:
    """التحقق من صحة ملف Excel"""
    try:
        # التحقق من امتداد الملف
        allowed_extensions = ['.xlsx', '.xls']
        file_extension = file.name.lower().split('.')[-1]
        
        if f'.{file_extension}' not in allowed_extensions:
            return False, "نوع الملف غير مدعوم. يرجى استخدام ملفات Excel (.xlsx, .xls)"
        
        # التحقق من حجم الملف (10 MB max)
        max_size = 10 * 1024 * 1024  # 10 MB
        if file.size > max_size:
            return False, f"حجم الملف كبير جداً. الحد الأقصى {format_file_size(max_size)}"
        
        # محاولة قراءة الملف للتأكد من سلامته
        try:
            df = pd.read_excel(file, nrows=1)
            if df.empty:
                return False, "الملف فارغ أو لا يحتوي على بيانات"
        except Exception as e:
            return False, f"الملف تالف أو لا يمكن قراءته: {str(e)}"
        
        return True, "الملف صالح"
        
    except Exception as e:
        return False, f"خطأ في التحقق من الملف: {str(e)}"


def extract_numbers_from_text(text: str) -> list:
    """استخراج الأرقام من النص"""
    import re
    
    if not text:
        return []
    
    # البحث عن أرقام الهواتف العراقية
    patterns = [
        r'\b07\d{8}\b',  # أرقام تبدأ بـ 07
        r'\b7\d{8}\b',   # أرقام تبدأ بـ 7
        r'\b\+9647\d{8}\b',  # أرقام مع رمز البلد
        r'\b9647\d{8}\b',    # أرقام مع رمز البلد بدون +
    ]
    
    numbers = []
    for pattern in patterns:
        matches = re.findall(pattern, text)
        numbers.extend(matches)
    
    # تنظيف الأرقام وإزالة المكرر
    cleaned_numbers = []
    for number in numbers:
        cleaned = clean_phone_number(number)
        if cleaned and cleaned not in cleaned_numbers:
            cleaned_numbers.append(cleaned)
    
    return cleaned_numbers


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """حساب المسافة بين نقطتين جغرافيتين بالكيلومتر"""
    import math
    
    # تحويل إلى radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # حساب الفرق
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    # معادلة Haversine
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # نصف قطر الأرض بالكيلومتر
    r = 6371
    
    return c * r


def get_coordinate_bounds(lat: float, lon: float, radius_km: float) -> dict:
    """الحصول على حدود المنطقة الجغرافية حول نقطة معينة"""
    # تقريب: 1 درجة عرض = 111 كم
    # 1 درجة طول = 111 * cos(latitude) كم
    import math
    
    lat_delta = radius_km / 111.0
    lon_delta = radius_km / (111.0 * math.cos(math.radians(lat)))
    
    return {
        'min_lat': lat - lat_delta,
        'max_lat': lat + lat_delta,
        'min_lon': lon - lon_delta,
        'max_lon': lon + lon_delta
    }


def generate_report_summary(data: dict) -> dict:
    """إنشاء ملخص للتقرير"""
    summary = {
        'total_records': 0,
        'processed_records': 0,
        'errors': 0,
        'success_rate': 0.0,
        'processing_time': 0.0
    }
    
    try:
        if isinstance(data, dict):
            summary['total_records'] = data.get('total', 0)
            summary['processed_records'] = data.get('success_count', 0)
            summary['errors'] = data.get('error_count', 0)
            
            if summary['total_records'] > 0:
                summary['success_rate'] = (summary['processed_records'] / summary['total_records']) * 100
            
            summary['processing_time'] = data.get('processing_time', 0.0)
    
    except Exception as e:
        logger.error(f"خطأ في إنشاء ملخص التقرير: {str(e)}")
    
    return summary


def create_backup_filename(prefix: str = "backup") -> str:
    """إنشاء اسم ملف النسخة الاحتياطية"""
    from datetime import datetime
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{prefix}_{timestamp}.sql"


def log_user_action(user, action: str, details: str = "", ip_address: str = ""):
    """تسجيل نشاط المستخدم - دالة مساعدة"""
    try:
        from ..services.user_management_service import SecurityService
        
        SecurityService.log_activity(
            user=user,
            action=action,
            description=details or f"{user.username} قام بـ {action}",
            ip_address=ip_address
        )
    except Exception as e:
        logger.error(f"خطأ في تسجيل نشاط المستخدم: {str(e)}")


def mask_sensitive_data(data: str, mask_char: str = "*", visible_chars: int = 4) -> str:
    """إخفاء البيانات الحساسة"""
    if not data or len(data) <= visible_chars:
        return data
    
    visible_part = data[:visible_chars]
    masked_part = mask_char * (len(data) - visible_chars)
    
    return visible_part + masked_part


def get_client_location(ip_address: str) -> dict:
    """الحصول على الموقع الجغرافي من IP (نسخة مبسطة)"""
    # هذه نسخة مبسطة - يمكن تطويرها لاحقاً باستخدام خدمات GeoIP
    location = {
        'country': 'Unknown',
        'city': 'Unknown',
        'region': 'Unknown'
    }
    
    # تحديد بعض IPs المحلية
    if ip_address.startswith('192.168.') or ip_address.startswith('10.') or ip_address == '127.0.0.1':
        location.update({
            'country': 'Local',
            'city': 'Local Network',
            'region': 'Private'
        })
    
    return location