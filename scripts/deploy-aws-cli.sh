#!/usr/bin/env bash
set -e

REGION="${AWS_DEFAULT_REGION:-us-west-2}"
APP_NAME="finlytics-app"
ENV_NAME="prod"

echo "=== [Finlytics AWS Serverless CLI Deployment] ==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BUILD_DIR="${ROOT_DIR}/build"
mkdir -p "${BUILD_DIR}"

# 1. Build Frontend
echo "1. Building Frontend..."
cd "${ROOT_DIR}/finance-app/frontend"
npm run build

# 2. Deploy Frontend to S3
RANDOM_ID=$(head /dev/urandom | tr -dc a-z0-9 | head -c 8 ; echo '')
BUCKET_NAME="${APP_NAME}-${ENV_NAME}-${RANDOM_ID}"

echo "2. Creating S3 Bucket: ${BUCKET_NAME} in region ${REGION}..."
if [ "${REGION}" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "${BUCKET_NAME}" --region "${REGION}"
else
    aws s3api create-bucket --bucket "${BUCKET_NAME}" --region "${REGION}" --create-bucket-configuration LocationConstraint="${REGION}"
fi

# Configure S3 website
echo "Configuring S3 static website hosting..."
aws s3 website "s3://${BUCKET_NAME}" --index-document index.html --error-document index.html

# Disable block public access
aws s3api put-public-access-block --bucket "${BUCKET_NAME}" --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Apply public read bucket policy
cat <<EOF > "${BUILD_DIR}/bucket-policy.json"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
EOF
aws s3api put-bucket-policy --bucket "${BUCKET_NAME}" --policy "file://${BUILD_DIR}/bucket-policy.json"

# Sync build to S3
echo "Uploading frontend build to S3..."
aws s3 sync "${ROOT_DIR}/finance-app/frontend/dist" "s3://${BUCKET_NAME}" --delete

S3_WEBSITE_URL="http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com"
echo "Frontend deployed at: ${S3_WEBSITE_URL}"

# 3. Create CloudFront Distribution
echo "3. Creating CloudFront Distribution for SSL & Global CDN..."
CALLER_REF=$(date +%s)
cat <<EOF > "${BUILD_DIR}/cf-config.json"
{
  "CallerReference": "${CALLER_REF}",
  "Comment": "Finlytics Frontend CDN",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-${BUCKET_NAME}",
        "DomainName": "${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${BUCKET_NAME}",
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
EOF

CF_DOMAIN=$(aws cloudfront create-distribution --distribution-config "file://${BUILD_DIR}/cf-config.json" --query "Distribution.DomainName" --output text)
CDN_URL="https://${CF_DOMAIN}"

echo "=== Deployment Summary ==="
echo "S3 Direct Website: ${S3_WEBSITE_URL}"
echo "CloudFront CDN URL: ${CDN_URL}"
