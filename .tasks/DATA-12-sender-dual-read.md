# DATA-12: Reminder sender reads D1 subscriptions (dual-read window)

**Status:** todo
**Batch:** push-infra (`feat/push-on-d1`)
**Depends on:** DATA-11
**Estimated scope:** Medium

## Context

`send-reminders.js` (and `send-notifications.js`) stop reading Parse classes.
During the transition window, old shipped app builds still write prefs to
Back4App — so the sender dual-reads both stores until that traffic drains.

## Implementation notes

- Access path for GH Actions → D1: token-authed Worker admin endpoint
  (`GET /api/admin/subscriptions`, bearer token in GH secret + Worker secret)
  — keeps the D1 credential surface inside Cloudflare. Alternative (documented
  trade-off): Cloudflare D1 HTTP API with an API token.
- Dual-read: fetch D1 rows + Back4App rows, dedup by subscription id (D1 wins —
  it has the exported superset). Log per-store counts each run to observe the
  drain; the log trend is DATA-15's retirement gate.
- ReminderLog writes go to D1 only (dedup history was exported in DATA-11).
- Dead-subscription cleanup (410s) deletes from the store the row came from.
- FCM/web-push/telegram send logic itself is unchanged — only the
  subscription/preference source moves.

## Acceptance criteria

- [ ] A full cron cycle sends correctly with mixed-store subscribers (test run)
- [ ] No duplicate reminders for a subscriber present in both stores
- [ ] Per-store counts logged; ReminderLog dedup works across the cutover
