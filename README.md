# 🎯 نظام راصد - Rased System

نظام متكامل لتحليل بيانات الاتصالات وإدارة الأبراج مع واجهة إدارة مستخدمين متقدمة.

## 🚀 المميزات

- ✅ تحليل ملفات Excel للمكالمات (تنسيق أسيا وزين)
- ✅ مقارنة بيانات المشتركين
- ✅ بحث جغرافي عن الأبراج
- ✅ نظام صلاحيات متقدم (Roles & Permissions)
- ✅ تتبع الأنشطة والتنبيهات الأمنية
- ✅ Dashboard متقدم مع خرائط تفاعلية

## 🛠️ التقنيات المستخدمة

### Backend
- Django 3.2
- Django REST Framework
- PostgreSQL
- Redis (للـ caching)
- JWT Authentication

### Frontend
- React 18
- Material-UI
- Leaflet Maps
- Recharts

### DevOps
- Docker & Docker Compose
- Nginx
- GitHub Actions (CI/CD)
- Let's Encrypt (SSL)

---

## 📦 التثبيت والتشغيل

### المتطلبات الأساسية

- Docker و Docker Compose
- Git
- (اختياري) Node.js و Python للتطوير المحلي

### 1️⃣ استنساخ المشروع

```bash
git clone https://github.com/yourusername/rased-system.git
cd rased-system
```

### 2️⃣ إعداد ملف البيئة

```bash
# نسخ ملف البيئة
cp backend/.env.example backend/.env

# تعديل الإعدادات (مهم!)
nano backend/.env
```

**تأكد من تغيير:**
- `SECRET_KEY` - استخدم مفتاح جديد وآمن
- `POSTGRES_PASSWORD` - كلمة مرور قوية
- `ALLOWED_HOSTS` - النطاق الخاص بك
- `CORS_ALLOWED_ORIGINS` - رابط الموقع

### 3️⃣ توليد SECRET_KEY آمن

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 4️⃣ التشغيل (Development)

```bash
# بناء وتشغيل الحاويات
docker-compose up -d

# تشغيل الـ migrations
docker-compose exec backend python manage.py migrate

# إنشاء مستخدم مدير
docker-compose exec backend python manage.py setup_system

# عرض الـ logs
docker-compose logs -f
```

الموقع سيكون متاحاً على: `http://localhost`

### 5️⃣ النشر على DigitalOcean

#### A. إنشاء Droplet

1. اذهب إلى DigitalOcean وأنشئ Droplet جديد:
   - **OS**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($12/month أو أكثر حسب الحاجة)
   - **Datacenter**: اختر الأقرب لك
   - **Authentication**: SSH Key (موصى به)

2. سجل عنوان IP الخاص بالـ Droplet

#### B. إعداد السيرفر

```bash
# الاتصال بالسيرفر
ssh root@your_server_ip

# تحديث النظام
apt update && apt upgrade -y

# تثبيت المتطلبات
apt install -y docker.io docker-compose git ufw

# تفعيل Docker
systemctl start docker
systemctl enable docker

# إعداد الجدار الناري
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# إنشاء مستخدم للتطبيق
useradd -m -s /bin/bash rased
usermod -aG docker rased
su - rased
```

#### C. رفع المشروع

```bash
# كمستخدم rased
cd ~
mkdir app
cd app

# استنساخ المشروع
git clone https://github.com/yourusername/rased-system.git .

# إعداد ملف البيئة
cp backend/.env.example backend/.env
nano backend/.env  # عدّل الإعدادات

# إعطاء صلاحيات للسكريبتات
chmod +x deploy.sh setup-ssl.sh backup.sh

# النشر
./deploy.sh prod
```

#### D. إعداد SSL (HTTPS)

```bash
# انتظر حتى يشتغل الموقع على HTTP أولاً
# ثم نفذ:
./setup-ssl.sh yourdomain.com your-email@example.com
```

#### E. إعداد النسخ الاحتياطي التلقائي

```bash
# إضافة cron job للنسخ الاحتياطي اليومي
crontab -e

# أضف هذا السطر (نسخ احتياطي كل يوم الساعة 3 صباحاً)
0 3 * * * cd /home/rased/app && ./backup.sh >> /home/rased/backup.log 2>&1
```

---

## 🔗 إعداد GitHub Actions (CI/CD)

### 1️⃣ إنشاء SSH Key

على جهازك المحلي:

```bash
# إنشاء مفتاح SSH جديد
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions

# عرض المفتاح العام
cat ~/.ssh/github_actions.pub
```

### 2️⃣ إضافة المفتاح للسيرفر

```bash
# على السيرفر
ssh root@your_server_ip
su - rased

# إضافة المفتاح
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# الصق المفتاح العام هنا
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 3️⃣ إضافة Secrets في GitHub

اذهب إلى: `Repository → Settings → Secrets and variables → Actions`

أضف هذه الـ Secrets:

| Name | Value |
|------|-------|
| `SSH_PRIVATE_KEY` | محتوى ملف `~/.ssh/github_actions` (المفتاح الخاص) |
| `SERVER_IP` | عنوان IP للسيرفر |
| `SERVER_USER` | `rased` |
| `DOMAIN` | `yourdomain.com` |

### 4️⃣ اختبار GitHub Actions

```bash
# على جهازك المحلي
git add .
git commit -m "Setup CI/CD"
git push origin main

# راقب العملية في GitHub Actions tab
```

---

## 📚 الاستخدام

### إنشاء مستخدم مدير

```bash
docker-compose exec backend python manage.py setup_system
# سيطلب منك اسم المستخدم وكلمة المرور
```

أو يدوياً:

```bash
docker-compose exec backend python manage.py createsuperuser
```

### الوصول للنظام

- **Frontend**: https://yourdomain.com
- **Admin Panel**: https://yourdomain.com/admin
- **API Docs**: https://yourdomain.com/api/

### عرض السجلات (Logs)

```bash
# جميع الخدمات
docker-compose logs -f

# Backend فقط
docker-compose logs -f backend

# آخر 100 سطر
docker-compose logs --tail=100 backend
```

### إيقاف وإعادة تشغيل

```bash
# إيقاف
docker-compose down

# إعادة تشغيل
docker-compose restart

# إعادة بناء وتشغيل
docker-compose up -d --build
```

---

## 🔧 الصيانة

### تحديث النظام

```bash
cd /home/rased/app
git pull origin main
./deploy.sh prod
```

أو تلقائياً عبر GitHub Actions (push إلى main branch)

### النسخ الاحتياطي

```bash
# يدوياً
./backup.sh

# استعادة من نسخة احتياطية
gunzip < backups/backup_YYYYMMDD_HHMMSS_db.sql.gz | \
  docker-compose exec -T db psql -U rased_user -d rased_db
```

### تنظيف Docker

```bash
# حذف الحاويات والصور غير المستخدمة
docker system prune -a

# حذف volumes غير المستخدمة
docker volume prune
```

### مراقبة الأداء

```bash
# استخدام الموارد
docker stats

# حجم الـ volumes
docker system df -v

# عدد الاتصالات بقاعدة البيانات
docker-compose exec db psql -U rased_user -d rased_db -c \
  "SELECT count(*) FROM pg_stat_activity;"
```

---

## 🔒 الأمان

### ✅ مطبّق حالياً

- JWT Authentication مع Refresh Tokens
- HTTPS إجباري (بعد إعداد SSL)
- Rate Limiting على API
- CORS محدد
- Session Management
- Audit Logging
- Password Policies (8+ أحرف، تعقيد)
- Account Lockout (5 محاولات فاشلة)

### 🔐 توصيات إضافية

1. **تفعيل Fail2Ban**
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

2. **تحديثات دورية**
```bash
# إضافة cron job للتحديثات الأمنية
0 2 * * * apt update && apt upgrade -y
```

3. **مراقبة السجلات**
- استخدم Sentry للأخطاء (أضف `SENTRY_DSN` في `.env`)
- راجع `/app/logs/security.log` دورياً

4. **نسخ احتياطي خارجي**
- رفع النسخ على AWS S3 أو DigitalOcean Spaces

---

## 🐛 حل المشاكل

### المشكلة: Backend لا يبدأ

```bash
# فحص الـ logs
docker-compose logs backend

# الأسباب الشائعة:
# 1. قاعدة البيانات غير جاهزة
docker-compose restart db
sleep 10
docker-compose restart backend

# 2. خطأ في .env
docker-compose exec backend python manage.py check
```

### المشكلة: Frontend يظهر صفحة فارغة

```bash
# فحص console في المتصفح (F12)
# غالباً مشكلة في REACT_APP_API_URL

# إعادة بناء Frontend
docker-compose build frontend
docker-compose up -d frontend
```

### المشكلة: خطأ 502 Bad Gateway

```bash
# فحص حالة الخدمات
docker-compose ps

# إعادة تشغيل nginx
docker-compose restart nginx

# فحص تكوين nginx
docker-compose exec nginx nginx -t
```

### المشكلة: قاعدة البيانات ممتلئة

```bash
# فحص حجم قاعدة البيانات
docker-compose exec db psql -U rased_user -d rased_db -c \
  "SELECT pg_size_pretty(pg_database_size('rased_db'));"

# حذف السجلات القديمة (أكثر من 90 يوم)
docker-compose exec backend python manage.py shell
>>> from api.models import UserActivity
>>> from datetime import timedelta
>>> from django.utils import timezone
>>> UserActivity.objects.filter(
...     timestamp__lt=timezone.now() - timedelta(days=90)
... ).delete()
```

---

## 📊 مراقبة الأداء

### Metrics مهمة

```bash
# CPU و Memory
docker stats --no-stream

# حجم قاعدة البيانات
docker-compose exec db psql -U rased_user -d rased_db -c \
  "SELECT schemaname, tablename, 
   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
   FROM pg_tables WHERE schemaname = 'public' ORDER BY 
   pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Disk Usage
df -h
du -sh /var/lib/docker
```

---

## 🤝 المساهمة

1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للـ branch (`git push origin feature/amazing-feature`)
5. افتح Pull Request

---

## 📝 License

هذا المشروع خاص ومحمي.

---

## 📞 الدعم

للأسئلة والدعم:
- Email: support@rased.local
- Issues: https://github.com/yourusername/rased-system/issues

---

## 🎉 شكر خاص

تم تطوير هذا النظام باستخدام:
- Django & Django REST Framework
- React & Material-UI
- PostgreSQL
- Docker

---

**Made with ❤️ for Rased System**