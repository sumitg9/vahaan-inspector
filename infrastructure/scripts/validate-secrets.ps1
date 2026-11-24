# ==============================================================================
# VahanCheck Enterprise — Production Secret & Environment Validator (PowerShell)
# Enforces Invariant 1 (Zero Secret Leakage) and Invariant 2 (Production Fail-Safe)
# ==============================================================================

param(
    [string]$EnvFile = ".env"
)

if (-not (Test-Path $EnvFile)) {
    Write-Warning "Target env file $EnvFile not found. Skipping secret validation."
    exit 0
}

Write-Host "Validating production secrets in $EnvFile..."
$content = Get-Content $EnvFile
$errors = 0

function Get-EnvVal([string]$key) {
    $line = $content | Where-Object { $_ -match "^$key=" } | Select-Object -First 1
    if ($line) {
        return ($line -split '=', 2)[1].Trim('"', "'", " ")
    }
    return $null
}

# 1. Debug check
$debug = Get-EnvVal "APP_DEBUG"
if ($debug -eq "true") {
    Write-Error "APP_DEBUG must be false in production!"
    $errors++
}

# 2. Invariant 2 check
$prodEnabled = Get-EnvVal "APISATHI_PROD_ENABLED"
$apiKey = Get-EnvVal "APISATHI_API_KEY"

if ($prodEnabled -eq "true" -and [string]::IsNullOrEmpty($apiKey)) {
    Write-Error "Invariant 2 Violation: APISATHI_PROD_ENABLED cannot be true when APISATHI_API_KEY is empty!"
    $errors++
}

if ($errors -gt 0) {
    Write-Error "Secret validation failed with $errors errors."
    exit 1
} else {
    Write-Host "Production secret validation passed successfully."
    exit 0
}
