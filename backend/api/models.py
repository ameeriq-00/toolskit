from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import json

# النماذج الموجودة مسبقاً (محتفظ بها)
class SiteInformation(models.Model):
    governorate = models.CharField(max_length=100)
    site_enb_id = models.CharField(max_length=100)
    cell_id = models.CharField(max_length=100)
    site_name = models.CharField(max_length=200)
    latitude = models.FloatField()
    longitude = models.FloatField()
    bore = models.FloatField()
    lac_cell_id_ecgi = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.site_name} ({self.site_enb_id})"

class TwoGSiteInformation(models.Model):
    """معلومات أبراج 2G"""
    bsc = models.CharField(max_length=100, verbose_name="BSC")
    site_name = models.CharField(max_length=200, verbose_name="Site Name")
    site_id = models.CharField(max_length=100, verbose_name="Site ID")
    cell_id = models.CharField(max_length=100, verbose_name="Cell ID")
    geo_city = models.CharField(max_length=100, verbose_name="Geo-City")
    lac = models.CharField(max_length=50, verbose_name="LAC")
    mcc = models.CharField(max_length=10, verbose_name="MCC")
    mnc = models.CharField(max_length=10, verbose_name="MNC")
    longitude = models.FloatField(verbose_name="Longitude")
    latitude = models.FloatField(verbose_name="Latitude")
    mechanical_tilt = models.FloatField(verbose_name="Mechanical Tilt", null=True, blank=True)
    electrical_tilt = models.FloatField(verbose_name="Electrical Tilt", null=True, blank=True)
    azimuth = models.FloatField(verbose_name="Azimuth", null=True, blank=True)
    antenna_height = models.FloatField(verbose_name="Antenna Height", null=True, blank=True)
    antenna_beam_width = models.FloatField(verbose_name="Antenna Beam Width", null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "2G Site Information"
        verbose_name_plural = "2G Sites Information"
        unique_together = ('site_id', 'cell_id')

    def __str__(self):
        return f"2G: {self.site_name} ({self.site_id}-{self.cell_id})"

class ThreeGSiteInformation(models.Model):
    """معلومات أبراج 3G - محدث"""
    rnc = models.CharField(max_length=100, verbose_name="RNC")
    site_id = models.CharField(max_length=100, verbose_name="Site ID")  
    cell_id = models.CharField(max_length=100, verbose_name="Cell ID")
    full_site_name = models.CharField(max_length=200, verbose_name="Full Site Name")
    cell_name = models.CharField(max_length=200, verbose_name="Cell Name")
    lac = models.CharField(max_length=50, verbose_name="LAC")
    geo_city = models.CharField(max_length=100, verbose_name="Geo-City")
    longitude = models.FloatField(verbose_name="Longitude")
    latitude = models.FloatField(verbose_name="Latitude")
    azimuth = models.FloatField(verbose_name="Azimuth", null=True, blank=True)
    mechanical_tilt = models.FloatField(verbose_name="Mechanical Tilt", null=True, blank=True)
    electrical_tilt = models.FloatField(verbose_name="Electrical Tilt", null=True, blank=True)
    antenna_height = models.FloatField(verbose_name="Antenna Height", null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "3G Site Information"
        verbose_name_plural = "3G Sites Information"
        db_table = 'api_threegsiteinformation'

    def __str__(self):
        return f"3G: {self.full_site_name} ({self.site_id}-{self.cell_id})"

class FourGSiteInformation(models.Model):
    """معلومات أبراج 4G"""
    site_id = models.CharField(max_length=100, verbose_name="Site ID")
    cell_id = models.CharField(max_length=100, verbose_name="Cell ID")
    province_id = models.CharField(max_length=10, verbose_name="Province ID")
    geo_city = models.CharField(max_length=100, verbose_name="GEO City")
    full_site_name = models.CharField(max_length=200, verbose_name="Full Site Name")
    cell_name = models.CharField(max_length=200, verbose_name="Cell Name")
    technology = models.CharField(max_length=10, verbose_name="Technology", default="4G")
    lac_tac = models.CharField(max_length=50, verbose_name="LAC/TAC")
    antenna_height = models.FloatField(verbose_name="Antenna Height", null=True, blank=True)
    azimuth = models.FloatField(verbose_name="Azimuth", null=True, blank=True)
    rf_plan_longitude = models.FloatField(verbose_name="RF Plan Longitude")
    rf_plan_latitude = models.FloatField(verbose_name="RF Plan Latitude")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "4G Site Information"
        verbose_name_plural = "4G Sites Information"

    def __str__(self):
        return f"4G: {self.full_site_name} ({self.site_id}-{self.cell_id})"

class ExcelAnalysisResult(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    sheet_owner_number = models.CharField(max_length=20)
    filtered_calls = models.JSONField()
    imei_usage = models.JSONField()
    most_visited_sites = models.JSONField()

    def __str__(self):
        return f"Analysis for {self.sheet_owner_number} at {self.created_at}"

class SiteInformationUpload(models.Model):
    file = models.FileField(upload_to='site_information/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Site Information uploaded at {self.uploaded_at}"

# ===== النماذج الجديدة لنظام إدارة المستخدمين والأمان =====

class Role(models.Model):
    """نموذج الأدوار والصلاحيات"""
    name = models.CharField(max_length=100, unique=True, verbose_name="اسم الدور")
    display_name = models.CharField(max_length=100, verbose_name="الاسم المعروض")
    description = models.TextField(blank=True, verbose_name="الوصف")
    permissions = models.JSONField(default=dict, verbose_name="الصلاحيات")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    is_system_role = models.BooleanField(default=False, verbose_name="دور النظام")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "دور"
        verbose_name_plural = "الأدوار"
        ordering = ['name']

    def __str__(self):
        return self.display_name

    def get_permissions(self):
        """الحصول على قائمة الصلاحيات"""
        return self.permissions.get('actions', [])

    def has_permission(self, permission):
        """التحقق من وجود صلاحية معينة"""
        return permission in self.get_permissions()

class UserProfile(models.Model):
    """ملف المستخدم المتقدم"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="الدور")
    
    # معلومات الحساب
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    activation_date = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ التفعيل")
    deactivation_date = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ إلغاء التفعيل")
    account_expires_at = models.DateTimeField(null=True, blank=True, verbose_name="انتهاء صلاحية الحساب")
    
    # معلومات أمنية
    last_login_ip = models.GenericIPAddressField(null=True, blank=True, verbose_name="آخر IP تسجيل دخول")
    failed_login_attempts = models.PositiveIntegerField(default=0, verbose_name="محاولات تسجيل دخول فاشلة")
    account_locked_until = models.DateTimeField(null=True, blank=True, verbose_name="الحساب مقفل حتى")
    must_change_password = models.BooleanField(default=False, verbose_name="يجب تغيير كلمة المرور")
    password_changed_at = models.DateTimeField(null=True, blank=True, verbose_name="آخر تغيير لكلمة المرور")
    
    # معلومات إدارية
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                 related_name='created_users', verbose_name="أنشئ بواسطة")
    notes = models.TextField(blank=True, verbose_name="ملاحظات")
    
    # timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "ملف المستخدم"
        verbose_name_plural = "ملفات المستخدمين"

    def __str__(self):
        return f"{self.user.username} - {self.role.display_name if self.role else 'بدون دور'}"

    def is_account_active(self):
        """التحقق من نشاط الحساب"""
        if not self.is_active or not self.user.is_active:
            return False
        
        # التحقق من انتهاء صلاحية الحساب
        if self.account_expires_at and timezone.now() > self.account_expires_at:
            return False
        
        # التحقق من قفل الحساب
        if self.account_locked_until and timezone.now() < self.account_locked_until:
            return False
        
        return True

    def is_account_locked(self):
        """التحقق من قفل الحساب"""
        return self.account_locked_until and timezone.now() < self.account_locked_until

    def lock_account(self, duration_minutes=30):
        """قفل الحساب لفترة معينة"""
        self.account_locked_until = timezone.now() + timezone.timedelta(minutes=duration_minutes)
        self.save()

    def unlock_account(self):
        """إلغاء قفل الحساب"""
        self.account_locked_until = None
        self.failed_login_attempts = 0
        self.save()

    def deactivate_account(self, reason=""):
        """إلغاء تفعيل الحساب"""
        self.is_active = False
        self.deactivation_date = timezone.now()
        if reason:
            self.notes += f"\nتم إلغاء التفعيل في {timezone.now()}: {reason}"
        self.save()

    def activate_account(self, expires_at=None):
        """تفعيل الحساب"""
        self.is_active = True
        self.activation_date = timezone.now()
        self.deactivation_date = None
        self.account_expires_at = expires_at
        self.unlock_account()
        self.save()

class UserActivity(models.Model):
    """تتبع نشاطات المستخدمين"""
    ACTION_CHOICES = [
        ('login', 'تسجيل دخول'),
        ('logout', 'تسجيل خروج'),
        ('create', 'إنشاء'),
        ('update', 'تحديث'),
        ('delete', 'حذف'),
        ('view', 'عرض'),
        ('upload', 'رفع'),
        ('download', 'تحميل'),
        ('search', 'بحث'),
        ('analyze', 'تحليل'),
        ('password_change', 'تغيير كلمة مرور'),
        ('failed_login', 'محاولة دخول فاشلة'),
        ('account_locked', 'قفل حساب'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="المستخدم")
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, verbose_name="النشاط")
    description = models.TextField(verbose_name="الوصف")
    
    # تفاصيل العملية
    model_name = models.CharField(max_length=100, null=True, blank=True, verbose_name="نموذج البيانات")
    object_id = models.PositiveIntegerField(null=True, blank=True, verbose_name="معرف الكائن")
    changes = models.JSONField(default=dict, verbose_name="التغييرات")
    
    # معلومات الجلسة
    ip_address = models.GenericIPAddressField(verbose_name="عنوان IP")
    user_agent = models.TextField(verbose_name="متصفح المستخدم")
    session_key = models.CharField(max_length=255, null=True, blank=True, verbose_name="مفتاح الجلسة")
    
    # معلومات إضافية
    success = models.BooleanField(default=True, verbose_name="نجح")
    error_message = models.TextField(blank=True, verbose_name="رسالة الخطأ")
    
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="وقت الحدث")

    class Meta:
        verbose_name = "نشاط مستخدم"
        verbose_name_plural = "نشاطات المستخدمين"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['ip_address', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.get_action_display()} - {self.timestamp}"

    def save(self, *args, **kwargs):
        if not self.description:
            self.description = f"{self.user.username} قام بـ {self.get_action_display()}"
        super().save(*args, **kwargs)

class UserSession(models.Model):
    """إدارة جلسات المستخدمين"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="المستخدم")
    session_key = models.CharField(max_length=255, unique=True, verbose_name="مفتاح الجلسة")
    device_info = models.JSONField(default=dict, verbose_name="معلومات الجهاز")
    
    # معلومات الاتصال
    ip_address = models.GenericIPAddressField(verbose_name="عنوان IP")
    user_agent = models.TextField(verbose_name="متصفح المستخدم")
    location = models.CharField(max_length=200, blank=True, verbose_name="الموقع الجغرافي")
    
    # معلومات الجلسة
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    expires_at = models.DateTimeField(verbose_name="انتهاء الصلاحية")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    last_activity = models.DateTimeField(auto_now=True, verbose_name="آخر نشاط")
    
    # إحصائيات
    requests_count = models.PositiveIntegerField(default=0, verbose_name="عدد الطلبات")
    last_request_path = models.CharField(max_length=500, blank=True, verbose_name="آخر صفحة")

    class Meta:
        verbose_name = "جلسة مستخدم"
        verbose_name_plural = "جلسات المستخدمين"
        ordering = ['-last_activity']

    def __str__(self):
        return f"{self.user.username} - {self.ip_address} - {self.created_at}"

    def is_expired(self):
        """التحقق من انتهاء صلاحية الجلسة"""
        return timezone.now() > self.expires_at

    def extend_session(self, minutes=60):
        """تمديد الجلسة"""
        self.expires_at = timezone.now() + timezone.timedelta(minutes=minutes)
        self.save()

    def terminate_session(self):
        """إنهاء الجلسة"""
        self.is_active = False
        self.save()

class SecurityAlert(models.Model):
    """تنبيهات الأمان"""
    ALERT_TYPES = [
        ('failed_login', 'محاولة دخول فاشلة'),
        ('account_locked', 'قفل حساب'),
        ('suspicious_activity', 'نشاط مشبوه'),
        ('multiple_sessions', 'جلسات متعددة'),
        ('permission_violation', 'انتهاك صلاحيات'),
        ('data_access', 'وصول للبيانات الحساسة'),
    ]

    SEVERITY_LEVELS = [
        ('low', 'منخفض'),
        ('medium', 'متوسط'),
        ('high', 'عالي'),
        ('critical', 'حرج'),
    ]

    alert_type = models.CharField(max_length=50, choices=ALERT_TYPES, verbose_name="نوع التنبيه")
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS, verbose_name="مستوى الخطورة")
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, verbose_name="المستخدم")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="عنوان IP")
    
    title = models.CharField(max_length=200, verbose_name="العنوان")
    description = models.TextField(verbose_name="الوصف")
    details = models.JSONField(default=dict, verbose_name="التفاصيل")
    
    is_resolved = models.BooleanField(default=False, verbose_name="تم الحل")
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                  related_name='resolved_alerts', verbose_name="حل بواسطة")
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحل")
    resolution_notes = models.TextField(blank=True, verbose_name="ملاحظات الحل")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")

    class Meta:
        verbose_name = "تنبيه أمني"
        verbose_name_plural = "التنبيهات الأمنية"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.get_severity_display()}"

    def resolve(self, resolved_by, notes=""):
        """حل التنبيه"""
        self.is_resolved = True
        self.resolved_by = resolved_by
        self.resolved_at = timezone.now()
        self.resolution_notes = notes
        self.save()