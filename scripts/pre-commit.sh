#!/usr/bin/env bash
set -e

echo "=== [Finlytics Pre-Commit Quality Checks] ==="

echo "1. Checking Frontend Types & Lint..."
cd "$(dirname "$0")/../finance-app/frontend"
npm run build

echo "2. Running Backend Tests..."
cd "../backend"
if [ -d ".venv" ]; then
    source .venv/bin/activate || source .venv/Scripts/activate
fi
python -m pytest tests/ -q

echo "=== All pre-commit checks passed successfully! ==="
