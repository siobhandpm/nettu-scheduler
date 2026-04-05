#!/usr/bin/env node
/**
 * EPW Nettu Scheduler — Startup Script (Node.js)
 * Reads credentials from vault via gary-vault.js, writes .env.nettu, starts container.
 *
 * Usage: node scripts/start-nettu.js
 * Prerequisites: node scripts/gary-vault.js provision-app nettu-scheduler
 */

const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, '..');
const EPW_DIR = 'E:/Projects/EPW/epw-dashboard';
const GARY_VAULT = path.join(EPW_DIR, 'scripts', 'gary-vault.js');

function vaultRead(field) {
  try {
    return execFileSync(process.execPath, [GARY_VAULT, 'read', '--field', field, 'nettu-scheduler'], {
      encoding: 'utf8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (e) {
    return '';
  }
}

console.log('[nettu] Reading credentials from vault...');
const pgPassword = vaultRead('pg_password');
const accountSecret = vaultRead('account_secret');
const dbName = vaultRead('database_name');

if (!pgPassword || !accountSecret || !dbName) {
  console.error('[nettu] ERROR: Credentials not found in vault.');
  console.error('[nettu] Run: node scripts/gary-vault.js provision-app nettu-scheduler');
  process.exit(1);
}

// URL-encode the password for the connection string (handles $, %, @, etc.)
const encodedPassword = encodeURIComponent(pgPassword);
const databaseUrl = `postgresql://postgres:${encodedPassword}@host.docker.internal:5432/${dbName}`;

console.log('[nettu] Writing .env.nettu...');
const envContent = `DATABASE_URL=${databaseUrl}\nPORT=5000\nCREATE_ACCOUNT_SECRET_CODE=${accountSecret}\n`;
fs.writeFileSync(path.join(PROJECT_DIR, '.env.nettu'), envContent, 'utf8');

console.log('[nettu] Restarting container...');
try {
  execSync('docker compose -f docker-compose.epw.yml down 2>/dev/null', { cwd: PROJECT_DIR, stdio: 'pipe' });
} catch (_) {}
execSync('docker compose -f docker-compose.epw.yml up -d', { cwd: PROJECT_DIR, stdio: 'inherit' });

console.log('[nettu] Waiting for startup...');
setTimeout(() => {
  try {
    const status = execSync('docker ps --filter name=epw-nettu-scheduler --format "{{.Names}}\\t{{.Status}}"', {
      encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    console.log(status);
    console.log('[nettu] Done. Server available at http://localhost:5008');
  } catch (e) {
    console.error('[nettu] Container status check failed');
  }
}, 8000);
