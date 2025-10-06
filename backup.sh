#!/bin/bash

# Backup Script for Rased System
# Usage: ./backup.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP"

echo "💾 Starting backup at $TIMESTAMP"

# Create backup directory
mkdir -p $BACKUP_DIR

# Load environment
export $(cat backend/.env | grep -v '^#' | xargs)

# Backup database
echo "📊 Backing up database..."
docker-compose exec -T db pg_dump -U ${POSTGRES_USER:-rased_user} ${POSTGRES_DB:-rased_db} | gzip > "${BACKUP_FILE}_db.sql.gz"

# Backup media files
echo "📁 Backing up media files..."
docker-compose exec -T backend tar czf - /app/media | cat > "${BACKUP_FILE}_media.tar.gz"

# Backup logs
echo "📝 Backing up logs..."
docker-compose exec -T backend tar czf - /app/logs | cat > "${BACKUP_FILE}_logs.tar.gz"

# Create backup info file
cat > "${BACKUP_FILE}_info.txt" << EOF
Backup Information
==================
Date: $(date)
Database: ${POSTGRES_DB:-rased_db}
User: ${POSTGRES_USER:-rased_user}

Files:
- ${BACKUP_FILE}_db.sql.gz
- ${BACKUP_FILE}_media.tar.gz
- ${BACKUP_FILE}_logs.tar.gz
EOF

echo "✅ Backup completed successfully!"
echo "📦 Backup files:"
ls -lh ${BACKUP_FILE}*

# Remove backups older than 30 days
echo "🗑️ Cleaning old backups (>30 days)..."
find $BACKUP_DIR -name "backup_*" -mtime +30 -delete

echo "✨ Done!"