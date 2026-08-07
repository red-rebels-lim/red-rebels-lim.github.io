# Data Platform Tracker — Cloudflare-native (Payload + D1 + R2)

Started as **Option B** of [docs/back4app-data-architecture.md](../docs/back4app-data-architecture.md);
**re-scoped 2026-08-07**: the D1 database (written through the Payload admin
dashboard, later an MCP tool over the Payload API) is the **human-managed
source of truth**. No script or workflow writes to it. The `rrcalendar`
Worker serves the JSON feeds from D1; **Flutter is the product** — the web
PWA will sunset (no further investment), the scraper is retired, and
`events.ts` is a frozen legacy artifact for the remaining web/cron readers
until they move off it. Back4App retires at the end.

Repo-root tracker because the work spans `payload/`, `app/` (Worker),
`.github/scripts/` (crons), and `flutter/`.

## Rules (every task)

- One branch/PR **per batch**. Never push to `main`.
- Gates: whatever the touched project enforces — `app/`: lint + test + build
  (pre-push hook); `flutter/`: `flutter analyze && flutter test`; `payload/`:
  lint + int tests + local-D1 parity chain (CI `payload` job).
- **No script/workflow writes to production D1** — human writes only
  (dashboard / MCP). Exception: *runtime app data* written by the Worker on
  behalf of users (push subscriptions, DATA-11) is fine — the rule protects
  editorial sports data.
- The JSON contract of `/events.json` + `/players.json` is **frozen** — the
  CI parity chain guards the Worker's reshape against a local seeded D1.
- `eventKey` format `${monthName}-${day}-${sport}-${opponentName}` is frozen
  (ReminderLog dedup + FCM deep-links depend on it).
- Cloudflare access: `npx wrangler login` or `CLOUDFLARE_API_TOKEN`
  (Workers+D1+R2). Payload Worker deploys via Workers Builds on merge.

## Batch → branch map

| Batch (branch) | Tasks | Gate |
|---|---|---|
| scaffold (`feat/payload-cms`) | DATA-01…DATA-03 | ✅ done |
| seed (`feat/payload-seed`) | DATA-04…DATA-06 | ✅ done |
| read-path (`feat/worker-d1-api`) | DATA-07…DATA-08 | ✅ done, verified in prod |
| write-path (`feat/scraper-payload`) | DATA-09 | ✅ done, then superseded by the 2026-08-07 pivot |
| push-infra (`feat/push-on-d1`) | DATA-11…DATA-13 | transition window before Back4App retirement |
| cron-data (`feat/cron-api`) | DATA-10 | reminders fire from D1 data, not stale events.ts |
| flutter-live (`feat/flutter-live-mode`) | DATA-14 | — |
| mcp (`feat/payload-mcp`) | DATA-16 | plugin spike reviewed before any custom build |
| retire-scraper (`chore/retire-scraper`) | DATA-17 | payload-sync.ts relocated first |
| decommission (`chore/retire-back4app`) | DATA-15 | old-build traffic drained |

## Tasks

| ID | Title | Batch | Status | Depends on |
|----|-------|-------|--------|------------|
| DATA-01 | Scaffold Payload on Workers (template, local dev) | scaffold | done (PR #120) | - |
| DATA-02 | Payload collections: seasons/teams/players/fixtures/… | scaffold | done (PR #120) | DATA-01 |
| DATA-03 | Provision D1+R2, deploy Payload Worker, admin user | scaffold | done (PR #120) | DATA-02 |
| DATA-04 | Seed script: current season from TS sources | seed | done (PR #122) | DATA-02 |
| DATA-05 | Historical backfill: season 2025-26 from git history | seed | done (PR #122) | DATA-04 |
| DATA-06 | Parity checker (D1 → legacy JSON contract diff) | seed | done (PR #122) | DATA-04 |
| DATA-07 | rrcalendar: bind D1, dynamic /events.json + /players.json | read-path | done (PR #123, verified in prod) | DATA-03, DATA-06 |
| DATA-08 | Live updates: `live` status, /live.json, purge-on-write | read-path | done (PR #123, verified in prod) | DATA-07 |
| DATA-09 | Scraper → Payload REST writes (merge rules, dual-write) | write-path | done (PR #127/#129) — superseded by the pivot; payload-sync.ts kept as MCP foundation | DATA-03 |
| DATA-10 | Reminders cron: fetch /events.json instead of eval'ing events.ts | cron-data | todo — reminders (Telegram + FCM) must see dashboard-entered fixtures; events.ts is frozen | DATA-07 |
| DATA-11 | Push tables in D1 + Worker /api/push/* + Back4App export | push-infra | in progress | DATA-07 |
| DATA-12 | Reminder sender reads D1 subscriptions (dual-read window) | push-infra | todo | DATA-11 |
| DATA-13 | Flutter: parse_client → Worker push endpoints | push-infra | todo | DATA-11 |
| DATA-14 | Flutter: live score UI + foreground polling | flutter-live | todo | DATA-08 |
| DATA-15 | Decommission: retire Back4App | decommission | todo | DATA-10…DATA-13 |
| DATA-16 | MCP tool: spike @payloadcms/plugin-mcp, custom fallback on payload-sync.ts | mcp | todo | DATA-03 |
| DATA-17 | Retire the scraper (scrape.yml + code); relocate payload-sync.ts | retire-scraper | todo | DATA-16 (needs payload-sync.ts's new home) |

## Deferred / out of scope

- **Repo split** (decided in principle 2026-08-07, execute after this sprint):
  extract `flutter/` into its own repository (own release cadence/CI; only
  build-time coupling is the two snapshot scripts, to be repointed at the live
  endpoints). Payload + the rrcalendar Worker stay together (shared D1 schema,
  legacy-shape module, parity CI); rename this repo once slimmed. Reads for
  Flutter stay on the thin Worker (frozen contract, edge-cached) — Payload
  REST is the write/MCP interface, not the app feed.

- **Web PWA sunset** — decided in principle (2026-08-07): Flutter is the
  product; no further web investment. The actual wind-down (timeline, what
  happens to red-rebels.com beyond the Worker feeds, ICS consumers) is its
  own plan, NOT part of this sprint. The `rrcalendar` Worker and its JSON
  feeds outlive the web app — Flutter depends on them.
- StatSnapshot writer + `/api/stats.json` — via MCP/dashboard entry once
  DATA-16 lands; fills the Flutter stats placeholders.
- Real-time goal push notifications from the Payload afterChange hook.
- News authoring moves from WordPress into Payload.
- Reminders move from GH Actions cron to Cloudflare Cron Triggers.
