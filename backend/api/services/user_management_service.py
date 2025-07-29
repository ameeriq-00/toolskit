"""
خدمة إدارة المستخدمين والأمان
"""
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from datetime import timedelta
import logging
import re

from ..models import UserProfile, Role, UserActivity, UserSession, SecurityAlert

logger = logging.getLogger(__name__)


class UserManagementService:
    """خدمة إدارة المستخدمين"""
    
    @staticmethod
    def create_user(username, email, password, first_name="", last_name="", 
                   role_id=None, expires_at=None, created_by=None, notes=""):
        """إنشاء مستخدم جديد"""
        try:
            with transaction.atomic():
                # التحقق من صحة البيانات
                if User.objects.filter(username=username).exists():
                    raise ValidationError("اسم المستخدم موجود مسبقاً")
                
                if email and User.objects.filter(email=email).exists():
                    raise ValidationError("البريد الإلكتروني موجود مسبقاً")
                
                # التحقق من قوة كلمة المرور
                validate_password(password)
                
                # إنشاء المستخدم
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True
                )
                
                # الحصول على الدور
                role = None
                if role_id:
                    role = Role.objects.get(id=role_id)
                
                # إنشاء الملف الشخصي
                profile = UserProfile.objects.create(
                    user=user,
                    role=role,
                    is_active=True,
                    activation_date=timezone.now(),
                    account_expires_at=expires_at,
                    created_by=created_by,
                    notes=notes,
                    password_changed_at=timezone.now()
                )
                
                return user, profile
                
        except Exception as e:
            logger.error(f"خطأ في إنشاء المستخدم {username}: {str(e)}")
            raise

    @staticmethod
    def update_user(user_id, **kwargs):
        """تحديث بيانات المستخدم"""
        try:
            with transaction.atomic():
                user = User.objects.get(id=user_id)
                profile = user.profile
                
                # تحديث بيانات المستخدم الأساسية
                if 'first_name' in kwargs:
                    user.first_name = kwargs['first_name']
                if 'last_name' in kwargs:
                    user.last_name = kwargs['last_name']
                if 'email' in kwargs:
                    user.email = kwargs['email']
                if 'is_active' in kwargs:
                    user.is_active = kwargs['is_active']
                
                user.save()
                
                # تحديث الملف الشخصي
                if 'role_id' in kwargs and kwargs['role_id']:
                    profile.role = Role.objects.get(id=kwargs['role_id'])
                if 'account_expires_at' in kwargs:
                    profile.account_expires_at = kwargs['account_expires_at']
                if 'notes' in kwargs:
                    profile.notes = kwargs['notes']
                if 'is_active' in kwargs:
                    profile.is_active = kwargs['is_active']
                    if kwargs['is_active']:
                        profile.activation_date = timezone.now()
                        profile.deactivation_date = None
                    else:
                        profile.deactivation_date = timezone.now()
                
                profile.save()
                
                return user, profile
                
        except Exception as e:
            logger.error(f"خطأ في تحديث المستخدم {user_id}: {str(e)}")
            raise

    @staticmethod
    def change_password(user_id, new_password, changed_by=None):
        """تغيير كلمة مرور المستخدم"""
        try:
            user = User.objects.get(id=user_id)
            
            # التحقق من قوة كلمة المرور
            validate_password(new_password, user)
            
            # تغيير كلمة المرور
            user.set_password(new_password)
            user.save()
            
            # تحديث الملف الشخصي
            profile = user.profile
            profile.password_changed_at = timezone.now()
            profile.must_change_password = False
            profile.failed_login_attempts = 0
            profile.account_locked_until = None
            profile.save()
            
            return True
            
        except Exception as e:
            logger.error(f"خطأ في تغيير كلمة مرور المستخدم {user_id}: {str(e)}")
            raise

    @staticmethod
    def activate_user(user_id, expires_at=None, activated_by=None):
        """تفعيل المستخدم"""
        try:
            user = User.objects.get(id=user_id)
            profile = user.profile
            
            user.is_active = True
            user.save()
            
            profile.activate_account(expires_at)
            
            return True
            
        except Exception as e:
            logger.error(f"خطأ في تفعيل المستخدم {user_id}: {str(e)}")
            raise

    @staticmethod
    def deactivate_user(user_id, reason="", deactivated_by=None):
        """إلغاء تفعيل المستخدم"""
        try:
            user = User.objects.get(id=user_id)
            profile = user.profile
            
            user.is_active = False
            user.save()
            
            profile.deactivate_account(reason)
            
            # إنهاء جميع جلسات المستخدم
            UserSession.objects.filter(user=user, is_active=True).update(is_active=False)
            
            return True
            
        except Exception as e:
            logger.error(f"خطأ في إلغاء تفعيل المستخدم {user_id}: {str(e)}")
            raise

    @staticmethod
    def get_user_details(user_id):
        """الحصول على تفاصيل المستخدم"""
        try:
            user = User.objects.select_related('profile', 'profile__role').get(id=user_id)
            
            return {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'is_active': user.is_active,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'profile': {
                    'role': user.profile.role.display_name if user.profile.role else None,
                    'role_id': user.profile.role.id if user.profile.role else None,
                    'is_active': user.profile.is_active,
                    'activation_date': user.profile.activation_date,
                    'deactivation_date': user.profile.deactivation_date,
                    'account_expires_at': user.profile.account_expires_at,
                    'last_login_ip': user.profile.last_login_ip,
                    'failed_login_attempts': user.profile.failed_login_attempts,
                    'account_locked_until': user.profile.account_locked_until,
                    'must_change_password': user.profile.must_change_password,
                    'password_changed_at': user.profile.password_changed_at,
                    'notes': user.profile.notes,
                    'created_by': user.profile.created_by.username if user.profile.created_by else None,
                    'created_at': user.profile.created_at,
                    'updated_at': user.profile.updated_at,
                }
            }
            
        except Exception as e:
            logger.error(f"خطأ في الحصول على تفاصيل المستخدم {user_id}: {str(e)}")
            raise

    @staticmethod
    def list_users(page=1, per_page=20, search="", role_id=None, is_active=None):
        """قائمة المستخدمين مع الفلترة والبحث"""
        try:
            queryset = User.objects.select_related('profile', 'profile__role').all()
            
            # البحث
            if search:
                queryset = queryset.filter(
                    models.Q(username__icontains=search) |
                    models.Q(first_name__icontains=search) |
                    models.Q(last_name__icontains=search) |
                    models.Q(email__icontains=search)
                )
            
            # فلترة حسب الدور
            if role_id:
                queryset = queryset.filter(profile__role_id=role_id)
            
            # فلترة حسب النشاط
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active)
            
            # ترقيم الصفحات
            total = queryset.count()
            start = (page - 1) * per_page
            end = start + per_page
            users = queryset[start:end]
            
            # تحويل البيانات
            users_data = []
            for user in users:
                users_data.append({
                    'id': user.id,
                    'username': user.username,
                    'full_name': f"{user.first_name} {user.last_name}".strip(),
                    'email': user.email,
                    'is_active': user.is_active,
                    'role': user.profile.role.display_name if user.profile.role else 'بدون دور',
                    'last_login': user.last_login,
                    'account_expires_at': user.profile.account_expires_at,
                    'is_account_locked': user.profile.is_account_locked(),
                    'created_at': user.profile.created_at,
                })
            
            return {
                'users': users_data,
                'total': total,
                'page': page,
                'per_page': per_page,
                'total_pages': (total + per_page - 1) // per_page
            }
            
        except Exception as e:
            logger.error(f"خطأ في قائمة المستخدمين: {str(e)}")
            raise


class SecurityService:
    """خدمة الأمان والمراقبة"""
    
    @staticmethod
    def log_activity(user, action, description="", model_name="", object_id=None, 
                    changes=None, ip_address="", user_agent="", session_key="", 
                    success=True, error_message=""):
        """تسجيل نشاط المستخدم"""
        try:
            UserActivity.objects.create(
                user=user,
                action=action,
                description=description or f"{user.username} قام بـ {action}",
                model_name=model_name,
                object_id=object_id,
                changes=changes or {},
                ip_address=ip_address,
                user_agent=user_agent,
                session_key=session_key,
                success=success,
                error_message=error_message
            )
        except Exception as e:
            logger.error(f"خطأ في تسجيل النشاط: {str(e)}")

    @staticmethod
    def handle_failed_login(username, ip_address, user_agent=""):
        """معالجة محاولة تسجيل دخول فاشلة"""
        try:
            user = User.objects.get(username=username)
            profile = user.profile
            
            # زيادة عدد المحاولات الفاشلة
            profile.failed_login_attempts += 1
            profile.last_login_ip = ip_address
            
            # قفل الحساب بعد 5 محاولات فاشلة
            if profile.failed_login_attempts >= 5:
                profile.lock_account(30)  # قفل لمدة 30 دقيقة
                
                # إنشاء تنبيه أمني
                SecurityAlert.objects.create(
                    alert_type='account_locked',
                    severity='high',
                    user=user,
                    ip_address=ip_address,
                    title=f"قفل حساب {username}",
                    description=f"تم قفل الحساب بعد {profile.failed_login_attempts} محاولات فاشلة",
                    details={
                        'failed_attempts': profile.failed_login_attempts,
                        'locked_until': profile.account_locked_until.isoformat() if profile.account_locked_until else None,
                        'user_agent': user_agent
                    }
                )
            
            profile.save()
            
            # تسجيل النشاط
            SecurityService.log_activity(
                user=user,
                action='failed_login',
                description=f"محاولة دخول فاشلة من {ip_address}",
                ip_address=ip_address,
                user_agent=user_agent,
                success=False,
                error_message="كلمة مرور خاطئة"
            )
            
            return profile.failed_login_attempts
            
        except User.DoesNotExist:
            # إنشاء تنبيه للمحاولة بحساب غير موجود
            SecurityAlert.objects.create(
                alert_type='failed_login',
                severity='medium',
                ip_address=ip_address,
                title=f"محاولة دخول بحساب غير موجود",
                description=f"محاولة دخول باسم مستخدم غير موجود: {username}",
                details={
                    'username': username,
                    'user_agent': user_agent
                }
            )
            
        except Exception as e:
            logger.error(f"خطأ في معالجة تسجيل الدخول الفاشل: {str(e)}")

    @staticmethod
    def handle_successful_login(user, ip_address, user_agent="", session_key=""):
        """معالجة تسجيل دخول ناجح"""
        try:
            profile = user.profile
            
            # إعادة تعيين المحاولات الفاشلة
            profile.failed_login_attempts = 0
            profile.last_login_ip = ip_address
            profile.save()
            
            # تسجيل النشاط
            SecurityService.log_activity(
                user=user,
                action='login',
                description=f"تسجيل دخول ناجح من {ip_address}",
                ip_address=ip_address,
                user_agent=user_agent,
                session_key=session_key
            )
            
            # إنشاء أو تحديث الجلسة
            session_expires = timezone.now() + timedelta(hours=8)
            session, created = UserSession.objects.get_or_create(
                session_key=session_key,
                defaults={
                    'user': user,
                    'ip_address': ip_address,
                    'user_agent': user_agent,
                    'expires_at': session_expires,
                    'device_info': SecurityService.parse_user_agent(user_agent)
                }
            )
            
            if not created:
                session.last_activity = timezone.now()
                session.requests_count += 1
                session.save()
            
        except Exception as e:
            logger.error(f"خطأ في معالجة تسجيل الدخول الناجح: {str(e)}")

    @staticmethod
    def parse_user_agent(user_agent):
        """تحليل معلومات المتصفح"""
        try:
            device_info = {
                'browser': 'Unknown',
                'os': 'Unknown',
                'device': 'Unknown'
            }
            
            if 'Chrome' in user_agent:
                device_info['browser'] = 'Chrome'
            elif 'Firefox' in user_agent:
                device_info['browser'] = 'Firefox'
            elif 'Safari' in user_agent:
                device_info['browser'] = 'Safari'
            elif 'Edge' in user_agent:
                device_info['browser'] = 'Edge'
            
            if 'Windows' in user_agent:
                device_info['os'] = 'Windows'
            elif 'Mac' in user_agent:
                device_info['os'] = 'macOS'
            elif 'Linux' in user_agent:
                device_info['os'] = 'Linux'
            elif 'Android' in user_agent:
                device_info['os'] = 'Android'
            elif 'iOS' in user_agent:
                device_info['os'] = 'iOS'
            
            if 'Mobile' in user_agent:
                device_info['device'] = 'Mobile'
            elif 'Tablet' in user_agent:
                device_info['device'] = 'Tablet'
            else:
                device_info['device'] = 'Desktop'
            
            return device_info
            
        except Exception:
            return {'browser': 'Unknown', 'os': 'Unknown', 'device': 'Unknown'}

    @staticmethod
    def create_security_alert(alert_type, severity, title, description, user=None, 
                            ip_address=None, details=None):
        """إنشاء تنبيه أمني"""
        try:
            SecurityAlert.objects.create(
                alert_type=alert_type,
                severity=severity,
                user=user,
                ip_address=ip_address,
                title=title,
                description=description,
                details=details or {}
            )
        except Exception as e:
            logger.error(f"خطأ في إنشاء تنبيه أمني: {str(e)}")

    @staticmethod
    def get_user_activities(user_id, limit=50):
        """الحصول على نشاطات المستخدم"""
        try:
            activities = UserActivity.objects.filter(user_id=user_id).order_by('-timestamp')[:limit]
            
            return [{
                'id': activity.id,
                'action': activity.get_action_display(),
                'description': activity.description,
                'timestamp': activity.timestamp,
                'ip_address': activity.ip_address,
                'success': activity.success,
                'error_message': activity.error_message
            } for activity in activities]
            
        except Exception as e:
            logger.error(f"خطأ في الحصول على نشاطات المستخدم: {str(e)}")
            return []

    @staticmethod
    def get_user_sessions(user_id):
        """الحصول على جلسات المستخدم النشطة"""
        try:
            sessions = UserSession.objects.filter(
                user_id=user_id, 
                is_active=True,
                expires_at__gt=timezone.now()
            ).order_by('-created_at')
            
            return [{
                'id': session.id,
                'ip_address': session.ip_address,
                'device_info': session.device_info,
                'location': session.location,
                'created_at': session.created_at,
                'last_activity': session.last_activity,
                'requests_count': session.requests_count
            } for session in sessions]
            
        except Exception as e:
            logger.error(f"خطأ في الحصول على جلسات المستخدم: {str(e)}")
            return []


class RoleService:
    """خدمة إدارة الأدوار"""
    
    @staticmethod
    def create_default_roles():
        """إنشاء الأدوار الافتراضية"""
        try:
            # دور المدير العام
            admin_role, created = Role.objects.get_or_create(
                name='admin',
                defaults={
                    'display_name': 'مدير عام',
                    'description': 'صلاحيات كاملة على النظام',
                    'permissions': {
                        'actions': [
                            'view_users', 'create_users', 'edit_users', 'delete_users',
                            'view_roles', 'create_roles', 'edit_roles', 'delete_roles',
                            'view_activities', 'view_security_alerts',
                            'analyze_excel', 'upload_sites', 'search_sites',
                            'view_statistics', 'manage_system'
                        ]
                    },
                    'is_system_role': True
                }
            )
            
            # دور المحلل
            analyst_role, created = Role.objects.get_or_create(
                name='analyst',
                defaults={
                    'display_name': 'محلل',
                    'description': 'صلاحيات التحليل والبحث',
                    'permissions': {
                        'actions': [
                            'analyze_excel', 'search_sites', 'view_statistics'
                        ]
                    },
                    'is_system_role': True
                }
            )
            
            # دور المشغل
            operator_role, created = Role.objects.get_or_create(
                name='operator',
                defaults={
                    'display_name': 'مشغل',
                    'description': 'صلاحيات أساسية',
                    'permissions': {
                        'actions': [
                            'search_sites', 'view_statistics'
                        ]
                    },
                    'is_system_role': True
                }
            )
            
            return True
            
        except Exception as e:
            logger.error(f"خطأ في إنشاء الأدوار الافتراضية: {str(e)}")
            return False

    @staticmethod
    def get_all_roles():
        """الحصول على جميع الأدوار"""
        try:
            roles = Role.objects.filter(is_active=True).order_by('display_name')
            
            return [{
                'id': role.id,
                'name': role.name,
                'display_name': role.display_name,
                'description': role.description,
                'permissions': role.permissions,
                'is_system_role': role.is_system_role
            } for role in roles]
            
        except Exception as e:
            logger.error(f"خطأ في الحصول على الأدوار: {str(e)}")
            return []

    @staticmethod
    def user_has_permission(user, permission):
        """التحقق من صلاحية المستخدم"""
        try:
            if user.is_superuser:
                return True
            
            profile = getattr(user, 'profile', None)
            if not profile or not profile.role:
                return False
            
            return profile.role.has_permission(permission)
            
        except Exception as e:
            logger.error(f"خطأ في التحقق من الصلاحية: {str(e)}")
            return False