# ⚡ البدء السريع - 3 دقائق

## للتطوير المحلي (Local Development)

```bash
# 1. استنساخ المشروع
git clone https://github.com/yourusername/rased-system.git
cd rased-system

# 2. نسخ ملفات البيئة
cp .env.example .env
cp backend/.env.example backend/.env

# 3. توليد SECRET_KEY
make generate-secret
# انسخ النتيجة وضعها في backend/.env

# 4. تشغيل التطبيق
make build
make up

# 5. تشغيل Migrations وإنشاء مدير
make migrate
make setup

# 6. افتح المتصفح
# Frontend: http://localhost
# Admin: http://localhost/admin
```

## للإنتاج على DigitalOcean

```bash
# 1. على DigitalOcean: أنشئ Droplet (Ubuntu 22.04)

# 2. اتصل بالسيرفر
ssh root@YOUR_SERVER_IP

# 3. نفذ سكريبت الإعداد
curl -sSL https://raw.githubusercontent.com/yourusername/rased-system/main/scripts/quick-setup.sh | bash

# 4. اتبع التعليمات على الشاشة

# انتهى! 🎉
```

## أوامر مفيدة

```bash
make help          # عرض جميع الأوامر
make logs          # عرض السجلات
make restart       # إعادة تشغيل
make backup        # نسخ احتياطي
make health        # فحص صحة النظام
```

## المساعدة

- 📖 دليل كامل: `README.md`
- 🚀 دليل النشر: `DEPLOYMENT.md`
- 🐛 حل المشاكل: انظر `README.md` → Troubleshooting