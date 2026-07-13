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
const CONSTANTS_FILE = path.resolve(__dirname, '../../app/src/data/constants.ts');

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

import { buildReminderPayload, sportEmoji } from './lib/message-builder.js';

// --- Helpers ---

const MONTH_TO_INDEX = {
  september: 8, october: 9, november: 10, december: 11,
  january: 0, february: 1, march: 2, april: 3,
  may: 4, june: 5, july: 6, august: 7,
};

// Season years come from app/src/data/constants.ts so the annual bump is a
// single edit there — a stale copy here would silently mis-date every match.
function seasonYearByMonth() {
  const content = fs.readFileSync(CONSTANTS_FILE, 'utf-8');
  const start = content.match(/SEASON_START_YEAR\s*=\s*(\d{4})/);
  const end = content.match(/SEASON_END_YEAR\s*=\s*(\d{4})/);
  if (!start || !end) {
    throw new Error(`Cannot read SEASON_START_YEAR / SEASON_END_YEAR from ${CONSTANTS_FILE}`);
  }
  const startYear = Number(start[1]);
  const endYear = Number(end[1]);
  return {
    september: startYear, october: startYear, november: startYear, december: startYear,
    january: endYear, february: endYear, march: endYear, april: endYear,
    may: endYear, june: endYear, july: endYear, august: endYear,
  };
}

function parseEventsFile() {
  const content = fs.readFileSync(EVENTS_FILE, 'utf-8');
  const match = content.match(/export const eventsData[^=]*=\s*({[\s\S]*});?\s*$/);
  if (!match) return {};
  const fn = new Function(`return ${match[1]}`);
  return fn();
}

function getUpcomingMatches() {
  const events = parseEventsFile();
  const seasonYear = seasonYearByMonth();
  const now = new Date();
  const upcoming = [];

  for (const [monthName, monthEvents] of Object.entries(events)) {
    const monthIndex = MONTH_TO_INDEX[monthName];
    const year = seasonYear[monthName];
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

/**
 * Destroy dead PushSubscription rows and their NotifPreference rows.
 * Used by both the Web Push (410/404) and FCM (unregistered) channels.
 */
async function cleanupExpiredSubscriptions(ids, NotifPreference, PushSubscription) {
  const uniqueIds = [...new Set(ids)];
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
      logQuery.equalTo('channel', 'web-push');
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

      const reminderPayload = buildReminderPayload(match, tier);
      const payload = JSON.stringify({
        ...reminderPayload,
        icon: '/images/clear_logo.png',
      });

      for (const pref of prefs) {
        const sub = pref.get('subscription');
        if (!sub) continue;
        // FCM device subscriptions are handled by the FCM channel below
        if (sub.get('platform') === 'fcm') continue;

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
      log.set('channel', 'web-push');
      log.set('sentAt', new Date());
      await log.save(null, { useMasterKey: true });
    }
  }

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await cleanupExpiredSubscriptions(expiredIds, NotifPreference, PushSubscription);
  }

  console.log(`\nWeb Push summary: ${sent} sent, ${skipped} skipped/failed`);

  // --- Telegram reminders ---
  const { TELEGRAM_BOT_TOKEN } = process.env;
  if (TELEGRAM_BOT_TOKEN) {
    const { sendTelegramMessage } = await import('./lib/telegram-sender.js');
    const TelegramSubscriber = Parse.Object.extend('TelegramSubscriber');
    let tgSent = 0;
    let tgFailed = 0;

    for (const match of upcoming) {
      for (const tier of REMINDER_TIERS) {
        const lowerBound = tier - WINDOW_MINUTES / 60;
        const upperBound = tier + WINDOW_MINUTES / 60;
        if (match.hoursUntil < lowerBound || match.hoursUntil > upperBound) continue;

        // Dedup for telegram channel
        const tgLogQuery = new Parse.Query(ReminderLog);
        tgLogQuery.equalTo('eventKey', match.eventKey);
        tgLogQuery.equalTo('hoursBefore', tier);
        tgLogQuery.equalTo('channel', 'telegram');
        if (await tgLogQuery.first({ useMasterKey: true })) continue;

        const subQuery = new Parse.Query(TelegramSubscriber);
        subQuery.equalTo('active', true);
        subQuery.containedIn('reminderHours', [tier]);
        subQuery.containedIn('enabledSports', [match.sport]);
        subQuery.limit(1000);
        const subs = await subQuery.find({ useMasterKey: true });

        if (subs.length === 0) continue;

        const reminderPayload = buildReminderPayload(match, tier);

        for (const sub of subs) {
          try {
            const result = await sendTelegramMessage(sub.get('chatId'), reminderPayload, TELEGRAM_BOT_TOKEN);
            if (result.ok) tgSent++;
            else {
              if (result.statusCode === 403) {
                sub.set('active', false);
                await sub.save(null, { useMasterKey: true });
              }
              tgFailed++;
            }
          } catch (err) {
            console.error(`Telegram send failed:`, err.message);
            tgFailed++;
          }
        }

        const log = new ReminderLog();
        log.set('eventKey', match.eventKey);
        log.set('hoursBefore', tier);
        log.set('channel', 'telegram');
        log.set('sentAt', new Date());
        await log.save(null, { useMasterKey: true });
      }
    }
    console.log(`Telegram summary: ${tgSent} sent, ${tgFailed} failed`);
  }

  // --- FCM reminders (Android app) ---
  const { FIREBASE_SERVICE_ACCOUNT } = process.env;
  if (!FIREBASE_SERVICE_ACCOUNT) {
    console.log('FIREBASE_SERVICE_ACCOUNT not set — skipping FCM channel');
  } else {
    const { sendFcmMessage } = await import('./lib/fcm-sender.js');
    let fcmSent = 0;
    let fcmFailed = 0;
    const fcmExpiredIds = [];

    for (const match of upcoming) {
      for (const tier of REMINDER_TIERS) {
        const lowerBound = tier - WINDOW_MINUTES / 60;
        const upperBound = tier + WINDOW_MINUTES / 60;
        if (match.hoursUntil < lowerBound || match.hoursUntil > upperBound) continue;

        // Dedup for fcm channel — same eventKey format as the other channels
        const fcmLogQuery = new Parse.Query(ReminderLog);
        fcmLogQuery.equalTo('eventKey', match.eventKey);
        fcmLogQuery.equalTo('hoursBefore', tier);
        fcmLogQuery.equalTo('channel', 'fcm');
        if (await fcmLogQuery.first({ useMasterKey: true })) continue;

        const prefQuery = new Parse.Query(NotifPreference);
        prefQuery.equalTo('disabled', false);
        prefQuery.containedIn('reminderHours', [tier]);
        prefQuery.containedIn('enabledSports', [match.sport]);
        prefQuery.include('subscription');
        prefQuery.limit(1000);
        const prefs = await prefQuery.find({ useMasterKey: true });

        // Platform lives on the pointed-to PushSubscription — filter in JS.
        // Tier/sport are re-checked here as a guard alongside the Parse constraints.
        const fcmPrefs = prefs.filter((pref) => {
          const sub = pref.get('subscription');
          if (!sub || sub.get('platform') !== 'fcm' || !sub.get('token')) return false;
          return (
            (pref.get('reminderHours') || []).includes(tier) &&
            (pref.get('enabledSports') || []).includes(match.sport)
          );
        });

        if (fcmPrefs.length === 0) continue;

        const reminderPayload = buildReminderPayload(match, tier);

        for (const pref of fcmPrefs) {
          const sub = pref.get('subscription');
          try {
            const result = await sendFcmMessage(sub.get('token'), {
              title: reminderPayload.title,
              body: reminderPayload.body,
              data: {
                eventKey: match.eventKey,
                sport: match.sport,
                tag: reminderPayload.tag,
                url: reminderPayload.url,
              },
            });
            if (result.ok) fcmSent++;
            else {
              if (result.unregistered) fcmExpiredIds.push(sub.id);
              fcmFailed++;
            }
          } catch (err) {
            console.error('FCM send failed:', err.message);
            fcmFailed++;
          }
        }

        const log = new ReminderLog();
        log.set('eventKey', match.eventKey);
        log.set('hoursBefore', tier);
        log.set('channel', 'fcm');
        log.set('sentAt', new Date());
        await log.save(null, { useMasterKey: true });
      }
    }

    if (fcmExpiredIds.length > 0) {
      await cleanupExpiredSubscriptions(fcmExpiredIds, NotifPreference, PushSubscription);
    }

    console.log(`FCM summary: ${fcmSent} sent, ${fcmFailed} failed`);
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
