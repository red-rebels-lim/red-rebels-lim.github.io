# Data Platform Tracker — Cloudflare-native (Payload + D1 + R2)

Implements **Option B** of [docs/back4app-data-architecture.md](../docs/back4app-data-architecture.md):
one D1 database as the source of truth for fixtures/squads/stats inputs, written
through Payload CMS (admin dashboard + scraper API), read directly by the
`rrcalendar` Worker serving the existing JSON contract. Back4App retires at the end.

Repo-root tracker because the work spans `payload/` (new), `app/` (Worker),
`.github/scripts/` (crons), and `flutter/`.

## Rules (every task)

- One branch/PR **per batch**. Never push to `main`.
- Gates: whatever the touched project enforces — `app/`: lint + test + build
  (pre-push hook); `flutter/`: `flutter analyze && flutter test`; `payload/`:
  its own lint/test once scaffolded (DATA-01 defines them).
- The JSON contract of `/events.json` + `/players.json` is **frozen** — parity
  checks (DATA-06) guard every cutover step.
- `eventKey` format `${monthName}-${day}-${sport}-${opponentName}` is frozen
  (ReminderLog dedup + FCM deep-links depend on it).
- Cloudflare access required from DATA-03 onward: `npx wrangler login` or a
  `CLOUDFLARE_API_TOKEN` with Workers+D1+R2 permissions.

## Batch → branch map

| Batch (branch) | Tasks | Gate |
|---|---|---|
| scaffold (`feat/payload-cms`) | DATA-01…DATA-03 | DATA-03 needs Cloudflare auth |
| seed (`feat/payload-seed`) | DATA-04…DATA-06 | parity green vs generated files |
| read-path (`feat/worker-d1-api`) | DATA-07…DATA-08 | parity green in CI; shipped-app contract untouched |
| write-path (`feat/scraper-payload`) | DATA-09…DATA-10 | one scrape cycle of dual-write soak |
| push-infra (`feat/push-on-d1`) | DATA-11…DATA-14 | transition window before DATA-15 |
| decommission (`chore/retire-back4app`) | DATA-15 | old-build traffic drained |

## Tasks

| ID | Title | Batch | Status | Depends on |
|----|-------|-------|--------|------------|
| DATA-01 | Scaffold Payload on Workers (template, local dev) | scaffold | done (PR #120) | - |
| DATA-02 | Payload collections: seasons/teams/players/fixtures/… | scaffold | done (PR #120) | DATA-01 |
| DATA-03 | Provision D1+R2, deploy Payload Worker, admin user ⚠️ CF auth | scaffold | done (PR #120) | DATA-02 |
| DATA-04 | Seed script: current season from TS sources | seed | done (PR #122) | DATA-02 |
| DATA-05 | Historical backfill: season 2025-26 from git history | seed | done (PR #122) | DATA-04 |
| DATA-06 | Parity checker (D1 → legacy JSON contract diff) | seed | done (PR #122) | DATA-04 |
| DATA-07 | rrcalendar: bind D1, dynamic /events.json + /players.json | read-path | done (PR #123, verified in prod) | DATA-03, DATA-06 |
| DATA-08 | Live updates: `live` status, /live.json, purge-on-write | read-path | done (PR #123, verified in prod) | DATA-07 |
| DATA-09 | Scraper → Payload REST writes (merge rules, dual-write) | write-path | in progress | DATA-03 |
| DATA-10 | Reminders cron: fetch API instead of eval'ing events.ts | write-path | todo | DATA-07 |
| DATA-11 | Push tables in D1 + Worker /api/push/* + Back4App export | push-infra | todo | DATA-07 |
| DATA-12 | Reminder sender reads D1 subscriptions (dual-read window) | push-infra | todo | DATA-11 |
| DATA-13 | Flutter: parse_client → Worker push endpoints | push-infra | todo | DATA-11 |
| DATA-14 | Flutter: live score UI + foreground polling | push-infra | todo | DATA-08 |
| DATA-15 | Decommission: events.ts export-only, retire Back4App | decommission | todo | DATA-09…DATA-13 |

## Deferred (not in this sprint)

- StatSnapshot writer (FotMob standings/top scorers → D1) + `/api/stats.json`
  — fills the Flutter stats placeholders; schedule after read-path lands.
- Real-time goal push notifications from the Payload afterChange hook.
- Dynamic `/calendar.ics` Worker route (replaces build-time ICS generation).
- News authoring moves from WordPress into Payload.
- Reminders move from GH Actions cron to Cloudflare Cron Triggers.
