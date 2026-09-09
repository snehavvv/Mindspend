# Finlytics AWS Serverless Deployment Pipeline for PowerShell
$ErrorActionPreference = "Stop"

Write-Host "=== [Finlytics AWS Serverless Deployment Pipeline] ===" -ForegroundColor Cyan

$awsRegion = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }
$environment = if ($env:ENVIRONMENT) { $env:ENVIRONMENT } else { "production" }
$appName = "finlytics"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rootDir = Join-Path $scriptDir ".."
$buildDir = Join-Path $rootDir "build"

if (-not (Test-Path $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir | Out-Null
}

Write-Host "Step 1: Building Frontend Assets with Vite..." -ForegroundColor Yellow
Push-Location (Join-Path $rootDir "finance-app\frontend")
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
} finally {
    Pop-Location
}

Write-Host "Step 2: Packaging Backend for AWS Lambda (Mangum ASGI)..." -ForegroundColor Yellow
$backendZip = Join-Path $buildDir "backend.zip"
if (Test-Path $backendZip) { Remove-Item $backendZip -Force }

$backendDir = Join-Path $rootDir "finance-app\backend"
Compress-Archive -Path "$backendDir\app", "$backendDir\main.py", "$backendDir\requirements.txt" -DestinationPath $backendZip

Write-Host "Step 3: Provisioning Infrastructure with Terraform..." -ForegroundColor Yellow
Push-Location (Join-Path $rootDir "infra")
try {
    terraform init
    terraform apply -auto-approve `
        -var="aws_region=$awsRegion" `
        -var="environment=$environment" `
        -var="app_name=$appName"
    if ($LASTEXITCODE -ne 0) { throw "Terraform apply failed" }
} finally {
    Pop-Location
}

Write-Host "Step 4: Syncing Frontend to S3 Bucket..." -ForegroundColor Yellow
$frontendBucket = "$appName-$environment-frontend"
$distDir = Join-Path $rootDir "finance-app\frontend\dist"
aws s3 sync $distDir "s3://$frontendBucket" --delete

Write-Host "=== Deployment Succeeded! ===" -ForegroundColor Green
