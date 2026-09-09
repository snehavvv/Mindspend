# Finlytics AWS Serverless CLI Deployment (No Terraform Required)
param(
    [string]$Region = "us-west-2",
    [string]$AppName = "finlytics-app",
    [string]$EnvName = "prod"
)

$ErrorActionPreference = "Stop"

Write-Host "=== [Finlytics AWS Serverless Deployment (AWS CLI)] ===" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rootDir = Join-Path $scriptDir ".."
$buildDir = Join-Path $rootDir "build"
if (-not (Test-Path $buildDir)) { New-Item -ItemType Directory -Path $buildDir | Out-Null }

# 1. Build Frontend
Write-Host "1. Building Frontend..." -ForegroundColor Yellow
Push-Location (Join-Path $rootDir "finance-app\frontend")
try {
    npm run build
} finally {
    Pop-Location
}

# 2. Deploy Frontend to S3
$bucketName = "$AppName-$EnvName-$([guid]::NewGuid().ToString().Substring(0,8))"
Write-Host "2. Creating S3 Bucket: $bucketName in region $Region..." -ForegroundColor Yellow
if ($Region -eq "us-east-1") {
    aws s3api create-bucket --bucket $bucketName --region $Region
} else {
    aws s3api create-bucket --bucket $bucketName --region $Region --create-bucket-configuration LocationConstraint=$Region
}

# Configure S3 website
Write-Host "Configuring S3 static website hosting..." -ForegroundColor Yellow
aws s3 website "s3://$bucketName" --index-document index.html --error-document index.html

# Disable block public access
aws s3api put-public-access-block --bucket $bucketName --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Apply public read bucket policy
$policy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$bucketName/*"
    }
  ]
}
"@
$policyFile = Join-Path $buildDir "bucket-policy.json"
Set-Content -Path $policyFile -Value $policy
aws s3api put-bucket-policy --bucket $bucketName --policy file://$policyFile

# Upload frontend build
Write-Host "Uploading frontend build to S3..." -ForegroundColor Yellow
$distDir = Join-Path $rootDir "finance-app\frontend\dist"
aws s3 sync $distDir "s3://$bucketName" --delete

$s3WebsiteUrl = "http://$bucketName.s3-website-$Region.amazonaws.com"
Write-Host "Frontend deployed at: $s3WebsiteUrl" -ForegroundColor Green

# 3. Create CloudFront Distribution (optional / recommended)
Write-Host "3. Creating CloudFront Distribution for SSL & Global CDN..." -ForegroundColor Yellow
$cfConfig = @"
{
  "CallerReference": "$([guid]::NewGuid().ToString())",
  "Comment": "Finlytics Frontend CDN",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$bucketName",
        "DomainName": "$bucketName.s3-website-$Region.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$bucketName",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": { "Enabled": false, "Quantity": 0 },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" }
    },
    "MinTTL": 0
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  }
}
"@
$cfFile = Join-Path $buildDir "cf-config.json"
Set-Content -Path $cfFile -Value $cfConfig

$cfResult = aws cloudfront create-distribution --distribution-config file://$cfFile | ConvertFrom-Json
$cfDomain = $cfResult.Distribution.DomainName
$cdnUrl = "https://$cfDomain"

Write-Host "=== Deployment Summary ===" -ForegroundColor Green
Write-Host "S3 Direct Website: $s3WebsiteUrl" -ForegroundColor Cyan
Write-Host "CloudFront CDN URL: $cdnUrl" -ForegroundColor Cyan
