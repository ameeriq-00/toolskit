.PHONY: help build up down restart logs shell migrate backup deploy ssl clean

help: ## عرض جميع الأوامر المتاحة
	@echo "📋 الأوامر المتاحة:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## بناء الحاويات
	@echo "🔨 بناء الحاويات..."
	docker-compose build

up: ## تشغيل جميع الخدمات
	@echo "🚀 تشغيل الخدمات..."
	docker-compose up -d
	@echo "✅ الخدمات تعمل الآن"
	@make ps

down: ## إيقاف جميع الخدمات
	@echo "🛑 إيقاف الخدمات..."
	docker-compose down
	@echo "✅ تم إيقاف الخدمات"

restart: ## إعادة تشغيل الخدمات
	@echo "🔄 إعادة تشغيل..."
	docker-compose restart
	@echo "✅ تم إعادة التشغيل"

ps: ## عرض حالة الخدمات
	@echo "📊 حالة الخدمات:"
	@docker-compose ps

logs: ## عرض السجلات
	docker-compose logs -f --tail=100

logs-backend: ## عرض سجلات Backend فقط
	docker-compose logs -f --tail=100 backend

logs-db: ## عرض سجلات قاعدة البيانات
	docker-compose logs -f --tail=100 db

shell-backend: ## فتح shell في Backend
	docker-compose exec backend /bin/bash

shell-db: ## فتح shell في قاعدة البيانات
	docker-compose exec db psql -U rased_user -d rased_db

migrate: ## تشغيل Database Migrations
	@echo "🔄 تشغيل Migrations..."
	docker-compose exec backend python manage.py migrate
	@echo "✅ Migrations اكتملت"

makemigrations: ## إنشاء Migrations جديدة
	docker-compose exec backend python manage.py makemigrations

collectstatic: ## جمع الملفات الثابتة
	@echo "📁 جمع Static Files..."
	docker-compose exec backend python manage.py collectstatic --noinput
	@echo "✅ تم جمع الملفات"

createsuperuser: ## إنشاء مستخدم مدير
	docker-compose exec backend python manage.py createsuperuser

setup: ## إعداد النظام الأولي
	docker-compose exec backend python manage.py setup_system

backup: ## نسخ احتياطي
	@echo "💾 بدء النسخ الاحتياطي..."
	./backup.sh

deploy-dev: ## نشر في بيئة التطوير
	@echo "🚀 نشر Development..."
	./deploy.sh dev

deploy-prod: ## نشر في بيئة الإنتاج
	@echo "🚀 نشر Production..."
	./deploy.sh prod

ssl: ## إعداد SSL Certificate
	@read -p "أدخل النطاق (مثال: example.com): " domain; \
	read -p "أدخل البريد الإلكتروني: " email; \
	./setup-ssl.sh $$domain $$email

clean: ## تنظيف Docker
	@echo "🧹 تنظيف Docker..."
	docker system prune -f
	@echo "✅ تم التنظيف"

clean-all: ## تنظيف كامل (حذف Volumes أيضاً)
	@echo "⚠️  تحذير: سيتم حذف جميع البيانات!"
	@read -p "هل أنت متأكد؟ [y/N]: " confirm; \
	if [ "$$confirm" = "y" ]; then \
		docker-compose down -v; \
		docker system prune -a -f; \
		echo "✅ تم التنظيف الكامل"; \
	else \
		echo "❌ تم الإلغاء"; \
	fi

test-backend: ## تشغيل اختبارات Backend
	docker-compose exec backend python manage.py test

check: ## فحص إعدادات Django
	docker-compose exec backend python manage.py check

stats: ## عرض إحصائيات استخدام الموارد
	@echo "📊 استخدام الموارد:"
	@docker stats --no-stream

db-size: ## عرض حجم قاعدة البيانات
	@echo "💾 حجم قاعدة البيانات:"
	@docker-compose exec db psql -U rased_user -d rased_db -c \
		"SELECT pg_size_pretty(pg_database_size('rased_db'));"

db-backup: ## نسخ احتياطي لقاعدة البيانات فقط
	@echo "💾 نسخ احتياطي لقاعدة البيانات..."
	@mkdir -p backups
	@docker-compose exec -T db pg_dump -U rased_user rased_db | \
		gzip > backups/db_backup_$$(date +%Y%m%d_%H%M%S).sql.gz
	@echo "✅ تم حفظ النسخة الاحتياطية في: backups/"

db-restore: ## استعادة قاعدة البيانات من نسخة احتياطية
	@echo "⚠️  استعادة قاعدة البيانات"
	@read -p "أدخل اسم ملف النسخة الاحتياطية: " backup_file; \
	if [ -f "$$backup_file" ]; then \
		gunzip < $$backup_file | docker-compose exec -T db psql -U rased_user -d rased_db; \
		echo "✅ تمت الاستعادة بنجاح"; \
	else \
		echo "❌ الملف غير موجود"; \
	fi

health: ## فحص صحة النظام
	@echo "🏥 فحص صحة النظام..."
	@echo "\n📊 حالة الخدمات:"
	@docker-compose ps
	@echo "\n💾 حجم قاعدة البيانات:"
	@docker-compose exec db psql -U rased_user -d rased_db -c \
		"SELECT pg_size_pretty(pg_database_size('rased_db'));" || echo "قاعدة البيانات غير متاحة"
	@echo "\n🔥 استخدام الموارد:"
	@docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -n 6
	@echo "\n✅ الفحص اكتمل"

update: ## تحديث التطبيق من GitHub
	@echo "📥 جلب آخر التحديثات..."
	git pull origin main
	@echo "🔨 إعادة البناء والنشر..."
	@make deploy-prod
	@echo "✅ التحديث اكتمل"

init: ## إعداد أولي للمشروع (أول مرة)
	@echo "🎯 الإعداد الأولي للمشروع..."
	@if [ ! -f "backend/.env" ]; then \
		cp backend/.env.example backend/.env; \
		echo "📝 تم إنشاء backend/.env - يرجى تعديله"; \
		echo "⚠️  لا تنسى تغيير SECRET_KEY و POSTGRES_PASSWORD"; \
	fi
	@if [ ! -f "frontend/.env" ]; then \
		cp frontend/.env.example frontend/.env; \
		echo "📝 تم إنشاء frontend/.env"; \
	fi
	@echo "🔨 بناء الحاويات..."
	@make build
	@echo "🚀 تشغيل الخدمات..."
	@make up
	@sleep 10
	@echo "🔄 تشغيل Migrations..."
	@make migrate
	@echo "👤 إنشاء مستخدم مدير..."
	@make setup
	@echo "✅ الإعداد الأولي اكتمل!"
	@echo "\n🌐 الموقع متاح على: http://localhost"
	@echo "🔐 لوحة الإدارة: http://localhost/admin"

dev: ## تشغيل بيئة التطوير
	@echo "💻 بيئة التطوير..."
	docker-compose up

prod: ## تشغيل بيئة الإنتاج
	@echo "🚀 بيئة الإنتاج..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

install-deps: ## تثبيت dependencies جديدة
	@echo "📦 تثبيت Backend dependencies..."
	docker-compose exec backend pip install -r requirements.txt
	@echo "📦 تثبيت Frontend dependencies..."
	docker-compose exec frontend npm install

generate-secret: ## توليد SECRET_KEY جديد
	@echo "🔑 SECRET_KEY الجديد:"
	@python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"