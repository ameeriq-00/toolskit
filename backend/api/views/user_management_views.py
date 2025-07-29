"""
User Management API Views
إدارة المستخدمين والأمان
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import models
from datetime import datetime, timedelta
import logging

from ..models import UserProfile, Role, UserActivity, UserSession, SecurityAlert
from ..services.user_management_service import UserManagementService, SecurityService, RoleService
from ..utils.permissions import require_permission, get_client_ip

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """الحصول على IP الحقيقي للمستخدم"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def require_permission(permission):
    """decorator للتحقق من الصلاحيات"""
    def decorator(func):
        def wrapper(request, *args, **kwargs):
            if not RoleService.user_has_permission(request.user, permission):
                return Response({
                    "success": False,
                    "error": "ليس لديك صلاحية للوصول لهذه الوظيفة"
                }, status=403)
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_permission('view_users')
def list_users(request):
    """قائمة المستخدمين مع البحث والفلترة"""
    try:
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        search = request.GET.get('search', '')
        role_id = request.GET.get('role_id')
        is_active = request.GET.get('is_active')
        
        # تحويل is_active إلى boolean
        if is_active == 'true':
            is_active = True
        elif is_active == 'false':
            is_active = False
        else:
            is_active = None
        
        result = UserManagementService.list_users(
            page=page,
            per_page=per_page,
            search=search,
            role_id=int(role_id) if role_id else None,
            is_active=is_active
        )
        
        # تسجيل النشاط
        SecurityService.log_activity(
            user=request.user,
            action='view',
            description=f"عرض قائمة المستخدمين - صفحة {page}",
            model_name='User',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            "success": True,
            "data": result
        })
        
    except Exception as e:
        logger.error(f"خطأ في قائمة المستخدمين: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_permission('view_users')
def get_user_details(request, user_id):
    """تفاصيل مستخدم محدد"""
    try:
        user_details = UserManagementService.get_user_details(user_id)
        
        # الحصول على النشاطات الأخيرة
        activities = SecurityService.get_user_activities(user_id, 20)
        
        # الحصول على الجلسات النشطة
        sessions = SecurityService.get_user_sessions(user_id)
        
        # تسجيل النشاط
        SecurityService.log_activity(
            user=request.user,
            action='view',
            description=f"عرض تفاصيل المستخدم {user_details['username']}",
            model_name='User',
            object_id=user_id,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            "success": True,
            "data": {
                "user": user_details,
                "recent_activities": activities,
                "active_sessions": sessions
            }
        })
        
    except User.DoesNotExist:
        return Response({
            "success": False,
            "error": "المستخدم غير موجود"
        }, status=404)
    except Exception as e:
        logger.error(f"خطأ في تفاصيل المستخدم {user_id}: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_permission('create_users')
def create_user(request):
    """إنشاء مستخدم جديد"""
    try:
        data = request.data
        
        # التحقق من البيانات المطلوبة
        required_fields = ['username', 'password', 'email']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    "success": False,
                    "error": f"الحقل {field} مطلوب"
                }, status=400)
        
        # تحضير البيانات
        expires_at = None
        if data.get('account_expires_at'):
            expires_at = datetime.fromisoformat(data['account_expires_at'].replace('Z', '+00:00'))
        
        user, profile = UserManagementService.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            role_id=data.get('role_id'),
            expires_at=expires_at,
            created_by=request.user,
            notes=data.get('notes', '')
        )
        
        # تسجيل النشاط
        SecurityService.log_activity(
            user=request.user,
            action='create',
            description=f"إنشاء مستخدم جديد: {user.username}",
            model_name='User',
            object_id=user.id,
            changes={
                'username': user.username,
                'email': user.email,
                'role': profile.role.name if profile.role else None
            },
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            "success": True,
            "message": f"تم إنشاء المستخدم {user.username} بنجاح",
            "data": {
                "user_id": user.id,
                "username": user.username
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في إنشاء المستخدم: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=400)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@require_permission('edit_users')
def update_user(request, user_id):
    """تحديث بيانات المستخدم"""
    try:
        data = request.data
        
        # تحضير البيانات
        update_data = {}
        if 'first_name' in data:
            update_data['first_name'] = data['first_name']
        if 'last_name' in data:
            update_data['last_name'] = data['last_name']
        if 'email' in data:
            update_data['email'] = data['email']
        if 'role_id' in data:
            update_data['role_id'] = data['role_id']
        if 'is_active' in data:
            update_data['is_active'] = data['is_active']
        if 'notes' in data:
            update_data['notes'] = data['notes']
        if 'account_expires_at' in data:
            if data['account_expires_at']:
                update_data['account_expires_at'] = datetime.fromisoformat(
                    data['account_expires_at'].replace('Z', '+00:00')
                )
            else:
                update_data['account_expires_at'] = None
        
        user, profile = UserManagementService.update_user(user_id, **update_data)
        
        # تسجيل النشاط
        SecurityService.log_activity(
            user=request.user,
            action='update',
            description=f"تحديث بيانات المستخدم: {user.username}",
            model_name='User',
            object_id=user.id,
            changes=update_data,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            "success": True,
            "message": f"تم تحديث بيانات المستخدم {user.username} بنجاح"
        })
        
    except User.DoesNotExist:
        return Response({
            "success": False,
            "error": "المستخدم غير موجود"
        }, status=404)
    except Exception as e:
        logger.error(f"خطأ في تحديث المستخدم {user_id}: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_permission('edit_users')
def change_password(request, user_id):
    """تغيير كلمة مرور المستخدم"""
    try:
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response({
                "success": False,
                "error": "كلمة المرور الجديدة مطلوبة"
            }, status=400)
        
        UserManagementService.change_password(user_id, new_password, request.user)
        
        user = User.objects.get(id=user_id)
        
        # تسجيل النشاط
        SecurityService.log_activity(
            user=request.user,
            action='password_change',
            description=f"تغيير كلمة مرور المستخدم: {user.username}",
            model_name='User',
            object_id=user.id,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            "success": True,
            "message": "تم تغيير كلمة المرور بنجاح"
        })
        
    except User.DoesNotExist:
        return Response({
            "success": False,
            "error": "المستخدم غير موجود"
        }, status=404)
    except Exception as e:
        logger.error(f"خطأ في تغيير كلمة المرور للمستخدم {user_id}: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_permission('edit_users')
def activate_user(request, user_id):
    """تفعيل المستخدم"""
    try:
        data = request.data
        expires_at = None
        
        if data.get('account_expires_at'):
            expires_at = datetime.fromisoformat(
                data['account_expires_at'].replace('Z', '+00:00')
            )
        
        UserManagementService.activate_user(user_id, expires_at, request.user)
        
        user = User.objects.get(id=user_id)
        
        # تسجيل النشاط
        SecurityService.log_activity(
            user=request.user,
            action='update',
            description=f"تفعيل المستخدم: {user.username}",
            model_name='User',
            object_id=user.id,
            changes={'activated': True, 'expires_at': expires_at.isoformat() if expires_at else None},
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            "success": True,
            "message": f"تم تفعيل المستخدم {user.username} بنجاح"
        })
        
    except User.DoesNotExist:
        return Response({
            "success": False,
            "error": "المستخدم غير موجود"
        }, status=404)
    except Exception as e:
        logger.error(f"خطأ في تفعيل المستخدم {user_id}: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_permission('edit_users')
def deactivate_user(request, user_id):
    """إلغاء تفعيل المستخدم"""
    try:
        reason = request.data.get('reason', '')
        
        UserManagementService.deactivate_user(user_id, reason, request.user)
        
        user = User.objects.get(id=user_id)
        
        # تسجيل النشاط
        SecurityService.log_activity(
            user=request.user,
            action='update',
            description=f"إلغاء تفعيل المستخدم: {user.username}",
            model_name='User',
            object_id=user.id,
            changes={'deactivated': True, 'reason': reason},
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            "success": True,
            "message": f"تم إلغاء تفعيل المستخدم {user.username} بنجاح"
        })
        
    except User.DoesNotExist:
        return Response({
            "success": False,
            "error": "المستخدم غير موجود"
        }, status=404)
    except Exception as e:
        logger.error(f"خطأ في إلغاء تفعيل المستخدم {user_id}: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=400)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@require_permission('delete_users')
def delete_user(request, user_id):
    """حذف المستخدم"""
    try:
        user = User.objects.get(id=user_id)
        username = user.username
        
        # منع حذف المستخدم الحالي
        if user.id == request.user.id:
            return Response({
                "success": False,
                "error": "لا يمكنك حذف حسابك الخاص"
            }, status=400)
        
        # تسجيل النشاط قبل الحذف
        SecurityService.log_activity(
            user=request.user,
            action='delete',
            description=f"حذف المستخدم: {username}",
            model_name='User',
            object_id=user.id,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        user.delete()
        
        return Response({
            "success": True,
            "message": f"تم حذف المستخدم {username} بنجاح"
        })
        
    except User.DoesNotExist:
        return Response({
            "success": False,
            "error": "المستخدم غير موجود"
        }, status=404)
    except Exception as e:
        logger.error(f"خطأ في حذف المستخدم {user_id}: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=400)


# ===== إدارة الأدوار =====

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_permission('view_roles')
def list_roles(request):
    """قائمة الأدوار"""
    try:
        roles = RoleService.get_all_roles()
        
        return Response({
            "success": True,
            "data": roles
        })
        
    except Exception as e:
        logger.error(f"خطأ في قائمة الأدوار: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_permissions(request):
    """الحصول على صلاحيات المستخدم الحالي"""
    try:
        user = request.user
        permissions = []
        
        if user.is_superuser:
            # المدير العام لديه جميع الصلاحيات
            permissions = [
                'view_users', 'create_users', 'edit_users', 'delete_users',
                'view_roles', 'create_roles', 'edit_roles', 'delete_roles',
                'view_activities', 'view_security_alerts',
                'analyze_excel', 'upload_sites', 'search_sites',
                'view_statistics', 'manage_system'
            ]
        elif hasattr(user, 'profile') and user.profile.role:
            permissions = user.profile.role.get_permissions()
        
        return Response({
            "success": True,
            "data": {
                "permissions": permissions,
                "role": user.profile.role.display_name if hasattr(user, 'profile') and user.profile.role else 'بدون دور'
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في الحصول على صلاحيات المستخدم: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=500)


# ===== النشاطات والأمان =====

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_permission('view_activities')
def get_user_activities(request, user_id=None):
    """الحصول على نشاطات المستخدم"""
    try:
        target_user_id = user_id or request.user.id
        limit = int(request.GET.get('limit', 50))
        
        activities = SecurityService.get_user_activities(target_user_id, limit)
        
        return Response({
            "success": True,
            "data": activities
        })
        
    except Exception as e:
        logger.error(f"خطأ في الحصول على النشاطات: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_permission('view_activities')
def get_system_activities(request):
    """الحصول على نشاطات النظام"""
    try:
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 50))
        action = request.GET.get('action', '')
        
        queryset = UserActivity.objects.select_related('user').all()
        
        if action:
            queryset = queryset.filter(action=action)
        
        # ترقيم الصفحات
        total = queryset.count()
        start = (page - 1) * per_page
        end = start + per_page
        activities = queryset[start:end]
        
        activities_data = []
        for activity in activities:
            activities_data.append({
                'id': activity.id,
                'user': activity.user.username,
                'action': activity.get_action_display(),
                'description': activity.description,
                'model_name': activity.model_name,
                'object_id': activity.object_id,
                'ip_address': activity.ip_address,
                'success': activity.success,
                'timestamp': activity.timestamp
            })
        
        return Response({
            "success": True,
            "data": {
                "activities": activities_data,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في نشاطات النظام: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_permission('view_security_alerts')
def get_security_alerts(request):
    """الحصول على التنبيهات الأمنية"""
    try:
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        severity = request.GET.get('severity', '')
        is_resolved = request.GET.get('is_resolved')
        
        queryset = SecurityAlert.objects.select_related('user').all()
        
        if severity:
            queryset = queryset.filter(severity=severity)
        
        if is_resolved == 'true':
            queryset = queryset.filter(is_resolved=True)
        elif is_resolved == 'false':
            queryset = queryset.filter(is_resolved=False)
        
        # ترقيم الصفحات
        total = queryset.count()
        start = (page - 1) * per_page
        end = start + per_page
        alerts = queryset[start:end]
        
        alerts_data = []
        for alert in alerts:
            alerts_data.append({
                'id': alert.id,
                'alert_type': alert.get_alert_type_display(),
                'severity': alert.get_severity_display(),
                'title': alert.title,
                'description': alert.description,
                'user': alert.user.username if alert.user else None,
                'ip_address': alert.ip_address,
                'is_resolved': alert.is_resolved,
                'created_at': alert.created_at,
                'resolved_at': alert.resolved_at,
                'resolved_by': alert.resolved_by.username if alert.resolved_by else None
            })
        
        return Response({
            "success": True,
            "data": {
                "alerts": alerts_data,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في التنبيهات الأمنية: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_permission('view_security_alerts')
def resolve_security_alert(request, alert_id):
    """حل تنبيه أمني"""
    try:
        alert = SecurityAlert.objects.get(id=alert_id)
        notes = request.data.get('notes', '')
        
        alert.resolve(request.user, notes)
        
        return Response({
            "success": True,
            "message": "تم حل التنبيه بنجاح"
        })
        
    except SecurityAlert.DoesNotExist:
        return Response({
            "success": False,
            "error": "التنبيه غير موجود"
        }, status=404)
    except Exception as e:
        logger.error(f"خطأ في حل التنبيه {alert_id}: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=500)


# ===== إحصائيات النظام =====

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_permission('view_statistics')
def get_dashboard_statistics(request):
    """إحصائيات لوحة التحكم"""
    try:
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # إحصائيات المستخدمين
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        locked_users = UserProfile.objects.filter(
            account_locked_until__gt=now
        ).count()
        
        # إحصائيات النشاطات
        today_activities = UserActivity.objects.filter(
            timestamp__date=today
        ).count()
        
        week_activities = UserActivity.objects.filter(
            timestamp__gte=week_ago
        ).count()
        
        failed_logins_today = UserActivity.objects.filter(
            action='failed_login',
            timestamp__date=today
        ).count()
        
        # إحصائيات التنبيهات
        unresolved_alerts = SecurityAlert.objects.filter(
            is_resolved=False
        ).count()
        
        critical_alerts = SecurityAlert.objects.filter(
            is_resolved=False,
            severity='critical'
        ).count()
        
        # إحصائيات الجلسات
        active_sessions = UserSession.objects.filter(
            is_active=True,
            expires_at__gt=now
        ).count()
        
        return Response({
            "success": True,
            "data": {
                "users": {
                    "total": total_users,
                    "active": active_users,
                    "locked": locked_users
                },
                "activities": {
                    "today": today_activities,
                    "week": week_activities,
                    "failed_logins_today": failed_logins_today
                },
                "security": {
                    "unresolved_alerts": unresolved_alerts,
                    "critical_alerts": critical_alerts,
                    "active_sessions": active_sessions
                }
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في إحصائيات لوحة التحكم: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def terminate_session(request, session_id):
    """إنهاء جلسة مستخدم"""
    try:
        session = UserSession.objects.get(id=session_id)
        
        # التحقق من الصلاحية (المستخدم يمكنه إنهاء جلساته أو المدير يمكنه إنهاء أي جلسة)
        if session.user != request.user and not RoleService.user_has_permission(request.user, 'edit_users'):
            return Response({
                "success": False,
                "error": "ليس لديك صلاحية لإنهاء هذه الجلسة"
            }, status=403)
        
        session.terminate_session()
        
        # تسجيل النشاط
        SecurityService.log_activity(
            user=request.user,
            action='update',
            description=f"إنهاء جلسة المستخدم: {session.user.username}",
            model_name='UserSession',
            object_id=session.id,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            "success": True,
            "message": "تم إنهاء الجلسة بنجاح"
        })
        
    except UserSession.DoesNotExist:
        return Response({
            "success": False,
            "error": "الجلسة غير موجودة"
        }, status=404)
    except Exception as e:
        logger.error(f"خطأ في إنهاء الجلسة {session_id}: {str(e)}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=500)