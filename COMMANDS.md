# 🎯 دليل الأوامر السريعة - Quick Commands Reference

## 📦 استخدام Makefile

تم توفير `Makefile` لتسهيل العمليات الشائعة:

```bash
# عرض جميع الأوامر المتاحة
make help

# الإعداد الأولي (أول مرة فقط)
make init

# تشغيل النظام
make up

# إيقاف النظام
make down

# عرض السجلات
make logs

# نسخ احتياطي
make backup

# تحديث من GitHub
make update
```

---

## 🚀 الأوامر الأساسية

### البناء والتشغيل

```bash
# بناء الحاويات
make build

# تشغيل في الخلفية
make up

# تشغيل مع عرض اللوجز
make dev

# إيقاف
make down

# إعادة تشغيل
make restart
```

### المراقبة

```bash
# عرض حالة الخدمات
make ps

# عرض السجلات الحية
make logs

# سجلات Backend فقط
make logs-backend

# سجلات قاعدة البيانات
make logs-db

# إحصائيات الموارد
make stats

# فحص صحة النظام
make health
```

### قاعدة البيانات

```bash
# تشغيل migrations
make migrate

# إنشاء migrations جديدة
make makemigrations

# فتح shell قاعدة البيانات
make shell-db

# نسخ احتياطي للقاعدة
make db-backup

# حجم قاعدة البيانات
make db-size

# استعادة من نسخة احتياطية
make db-restore
```

### الإدارة

```bash
# إنشاء مستخدم مدير
make createsuperuser

# إعداد النظام (roles & admin)
make setup

# جمع الملفات الثابتة
make collectstatic

# فحص إعدادات Django
make check
```

### النشر

```bash
# نشر Development
make deploy-dev

# نشر Production
make deploy-prod

# إعداد SSL
make ssl

# تحديث من GitHub ونشر
make update
```

### التنظيف

```bash
# تنظيف ملفات Docker غير المستخدمة
make clean

# تنظيف كامل (حذف كل شيء)
make clean-all
```

---

## 🐳 أوامر Docker المباشرة

### إدارة الحاويات

```bash
# عرض الحاويات النشطة
docker-compose ps

# تشغيل حاوية معينة
docker-compose up -d backend

# إيقاف حاوية معينة
docker-compose stop backend

# إعادة تشغيل حاوية
docker-compose restart backend

# حذف الحاويات
docker-compose down

# حذف الحاويات مع Volumes
docker-compose down -v

# بناء بدون cache
docker-compose build --no-cache

# عرض Logs لحاوية معينة
docker-compose logs -f backend

# عرض آخر 100 سطر
docker-compose logs --tail=100 backend
```

### تنفيذ أوامر داخل الحاويات

```bash
# فتح shell في Backend
docker-compose exec backend bash

# تشغيل أمر Python
docker-compose exec backend python manage.py shell

# تشغيل أمر في قاعدة البيانات
docker-compose exec db psql -U rased_user -d rased_db

# نسخ ملف من الحاوية
docker-compose cp backend:/app/logs/django.log ./local-logs.log

# نسخ ملف إلى الحاوية
docker-compose cp local-file.txt backend:/app/
```

### مراقبة الموارد

```bash
# عرض استخدام الموارد
docker stats

# عرض مرة واحدة (بدون تحديث)
docker stats --no-stream

# فحص مساحة Docker
docker system df

# عرض تفاصيل Volumes
docker system df -v
```

---

## 💾 قاعدة البيانات

### Backup & Restore

```bash
# نسخ احتياطي كامل
./backup.sh

# نسخ احتياطي يدوي للقاعدة
docker-compose exec -T db pg_dump -U rased_user rased_db | \
  gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# استعادة من نسخة احتياطية
gunzip < backup_file.sql.gz | \
  docker-compose exec -T db psql -U rased_user -d rased_db

# نسخ احتياطي مع البنية فقط
docker-compose exec -T db pg_dump -U rased_user --schema-only rased_db > schema.sql

# نسخ احتياطي للبيانات فقط
docker-compose exec -T db pg_dump -U rased_user --data-only rased_db > data.sql
```

### استعلامات مفيدة

```bash
# الاتصال بقاعدة البيانات
docker-compose exec db psql -U rased_user -d rased_db

# داخل psql:

# عرض جميع الجداول
\dt

# حجم قاعدة البيانات
SELECT pg_size_pretty(pg_database_size('rased_db'));

# حجم كل جدول
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# عدد السجلات في جدول
SELECT COUNT(*) FROM api_useractivity;

# عدد الاتصالات النشطة
SELECT count(*) FROM pg_stat_activity;

# إنهاء جميع الاتصالات
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'rased_db' AND pid <> pg_backend_pid();

# الخروج
\q
```

---

## 🔧 Django Management Commands

```bash
# تشغيل أي أمر Django
docker-compose exec backend python manage.py COMMAND

# أوامر شائعة:

# Migrations
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py showmigrations

# قاعدة البيانات
docker-compose exec backend python manage.py dbshell
docker-compose exec backend python manage.py sqlmigrate api 0001
docker-compose exec backend python manage.py flush  # حذف كل البيانات!

# المستخدمين
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py changepassword username

# Static Files
docker-compose exec backend python manage.py collectstatic --noinput
docker-compose exec backend python manage.py findstatic filename.css

# Shell
docker-compose exec backend python manage.py shell
docker-compose exec backend python manage.py shell_plus  # إذا كان installed

# إعداد مخصص
docker-compose exec backend python manage.py setup_system

# فحص
docker-compose exec backend python manage.py check
docker-compose exec backend python manage.py check --deploy
```

---

## 🛠️ الصيانة والتنظيف

### تنظيف Docker

```bash
# حذف الحاويات المتوقفة
docker container prune

# حذف الصور غير المستخدمة
docker image prune

# حذف الشبكات غير المستخدمة
docker network prune

# حذف Volumes غير المستخدمة
docker volume prune

# تنظيف شامل
docker system prune -a

# عرض المساحة المستخدمة
docker system df
```

### تنظيف السجلات

```bash
# حذف سجلات أقدم من 7 أيام
find backend/logs/ -name "*.log" -mtime +7 -delete

# حذف سجلات Docker
truncate -s 0 $(docker inspect --format='{{.LogPath}}' rased_backend)

# تنظيف سجلات النظام (كـ root)
journalctl --vacuum-time=7d
```

### تنظيف قاعدة البيانات

```bash
# حذف الأنشطة القديمة (أكثر من 90 يوم)
docker-compose exec backend python manage.py shell << EOF
from api.models import UserActivity
from datetime import timedelta
from django.utils import timezone
UserActivity.objects.filter(
    timestamp__lt=timezone.now() - timedelta(days=90)
).delete()
EOF

# تنظيف الجلسات المنتهية
docker-compose exec backend python manage.py clearsessions
```

---

## 🔐 الأمان والمراقبة

### مراقبة الأمان

```bash
# عرض محاولات تسجيل الدخول الفاشلة
docker-compose exec backend python manage.py shell << EOF
from api.models import UserActivity
failed_logins = UserActivity.objects.filter(action='failed_login')
print(f"Failed logins: {failed_logins.count()}")
for activity in failed_logins[:10]:
    print(f"{activity.timestamp} - {activity.user} - {activity.ip_address}")
EOF

# عرض التنبيهات الأمنية
docker-compose exec backend python manage.py shell << EOF
from api.models import SecurityAlert
alerts = SecurityAlert.objects.filter(is_resolved=False)
print(f"Active alerts: {alerts.count()}")
EOF

# مراجعة سجلات الأمان
docker-compose exec backend tail -f logs/security.log
```

### فحص الاتصالات

```bash
# عرض الاتصالات النشطة
docker-compose exec backend python manage.py shell << EOF
from api.models import UserSession
from django.utils import timezone
active = UserSession.objects.filter(
    last_activity__gte=timezone.now() - timezone.timedelta(hours=8)
)
print(f"Active sessions: {active.count()}")
EOF

# عرض المستخدمين المتصلين
ss -tunap | grep :8000
netstat -an | grep :8000
```

---

## 📊 التقارير والإحصائيات

```bash
# عدد المستخدمين
docker-compose exec backend python manage.py shell -c \
  "from django.contrib.auth.models import User; print(User.objects.count())"

# المستخدمين النشطين
docker-compose exec backend python manage.py shell -c \
  "from django.contrib.auth.models import User; print(User.objects.filter(is_active=True).count())"

# إحصائيات التحليلات
docker-compose exec backend python manage.py shell << EOF
from api.models import UserAnalysisResult
from django.db.models import Count
from datetime import timedelta
from django.utils import timezone

recent = UserAnalysisResult.objects.filter(
    created_at__gte=timezone.now() - timedelta(days=7)
)
print(f"تحليلات آخر 7 أيام: {recent.count()}")

by_type = recent.values('analysis_type').annotate(count=Count('id'))
for item in by_type:
    print(f"  {item['analysis_type']}: {item['count']}")
EOF
```

---

## 🚨 الطوارئ

### إيقاف سريع

```bash
# إيقاف جميع الخدمات فوراً
docker-compose kill

# ثم
docker-compose down
```

### استعادة سريعة

```bash
# من آخر نسخة احتياطية
cd backups
LATEST=$(ls -t backup_*_db.sql.gz | head -1)
gunzip < $LATEST | docker-compose exec -T db psql -U rased_user -d rased_db
```

### إعادة بناء كاملة

```bash
# حذف كل شيء وإعادة البناء
docker-compose down -v
docker system prune -a -f
make build
make init
```

---

## 💡 نصائح مفيدة

### مراقبة مستمرة

```bash
# في terminal منفصل
watch -n 5 'docker stats --no-stream'

# مراقبة اللوجز
tail -f backend/logs/*.log

# مراقبة قاعدة البيانات
watch -n 10 'docker-compose exec db psql -U rased_user -d rased_db -c "SELECT count(*) FROM pg_stat_activity;"'
```

### Aliases مفيدة (أضفها لـ ~/.bashrc)

```bash
alias dps='docker-compose ps'
alias dup='docker-compose up -d'
alias ddown='docker-compose down'
alias dlogs='docker-compose logs -f --tail=100'
alias dshell='docker-compose exec backend bash'
alias ddb='docker-compose exec db psql -U rased_user -d rased_db'
alias dbackup='cd ~/app && ./backup.sh'
```

---

**📖 للمزيد من المعلومات راجع:**
- `README.md` - معلومات عامة
- `DEPLOYMENT.md` - دليل النشر
- `backend/web_app/settings.py` - إعدادات Django