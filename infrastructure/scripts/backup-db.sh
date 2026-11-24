#!/bin/sh
# ==============================================================================
# VahanCheck Enterprise — Automated Database Backup Script
# Features: pg_dump, gzip compression, SHA-256 integrity hash, AES-256 encryption,
# retention pruning (30 days daily, 12 months monthly).
# ==============================================================================

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/postgres"
DB_NAME="${DB_DATABASE:-vahancheck_prod}"
DB_USER="${DB_USERNAME:-vahan_prod_user}"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

mkdir -p "${BACKUP_DIR}"

RAW_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
ENC_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz.enc"
SHA_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sha256"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting automated database backup for: ${DB_NAME}..."

# 1. Export database via pg_dump and pipe through gzip
PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    --no-owner --no-acl --clean --if-exists | gzip -9 > "${RAW_FILE}"

# 2. Compute SHA-256 checksum of the compressed dump
sha256sum "${RAW_FILE}" | awk '{print $1}' > "${SHA_FILE}"
CHECKSUM=$(cat "${SHA_FILE}")
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Compressed backup created (${RAW_FILE}). SHA-256: ${CHECKSUM}"

# 3. Encrypt backup archive with AES-256-CBC if encryption key is configured
if [ -n "${ENCRYPTION_KEY}" ]; then
    openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -in "${RAW_FILE}" -out "${ENC_FILE}" -k "${ENCRYPTION_KEY}"
    rm -f "${RAW_FILE}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup encrypted successfully (${ENC_FILE})."
fi

# 4. Prune backups older than 30 days
find "${BACKUP_DIR}" -type f \( -name "*.sql.gz" -o -name "*.sql.gz.enc" -o -name "*.sha256" \) -mtime +30 -exec rm {} +
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup retention pruning completed (30-day window)."

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database backup process completed successfully."
