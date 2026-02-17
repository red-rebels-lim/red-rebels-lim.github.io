#!/usr/bin/env node

/**
 * One-time VAPID key generator.
 * Run: node scripts/generate-vapid-keys.js
 *
 * Add the output values as GitHub Secrets:
 *   VAPID_PUBLIC_KEY  (also as VITE_VAPID_PUBLIC_KEY for client)
 *   VAPID_PRIVATE_KEY (server-only, never expose to client)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const webpush = require('../.github/scripts/node_modules/web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Keys Generated\n');
console.log('Public Key (add as VAPID_PUBLIC_KEY and VITE_VAPID_PUBLIC_KEY):');
console.log(vapidKeys.publicKey);
console.log('\nPrivate Key (add as VAPID_PRIVATE_KEY — keep secret!):');
console.log(vapidKeys.privateKey);
