"""
أمر إعداد النظام الأولي
python manage.py setup_system
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import transaction
from api.models import Role, UserProfile
from api.services.user_management_service import RoleService
import getpass


class Command(BaseCommand):
    help = 'إعداد النظام الأولي - إنشاء الأدوار والمدير العام'

    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-username',
            type=str,
            help='اسم المدير العام',
            default='admin'
        )
        parser.add_argument(
            '--admin-email',
            type=str,
            help='بريد المدير العام',
            default='admin@rased.local'
        )
        parser.add_argument(
            '--skip-admin',
            action='store_true',
            help='تخطي إنشاء المدير العام'
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🚀 بدء إعداد نظام راصد...')
        )

        try:
            with transaction.atomic():
                # 1. إنشاء الأدوار الافتراضية
                self.create_default_roles()
                
                # 2. إنشاء المدير العام
                if not options['skip_admin']:
                    self.create_superuser(options)
                
                # 3. إنشاء ملفات المستخدمين الموجودين
                self.create_missing_profiles()
                
                self.stdout.write(
                    self.style.SUCCESS('✅ تم إعداد النظام بنجاح!')
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ حدث خطأ أثناء الإعداد: {str(e)}')
            )
            raise

    def create_default_roles(self):
        """إنشاء الأدوار الافتراضية"""
        self.stdout.write('📋 إنشاء الأدوار الافتراضية...')
        
        roles_data = [
            {
                'name': 'admin',
                'display_name': 'مدير عام',
                'description': 'صلاحيات كاملة على النظام',
                'permissions': {
                    'actions': [
                        'view_users', 'create_users', 'edit_users', 'delete_users',
                        'view_roles', 'create_roles', 'edit_roles', 'delete_roles',
                        'view_activities', 'view_security_alerts', 'manage_sessions',
                        'analyze_excel', 'compare_sheets',
                        'upload_sites', 'search_sites', 'manage_sites',
                        'view_statistics', 'generate_reports',
                        'manage_system', 'backup_restore'
                    ]
                },
                'is_system_role': True
            },
            {
                'name': 'analyst',
                'display_name': 'محلل',
                'description': 'صلاحيات التحليل والبحث',
                'permissions': {
                    'actions': [
                        'analyze_excel', 'compare_sheets',
                        'search_sites', 'view_statistics'
                    ]
                },
                'is_system_role': True
            },
            {
                'name': 'operator',
                'display_name': 'مشغل',
                'description': 'صلاحيات البحث الأساسية',
                'permissions': {
                    'actions': [
                        'search_sites', 'view_statistics'
                    ]
                },
                'is_system_role': True
            },
            {
                'name': 'uploader',
                'display_name': 'رافع البيانات',
                'description': 'صلاحيات رفع بيانات الأبراج',
                'permissions': {
                    'actions': [
                        'upload_sites', 'search_sites', 'view_statistics'
                    ]
                },
                'is_system_role': True
            },
            {
                'name': 'viewer',
                'display_name': 'مشاهد',
                'description': 'صلاحيات عرض فقط',
                'permissions': {
                    'actions': [
                        'view_statistics'
                    ]
                },
                'is_system_role': True
            }
        ]

        created_count = 0
        for role_data in roles_data:
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults=role_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'  ✓ تم إنشاء دور: {role.display_name}')
            else:
                self.stdout.write(f'  - دور موجود: {role.display_name}')

        self.stdout.write(
            self.style.SUCCESS(f'📋 تم إنشاء {created_count} دور جديد')
        )

    def create_superuser(self, options):
        """إنشاء المدير العام"""
        self.stdout.write('👤 إعداد المدير العام...')
        
        admin_username = options['admin_username']
        admin_email = options['admin_email']

        # التحقق من وجود مدير عام
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write('  - يوجد مدير عام مسبقاً')
            return

        # التحقق من وجود المستخدم
        if User.objects.filter(username=admin_username).exists():
            self.stdout.write(
                self.style.WARNING(f'  ⚠️  المستخدم {admin_username} موجود مسبقاً')
            )
            return

        # طلب كلمة المرور
        password = getpass.getpass('كلمة مرور المدير العام: ')
        if not password:
            password = 'Admin@123'  # كلمة مرور افتراضية للتطوير
            self.stdout.write(
                self.style.WARNING(f'  ⚠️  استخدام كلمة المرور الافتراضية: {password}')
            )

        # إنشاء المدير العام
        admin_user = User.objects.create_superuser(
            username=admin_username,
            email=admin_email,
            password=password,
            first_name='مدير',
            last_name='النظام'
        )

        # إنشاء الملف الشخصي
        admin_role = Role.objects.get(name='admin')
        UserProfile.objects.create(
            user=admin_user,
            role=admin_role,
            is_active=True,
            activation_date=timezone.now(),
            password_changed_at=timezone.now(),
            notes='حساب المدير العام - تم إنشاؤه تلقائياً'
        )

        self.stdout.write(
            self.style.SUCCESS(f'👤 تم إنشاء المدير العام: {admin_username}')
        )
        
        if password == 'Admin@123':
            self.stdout.write(
                self.style.WARNING('⚠️  تذكر تغيير كلمة المرور بعد تسجيل الدخول!')
            )

    def create_missing_profiles(self):
        """إنشاء ملفات شخصية للمستخدمين الموجودين بدونها"""
        self.stdout.write('🔗 التحقق من الملفات الشخصية...')
        
        users_without_profiles = User.objects.filter(profile__isnull=True)
        created_count = 0
        
        # الحصول على دور افتراضي
        default_role = Role.objects.filter(name='viewer').first()
        
        for user in users_without_profiles:
            UserProfile.objects.create(
                user=user,
                role=default_role,
                is_active=user.is_active,
                activation_date=timezone.now() if user.is_active else None,
                password_changed_at=timezone.now(),
                notes='تم إنشاء الملف تلقائياً أثناء إعداد النظام'
            )
            created_count += 1
            self.stdout.write(f'  ✓ تم إنشاء ملف: {user.username}')

        if created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'🔗 تم إنشاء {created_count} ملف شخصي')
            )
        else:
            self.stdout.write('  - جميع المستخدمين لديهم ملفات شخصية')

    def display_summary(self):
        """عرض ملخص النظام"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('📊 ملخص النظام:'))
        self.stdout.write('='*50)
        
        # إحصائيات الأدوار
        roles_count = Role.objects.count()
        system_roles_count = Role.objects.filter(is_system_role=True).count()
        
        self.stdout.write(f'📋 الأدوار: {roles_count} (نظام: {system_roles_count})')
        
        # إحصائيات المستخدمين
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        superusers = User.objects.filter(is_superuser=True).count()
        
        self.stdout.write(f'👥 المستخدمين: {total_users} (نشط: {active_users}, مدير: {superusers})')
        
        # إحصائيات الملفات الشخصية
        profiles_count = UserProfile.objects.count()
        active_profiles = UserProfile.objects.filter(is_active=True).count()
        
        self.stdout.write(f'📝 الملفات الشخصية: {profiles_count} (نشط: {active_profiles})')
        
        self.stdout.write('='*50)
        self.stdout.write(self.style.SUCCESS('✅ النظام جاهز للاستخدام!'))
        self.stdout.write('='*50 + '\n')


# أمر إضافي لإنشاء مستخدم تجريبي
class Command2(BaseCommand):
    help = 'إنشاء مستخدمين تجريبيين'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            help='عدد المستخدمين التجريبيين',
            default=5
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('👥 إنشاء مستخدمين تجريبيين...')
        )

        count = options['count']
        roles = list(Role.objects.filter(is_active=True))
        
        if not roles:
            self.stdout.write(
                self.style.ERROR('❌ لا توجد أدوار في النظام. قم بتشغيل setup_system أولاً')
            )
            return

        created_count = 0
        
        for i in range(1, count + 1):
            username = f'user{i:02d}'
            
            # التحقق من عدم وجود المستخدم
            if User.objects.filter(username=username).exists():
                continue
            
            # إنشاء المستخدم
            user = User.objects.create_user(
                username=username,
                email=f'{username}@test.local',
                password='Test@123',
                first_name=f'مستخدم',
                last_name=f'{i:02d}',
                is_active=True
            )
            
            # اختيار دور عشوائي
            import random
            role = random.choice(roles)
            
            # إنشاء الملف الشخصي
            UserProfile.objects.create(
                user=user,
                role=role,
                is_active=True,
                activation_date=timezone.now(),
                password_changed_at=timezone.now(),
                notes=f'مستخدم تجريبي - {role.display_name}'
            )
            
            created_count += 1
            self.stdout.write(f'  ✓ {username} ({role.display_name})')

        self.stdout.write(
            self.style.SUCCESS(f'✅ تم إنشاء {created_count} مستخدم تجريبي')
        )
        
        if created_count > 0:
            self.stdout.write(
                self.style.WARNING('⚠️  كلمة المرور لجميع المستخدمين: Test@123')
            )