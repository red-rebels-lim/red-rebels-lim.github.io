# DATA-11: Push tables in D1 + Worker /api/push/* + Back4App export

**Status:** implemented (awaiting PR)
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

## Implementation record (2026-08-07)

- Migration `20260807_160000_push_tables` (hand-written, Worker-owned tables
  outside the drizzle snapshots): push_subscriptions, notif_preferences (FK
  cascade), telegram_subscribers (unique chat_id), reminder_logs (UNIQUE dedup
  triple → the DATA-12 sender can INSERT OR IGNORE).
- `app/src/worker/push.ts`: validated handlers + telegram store; routes wired
  in `_worker.ts` with best-effort per-IP rate limiting (Cache API fixed
  window). Worker no longer reads the BACK4APP_* secrets.
- Tests run against a REAL local D1 (getPlatformProxy, throwaway persist dir)
  with DDL extracted from the migration source — schema can't drift (11 tests).
- Export: `payload/scripts/export-back4app-push.ts` generates reviewed SQL;
  a human applies it (`wrangler d1 execute D1 --remote --file …`).

Post-merge checklist:
- [ ] Payload Workers Build applies the migration to production D1
- [ ] Run the export with BACK4APP creds, review counts, apply the SQL file
- [ ] Telegram /start /stop /language smoke against production
- [ ] curl register/prefs/unregister round-trip against production
