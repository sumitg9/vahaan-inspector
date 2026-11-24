#!/bin/sh
# ==============================================================================
# VahanCheck Enterprise — Production Secret & Environment Validator
# Enforces Invariant 1 (Zero Secret Leakage) and Invariant 2 (Production Fail-Safe)
# ==============================================================================

set -e

ENV_FILE="${1:-.env}"

if [ ! -f "${ENV_FILE}" ]; then
    echo "ERROR: Environment file ${ENV_FILE} not found."
    exit 1
fi

echo "Validating production environment configuration in: ${ENV_FILE}"
ERRORS=0

check_val() {
    KEY="$1"
    VAL=$(grep -E "^${KEY}=" "${ENV_FILE}" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [ -z "${VAL}" ]; then
        echo "  [FAIL] ${KEY} is empty!"
        ERRORS=$((ERRORS + 1))
    fi
}

check_not_equal() {
    KEY="$1"
    FORBIDDEN="$2"
    VAL=$(grep -E "^${KEY}=" "${ENV_FILE}" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [ "${VAL}" = "${FORBIDDEN}" ]; then
        echo "  [FAIL] ${KEY} cannot use default or insecure value: ${FORBIDDEN}"
        ERRORS=$((ERRORS + 1))
    fi
}

# 1. Environment and Debug Checks
check_not_equal "APP_DEBUG" "true"

# 2. Database & Redis Credentials
check_val "DB_PASSWORD"
check_not_equal "DB_PASSWORD" "vahan_secure_pass_2026"
check_not_equal "DB_PASSWORD" "password"

# 3. Invariant 2 Provider Check
PROD_ENABLED=$(grep -E "^APISATHI_PROD_ENABLED=" "${ENV_FILE}" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
API_KEY=$(grep -E "^APISATHI_API_KEY=" "${ENV_FILE}" | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ "${PROD_ENABLED}" = "true" ] && [ -z "${API_KEY}" ]; then
    echo "  [FAIL] Invariant 2 Violation: APISATHI_PROD_ENABLED is true but APISATHI_API_KEY is empty!"
    ERRORS=$((ERRORS + 1))
fi

if [ ${ERRORS} -gt 0 ]; then
    echo "Production environment validation FAILED with ${ERRORS} errors."
    exit 1
else
    echo "All production environment secret validations PASSED."
    exit 0
fi
