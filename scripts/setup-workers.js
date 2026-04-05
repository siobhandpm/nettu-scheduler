#!/usr/bin/env node
/**
 * EPW Nettu Scheduler — Worker Account Setup
 * Creates an account, user, and calendar for each EPW digital worker.
 * Stores the API keys in a local config file for the EPW integration layer.
 *
 * Usage: node scripts/setup-workers.js
 * Prerequisites: Nettu container running on port 5008
 */

const fs = require('fs');
const path = require('path');

const NETTU_URL = 'http://localhost:5008';
const CONFIG_PATH = path.join(__dirname, '..', 'epw-worker-accounts.json');

// Read the account secret from vault
const { execFileSync } = require('child_process');
const GARY_VAULT = path.join('E:', 'Projects', 'EPW', 'epw-dashboard', 'scripts', 'gary-vault.js');

function vaultRead(field) {
  try {
    return execFileSync(process.execPath, [GARY_VAULT, 'read', '--field', field, 'nettu-scheduler'], {
      encoding: 'utf8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (_) { return ''; }
}

async function nettuPost(path, body, apiKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  const res = await fetch(`${NETTU_URL}${path}`, {
    method: 'POST', headers, body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  // Get worker list from EPW
  const workersRes = await fetch('http://localhost:3000/api/workers', { signal: AbortSignal.timeout(10000) });
  const workers = await workersRes.json();

  const accountSecret = vaultRead('account_secret');
  if (!accountSecret) {
    console.error('ERROR: Cannot read account_secret from vault');
    process.exit(1);
  }

  // Load existing config if present (idempotent — skip already-created workers)
  let config = {};
  if (fs.existsSync(CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  }

  console.log(`[setup] ${workers.length} EPW workers found. Setting up Nettu accounts...\n`);

  for (const w of workers) {
    if (config[w.id]) {
      console.log(`  ${w.id}: already configured (skipping)`);
      continue;
    }

    try {
      // 1. Create account
      const accountRes = await nettuPost('/api/v1/account', { code: accountSecret });
      const apiKey = accountRes.secretApiKey;
      const accountId = accountRes.account.id;

      // 2. Create user with metadata
      const userRes = await nettuPost('/api/v1/user', {
        metadata: {
          epw_worker_id: w.id,
          epw_worker_name: w.name,
          epw_role: w.role || ''
        }
      }, apiKey);
      const userId = userRes.user.id;

      // 3. Create calendar
      const calRes = await nettuPost(`/api/v1/user/${userId}/calendar`, {
        timezone: 'Europe/Dublin',
        weekStart: "Mon"
      }, apiKey);
      const calendarId = calRes.calendar.id;

      config[w.id] = {
        accountId,
        apiKey,
        userId,
        calendarId,
        workerName: w.name,
        role: w.role || '',
        createdAt: new Date().toISOString()
      };

      console.log(`  ${w.id}: account=${accountId.slice(0,8)}... user=${userId.slice(0,8)}... calendar=${calendarId.slice(0,8)}...`);
    } catch (e) {
      console.error(`  ${w.id}: FAILED — ${e.message}`);
    }
  }

  // Save config
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  console.log(`\n[setup] Done. ${Object.keys(config).length} workers configured.`);
  console.log(`[setup] Config saved to: ${CONFIG_PATH}`);
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
