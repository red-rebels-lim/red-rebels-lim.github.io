/**
 * Send push notifications for scraper-detected changes.
 * Run after the scraper writes changes.json.
 *
 * Required env vars:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
 *   BACK4APP_APP_ID, BACK4APP_MASTER_KEY
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import Parse from 'parse/node.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHANGES_PATH = path.resolve(__dirname, '../../changes.json');
const EVENTS_FILE = path.resolve(__dirname, '../../app/src/data/events.ts');

// --- Init ---

const {
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  BACK4APP_APP_ID,
  BACK4APP_MASTER_KEY,
} = process.env;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !BACK4APP_APP_ID || !BACK4APP_MASTER_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

webpush.setVapidDetails(
  'mailto:redrebels@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

Parse.initialize(BACK4APP_APP_ID, undefined, BACK4APP_MASTER_KEY);
Parse.serverURL = 'https://parseapi.back4app.com/';
Parse.masterKey = BACK4APP_MASTER_KEY;

// --- Helpers ---

function sportEmoji(sport) {
  switch (sport) {
    case 'football-men': return '\u{1F468}\u26BD';
    case 'volleyball-men': return '\u{1F468}\u{1F3D0}';
    case 'volleyball-women': return '\u{1F469}\u{1F3FB}\u{1F3D0}';
    default: return '';
  }
}

function parseEventsFile() {
  try {
    const content = fs.readFileSync(EVENTS_FILE, 'utf-8');
    const match = content.match(/export const eventsData[^=]*=\s*({[\s\S]*});?\s*$/);
    if (!match) return {};
    const fn = new Function(`return ${match[1]}`);
    return fn();
  } catch {
    return {};
  }
}

/**
 * Look up event location from events.ts by parsing the change description.
 * Desc format: "February 20: football-men vs OPPONENT"
 */
function lookupLocation(desc, eventsData) {
  const m = desc.match(/^(\w+)\s+(\d+):\s*([\w-]+)\s+vs\s+(.+?)(?:\s*\(|$)/);
  if (!m) return null;
  const [, monthName, day, sport, opponent] = m;
  const monthEvents = eventsData[monthName.toLowerCase()] || [];
  const event = monthEvents.find(
    e => e.day === parseInt(day) && e.sport === sport && e.opponent === opponent.trim()
  );
  return event?.location || null;
}

/**
 * Extract sport key from a change description string.
 * E.g. "January 15: football-men vs Omonia" → "football-men"
 */
function extractSport(desc) {
  const match = desc.match(/:\s*(football-men|volleyball-men|volleyball-women)\s/);
  return match ? match[1] : null;
}

/**
 * Build notification payload for a change type.
 */
function buildPayload(type, desc, sport, location) {
  const sportMatch = desc.match(/:\s*\S+\s+vs\s+(.+?)(?:\s*\(|$)/);
  const opponent = sportMatch ? sportMatch[1].trim() : '';
  const emoji = sportEmoji(sport);
  const prefix = emoji ? `${emoji} ` : '';
  const ha = location === 'home' ? ' (H)' : location === 'away' ? ' (A)' : '';

  switch (type) {
    case 'added': {
      return {
        title: `${prefix}New Match`,
        body: opponent ? `vs ${opponent}${ha}` : desc,
        tag: `new-${desc.replace(/\s+/g, '-').toLowerCase()}`,
        url: '/',
      };
    }
    case 'scoreUpdated': {
      const scoreMatch = desc.match(/\(([^)]+)\)/);
      return {
        title: `${prefix}Score Update`,
        body: opponent && scoreMatch ? `vs ${opponent}${ha} — ${scoreMatch[1]}` : desc,
        tag: `score-${desc.replace(/\s+/g, '-').toLowerCase()}`,
        url: '/',
      };
    }
    case 'timeUpdated': {
      const timeMatch = desc.match(/\(([^)]+)\)/);
      return {
        title: `${prefix}Time Changed`,
        body: opponent && timeMatch ? `vs ${opponent}${ha} — ${timeMatch[1]}` : desc,
        tag: `time-${desc.replace(/\s+/g, '-').toLowerCase()}`,
        url: '/',
      };
    }
    default:
      return null;
  }
}

const PREF_FIELDS = {
  added: 'notifyNewEvents',
  scoreUpdated: 'notifyScoreUpdates',
  timeUpdated: 'notifyTimeChanges',
};

// --- Main ---

async function main() {
  // 1. Read changes
  if (!fs.existsSync(CHANGES_PATH)) {
    console.log('No changes.json found — nothing to send');
    process.exit(0);
  }

  const changes = JSON.parse(fs.readFileSync(CHANGES_PATH, 'utf-8'));

  const changeTypes = ['added', 'scoreUpdated', 'timeUpdated'];
  const totalChanges = changeTypes.reduce((sum, t) => sum + (changes[t]?.length || 0), 0);

  if (totalChanges === 0) {
    console.log('No relevant changes — nothing to send');
    process.exit(0);
  }

  console.log(`Found ${totalChanges} change(s) to notify about`);

  const eventsData = parseEventsFile();

  // 2. Query all active subscriptions with preferences
  const PushSubscription = Parse.Object.extend('PushSubscription');
  const NotifPreference = Parse.Object.extend('NotifPreference');

  const prefQuery = new Parse.Query(NotifPreference);
  prefQuery.equalTo('disabled', false);
  prefQuery.include('subscription');
  prefQuery.limit(1000);

  const prefs = await prefQuery.find({ useMasterKey: true });
  console.log(`Found ${prefs.length} active subscriber(s)`);

  if (prefs.length === 0) {
    console.log('No active subscribers — exiting');
    process.exit(0);
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const expiredIds = [];

  // 3. For each change, send to matching subscribers
  for (const changeType of changeTypes) {
    const items = changes[changeType] || [];
    const prefField = PREF_FIELDS[changeType];

    for (const desc of items) {
      const sport = extractSport(desc);
      const location = lookupLocation(desc, eventsData);
      const payload = buildPayload(changeType, desc, sport, location);
      if (!payload) continue;

      for (const pref of prefs) {
        // Check preference flag
        if (!pref.get(prefField)) {
          skipped++;
          continue;
        }

        // Check sport filter
        if (sport && !(pref.get('enabledSports') || []).includes(sport)) {
          skipped++;
          continue;
        }

        const sub = pref.get('subscription');
        if (!sub) continue;

        const pushSubscription = {
          endpoint: sub.get('endpoint'),
          keys: {
            p256dh: sub.get('p256dh'),
            auth: sub.get('auth'),
          },
        };

        try {
          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify({ ...payload, icon: '/images/clear_logo.png' })
          );
          sent++;
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`Expired subscription: ${sub.id}`);
            expiredIds.push(sub.id);
          } else {
            console.error(`Failed to send to ${sub.id}:`, err.message);
          }
          failed++;
        }
      }
    }
  }

  // 4. Clean up expired subscriptions
  if (expiredIds.length > 0) {
    const uniqueIds = [...new Set(expiredIds)];
    console.log(`Cleaning up ${uniqueIds.length} expired subscription(s)`);

    for (const id of uniqueIds) {
      try {
        // Delete preferences
        const prefCleanup = new Parse.Query(NotifPreference);
        const subPointer = PushSubscription.createWithoutData(id);
        prefCleanup.equalTo('subscription', subPointer);
        const prefsToDelete = await prefCleanup.find({ useMasterKey: true });
        await Parse.Object.destroyAll(prefsToDelete, { useMasterKey: true });

        // Delete subscription
        await subPointer.destroy({ useMasterKey: true });
      } catch (err) {
        console.error(`Failed to clean up ${id}:`, err.message);
      }
    }
  }

  console.log(`\nSummary: ${sent} sent, ${failed} failed, ${skipped} skipped`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
