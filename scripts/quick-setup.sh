#!/bin/bash

# Quick Setup Script for DigitalOcean Droplet
# Usage: curl -sSL https://raw.githubusercontent.com/yourusername/rased-system/main/scripts/quick-setup.sh | bash

set -e

echo "🚀 مرحباً بك في إعداد نظام راصد السريع"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ يجب تشغيل هذا السكريبت كـ root${NC}"
    echo "استخدم: sudo bash أو سجل دخول كـ root"
    exit 1
fi

echo -e "${GREEN}✅ فحص الصلاحيات - OK${NC}"

# Update system
echo ""
echo "📦 تحديث النظام..."
apt update -qq
apt upgrade -y -qq

# Install required packages
echo ""
echo "🔧 تثبيت المتطلبات..."
apt install -y -qq \
    docker.io \
    docker-compose \
    git \
    ufw \
    curl \
    wget \
    nano \
    htop \
    python3 \
    python3-pip

# Start and enable Docker
echo ""
echo "🐳 إعداد Docker..."
systemctl start docker
systemctl enable docker

# Setup firewall
echo ""
echo "🔥 إعداد الجدار الناري..."
ufw --force enable
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
echo -e "${GREEN}✅ تم تفعيل الجدار الناري${NC}"

# Create app user
echo ""
echo "👤 إنشاء مستخدم التطبيق..."
if id "rased" &>/dev/null; then
    echo -e "${YELLOW}⚠️  المستخدم rased موجود مسبقاً${NC}"
else
    useradd -m -s /bin/bash -G docker rased
    echo "rased ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/rased
    chmod 440 /etc/sudoers.d/rased
    echo -e "${GREEN}✅ تم إنشاء المستخدم rased${NC}"
fi

# Prompt for GitHub repository
echo ""
echo "================================================"
read -p "📥 أدخل رابط GitHub repository (مثال: https://github.com/username/repo.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ لم يتم إدخال رابط${NC}"
    exit 1
fi

# Clone repository as rased user
echo ""
echo "📥 استنساخ المشروع..."
su - rased -c "
    cd ~
    if [ -d 'app' ]; then
        echo '⚠️  المجلد app موجود، سيتم حذفه...'
        rm -rf app
    fi
    git clone $REPO_URL app
    cd app
    chmod +x deploy.sh setup-ssl.sh backup.sh 2>/dev/null || true
"

# Setup environment
echo ""
echo "⚙️  إعداد ملف البيئة..."
su - rased -c "
    cd ~/app
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        
        # Generate SECRET_KEY
        SECRET_KEY=\$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')
        sed -i \"s|SECRET_KEY=.*|SECRET_KEY=\$SECRET_KEY|\" backend/.env
        
        # Generate strong password
        DB_PASS=\$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
        sed -i \"s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=\$DB_PASS|\" backend/.env
        
        echo '✅ تم إنشاء backend/.env'
    fi
    
    if [ ! -f .env ]; then
        cp .env.example .env
        echo '✅ تم إنشاء .env'
    fi
"

# Ask for domain
echo ""
echo "================================================"
read -p "🌐 أدخل النطاق الخاص بك (مثال: example.com) أو اضغط Enter للتخطي: " DOMAIN

if [ ! -z "$DOMAIN" ]; then
    echo "📝 تحديث إعدادات النطاق..."
    su - rased -c "
        cd ~/app
        sed -i \"s|ALLOWED_HOSTS=.*|ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN|\" backend/.env
        sed -i \"s|CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN|\" backend/.env
        sed -i \"s|DOMAIN=.*|DOMAIN=$DOMAIN|\" .env
    "
    echo -e "${GREEN}✅ تم تحديث النطاق: $DOMAIN${NC}"
else
    echo -e "${YELLOW}⚠️  تم تخطي إعداد النطاق (يمكن إعداده لاحقاً)${NC}"
fi

# Deploy application
echo ""
echo "================================================"
echo "🚀 نشر التطبيق..."
su - rased -c "
    cd ~/app
    ./deploy.sh prod
"

# Setup SSL if domain provided
if [ ! -z "$DOMAIN" ]; then
    echo ""
    echo "================================================"
    read -p "🔒 هل تريد إعداد SSL الآن؟ (y/n): " SETUP_SSL
    
    if [ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ]; then
        read -p "📧 أدخل بريدك الإلكتروني للحصول على شهادة SSL: " EMAIL
        
        if [ ! -z "$EMAIL" ]; then
            echo "🔒 إعداد SSL..."
            su - rased -c "
                cd ~/app
                ./setup-ssl.sh $DOMAIN $EMAIL
            "
        fi
    fi
fi

# Setup backup cron
echo ""
echo "📅 إعداد النسخ الاحتياطي التلقائي..."
su - rased -c "
    (crontab -l 2>/dev/null | grep -v 'backup.sh'; echo '0 3 * * * cd /home/rased/app && ./backup.sh >> /home/rased/backup.log 2>&1') | crontab -
"
echo -e "${GREEN}✅ تم إعداد نسخ احتياطي يومي (3 صباحاً)${NC}"

# Display information
echo ""
echo "================================================"
echo -e "${GREEN}✅ اكتمل الإعداد بنجاح!${NC}"
echo "================================================"
echo ""
echo "📊 معلومات النظام:"
echo "-------------------"
echo "• المستخدم: rased"
echo "• مسار التطبيق: /home/rased/app"
if [ ! -z "$DOMAIN" ]; then
    echo "• النطاق: https://$DOMAIN"
else
    echo "• الوصول: http://$(curl -s ifconfig.me)"
fi
echo ""
echo "🔐 بيانات تسجيل الدخول:"
echo "----------------------"
echo "للحصول على بيانات المدير، نفذ:"
echo "  su - rased"
echo "  cd app"
echo "  docker-compose exec backend python manage.py setup_system"
echo ""
echo "📝 أوامر مفيدة:"
echo "---------------"
echo "  su - rased                    # التبديل لمستخدم rased"
echo "  cd app                        # الذهاب لمجلد التطبيق"
echo "  make help                     # عرض جميع الأوامر"
echo "  make logs                     # عرض السجلات"
echo "  make health                   # فحص صحة النظام"
echo "  make backup                   # نسخ احتياطي"
echo ""
echo "🔄 للتحديث:"
echo "-----------"
echo "  cd /home/rased/app"
echo "  git pull origin main"
echo "  ./deploy.sh prod"
echo ""
echo "📖 للمزيد من المعلومات:"
echo "  https://github.com/yourusername/rased-system"
echo ""
echo -e "${GREEN}🎉 نظام راصد جاهز للاستخدام!${NC}"
echo "================================================"