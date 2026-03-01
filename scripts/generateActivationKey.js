#!/usr/bin/env node
/**
 * Generate an activation key for a device ID.
 * Use the SAME formula as src/services/activationService.ts.
 *
 * Usage: node scripts/generateActivationKey.js <deviceId>
 * Example: node scripts/generateActivationKey.js dd96dec43fb81c97
 *
 * Keep this script and MASTER_SECRET private. Do not commit secrets to the repo.
 * You can use env: MASTER_SECRET=xxx node scripts/generateActivationKey.js <deviceId>
 */

const crypto = require('crypto');

const MASTER_SECRET = process.env.MASTER_SECRET || 'TeaShopPOS2026SecureKey';

function computeKey(deviceId) {
  const hash = crypto
    .createHash('sha256')
    .update(deviceId + MASTER_SECRET)
    .digest('hex');
  const raw = hash.substring(0, 12).toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

const deviceId = process.argv[2];
if (!deviceId) {
  console.error('Usage: node scripts/generateActivationKey.js <deviceId>');
  console.error('Example: node scripts/generateActivationKey.js dd96dec43fb81c97');
  process.exit(1);
}

const key = computeKey(deviceId.trim());
console.log('Device ID:', deviceId.trim());
console.log('Activation key:', key);
