/**
 * Send match reminder push notifications.
 * Runs on a 30-minute cron schedule.
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

const MONTH_TO_INDEX = {
  september: 8, october: 9, november: 10, december: 11,
  january: 0, february: 1, march: 2, april: 3,
  may: 4, june: 5, july: 6, august: 7,
};

const SEASON_YEAR = {
  september: 2025, october: 2025, november: 2025, december: 2025,
  january: 2026, february: 2026, march: 2026, april: 2026,
  may: 2026, june: 2026, july: 2026, august: 2026,
};

function parseEventsFile() {
  const content = fs.readFileSync(EVENTS_FILE, 'utf-8');
  const match = content.match(/export const eventsData[^=]*=\s*({[\s\S]*});?\s*$/);
  if (!match) return {};
  const fn = new Function(`return ${match[1]}`);
  return fn();
}

function getUpcomingMatches() {
  const events = parseEventsFile();
  const now = new Date();
  const upcoming = [];

  for (const [monthName, monthEvents] of Object.entries(events)) {
    const monthIndex = MONTH_TO_INDEX[monthName];
    const year = SEASON_YEAR[monthName];
    if (monthIndex === undefined || year === undefined) continue;

    for (const event of monthEvents) {
      if (event.status === 'played' || !event.time) continue;

      const timeMatch = event.time.match(/^(\d{1,2}):(\d{2})$/);
      if (!timeMatch) continue;

      const matchDate = new Date(year, monthIndex, event.day, parseInt(timeMatch[1]), parseInt(timeMatch[2]));

      // Only consider future matches within 25 hours
      const hoursUntil = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntil > 0 && hoursUntil <= 25) {
        upcoming.push({
          ...event,
          matchDate,
          hoursUntil,
          monthName,
          eventKey: `${monthName}-${event.day}-${event.sport}-${event.opponent}`,
        });
      }
    }
  }

  return upcoming;
}

const REMINDER_TIERS = [24, 12, 2, 1];
const WINDOW_MINUTES = 30;

// --- Main ---

async function main() {
  const upcoming = getUpcomingMatches();

  if (upcoming.length === 0) {
    console.log('No upcoming matches within 25 hours — exiting');
    process.exit(0);
  }

  console.log(`Found ${upcoming.length} upcoming match(es) within 25 hours`);

  const ReminderLog = Parse.Object.extend('ReminderLog');
  const PushSubscription = Parse.Object.extend('PushSubscription');
  const NotifPreference = Parse.Object.extend('NotifPreference');

  let sent = 0;
  let skipped = 0;
  const expiredIds = [];

  for (const match of upcoming) {
    for (const tier of REMINDER_TIERS) {
      // Check if this match falls within the window for this tier
      const lowerBound = tier - WINDOW_MINUTES / 60;
      const upperBound = tier + WINDOW_MINUTES / 60;

      if (match.hoursUntil < lowerBound || match.hoursUntil > upperBound) continue;

      // Check ReminderLog for deduplication
      const logQuery = new Parse.Query(ReminderLog);
      logQuery.equalTo('eventKey', match.eventKey);
      logQuery.equalTo('hoursBefore', tier);
      const existing = await logQuery.first({ useMasterKey: true });

      if (existing) {
        console.log(`Already sent ${tier}h reminder for ${match.eventKey}`);
        continue;
      }

      console.log(`Sending ${tier}h reminder for ${match.eventKey}`);

      // Query subscribers who want this reminder tier + sport
      const prefQuery = new Parse.Query(NotifPreference);
      prefQuery.equalTo('disabled', false);
      prefQuery.containedIn('reminderHours', [tier]);
      prefQuery.containedIn('enabledSports', [match.sport]);
      prefQuery.include('subscription');
      prefQuery.limit(1000);

      const prefs = await prefQuery.find({ useMasterKey: true });

      const payload = JSON.stringify({
        title: `Match in ${tier}h`,
        body: `vs ${match.opponent}${match.venue ? ` at ${match.venue}` : ''} — ${match.time}`,
        icon: '/images/clear_logo.png',
        tag: `reminder-${tier}h-${match.eventKey}`,
        url: '/',
      });

      for (const pref of prefs) {
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
          await webpush.sendNotification(pushSubscription, payload);
          sent++;
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            expiredIds.push(sub.id);
          } else {
            console.error(`Failed to send to ${sub.id}:`, err.message);
          }
          skipped++;
        }
      }

      // Log that this reminder was sent
      const log = new ReminderLog();
      log.set('eventKey', match.eventKey);
      log.set('hoursBefore', tier);
      log.set('sentAt', new Date());
      await log.save(null, { useMasterKey: true });
    }
  }

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    const uniqueIds = [...new Set(expiredIds)];
    console.log(`Cleaning up ${uniqueIds.length} expired subscription(s)`);
    for (const id of uniqueIds) {
      try {
        const prefCleanup = new Parse.Query(NotifPreference);
        prefCleanup.equalTo('subscription', PushSubscription.createWithoutData(id));
        const prefsToDelete = await prefCleanup.find({ useMasterKey: true });
        await Parse.Object.destroyAll(prefsToDelete, { useMasterKey: true });
        await PushSubscription.createWithoutData(id).destroy({ useMasterKey: true });
      } catch (err) {
        console.error(`Failed to clean up ${id}:`, err.message);
      }
    }
  }

  console.log(`\nSummary: ${sent} sent, ${skipped} skipped/failed`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
