"""
Authentication API Views المحسنة
إدارة المصادقة والجلسات بأمان متقدم
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
import logging

from ..models import UserProfile, Role
from ..services.user_management_service import SecurityService, RoleService
from ..utils.permissions import get_client_ip, SecurityHelper, require_account_active

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """تسجيل دخول محسن مع حماية متقدمة"""
    try:
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        
        if not username or not password:
            return Response({
                "success": False,
                "error": "اسم المستخدم وكلمة المرور مطلوبان"
            }, status=400)
        
        # الحصول على معلومات الطلب
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        try:
            user = User.objects.get(username=username)
            profile = user.profile
            
            # التحقق من قفل الحساب
            if profile.is_account_locked():
                SecurityService.create_security_alert(
                    alert_type='failed_login',
                    severity='medium',
                    title=f"محاولة دخول لحساب مقفل",
                    description=f"محاولة دخول للحساب المقفل {username} من {ip_address}",
                    user=user,
                    ip_address=ip_address,
                    details={'user_agent': user_agent}
                )
                
                return Response({
                    "success": False,
                    "error": f"الحساب مقفل حتى {profile.account_locked_until.strftime('%Y-%m-%d %H:%M')}"
                }, status=423)
            
            # التحقق من حالة الحساب
            if not profile.is_account_active():
                return Response({
                    "success": False,
                    "error": "الحساب غير نشط أو منتهي الصلاحية"
                }, status=403)
                
        except User.DoesNotExist:
            # تسجيل محاولة دخول بحساب غير موجود
            SecurityService.handle_failed_login(username, ip_address, user_agent)
            return Response({
                "success": False,
                "error": "اسم المستخدم أو كلمة المرور غير صحيحة"
            }, status=401)
        
        # محاولة المصادقة
        authenticated_user = authenticate(username=username, password=password)
        
        if authenticated_user:
            # تسجيل دخول ناجح
            refresh = RefreshToken.for_user(authenticated_user)
            access_token = refresh.access_token
            
            # إنشاء مفتاح جلسة
            session_key = SecurityHelper.generate_session_key()
            
            # تسجيل الدخول الناجح
            SecurityService.handle_successful_login(
                user=authenticated_user,
                ip_address=ip_address,
                user_agent=user_agent,
                session_key=session_key
            )
            
            # تحديث وقت آخر دخول
            authenticated_user.last_login = timezone.now()
            authenticated_user.save()
            
            return Response({
                "success": True,
                "message": "تم تسجيل الدخول بنجاح",
                "data": {
                    "access_token": str(access_token),
                    "refresh_token": str(refresh),
                    "session_key": session_key,
                    "user": {
                        "id": authenticated_user.id,
                        "username": authenticated_user.username,
                        "full_name": f"{authenticated_user.first_name} {authenticated_user.last_name}".strip(),
                        "email": authenticated_user.email,
                        "role": profile.role.display_name if profile.role else "بدون دور",
                        "permissions": profile.role.get_permissions() if profile.role else [],
                        "must_change_password": profile.must_change_password,
                        "last_login": authenticated_user.last_login
                    }
                }
            })
        else:
            # تسجيل محاولة دخول فاشلة
            failed_attempts = SecurityService.handle_failed_login(username, ip_address, user_agent)
            
            error_message = "اسم المستخدم أو كلمة المرور غير صحيحة"
            if failed_attempts >= 3:
                error_message += f" (محاولة {failed_attempts}/5)"
            
            return Response({
                "success": False,
                "error": error_message
            }, status=401)
            
    except Exception as e:
        logger.error(f"خطأ في تسجيل الدخول: {str(e)}")
        return Response({
            "success": False,
            "error": "حدث خطأ في النظام"
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_account_active
def logout(request):
    """تسجيل خروج محسن"""
    try:
        # إنهاء الجلسة
        session_key = request.data.get('session_key')
        if session_key:
            from ..models import UserSession
            UserSession.objects.filter(
                user=request.user,
                session_key=session_key
            ).update(is_active=False)
        
        # تسجيل النشاط
        SecurityService.log_activity(
            user=request.user,
            action='logout',
            description=f"تسجيل خروج من {get_client_ip(request)}",
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            "success": True,
            "message": "تم تسجيل الخروج بنجاح"
        })
        
    except Exception as e:
        logger.error(f"خطأ في تسجيل الخروج: {str(e)}")
        return Response({
            "success": False,
            "error": "حدث خطأ في النظام"
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_account_active
def get_user_info(request):
    """الحصول على معلومات المستخدم الحالي المحسنة"""
    try:
        user = request.user
        profile = user.profile
        
        # تحديث آخر نشاط
        if hasattr(profile, 'last_activity'):
            profile.last_activity = timezone.now()
            profile.save()
        
        # الحصول على الصلاحيات
        permissions = []
        role_name = "بدون دور"
        
        if user.is_superuser:
            from ..utils.permissions import get_all_permissions
            permissions = get_all_permissions()
            role_name = "مدير عام"
        elif profile.role:
            permissions = profile.role.get_permissions()
            role_name = profile.role.display_name
        
        # الحصول على الجلسات النشطة
        active_sessions = SecurityService.get_user_sessions(user.id)
        
        return Response({
            "success": True,
            "data": {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "full_name": f"{user.first_name} {user.last_name}".strip(),
                "email": user.email,
                "is_active": user.is_active,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "date_joined": user.date_joined,
                "last_login": user.last_login,
                "role": role_name,
                "permissions": permissions,
                "profile": {
                    "must_change_password": profile.must_change_password,
                    "password_changed_at": profile.password_changed_at,
                    "account_expires_at": profile.account_expires_at,
                    "last_login_ip": profile.last_login_ip,
                    "failed_login_attempts": profile.failed_login_attempts,
                    "notes": profile.notes
                },
                "security": {
                    "active_sessions_count": len(active_sessions),
                    "is_account_locked": profile.is_account_locked(),
                    "must_change_password": profile.must_change_password
                }
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في الحصول على معلومات المستخدم: {str(e)}")
        return Response({
            "success": False,
            "error": "حدث خطأ في النظام"
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_account_active
def change_my_password(request):
    """تغيير كلمة مرور المستخدم الحالي"""
    try:
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response({
                "success": False,
                "error": "كلمة المرور الحالية والجديدة مطلوبتان"
            }, status=400)
        
        # التحقق من كلمة المرور الحالية
        if not request.user.check_password(current_password):
            SecurityService.log_activity(
                user=request.user,
                action='password_change',
                description="محاولة تغيير كلمة مرور بكلمة مرور حالية خاطئة",
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                success=False,
                error_message="كلمة المرور الحالية خاطئة"
            )
            
            return Response({
                "success": False,
                "error": "كلمة المرور الحالية غير صحيحة"
            }, status=400)
        
        # التحقق من قوة كلمة المرور الجديدة
        try:
            validate_password(new_password, request.user)
        except ValidationError as e:
            return Response({
                "success": False,
                "error": "كلمة المرور الجديدة غير قوية بما فيه الكفاية",
                "details": list(e.messages)
            }, status=400)
        
        # تغيير كلمة المرور
        request.user.set_password(new_password)
        request.user.save()
        
        # تحديث الملف الشخصي
        profile = request.user.profile
        profile.password_changed_at = timezone.now()
        profile.must_change_password = False
        profile.save()
        
        # تسجيل النشاط
        SecurityService.log_activity(
            user=request.user,
            action='password_change',
            description="تغيير كلمة المرور بنجاح",
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            "success": True,
            "message": "تم تغيير كلمة المرور بنجاح"
        })
        
    except Exception as e:
        logger.error(f"خطأ في تغيير كلمة المرور: {str(e)}")
        return Response({
            "success": False,
            "error": "حدث خطأ في النظام"
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_account_active
def get_my_sessions(request):
    """الحصول على جلسات المستخدم الحالي"""
    try:
        sessions = SecurityService.get_user_sessions(request.user.id)
        
        return Response({
            "success": True,
            "data": {
                "sessions": sessions,
                "total_sessions": len(sessions)
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في الحصول على الجلسات: {str(e)}")
        return Response({
            "success": False,
            "error": "حدث خطأ في النظام"
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_account_active
def get_my_activities(request):
    """الحصول على نشاطات المستخدم الحالي"""
    try:
        limit = int(request.GET.get('limit', 50))
        activities = SecurityService.get_user_activities(request.user.id, limit)
        
        return Response({
            "success": True,
            "data": {
                "activities": activities,
                "total_activities": len(activities)
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في الحصول على النشاطات: {str(e)}")
        return Response({
            "success": False,
            "error": "حدث خطأ في النظام"
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def number_lookup(request):
    """البحث عن رقم - الوظيفة الموجودة مسبقاً"""
    try:
        number = request.GET.get('number', '')
        
        if not number:
            return Response({
                "success": False,
                "error": "رقم الهاتف مطلوب"
            }, status=400)
        
        # تسجيل النشاط
        SecurityService.log_activity(
            user=request.user,
            action='search',
            description=f"البحث عن الرقم: {number}",
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # هنا يمكن إضافة منطق البحث الفعلي
        info = f"معلومات الرقم: {number}"
        
        return Response({
            "success": True,
            "data": {
                "number": number,
                "info": info
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في البحث عن الرقم: {str(e)}")
        return Response({
            "success": False,
            "error": "حدث خطأ في النظام"
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unlock_my_account(request):
    """إلغاء قفل الحساب (للحالات الخاصة)"""
    try:
        profile = request.user.profile
        
        if not profile.is_account_locked():
            return Response({
                "success": False,
                "error": "الحساب غير مقفل"
            }, status=400)
        
        # هنا يمكن إضافة تحقق إضافي مثل OTP أو أسئلة الأمان
        
        # إلغاء قفل الحساب
        profile.unlock_account()
        
        # تسجيل النشاط
        SecurityService.log_activity(
            user=request.user,
            action='account_locked',
            description="إلغاء قفل الحساب بواسطة المستخدم نفسه",
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            "success": True,
            "message": "تم إلغاء قفل الحساب بنجاح"
        })
        
    except Exception as e:
        logger.error(f"خطأ في إلغاء قفل الحساب: {str(e)}")
        return Response({
            "success": False,
            "error": "حدث خطأ في النظام"
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def check_username_availability(request):
    """التحقق من توفر اسم المستخدم"""
    try:
        username = request.data.get('username', '').strip()
        
        if not username:
            return Response({
                "success": False,
                "error": "اسم المستخدم مطلوب"
            }, status=400)
        
        # التحقق من الطول الأدنى
        if len(username) < 3:
            return Response({
                "success": False,
                "available": False,
                "error": "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"
            })
        
        # التحقق من الأحرف المسموحة
        import re
        if not re.match("^[a-zA-Z0-9_]+$", username):
            return Response({
                "success": False,
                "available": False,
                "error": "اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط"
            })
        
        # التحقق من التوفر
        is_available = not User.objects.filter(username=username).exists()
        
        return Response({
            "success": True,
            "available": is_available,
            "message": "اسم المستخدم متاح" if is_available else "اسم المستخدم مُستخدم بالفعل"
        })
        
    except Exception as e:
        logger.error(f"خطأ في التحقق من توفر اسم المستخدم: {str(e)}")
        return Response({
            "success": False,
            "error": "حدث خطأ في النظام"
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def validate_password_strength(request):
    """التحقق من قوة كلمة المرور"""
    try:
        password = request.data.get('password', '')
        
        if not password:
            return Response({
                "success": False,
                "error": "كلمة المرور مطلوبة"
            }, status=400)
        
        # استخدام SecurityHelper للتحقق من قوة كلمة المرور
        is_strong, message = SecurityHelper.is_strong_password(password)
        
        # التحقق الإضافي باستخدام Django validators
        try:
            validate_password(password)
            django_validation_passed = True
            django_errors = []
        except ValidationError as e:
            django_validation_passed = False
            django_errors = list(e.messages)
        
        return Response({
            "success": True,
            "data": {
                "is_strong": is_strong and django_validation_passed,
                "message": message,
                "django_validation_passed": django_validation_passed,
                "django_errors": django_errors,
                "requirements": {
                    "min_length": len(password) >= 8,
                    "has_uppercase": any(c.isupper() for c in password),
                    "has_lowercase": any(c.islower() for c in password),
                    "has_digit": any(c.isdigit() for c in password),
                    "has_special": any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
                }
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في التحقق من قوة كلمة المرور: {str(e)}")
        return Response({
            "success": False,
            "error": "حدث خطأ في النظام"
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_session(request):
    """تجديد الجلسة"""
    try:
        session_key = request.data.get('session_key')
        
        if not session_key:
            return Response({
                "success": False,
                "error": "مفتاح الجلسة مطلوب"
            }, status=400)
        
        from ..models import UserSession
        
        try:
            session = UserSession.objects.get(
                user=request.user,
                session_key=session_key,
                is_active=True
            )
            
            # تجديد الجلسة
            session.extend_session(480)  # 8 ساعات
            
            # تحديث معلومات الطلب
            session.requests_count += 1
            session.last_request_path = request.path
            session.save()
            
            return Response({
                "success": True,
                "message": "تم تجديد الجلسة بنجاح",
                "data": {
                    "expires_at": session.expires_at,
                    "requests_count": session.requests_count
                }
            })
            
        except UserSession.DoesNotExist:
            return Response({
                "success": False,
                "error": "الجلسة غير موجودة أو منتهية الصلاحية"
            }, status=404)
            
    except Exception as e:
        logger.error(f"خطأ في تجديد الجلسة: {str(e)}")
        return Response({
            "success": False,
            "error": "حدث خطأ في النظام"
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_security_dashboard(request):
    """لوحة الأمان للمستخدم الحالي"""
    try:
        user = request.user
        profile = user.profile
        
        # إحصائيات الأمان
        from ..models import UserActivity, UserSession
        
        # آخر 5 أنشطة
        recent_activities = UserActivity.objects.filter(
            user=user
        ).order_by('-timestamp')[:5]
        
        activities_data = [{
            'action': activity.get_action_display(),
            'description': activity.description,
            'timestamp': activity.timestamp,
            'ip_address': activity.ip_address,
            'success': activity.success
        } for activity in recent_activities]
        
        # الجلسات النشطة
        active_sessions = UserSession.objects.filter(
            user=user,
            is_active=True,
            expires_at__gt=timezone.now()
        ).count()
        
        # محاولات تسجيل الدخول الفاشلة اليوم
        today = timezone.now().date()
        failed_logins_today = UserActivity.objects.filter(
            user=user,
            action='failed_login',
            timestamp__date=today
        ).count()
        
        return Response({
            "success": True,
            "data": {
                "account_status": {
                    "is_active": profile.is_account_active(),
                    "is_locked": profile.is_account_locked(),
                    "must_change_password": profile.must_change_password,
                    "account_expires_at": profile.account_expires_at,
                    "password_changed_at": profile.password_changed_at
                },
                "security_stats": {
                    "active_sessions": active_sessions,
                    "failed_logins_today": failed_logins_today,
                    "last_login": user.last_login,
                    "last_login_ip": profile.last_login_ip
                },
                "recent_activities": activities_data
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في لوحة الأمان: {str(e)}")
        return Response({
            "success": False,
            "error": "حدث خطأ في النظام"
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_suspicious_activity(request):
    """الإبلاغ عن نشاط مشبوه"""
    try:
        description = request.data.get('description', '')
        activity_type = request.data.get('activity_type', 'suspicious_activity')
        
        if not description:
            return Response({
                "success": False,
                "error": "وصف النشاط المشبوه مطلوب"
            }, status=400)
        
        # إنشاء تنبيه أمني
        SecurityService.create_security_alert(
            alert_type=activity_type,
            severity='medium',
            title=f"إبلاغ عن نشاط مشبوه من {request.user.username}",
            description=description,
            user=request.user,
            ip_address=get_client_ip(request),
            details={
                'reported_by': request.user.username,
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'timestamp': timezone.now().isoformat()
            }
        )
        
        # تسجيل النشاط
        SecurityService.log_activity(
            user=request.user,
            action='view',
            description=f"إبلاغ عن نشاط مشبوه: {description[:100]}",
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            "success": True,
            "message": "تم الإبلاغ عن النشاط المشبوه بنجاح وسيتم مراجعته"
        })
        
    except Exception as e:
        logger.error(f"خطأ في الإبلاغ عن نشاط مشبوه: {str(e)}")
        return Response({
            "success": False,
            "error": "حدث خطأ في النظام"
        }, status=500)


# ===== Middleware الأمان =====

class SecurityMiddleware:
    """Middleware للأمان المتقدم"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # معالجة الطلب قبل الوصول للـ view
        self.process_request(request)
        
        response = self.get_response(request)
        
        # معالجة الاستجابة
        self.process_response(request, response)
        
        return response
    
    def process_request(self, request):
        """معالجة الطلب"""
        # إضافة معلومات الأمان للطلب
        request.security_info = {
            'ip_address': get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'timestamp': timezone.now()
        }
        
        # تنظيف المدخلات
        if hasattr(request, 'data') and request.data:
            self.sanitize_request_data(request)
    
    def process_response(self, request, response):
        """معالجة الاستجابة"""
        # إضافة headers أمنية
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # إضافة CSP للصفحات HTML
        if response.get('Content-Type', '').startswith('text/html'):
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data:; "
                "font-src 'self'"
            )
        
        return response
    
    def sanitize_request_data(self, request):
        """تنظيف بيانات الطلب"""
        try:
            if hasattr(request, '_body') and request._body:
                # تنظيف أساسي للبيانات
                import json
                data = json.loads(request._body.decode('utf-8'))
                
                cleaned_data = self.clean_dict(data)
                request._body = json.dumps(cleaned_data).encode('utf-8')
        except:
            pass  # في حالة الخطأ، اترك البيانات كما هي
    
    def clean_dict(self, data):
        """تنظيف dictionary بشكل تكراري"""
        if isinstance(data, dict):
            return {key: self.clean_dict(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self.clean_dict(item) for item in data]
        elif isinstance(data, str):
            return self.clean_string(data)
        else:
            return data
    
    def clean_string(self, text):
        """تنظيف النص من الرموز الضارة"""
        if not text:
            return text
        
        # إزالة الرموز الضارة الأساسية
        dangerous_patterns = [
            '<script', '</script>',
            'javascript:', 'vbscript:',
            'onload=', 'onerror=', 'onclick=',
            'eval(', 'alert(', 'confirm(',
            'document.cookie', 'document.write'
        ]
        
        cleaned_text = text
        for pattern in dangerous_patterns:
            cleaned_text = cleaned_text.replace(pattern, '')
        
        return cleaned_text 