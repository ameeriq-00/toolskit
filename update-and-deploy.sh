#!/bin/bash

# Script لتحديث الكود من GitHub وإعادة النشر بأمان
# Usage: ./update-and-deploy.sh

set -e  # Stop on any error

echo "🔄 Starting safe update and deployment..."
echo ""

# ألوان للـ output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Backup current state
echo -e "${YELLOW}📦 Step 1/6: Creating backup...${NC}"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r nginx/conf.d $BACKUP_DIR/ 2>/dev/null || true
echo -e "${GREEN}✓ Backup created at: $BACKUP_DIR${NC}"
echo ""

# 2. Check for local changes
echo -e "${YELLOW}📊 Step 2/6: Checking for local changes...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}⚠️  Warning: You have uncommitted local changes:${NC}"
    git status -s
    echo ""
    read -p "Do you want to stash these changes? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git stash save "Auto-stash before update $(date +%Y%m%d_%H%M%S)"
        echo -e "${GREEN}✓ Changes stashed${NC}"
    else
        echo -e "${RED}✗ Aborted. Please commit or stash your changes first.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ No local changes detected${NC}"
fi
echo ""

# 3. Pull latest changes
echo -e "${YELLOW}🔽 Step 3/6: Pulling latest changes from GitHub...${NC}"
git fetch origin main
BEFORE_COMMIT=$(git rev-parse HEAD)
git pull origin main
AFTER_COMMIT=$(git rev-parse HEAD)

if [ "$BEFORE_COMMIT" = "$AFTER_COMMIT" ]; then
    echo -e "${GREEN}✓ Already up to date!${NC}"
else
    echo -e "${GREEN}✓ Updated from $BEFORE_COMMIT to $AFTER_COMMIT${NC}"
    echo ""
    echo "📝 Changes pulled:"
    git log --oneline $BEFORE_COMMIT..$AFTER_COMMIT
fi
echo ""

# 4. Stop services gracefully
echo -e "${YELLOW}🛑 Step 4/6: Stopping services gracefully...${NC}"
docker-compose down --remove-orphans
echo -e "${GREEN}✓ All services stopped${NC}"
echo ""

# 5. Rebuild only if needed (nginx config changed)
echo -e "${YELLOW}🔨 Step 5/6: Checking if rebuild is needed...${NC}"
REBUILD_NEEDED=false

# Check if nginx config changed
if git diff $BEFORE_COMMIT $AFTER_COMMIT --name-only | grep -q "nginx/"; then
    echo "  → Nginx config changed"
    REBUILD_NEEDED=true
fi

# Check if frontend files changed
if git diff $BEFORE_COMMIT $AFTER_COMMIT --name-only | grep -q "frontend/"; then
    echo "  → Frontend files changed"
    REBUILD_NEEDED=true
fi

# Check if backend files changed
if git diff $BEFORE_COMMIT $AFTER_COMMIT --name-only | grep -q "backend/"; then
    echo "  → Backend files changed"
    REBUILD_NEEDED=true
fi

if [ "$REBUILD_NEEDED" = true ]; then
    echo -e "${YELLOW}🔨 Rebuilding necessary images...${NC}"
    docker-compose build --no-cache
    echo -e "${GREEN}✓ Images rebuilt${NC}"
else
    echo -e "${GREEN}✓ No rebuild needed, using existing images${NC}"
fi
echo ""

# 6. Start services
echo -e "${YELLOW}🚀 Step 6/6: Starting services...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo ""
echo -e "${GREEN}📊 Service Status:${NC}"
docker-compose ps
echo ""

# 7. Run migrations (if backend changed)
if git diff $BEFORE_COMMIT $AFTER_COMMIT --name-only | grep -q "backend/"; then
    echo -e "${YELLOW}🔄 Running database migrations...${NC}"
    docker-compose exec -T backend python manage.py migrate --noinput
    echo -e "${GREEN}✓ Migrations completed${NC}"
fi
echo ""

# 8. Collect static files (if backend changed)
if git diff $BEFORE_COMMIT $AFTER_COMMIT --name-only | grep -q "backend/"; then
    echo -e "${YELLOW}📁 Collecting static files...${NC}"
    docker-compose exec -T backend python manage.py collectstatic --noinput
    echo -e "${GREEN}✓ Static files collected${NC}"
fi
echo ""

# 9. Test endpoints
echo -e "${YELLOW}🧪 Testing endpoints...${NC}"
sleep 5

# Test frontend
if curl -sf http://localhost/ > /dev/null; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${RED}✗ Frontend is NOT accessible${NC}"
fi

# Test backend API
if curl -sf http://localhost/api/ > /dev/null; then
    echo -e "${GREEN}✓ Backend API is accessible${NC}"
else
    echo -e "${RED}✗ Backend API is NOT accessible${NC}"
fi

# Test specific static file
if curl -sf http://localhost/static/js/main.0407d6d6.js > /dev/null; then
    echo -e "${GREEN}✓ Static files are accessible${NC}"
else
    echo -e "${YELLOW}⚠ Static file test failed (might be different filename)${NC}"
fi
echo ""

# 10. Show logs
echo -e "${YELLOW}📋 Recent logs:${NC}"
echo "--- Nginx ---"
docker-compose logs --tail=5 nginx
echo ""
echo "--- Frontend ---"
docker-compose logs --tail=5 frontend
echo ""
echo "--- Backend ---"
docker-compose logs --tail=5 backend
echo ""

# Final summary
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "🌐 Your application should be available at:"
echo "   Frontend: http://deaiq.live"
echo "   Backend API: http://deaiq.live/api"
echo "   Admin: http://deaiq.live/admin"
echo ""
echo "📝 Useful commands:"
echo "   View all logs: docker-compose logs -f"
echo "   View specific service: docker-compose logs -f [service_name]"
echo "   Restart service: docker-compose restart [service_name]"
echo "   Check status: docker-compose ps"
echo ""
echo "💾 Backup location: $BACKUP_DIR"