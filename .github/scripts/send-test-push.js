/**
 * Send a single, clearly-labeled test push via FCM.
 * Run manually (workflow_dispatch on reminders.yml) to validate the FCM
 * channel end-to-end without waiting for a real fixture to enter the
 * 25-hour reminder window.
 *
 * Required env vars:
 *   FIREBASE_SERVICE_ACCOUNT, TEST_FCM_TOKEN
 * Optional:
 *   TEST_EVENT_KEY — eventKey to embed in the data payload so the app's
 *   notification-tap deep link can be exercised against a real fixture.
 */

import path from 'path';
import { fileURLToPath } from 'url';

import { buildReminderPayload } from './lib/message-builder.js';

const KNOWN_SPORTS = ['football-men', 'volleyball-men', 'volleyball-women', 'meeting'];

/**
 * Extract the sport id from an eventKey (`month-day-sport-opponent`).
 * Sport ids themselves contain dashes, so match against the known ids.
 */
function sportFromEventKey(eventKey) {
  const match = KNOWN_SPORTS.find((sport) => eventKey.includes(`-${sport}-`));
  return match || null;
}

// --- Main ---

async function main() {
  const { FIREBASE_SERVICE_ACCOUNT, TEST_FCM_TOKEN, TEST_EVENT_KEY } = process.env;

  if (!FIREBASE_SERVICE_ACCOUNT) {
    console.error('FIREBASE_SERVICE_ACCOUNT is not set — cannot send via FCM');
    process.exit(1);
  }
  if (!TEST_FCM_TOKEN) {
    console.error('TEST_FCM_TOKEN is not set — provide the FCM device token to test');
    process.exit(1);
  }

  const eventKey = TEST_EVENT_KEY || 'september-1-football-men-TEST OPPONENT';
  const sport = sportFromEventKey(eventKey) || 'football-men';

  // Synthetic match shaped like send-reminders.js's upcoming-match objects.
  const match = {
    opponent: 'TEST OPPONENT',
    sport,
    location: 'home',
    venue: 'Test Venue',
    time: '19:00',
    eventKey,
  };

  const reminderPayload = buildReminderPayload(match, 24);
  const payload = {
    ...reminderPayload,
    title: `[TEST] ${reminderPayload.title}`,
  };

  console.log(`Sending test push (eventKey: ${eventKey})`);

  const { sendFcmMessage } = await import('./lib/fcm-sender.js');
  const result = await sendFcmMessage(TEST_FCM_TOKEN, {
    title: payload.title,
    body: payload.body,
    data: { eventKey, sport, tag: payload.tag, url: payload.url },
  });

  console.log(`FCM test send result: ok=${result.ok}, unregistered=${result.unregistered}`);

  if (!result.ok) {
    console.error(`Test push failed${result.statusCode ? ` (HTTP ${result.statusCode})` : ''}`);
    process.exit(1);
  }
}

const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { main };
