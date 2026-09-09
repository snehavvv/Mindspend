#!/usr/bin/env bash
set -e

echo "=== [Finlytics AWS Serverless Deployment Pipeline] ==="

AWS_REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT="${ENVIRONMENT:-production}"
APP_NAME="finlytics"

# Check prerequisites
command -v aws >/dev/null 2>&1 || { echo "Error: AWS CLI is required but not installed." >&2; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "Error: Terraform is required but not installed." >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BUILD_DIR="${ROOT_DIR}/build"

mkdir -p "${BUILD_DIR}"

echo "Step 1: Building Frontend Bundle (Vite)..."
cd "${ROOT_DIR}/finance-app/frontend"
npm ci || npm install
npm run build

echo "Step 2: Packaging Backend for AWS Lambda (Mangum ASGI)..."
cd "${ROOT_DIR}/finance-app/backend"
rm -f "${BUILD_DIR}/backend.zip"
zip -r "${BUILD_DIR}/backend.zip" app/ main.py requirements.txt

echo "Step 3: Provisioning Infrastructure with Terraform..."
cd "${ROOT_DIR}/infra"
terraform init
terraform apply -auto-approve \
  -var="aws_region=${AWS_REGION}" \
  -var="environment=${ENVIRONMENT}" \
  -var="app_name=${APP_NAME}"

# Extract outputs
FRONTEND_BUCKET="${APP_NAME}-${ENVIRONMENT}-frontend"
CDN_DISTRIBUTION_ID=$(terraform output -raw cdn_distribution_id 2>/dev/null || echo "")

echo "Step 4: Syncing Frontend Assets to S3..."
aws s3 sync "${ROOT_DIR}/finance-app/frontend/dist" "s3://${FRONTEND_BUCKET}" --delete

if [ -n "${CDN_DISTRIBUTION_ID}" ]; then
  echo "Step 5: Invalidating CloudFront Cache..."
  aws cloudfront create-invalidation --distribution-id "${CDN_DISTRIBUTION_ID}" --paths "/*"
fi

echo "=== Deployment Complete! ==="
terraform output
