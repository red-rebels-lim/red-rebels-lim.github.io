# DATA-11: Push tables in D1 + Worker /api/push/* + Back4App export

**Status:** todo
**Batch:** push-infra (`feat/push-on-d1`)
**Depends on:** DATA-07
**Estimated scope:** Large

## Context

The fiddly phase begins: the four Back4App notification classes become D1
tables, fronted by validated Worker endpoints (a security upgrade — no more
world-readable classes writable with the public JS key).

## Implementation notes

- D1 migration (managed in payload/ migrations dir, but tables are NOT Payload
  collections — plain tables the Worker owns): `push_subscriptions` (web:
  endpoint/p256dh/auth; fcm: platform+token), `notif_preferences` (fields
  mirroring `NotifPreference` incl. reminderHours[], enabledSports[] as JSON),
  `telegram_subscribers`, `reminder_logs` (add the index on eventKey+hoursBefore
  +channel the dedup query needs).
- Worker endpoints in `_worker.ts`: `POST /api/push/register`,
  `PUT /api/push/prefs`, `DELETE /api/push/unregister` — input validation,
  upsert semantics, return ids compatible with what clients persist today
  (Flutter stores objectIds in SharedPreferences — new ids must slot in).
- Telegram webhook handlers switch from Back4App REST to D1 (same file, the
  tgQuery/tgCreate/… helpers become SQL).
- One-time export script: Back4App REST (master key) → D1 rows, preserving
  objectIds as the row ids so existing client-persisted ids keep working.
- Rate-limit lightly (per-IP) — these are unauthenticated public endpoints.

## Acceptance criteria

- [ ] Web + FCM registration round-trips through the new endpoints in wrangler dev
- [ ] Export script migrates all existing rows; counts reconciled against Back4App
- [ ] Telegram /start /stop /language flows work against D1
