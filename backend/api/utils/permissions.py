"""
أدوات الصلاحيات والأمان
"""
from functools import wraps
from rest_framework.response import Response
from django.contrib.auth.models import AnonymousUser


def get_client_ip(request):
    """الحصول على IP الحقيقي للمستخدم"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return ip


def require_permission(permission):
    """decorator للتحقق من الصلاحيات"""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # التحقق من تسجيل الدخول
            if isinstance(request.user, AnonymousUser) or not request.user.is_authenticated:
                return Response({
                    "success": False,
                    "error": "يجب تسجيل الدخول للوصول لهذه الوظيفة"
                }, status=401)
            
            # المدير العام لديه جميع الصلاحيات
            if request.user.is_superuser:
                return func(request, *args, **kwargs)
            
            # التحقق من الصلاحية
            if not user_has_permission(request.user, permission):
                return Response({
                    "success": False,
                    "error": "ليس لديك صلاحية للوصول لهذه الوظيفة"
                }, status=403)
            
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def user_has_permission(user, permission):
    """التحقق من صلاحية المستخدم"""
    try:
        # المدير العام لديه جميع الصلاحيات
        if user.is_superuser:
            return True
        
        # التحقق من وجود الملف الشخصي والدور
        if not hasattr(user, 'profile') or not user.profile:
            return False
        
        profile = user.profile
        
        # التحقق من حالة الحساب
        if not profile.is_account_active():
            return False
        
        # التحقق من وجود دور
        if not profile.role:
            return False
        
        # التحقق من الصلاحية
        return profile.role.has_permission(permission)
        
    except Exception:
        return False


def require_any_permission(*permissions):
    """decorator للتحقق من وجود أي من الصلاحيات المحددة"""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # التحقق من تسجيل الدخول
            if isinstance(request.user, AnonymousUser) or not request.user.is_authenticated:
                return Response({
                    "success": False,
                    "error": "يجب تسجيل الدخول للوصول لهذه الوظيفة"
                }, status=401)
            
            # المدير العام لديه جميع الصلاحيات
            if request.user.is_superuser:
                return func(request, *args, **kwargs)
            
            # التحقق من وجود أي من الصلاحيات
            has_any_permission = any(
                user_has_permission(request.user, permission) 
                for permission in permissions
            )
            
            if not has_any_permission:
                return Response({
                    "success": False,
                    "error": "ليس لديك صلاحية للوصول لهذه الوظيفة"
                }, status=403)
            
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_all_permissions(*permissions):
    """decorator للتحقق من وجود جميع الصلاحيات المحددة"""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # التحقق من تسجيل الدخول
            if isinstance(request.user, AnonymousUser) or not request.user.is_authenticated:
                return Response({
                    "success": False,
                    "error": "يجب تسجيل الدخول للوصول لهذه الوظيفة"
                }, status=401)
            
            # المدير العام لديه جميع الصلاحيات
            if request.user.is_superuser:
                return func(request, *args, **kwargs)
            
            # التحقق من وجود جميع الصلاحيات
            has_all_permissions = all(
                user_has_permission(request.user, permission) 
                for permission in permissions
            )
            
            if not has_all_permissions:
                return Response({
                    "success": False,
                    "error": "ليس لديك جميع الصلاحيات المطلوبة للوصول لهذه الوظيفة"
                }, status=403)
            
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def is_owner_or_admin(get_object_user_func):
    """decorator للتحقق من كون المستخدم مالك المورد أو مدير"""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # التحقق من تسجيل الدخول
            if isinstance(request.user, AnonymousUser) or not request.user.is_authenticated:
                return Response({
                    "success": False,
                    "error": "يجب تسجيل الدخول للوصول لهذه الوظيفة"
                }, status=401)
            
            # المدير العام لديه جميع الصلاحيات
            if request.user.is_superuser:
                return func(request, *args, **kwargs)
            
            # الحصول على المستخدم المالك للمورد
            try:
                object_user = get_object_user_func(request, *args, **kwargs)
                
                # التحقق من كون المستخدم هو المالك أو لديه صلاحية التعديل
                if (request.user == object_user or 
                    user_has_permission(request.user, 'edit_users')):
                    return func(request, *args, **kwargs)
                else:
                    return Response({
                        "success": False,
                        "error": "ليس لديك صلاحية للوصول لهذا المورد"
                    }, status=403)
                    
            except Exception as e:
                return Response({
                    "success": False,
                    "error": "خطأ في التحقق من الصلاحيات"
                }, status=500)
        
        return wrapper
    return decorator


class PermissionChecker:
    """فئة للتحقق من الصلاحيات بطريقة متقدمة"""
    
    def __init__(self, user):
        self.user = user
    
    def has_permission(self, permission):
        """التحقق من صلاحية واحدة"""
        return user_has_permission(self.user, permission)
    
    def has_any_permission(self, *permissions):
        """التحقق من وجود أي من الصلاحيات"""
        return any(self.has_permission(permission) for permission in permissions)
    
    def has_all_permissions(self, *permissions):
        """التحقق من وجود جميع الصلاحيات"""
        return all(self.has_permission(permission) for permission in permissions)
    
    def can_manage_user(self, target_user):
        """التحقق من إمكانية إدارة مستخدم معين"""
        # المدير العام يمكنه إدارة الجميع
        if self.user.is_superuser:
            return True
        
        # لا يمكن للمستخدم إدارة نفسه في بعض العمليات الحساسة
        if self.user == target_user:
            return False
        
        # التحقق من صلاحية إدارة المستخدمين
        return self.has_permission('edit_users')
    
    def can_view_user(self, target_user):
        """التحقق من إمكانية عرض بيانات مستخدم"""
        # المدير العام يمكنه عرض الجميع
        if self.user.is_superuser:
            return True
        
        # المستخدم يمكنه عرض بياناته الخاصة
        if self.user == target_user:
            return True
        
        # التحقق من صلاحية عرض المستخدمين
        return self.has_permission('view_users')
    
    def can_delete_user(self, target_user):
        """التحقق من إمكانية حذف مستخدم"""
        # المدير العام يمكنه حذف الجميع عدا نفسه
        if self.user.is_superuser:
            return self.user != target_user
        
        # لا يمكن للمستخدم حذف نفسه
        if self.user == target_user:
            return False
        
        # التحقق من صلاحية حذف المستخدمين
        return self.has_permission('delete_users')


# قائمة جميع الصلاحيات المتاحة في النظام
AVAILABLE_PERMISSIONS = {
    # إدارة المستخدمين
    'view_users': 'عرض المستخدمين',
    'create_users': 'إنشاء مستخدمين',
    'edit_users': 'تعديل المستخدمين',
    'delete_users': 'حذف المستخدمين',
    
    # إدارة الأدوار
    'view_roles': 'عرض الأدوار',
    'create_roles': 'إنشاء أدوار',
    'edit_roles': 'تعديل الأدوار',
    'delete_roles': 'حذف الأدوار',
    
    # الأمان والمراقبة
    'view_activities': 'عرض سجل النشاطات',
    'view_security_alerts': 'عرض التنبيهات الأمنية',
    'manage_sessions': 'إدارة الجلسات',
    
    # تحليل البيانات
    'analyze_excel': 'تحليل ملفات Excel',
    'compare_sheets': 'مقارنة الملفات',
    
    # إدارة الأبراج
    'upload_sites': 'رفع بيانات الأبراج',
    'search_sites': 'البحث في الأبراج',
    'manage_sites': 'إدارة بيانات الأبراج',
    
    # الإحصائيات والتقارير
    'view_statistics': 'عرض الإحصائيات',
    'generate_reports': 'إنشاء التقارير',
    
    # إدارة النظام
    'manage_system': 'إدارة النظام',
    'backup_restore': 'النسخ الاحتياطي والاستعادة',
}


def get_permission_display_name(permission):
    """الحصول على الاسم المعروض للصلاحية"""
    return AVAILABLE_PERMISSIONS.get(permission, permission)


def get_all_permissions():
    """الحصول على جميع الصلاحيات المتاحة"""
    return list(AVAILABLE_PERMISSIONS.keys())


def validate_permissions(permissions):
    """التحقق من صحة قائمة الصلاحيات"""
    available_permissions = set(AVAILABLE_PERMISSIONS.keys())
    invalid_permissions = []
    
    for permission in permissions:
        if permission not in available_permissions:
            invalid_permissions.append(permission)
    
    return len(invalid_permissions) == 0, invalid_permissions


# Decorators إضافية للحماية

def rate_limit_by_ip(max_requests=10, time_window=60):
    """decorator لتحديد معدل الطلبات حسب IP"""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # هذا مجرد نموذج بسيط - في الإنتاج استخدم Redis أو cache متقدم
            # يمكن تطويره لاحقاً
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def log_user_activity(action, model_name="", description=""):
    """decorator لتسجيل نشاط المستخدم تلقائياً"""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # تنفيذ الوظيفة أولاً
            response = func(request, *args, **kwargs)
            
            # تسجيل النشاط إذا نجح الطلب
            if hasattr(response, 'status_code') and 200 <= response.status_code < 300:
                try:
                    from ..services.user_management_service import SecurityService
                    
                    SecurityService.log_activity(
                        user=request.user,
                        action=action,
                        description=description or f"{request.user.username} قام بـ {action}",
                        model_name=model_name,
                        ip_address=get_client_ip(request),
                        user_agent=request.META.get('HTTP_USER_AGENT', ''),
                        success=True
                    )
                except Exception:
                    # لا نريد أن يفشل الطلب بسبب خطأ في التسجيل
                    pass
            
            return response
        return wrapper
    return decorator


def require_account_active(func):
    """decorator للتأكد من أن الحساب نشط"""
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        if isinstance(request.user, AnonymousUser) or not request.user.is_authenticated:
            return Response({
                "success": False,
                "error": "يجب تسجيل الدخول"
            }, status=401)
        
        # التحقق من حالة الحساب
        if hasattr(request.user, 'profile'):
            profile = request.user.profile
            
            if not profile.is_account_active():
                reasons = []
                
                if not profile.is_active:
                    reasons.append("الحساب غير مفعل")
                
                if profile.is_account_locked():
                    reasons.append("الحساب مقفل")
                
                if (profile.account_expires_at and 
                    timezone.now() > profile.account_expires_at):
                    reasons.append("انتهت صلاحية الحساب")
                
                return Response({
                    "success": False,
                    "error": "الحساب غير نشط",
                    "details": reasons
                }, status=403)
        
        return func(request, *args, **kwargs)
    return wrapper


def sanitize_input(func):
    """decorator لتنظيف المدخلات من الرموز الضارة"""
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        # تنظيف بسيط للمدخلات
        if hasattr(request, 'data') and request.data:
            cleaned_data = {}
            for key, value in request.data.items():
                if isinstance(value, str):
                    # إزالة الرموز الضارة الأساسية
                    cleaned_value = value.replace('<script>', '').replace('</script>', '')
                    cleaned_value = cleaned_value.replace('javascript:', '')
                    cleaned_value = cleaned_value.replace('onload=', '')
                    cleaned_data[key] = cleaned_value
                else:
                    cleaned_data[key] = value
            
            # استبدال البيانات المنظفة
            request._full_data = cleaned_data
        
        return func(request, *args, **kwargs)
    return wrapper


# فئة مساعدة للتحقق من الأمان
class SecurityHelper:
    """فئة مساعدة للعمليات الأمنية"""
    
    @staticmethod
    def is_safe_redirect_url(url):
        """التحقق من أن رابط إعادة التوجيه آمن"""
        if not url:
            return False
        
        # تجنب إعادة التوجيه لمواقع خارجية
        if url.startswith('http://') or url.startswith('https://'):
            return False
        
        # تجنب رموز JavaScript
        if 'javascript:' in url.lower():
            return False
        
        return True
    
    @staticmethod
    def generate_session_key():
        """إنشاء مفتاح جلسة آمن"""
        import secrets
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def hash_sensitive_data(data):
        """تشفير البيانات الحساسة"""
        import hashlib
        return hashlib.sha256(data.encode()).hexdigest()
    
    @staticmethod
    def is_strong_password(password):
        """التحقق من قوة كلمة المرور"""
        if len(password) < 8:
            return False, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
        
        if not any(c.isupper() for c in password):
            return False, "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل"
        
        if not any(c.islower() for c in password):
            return False, "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل"
        
        if not any(c.isdigit() for c in password):
            return False, "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل"
        
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        if not any(c in special_chars for c in password):
            return False, "كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل"
        
        return True, "كلمة مرور قوية"