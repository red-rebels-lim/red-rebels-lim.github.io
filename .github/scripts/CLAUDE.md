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

## Channels

`send-reminders.js` runs two channels in sequence: Web Push (always) and Telegram (if `TELEGRAM_BOT_TOKEN` is set). Each channel deduplicates per `(eventKey, hoursBefore, channel)` against the Parse class `ReminderLog`.

Reminder tiers: `[24, 12, 2, 1]` hours, ±30-minute window. Subscribers opt in to specific tiers via their `NotifPreference.reminderHours` array.

## Shared helpers

`lib/message-builder.js` builds reminder + change payloads. `lib/telegram-sender.js` wraps the Telegram HTTP API. Keep payload shapes consistent across channels.

## Don't

- Don't add a TypeScript build step here — the workflows run plain `node send-*.js`.
- Don't import from `app/src/` — the workflow doesn't install app deps and won't resolve `@/` aliases.
- Don't change `eventKey` format (`${monthName}-${event.day}-${event.sport}-${event.opponent}`) without migrating the `ReminderLog` table — old entries will stop deduping.
