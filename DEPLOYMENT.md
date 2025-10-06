# 🚀 دليل النشر السريع - Quick Deployment Guide

## 📋 قائمة التحقق قبل النشر

- [ ] حساب DigitalOcean جاهز
- [ ] نطاق (Domain) جاهز ومربوط بالـ DNS
- [ ] حساب GitHub جاهز
- [ ] معلومات البريد الإلكتروني للـ SSL

---

## ⚡ النشر في 10 دقائق

### الخطوة 1: إنشاء Droplet (دقيقتان)

```bash
# على DigitalOcean Dashboard:
1. Create → Droplets
2. اختر: Ubuntu 22.04 LTS
3. اختر الخطة: Basic - $12/mo (2 GB RAM)
4. اختر Datacenter region: الأقرب لك
5. إضافة SSH Key أو استخدام Password
6. اضغط Create Droplet
7. سجل الـ IP Address
```

### الخطوة 2: ربط النطاق (دقيقة واحدة)

```bash
# في إعدادات النطاق (Domain DNS):
Type: A Record
Name: @
Value: YOUR_DROPLET_IP
TTL: 3600

Type: A Record
Name: www
Value: YOUR_DROPLET_IP
TTL: 3600
```

### الخطوة 3: إعداد السيرفر (5 دقائق)

```bash
# الاتصال بالسيرفر
ssh root@YOUR_DROPLET_IP

# نسخ والصق هذا السكريبت كاملاً:
cat > setup.sh << 'EOF'
#!/bin/bash
set -e

echo "🔧 تثبيت المتطلبات..."
apt update
apt install -y docker.io docker-compose git ufw curl

echo "🔥 إعداد الجدار الناري..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "🐳 تفعيل Docker..."
systemctl start docker
systemctl enable docker

echo "👤 إنشاء مستخدم التطبيق..."
useradd -m -s /bin/bash -G docker rased
echo "rased ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/rased

echo "✅ الإعداد الأولي اكتمل!"
EOF

chmod +x setup.sh
./setup.sh
```

### الخطوة 4: رفع التطبيق (دقيقتان)

```bash
# التبديل لمستخدم rased
su - rased

# استنساخ المشروع
cd ~
git clone https://github.com/YOUR_USERNAME/rased-system.git app
cd app

# إعداد ملف البيئة
cp backend/.env.example backend/.env

# توليد SECRET_KEY
python3 << EOF
import secrets
print(f"SECRET_KEY={secrets.token_urlsafe(50)}")
EOF

# نسخ المفتاح وعدّل .env
nano backend/.env
```

**في ملف `.env`، عدّل:**

```bash
SECRET_KEY=YOUR_GENERATED_KEY_HERE
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://rased_user:CHANGE_THIS_PASSWORD@db:5432/rased_db
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database credentials
POSTGRES_DB=rased_db
POSTGRES_USER=rased_user
POSTGRES_PASSWORD=CHANGE_THIS_TO_STRONG_PASSWORD

# Security (سيتم تفعيلها بعد SSL)
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
SECURE_SSL_REDIRECT=False
```

احفظ بـ `Ctrl+X` ثم `Y` ثم `Enter`

### الخطوة 5: النشر وإعداد SSL (دقيقتان)

```bash
# إعطاء صلاحيات للسكريبتات
chmod +x deploy.sh setup-ssl.sh backup.sh

# النشر الأول
./deploy.sh prod

# انتظر حتى يكتمل... ثم:
# إعداد SSL (استبدل بمعلوماتك)
./setup-ssl.sh yourdomain.com your-email@example.com
```

---

## 🎯 إعداد GitHub Actions للنشر التلقائي

### 1. إنشاء SSH Key على جهازك المحلي

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy
cat ~/.ssh/github_deploy.pub
```

### 2. إضافة المفتاح للسيرفر

```bash
# على السيرفر (كمستخدم rased)
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# الصق المفتاح العام هنا
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 3. إضافة Secrets في GitHub

اذهب إلى: `Repository → Settings → Secrets and variables → Actions → New repository secret`

أضف:

| Secret Name | Value |
|-------------|-------|
| `SSH_PRIVATE_KEY` | محتوى `~/.ssh/github_deploy` (المفتاح الخاص الكامل) |
| `SERVER_IP` | عنوان IP للسيرفر |
| `SERVER_USER` | `rased` |
| `DOMAIN` | `yourdomain.com` |

### 4. اختبار

```bash
# على جهازك المحلي
git add .
git commit -m "Setup production deployment"
git push origin main

# راقب في: https://github.com/YOUR_USERNAME/rased-system/actions
```

---

## ✅ التحقق من التشغيل

### على السيرفر:

```bash
# فحص حالة الخدمات
docker-compose ps

# يجب أن ترى:
# ✅ rased_db       (healthy)
# ✅ rased_redis    (healthy)
# ✅ rased_backend  (Up)
# ✅ rased_frontend (Up)
# ✅ rased_nginx    (Up)

# فحص الـ logs
docker-compose logs --tail=50

# اختبار الاتصال
curl http://localhost
```

### من المتصفح:

```bash
https://yourdomain.com          # يجب أن يفتح الموقع
https://yourdomain.com/admin    # صفحة الإدارة
```

---

## 🔐 إنشاء أول مستخدم مدير

```bash
# على السيرفر
cd /home/rased/app
docker-compose exec backend python manage.py setup_system

# أو يدوياً:
docker-compose exec backend python manage.py createsuperuser
```

---

## 📊 المراقبة اليومية

### أوامر مفيدة:

```bash
# عرض استخدام الموارد
docker stats --no-stream

# عرض آخر 100 سطر من اللوجز
docker-compose logs --tail=100 -f

# إعادة تشغيل خدمة معينة
docker-compose restart backend

# تحديث التطبيق
cd /home/rased/app
git pull origin main
./deploy.sh prod

# نسخ احتياطي
./backup.sh
```

---

## 🐛 حل المشاكل الشائعة

### مشكلة: الموقع لا يفتح

```bash
# 1. تحقق من حالة الخدمات
docker-compose ps

# 2. فحص nginx
docker-compose logs nginx

# 3. فحص backend
docker-compose logs backend

# 4. إعادة التشغيل
docker-compose restart
```

### مشكلة: خطأ في قاعدة البيانات

```bash
# إعادة تشغيل قاعدة البيانات
docker-compose restart db

# تشغيل migrations
docker-compose exec backend python manage.py migrate
```

### مشكلة: SSL لا يعمل

```bash
# تحقق من ملفات SSL
ls -la certbot/conf/live/yourdomain.com/

# إعادة محاولة الحصول على شهادة
docker-compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  --email your-email@example.com \
  -d yourdomain.com -d www.yourdomain.com \
  --agree-tos --force-renewal
```

---

## 🔄 التحديثات المستقبلية

### طريقة 1: تلقائياً عبر GitHub

```bash
# على جهازك المحلي
git add .
git commit -m "Update feature"
git push origin main

# سيتم النشر تلقائياً خلال 2-3 دقائق
```

### طريقة 2: يدوياً على السيرفر

```bash
cd /home/rased/app
git pull origin main
./deploy.sh prod
```

---

## 📞 الدعم السريع

### مشكلة طارئة؟

```bash
# الاتصال بالسيرفر
ssh rased@YOUR_SERVER_IP

# عرض حالة النظام
cd app
docker-compose ps
docker-compose logs --tail=100

# إيقاف مؤقت
docker-compose down

# تشغيل
docker-compose up -d
```

### نسيت كلمة مرور المدير؟

```bash
docker-compose exec backend python manage.py changepassword admin
```

---

## 🎉 تم بنجاح!

الآن لديك:
- ✅ موقع يعمل على HTTPS
- ✅ قاعدة بيانات آمنة
- ✅ نسخ احتياطي تلقائي
- ✅ نشر تلقائي من GitHub
- ✅ مراقبة وسجلات

**الموقع**: https://yourdomain.com  
**لوحة الإدارة**: https://yourdomain.com/admin

---

**⚠️ ملاحظة مهمة**: 
- غيّر جميع كلمات المرور الافتراضية
- راجع `backend/.env` وتأكد من أنه آمن
- لا ترفع `.env` على GitHub أبداً
- راجع اللوجز يومياً
- نفذ `./backup.sh` قبل أي تحديث كبير