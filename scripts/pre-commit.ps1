# Finlytics Pre-Commit Quality Checks for PowerShell
$ErrorActionPreference = "Stop"

Write-Host "=== [Finlytics Pre-Commit Quality Checks] ===" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$frontendDir = Join-Path $scriptDir "..\finance-app\frontend"
$backendDir = Join-Path $scriptDir "..\finance-app\backend"

Write-Host "1. Validating Frontend Build & Types..." -ForegroundColor Yellow
Push-Location $frontendDir
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
} finally {
    Pop-Location
}

Write-Host "2. Running Backend Pytest Suite..." -ForegroundColor Yellow
Push-Location $backendDir
try {
    $pythonExe = Join-Path $backendDir ".venv\Scripts\python.exe"
    if (-not (Test-Path $pythonExe)) {
        $pythonExe = "python"
    }
    & $pythonExe -m pytest tests/ -q
    if ($LASTEXITCODE -ne 0) { throw "Backend pytest suite failed" }
} finally {
    Pop-Location
}

Write-Host "=== All pre-commit checks passed successfully! ===" -ForegroundColor Green
