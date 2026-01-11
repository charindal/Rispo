#!/bin/bash
set -e

# ========================
# Database Backup Script
# ========================

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/rispo_backup_$DATE.sql.gz"

echo "🔄 Starting database backup..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup with compression
pg_dump "$PGDATABASE" | gzip > "$BACKUP_FILE"

echo "✅ Backup created: $BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "rispo_backup_*.sql.gz" -type f -mtime +7 -delete

echo "🧹 Old backups cleaned up (keeping last 7 days)"

# Display backup info
ls -lh "$BACKUP_FILE"
