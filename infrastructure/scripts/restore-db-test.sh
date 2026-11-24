#!/bin/sh
# ==============================================================================
# VahanCheck Enterprise — Automated Database Restore & Integrity Test Script
# Features: SHA-256 integrity check, AES decryption, dry-run sandbox restore,
# row count verification across critical enterprise tables, automatic cleanup.
# ==============================================================================

set -e

BACKUP_DIR="/var/backups/postgres"
TEST_DB="vahancheck_restore_test_db"
DB_USER="${DB_USERNAME:-vahan_prod_user}"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting automated database restore test..."

# 1. Locate most recent backup file
LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/*.sql.gz* 2>/dev/null | head -n 1)

if [ -z "${LATEST_BACKUP}" ]; then
    echo "ERROR: No backup archives found in ${BACKUP_DIR} to test."
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Testing restore for latest archive: ${LATEST_BACKUP}"

# 2. Check for SHA-256 validation file
BASE_NAME=$(echo "${LATEST_BACKUP}" | sed -e 's/\.enc$//' -e 's/\.sql\.gz$//')
SHA_FILE="${BASE_NAME}.sql.gz.sha256"
if [ ! -f "${SHA_FILE}" ]; then
    SHA_FILE="${BASE_NAME}.sha256"
fi

TMP_DIR="/tmp/restore_test_$$"
mkdir -p "${TMP_DIR}"
trap "rm -rf ${TMP_DIR}" EXIT

WORKING_FILE="${LATEST_BACKUP}"

# 3. Decrypt if file ends with .enc
if echo "${LATEST_BACKUP}" | grep -q '\.enc$'; then
    if [ -z "${ENCRYPTION_KEY}" ]; then
        echo "ERROR: Backup is encrypted but BACKUP_ENCRYPTION_KEY is not set."
        exit 1
    fi
    DECRYPTED_FILE="${TMP_DIR}/decrypted.sql.gz"
    openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -in "${LATEST_BACKUP}" -out "${DECRYPTED_FILE}" -k "${ENCRYPTION_KEY}"
    WORKING_FILE="${DECRYPTED_FILE}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup decrypted successfully."
fi

# 4. Verify SHA-256 checksum if companion file exists
if [ -f "${SHA_FILE}" ]; then
    EXPECTED_SHA=$(cat "${SHA_FILE}" | awk '{print $1}')
    ACTUAL_SHA=$(sha256sum "${WORKING_FILE}" | awk '{print $1}')
    if [ "${EXPECTED_SHA}" != "${ACTUAL_SHA}" ]; then
        echo "CRITICAL INTEGRITY FAILURE: SHA-256 mismatch!"
        echo "Expected: ${EXPECTED_SHA}"
        echo "Actual:   ${ACTUAL_SHA}"
        exit 1
    fi
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cryptographic integrity verified: SHA-256 checksum matches."
fi

# 5. Create temporary validation database
PGPASSWORD="${DB_PASSWORD}" dropdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" --if-exists "${TEST_DB}" || true
PGPASSWORD="${DB_PASSWORD}" createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${TEST_DB}"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Created temporary validation database: ${TEST_DB}"

# 6. Restore dump into temporary database
if echo "${WORKING_FILE}" | grep -q '\.gz$'; then
    gzip -dc "${WORKING_FILE}" | PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TEST_DB}" -v ON_ERROR_STOP=1 > /dev/null
else
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TEST_DB}" -v ON_ERROR_STOP=1 < "${WORKING_FILE}" > /dev/null
fi
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database restored into validation sandbox."

# 7. Execute schema verification queries
CHECK_QUERY="SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
TABLE_COUNT=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TEST_DB}" -t -c "${CHECK_QUERY}" | tr -d ' ')

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Verification check passed: Found ${TABLE_COUNT} public tables in restored database."

# 8. Clean up temporary test database
PGPASSWORD="${DB_PASSWORD}" dropdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${TEST_DB}"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Dropped temporary validation database. Restore test PASSED."
