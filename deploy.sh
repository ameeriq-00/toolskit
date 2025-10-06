#!/bin/bash

# Rased System Deployment Script
# Usage: ./deploy.sh [environment]
# environment: dev, staging, prod (default: prod)

set -e  # Exit on error

ENV=${1:-prod}
COMPOSE_FILE="docker-compose.yml"

echo "🚀 Starting deployment for environment: $ENV"

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env file not found!"
    echo "📝 Please copy backend/.env.example to backend/.env and configure it"
    exit 1
fi

# Load environment variables
export $(cat backend/.env | grep -v '^#' | xargs)

echo "📦 Pulling latest changes from git..."
git pull origin main

echo "🔨 Building Docker images..."
if [ "$ENV" = "prod" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
else
    docker-compose build
fi

echo "🛑 Stopping existing containers..."
docker-compose down

echo "🗄️ Starting database..."
docker-compose up -d db redis

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔄 Running database migrations..."
docker-compose run --rm backend python manage.py migrate --noinput

echo "📊 Creating initial data (if needed)..."
docker-compose run --rm backend python manage.py setup_system --skip-admin || true

echo "📁 Collecting static files..."
docker-compose run --rm backend python manage.py collectstatic --noinput

echo "🚀 Starting all services..."
if [ "$ENV" = "prod" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
else
    docker-compose up -d
fi

echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "📝 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  View backend logs: docker-compose logs -f backend"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo ""
echo "🌐 Application should be available at:"
echo "  HTTP: http://localhost"
echo "  Admin: http://localhost/admin"