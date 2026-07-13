# .github/scripts/CLAUDE.md

Standalone Node project for the cron reminders + post-scrape notifications.

## Setup

Own `package.json`, own `node_modules`. CI installs separately. The two entry points:

- `send-reminders.js` — runs every 30 min via `.github/workflows/reminders.yml`.
- `send-notifications.js` — runs after a scrape detects changes, via `.github/workflows/scrape.yml`.

Both ESM (`"type": "module"`); both are tested with their own Vitest config.

## How they read events.ts

`send-reminders.js:60-65` parses `app/src/data/events.ts` like this:

```js
const content = fs.readFileSync(EVENTS_FILE, 'utf-8');
const match = content.match(/export const eventsData[^=]*=\s*({[\s\S]*});?\s*$/);
const fn = new Function(`return ${match[1]}`);
return fn();
```

This is the silent-failure surface called out in the root CLAUDE.md and `app/src/data/CLAUDE.md`. Anything you ship that breaks the regex or makes the literal non-JS-evaluable will fail at the *next cron firing*, not in CI.

`send-reminders.js` also regex-parses `SEASON_START_YEAR` / `SEASON_END_YEAR` out of `app/src/data/constants.ts` to assign years to month buckets — renaming those constants breaks the cron the same way.

## Channels

`send-reminders.js` runs three channels in sequence: Web Push (always), Telegram (if `TELEGRAM_BOT_TOKEN` is set), and FCM (if `FIREBASE_SERVICE_ACCOUNT` is set). Each channel deduplicates per `(eventKey, hoursBefore, channel)` against the Parse class `ReminderLog` — channel values: `web-push`, `telegram`, `fcm`.

`send-notifications.js` delivers each change to web-push and FCM subscribers in a single pass over `NotifPreference` (the per-type flags and sport filter apply identically to both); FCM is skipped there too when `FIREBASE_SERVICE_ACCOUNT` is unset.

Reminder tiers: `[24, 12, 2, 1]` hours, ±30-minute window. Subscribers opt in to specific tiers via their `NotifPreference.reminderHours` array.

### FCM (Android app)

`FIREBASE_SERVICE_ACCOUNT` holds the **raw Firebase service-account JSON**. `lib/fcm-sender.js` mints an OAuth2 token via `google-auth-library` (scope `firebase.messaging`) and POSTs to the FCM HTTP v1 `messages:send` endpoint of the `project_id` inside that JSON.

FCM device rows live in the **same `PushSubscription` class** as web-push rows but carry `platform: 'fcm'` and `token: <device token>` instead of `endpoint`/`p256dh`/`auth` (web rows have no `platform` field, or `'web'`). Their `NotifPreference` rows are identical to web ones. Because `platform` lives on the pointed-to subscription, both scripts filter fcm vs web **in JS** after the `include('subscription')` query — the web-push loops skip `platform === 'fcm'` rows and vice versa.

A `404`/`UNREGISTERED` or `400`/`INVALID_ARGUMENT` FCM response marks the token dead: the `PushSubscription` row and its `NotifPreference` rows are destroyed, exactly like the web-push 410 cleanup.

## Shared helpers

`lib/message-builder.js` builds reminder + change payloads. `lib/telegram-sender.js` wraps the Telegram HTTP API. `lib/fcm-sender.js` wraps FCM HTTP v1. Keep payload shapes consistent across channels.

## Don't

- Don't add a TypeScript build step here — the workflows run plain `node send-*.js`.
- Don't import from `app/src/` — the workflow doesn't install app deps and won't resolve `@/` aliases.
- Don't change `eventKey` format (`${monthName}-${event.day}-${event.sport}-${event.opponent}`) without migrating the `ReminderLog` table — old entries will stop deduping.
