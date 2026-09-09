# Deploy FastAPI Backend to AWS Lambda with Public Function URL
param(
    [string]$Region = "us-west-2",
    [string]$FunctionName = "finlytics-api"
)

Write-Host "=== [Finlytics Backend AWS Lambda Deployment] ===" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rootDir = Join-Path $scriptDir ".."
$backendDir = Join-Path $rootDir "finance-app\backend"
$buildDir = Join-Path $rootDir "build"
$zipFile = Join-Path $buildDir "backend-lambda.zip"

Write-Host "1. Deploying to AWS Lambda in region $Region..." -ForegroundColor Yellow
$roleArn = "arn:aws:iam::462517140248:role/RoleForLambdaModLabRole"

$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"

# Check if function exists
$checkOutput = & aws lambda get-function --function-name $FunctionName --region $Region 2>&1

$ErrorActionPreference = $prevErrorAction

if ($checkOutput -match "ResourceNotFoundException" -or $checkOutput -match "Function not found") {
    Write-Host "Creating new lambda function: $FunctionName..." -ForegroundColor Yellow
    & aws lambda create-function `
        --function-name $FunctionName `
        --runtime python3.11 `
        --role $roleArn `
        --handler lambda_handler.handler `
        --timeout 30 `
        --memory-size 512 `
        --zip-file "fileb://$zipFile" `
        --region $Region
} else {
    Write-Host "Updating existing lambda function code..." -ForegroundColor Yellow
    & aws lambda update-function-code --function-name $FunctionName --zip-file "fileb://$zipFile" --region $Region
}

# Wait for function to be active
Start-Sleep -Seconds 5

# Configure Function URL
Write-Host "2. Creating / Configuring Lambda Function URL with CORS..." -ForegroundColor Yellow
$corsConfig = '{"AllowOrigins":["*"],"AllowMethods":["*"],"AllowHeaders":["*"],"AllowCredentials":true}'

$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"

& aws lambda create-function-url-config `
    --function-name $FunctionName `
    --auth-type NONE `
    --cors $corsConfig `
    --region $Region 2>&1

& aws lambda add-permission `
    --function-name $FunctionName `
    --statement-id FunctionURLAllowPublicAccess `
    --action lambda:InvokeFunctionUrl `
    --principal "*" `
    --function-url-auth-type NONE `
    --region $Region 2>&1

$ErrorActionPreference = $prevErrorAction

# Retrieve Function URL
$funcUrl = & aws lambda get-function-url-config --function-name $FunctionName --region $Region --query "FunctionUrl" --output text
Write-Host "=== Backend API Deployed Successfully! ===" -ForegroundColor Green
Write-Host "Live Backend URL: $funcUrl" -ForegroundColor Cyan
Write-Host "API Endpoint: $($funcUrl.TrimEnd('/'))/api" -ForegroundColor Cyan
