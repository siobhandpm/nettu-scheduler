#!/bin/bash
# EPW Nettu Scheduler — Startup Script
# Reads credentials from vault via gary-vault.js and starts the service.
# Usage: bash scripts/start-nettu.sh
#
# Prerequisites: Run "gary-vault.js provision-app nettu-scheduler" first.
# Vault path: secret/epw/nettucheduler
# Required vault fields: database_url, account_secret

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
EPW_DIR="E:/Projects/EPW/epw-dashboard"
GARY_VAULT="$EPW_DIR/scripts/gary-vault.js"

echo "[nettu] Reading credentials from vault..."
DATABASE_URL=$(node "$GARY_VAULT" read --field database_url nettu-scheduler)
ACCOUNT_SECRET=$(node "$GARY_VAULT" read --field account_secret nettu-scheduler)

if [ -z "$DATABASE_URL" ] || [ -z "$ACCOUNT_SECRET" ]; then
  echo "[nettu] ERROR: Credentials not found in vault."
  echo "[nettu] Run: node scripts/gary-vault.js provision-app nettu-scheduler"
  exit 1
fi

echo "[nettu] Writing .env.nettu..."
cat > "$PROJECT_DIR/.env.nettu" <<EOF
DATABASE_URL=${DATABASE_URL}
PORT=5000
CREATE_ACCOUNT_SECRET_CODE=${ACCOUNT_SECRET}
EOF

echo "[nettu] Starting container..."
cd "$PROJECT_DIR"
docker compose -f docker-compose.epw.yml up -d

echo "[nettu] Waiting for health check..."
sleep 5
docker ps --filter name=epw-nettu-scheduler --format "{{.Names}}\t{{.Status}}"
echo "[nettu] Done. Server available at http://localhost:5008"
