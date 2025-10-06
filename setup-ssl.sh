#!/bin/bash

# SSL Setup Script using Let's Encrypt
# Usage: ./setup-ssl.sh yourdomain.com email@example.com

set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: ./setup-ssl.sh yourdomain.com email@example.com"
    exit 1
fi

echo "🔒 Setting up SSL for domain: $DOMAIN"

# Create directories
mkdir -p certbot/conf certbot/www

# Stop nginx temporarily
docker-compose up -d nginx
sleep 10

# Run certbot
echo "📝 Requesting SSL certificate..."
docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN -d www.$DOMAIN" certbot

# Update nginx configuration
echo "⚙️ Updating nginx configuration..."
# Uncomment HTTPS server block in nginx/conf.d/default.conf
sed -i 's/# server {/server {/g' nginx/conf.d/default.conf
sed -i 's/#     /    /g' nginx/conf.d/default.conf
sed -i "s/yourdomain.com/$DOMAIN/g" nginx/conf.d/default.conf

# Enable HTTP to HTTPS redirect
sed -i 's|    # return 301|    return 301|g' nginx/conf.d/default.conf

# Update backend .env for SSL
sed -i 's/SECURE_SSL_REDIRECT=False/SECURE_SSL_REDIRECT=True/g' backend/.env
sed -i 's/SESSION_COOKIE_SECURE=False/SESSION_COOKIE_SECURE=True/g' backend/.env
sed -i 's/CSRF_COOKIE_SECURE=False/CSRF_COOKIE_SECURE=True/g' backend/.env

# Restart services
echo "🔄 Restarting services..."
docker-compose up -d nginx

echo "✅ SSL setup completed!"
echo ""
echo "🌐 Your site should now be available at:"
echo "  https://$DOMAIN"
echo "  https://www.$DOMAIN"
echo ""
echo "🔄 SSL certificates will auto-renew via certbot container"