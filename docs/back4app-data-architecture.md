# Data Platform Architecture Plan

Status: **proposal** (2026-08-05). Goal: move fixtures, squads/players, and statistics
into a managed database as the primary data store, support historical
(multi-season) data, and pave the way for Payload CMS as the editorial layer.

Two candidate architectures are documented:

- **Option A (§1–§10)**: Back4App (Parse) as the datastore, Payload synced on top.
- **Option B (§11)**: Cloudflare-native — Payload CMS on Workers + D1 + R2, the
  existing Worker serving the JSON API straight from the same D1 database.
  **Recommended if Payload CMS is a firm goal**, because it eliminates Option A's
  dual-store sync entirely. Option A remains the better choice only if the CMS
  step might be skipped (Back4App's free Admin App covers basic editing).

## 1. Where we are today

- **Fixtures** live in git: `app/src/data/events.ts`, month-bucketed `SportEvent`
  literals, regenerated wholesale by the scraper. Consumers: the React app (build-time
  import), `generate-calendar.ts` (ICS), the reminders cron (regex + `new Function`
  eval — fragile by design), the post-scrape notifier, and the scraper's own merge step.
- **Squad** lives in git: `app/src/data/players.ts` (69 `Player` records, manual,
  with an alias system reconciling inconsistent name forms in match detail).
- **Statistics** are almost all *derived*: pure functions over events, computed
  client-side (web `lib/stats.ts` etc., Flutter `logic/*.dart` ports). The only
  external stats are FotMob league table / top scorers / rankings — live-fetched on
  the web, and currently **empty placeholders** in the Flutter stats page.
- **Back4App today** holds only notification infra: `PushSubscription`,
  `NotifPreference`, `TelegramSubscriber`, `ReminderLog`. No schema-as-code, no
  Cloud Code; CLPs exist only as dashboard state. Four access styles already exist:
  web Parse JS SDK (JS key), Flutter hand-rolled REST client (JS key, write-only),
  Cloudflare Worker REST (REST key), GitHub Actions crons (master key).
- **Flutter (the go-forward app)** reads everything as JSON over HTTP:
  `https://red-rebels.com/events.json` + `/players.json` (static build artifacts
  served by the Worker), with bundled asset fallback + file cache for offline.
  News comes from the solosalamina.com WordPress API.

## 2. Goals

1. Back4App classes become the source of truth for fixtures, squad, and stats inputs.
2. First-class historical data: multiple seasons of matches and player records.
3. Kill the `new Function`-on-`events.ts` hazard in the cron.
4. Keep the Flutter offline-first behaviour (bundled snapshot → cache → network).
5. Keep already-shipped Flutter builds working (they hit fixed JSON URLs).
6. Leave a clean seam for Payload CMS to become the editorial write path.

## 3. Target data model (Parse classes)

All content classes get CLP: public `get/find/count`, **no** public
`create/update/delete/addField` (master key / Admin role only). Client-side rows
are world-readable anyway (JS key is public), so nothing secret goes in these classes.

### Season
| Field | Type | Notes |
|---|---|---|
| `code` | String, unique | `"2026-27"` |
| `startYear` / `endYear` | Number | replaces `SEASON_START_YEAR/END_YEAR` constants |
| `isCurrent` | Boolean | exactly one true |

### Team
Canonical opponent registry — collapses the Greek-uppercase / mixed-case /
English three-name problem into one row.
| Field | Type | Notes |
|---|---|---|
| `slug` | String, unique | e.g. `"omonoia"` — same keys as `i18n fotmob.teams.*` |
| `nameEl` | String | canonical Greek uppercase (today's `opponent` strings) |
| `nameEn` | String | from i18n tables |
| `shortName?` | String | |
| `logoUrl?` | String | keep pointing at hosted `/images/team_logos/*.webp` for now |
| `aliases` | Array<String> | scraper-source spellings (FotMob/DataProject EN names) |
| `sports` | Array<String> | which sports we meet them in |
| `fotmobId?` | Number | |

Seed source: `lib/translate.ts` `GREEK_TO_TEAM_KEY` (~55 entries) + i18n names.

### Fixture
One class for all sports **including meetings** (`sport: 'meeting'`, title in
`opponentName`). Match detail stays embedded (Parse Array/Object fields) — it is
display data, always consumed whole; player-level queryability comes from
`Appearance` (below), not from normalizing these arrays.

| Field | Type | Notes |
|---|---|---|
| `season` | Pointer→Season | |
| `sport` | String | `football-men \| volleyball-men \| volleyball-women \| meeting` |
| `kickoff` | Date (UTC) | replaces `day` + month bucket + `time` string |
| `dateTbd` | Boolean | CFA draw fixture; `kickoff` = matchday-window start |
| `timeTbd` | Boolean | replaces today's `time: ""` convention |
| `location` | String | `home \| away` |
| `opponent?` | Pointer→Team | null for meetings |
| `opponentName` | String | denormalized Greek canonical — display + legacy keys |
| `venue?` / `status` / `score?` / `penalties?` / `duration?` | String | as today |
| `competition?` | String | `league \| cup \| friendly` |
| `matchday?` | Number | |
| `reportEN?` / `reportEL?` | String | |
| `scorers?` / `bookings?` / `subs?` / `sets?` / `vbScorers?` | Array | embedded, same shapes as `types/events.ts` |
| `lineup?` | Object | `{home: [], away: []}` |
| `eventKey` | String, unique index | `${monthName}-${day}-${sport}-${opponentName}` — **must keep the legacy format** so `ReminderLog` dedup and push deep-links survive the migration |
| `source` | String | `scraper \| manual` |
| `locked` | Boolean | manual edit protection — scraper must not clobber (mirrors today's "played events untouched / manual additions preserved" merge rules) |

Indexes: `(season, sport, kickoff)`, `eventKey` unique, `status`.

### Player
Career-level identity (season-specific facts move to SquadMembership).
| Field | Type | Notes |
|---|---|---|
| `slug` | String, unique | today's `key`, e.g. `alberto_varo_lara` |
| `sport` | String | |
| `nameEl` / `nameEn` | String | |
| `position` / `subPosition?` | String | |
| `dateOfBirth?` / `nationality?` | String | |
| `photoUrl?` | String | |
| `aliases` | Array<String> | every raw name form seen in match detail — load-bearing for stats resolution |

### SquadMembership
The historical-squad primitive: who was in which squad, when, with what number.
| Field | Type |
|---|---|
| `player` | Pointer→Player |
| `season` | Pointer→Season |
| `sport` | String |
| `shirtNumber?` | Number |
| `active` | Boolean |
| `joinedDate?` / `leftDate?` | Date |

Today's `players.ts` `active`/`joinedDate`/`leftDate`/`shirtNumber` fields migrate here.

### Appearance (phase-in; enables historical player stats)
One row per player per match — makes "all goals by X across seasons" a query
instead of an eval-all-events aggregation.
| Field | Type |
|---|---|
| `fixture` | Pointer→Fixture |
| `player` | Pointer→Player |
| `season` | Pointer→Season (denormalized) |
| `appearance` | String `start \| sub \| none` |
| `goals` / `penaltyGoals` / `ownGoals` | Number |
| `yellowCards` / `redCards` | Number |
| `vbPoints?` | Number (volleyball) |

Populated by a materializer script that ports `aggregateSquadStats`'s alias
resolution (currently client-side in `lib/football-stats.ts` / `logic/squad_stats.dart`)
to run at write time. Current-season stats can keep being computed on-device;
Appearance is what makes **closed seasons** queryable without shipping their raw events.

### StatSnapshot
Replaces client-side FotMob fetching (and fills the Flutter stats-page placeholders).
| Field | Type | Notes |
|---|---|---|
| `season` | Pointer→Season | |
| `sport` | String | |
| `kind` | String | `league-table \| top-scorers \| league-rankings \| venue` |
| `payload` | Object | the parsed FotMob shapes (`LeagueTableData`, etc.) |
| `fetchedAt` | Date | |

Written by a scheduled GitHub Action (reusing `lib/fotmob.ts` parsers) every few
hours; apps read the snapshot. One row per `(season, sport, kind)`, upserted.

### What we deliberately do NOT store
Derived team statistics (`FormattedStats`, `VolleyballFormattedStats`, form,
streaks, H2H…). They are cheap pure functions over fixtures and would go stale
in a stored form. Exception: for **archived seasons** we may materialize a
`PlayerSeasonTotals`-style rollup later; decide when the first season closes.

## 4. Read path (serving architecture)

**Recommended: keep the Worker as a thin cached API in front of Back4App.**

- `GET /events.json`, `GET /players.json` become **dynamic Worker routes** that
  query Back4App REST (REST key from Secrets Store, same pattern as the Telegram
  webhook) and reshape rows into the *existing* JSON contract, cached at the edge
  (Cache API, ~5 min TTL).
- Why not direct Parse reads from Flutter:
  1. **Shipped builds keep working** — every installed app already polls those URLs;
     re-backing them means live data on day one, no forced app update.
  2. **Quota protection** — edge caching keeps Back4App request volume near zero
     regardless of app installs (free/MVP tier friendly).
  3. Parse keys stay off the read path; the JSON contract stays testable.
- Flutter change required: **none initially**. Later, optionally add query support
  to `ParseClient` (it is write-only today) for features that want richer queries
  or LiveQuery — not needed for parity.
- New endpoints as needed: `/api/seasons/<code>/events.json` for historical seasons,
  `/api/stats.json` (StatSnapshot payloads) for the stats page placeholders.
- Optional win: a dynamic `/calendar.ics` Worker route (port `ics-core.ts`) so
  subscribed calendars update without a site deploy.

## 5. Write path & conflict rules

Writers, in order of arrival:
1. **Scraper** (GH Actions, master key REST): upserts Fixtures by `eventKey` /
   TBD-window matching. Port the existing merge rules verbatim:
   - `status: 'played'` rows are never overwritten by a scrape;
   - rows with `locked: true` or `source: 'manual'` are never clobbered;
   - `dateTbd` confirmation = match by `sport + opponent` within ±10 days, then
     set real `kickoff`, clear flag (and **rewrite `eventKey`** — log the change
     so notification deep-links can be reasoned about);
   - enrichment (scorers/lineups/sets) only fills, never deletes.
2. **Humans**: Back4App **Admin App** (free, spreadsheet-style UI over the classes)
   until Payload lands. Manual edits set `source: 'manual'` / `locked: true`.
3. **Payload CMS** (phase 5): becomes the single write entry point — see §7.

Change detection for notifications (`send-notifications.js` today reads the
scraper's `changes.json`): keep that mechanism; the scraper computes the same
change log from the pre-upsert query results.

## 6. Consumer cutover map

| Consumer | Today | After |
|---|---|---|
| Flutter repositories | static `events.json`/`players.json` | same URLs, dynamically served from Back4App (no app change) |
| `send-reminders.js` cron | regex + `new Function` over checked-out `events.ts` | Parse query: `Fixture where status='upcoming' AND kickoff in window` — deletes the eval hazard and the repo checkout; `eventKey` field keeps `ReminderLog` dedup intact |
| `send-notifications.js` | scraper's `changes.json` | unchanged (changes.json still produced) |
| Scraper merge step | reads `events.ts` back | queries Back4App |
| `generate-calendar.ts` (ICS) | imports `events.ts` at build | fetch from Worker/Parse at build — or replaced by dynamic `/calendar.ics` |
| React web app | build-time import | **leave on `events.ts` until sunset**; keep a small Parse→`events.ts` export script so the generated file stays truthful during transition |
| Flutter bundled assets | generated from `events.ts`/`players.ts` literals | generated from the JSON endpoints (simpler than today's `new Function` extraction) |

## 7. Payload CMS (next step)

Research conclusions (mid-2026):
- Payload v3 is MIT/free, **Next.js-native**, with Mongo (Mongoose), Postgres
  (Drizzle) and SQLite adapters; REST + GraphQL auto-generated; rich hook system.
- **Pointing Payload at Parse's own MongoDB collections is a dead end.** Parse
  stores string `_id`s, `_created_at`/`_updated_at`, `_p_field` pointers,
  `_rperm`/`_wperm` ACL arrays and a `_SCHEMA` registry; Payload's adapter owns
  its schema and cannot adopt that format. No prior art exists for Payload+Parse.
- Back4App *does* expose the Mongo connection string on all plans, and Back4App
  **Containers** can host a Next.js/Payload instance (paid tier; 256 MB free tier
  is too small) — but neither changes the verdict above.

**Recommended pattern: Payload as write master, Parse as serving replica.**
- Payload self-hosted (Back4App Containers paid tier, or Vercel/small VPS) with
  its **own** database (MongoDB Atlas M0 free tier is sufficient at this scale).
- Payload collections mirror §3 (Seasons, Teams, Fixtures, Players,
  SquadMemberships) — same field names, so sync is mechanical.
- `afterChange`/`afterDelete` hooks upsert/delete the mirrored Parse object via
  REST with the master key. Store `parseObjectId` on the Payload doc; guard hook
  recursion with `context`; add a tiny outbox collection + retry for failed syncs
  (dual-write drift is the known pitfall of this pattern).
- **The scraper re-points to Payload's REST API** (API-key auth) instead of Parse.
  That restores a single write path: scraper + humans → Payload → (hooks) → Parse
  → (Worker cache) → apps. No two-way sync ever needed.
- Apps and crons keep reading Parse/Worker exactly as in §4 — Payload's
  availability is never on the app-serving critical path.

**Cheaper alternative to evaluate first:** Back4App's built-in Admin App may cover
"edit fixtures and squads in real time" with zero extra infrastructure. Payload
earns its keep when richer editorial features (drafts, media library, news
authoring — potentially replacing the WordPress news source) are wanted.

## 8. Migration phases

**Phase 0 — Schema as code** (~½ day)
New `.github/scripts/back4app-schema.js` (master key, Parse Schema REST API):
idempotently creates all §3 classes with CLPs (`get/find/count: {"*": true}`,
everything else `{}`) and indexes. Run manually via workflow_dispatch.

**Phase 1 — Seed + historical backfill** (~1 day)
- Seed script: parse `players.ts` + `events.ts` + `translate.ts` tables →
  Teams, Season 2026-27, Fixtures, Players, SquadMemberships.
- **Historical data is already in git**: check out the last pre-reset revision of
  `events.ts` (season 2025-26 had full football + volleyball data incl. sets,
  scorers, lineups) and run the same seed for Season 2025-26. Repeat for any
  earlier season revisions worth keeping.
- Parity check script: Parse rows → regenerate month-bucket JSON → diff against
  the source files.

**Phase 2 — Dual write** (~½ day + one scrape cycle of soak)
Scraper gains a `back4app-sync` step (master key via GH secrets, already present):
after writing `events.ts` it upserts Fixtures/Teams. `events.ts` remains the
consumer-facing truth; parity check runs in the workflow.

**Phase 3 — Read cutover** (~1–2 days)
- Worker: dynamic `/events.json` + `/players.json` (edge-cached) from Parse.
- Cron: `send-reminders.js` switches to Parse queries (eventKey preserved).
- StatSnapshot writer Action + `/api/stats.json`; Flutter stats placeholders can
  then be filled from local data + snapshots.
- Flutter: verify against the dynamic endpoints; regenerate bundled snapshots.

**Phase 4 — Back4App is the store** (~½ day)
Scraper writes only to Back4App; `events.ts` becomes an *export* (small script,
keeps the web app + ICS build working until sunset). Remove the `new Function`
consumers. Season bump = new Season row (+ scraper URL/ID update as today).

**Phase 5 — Payload CMS** (separate project, ~2–4 days)
Per §7: stand up Payload, import from Parse, wire sync hooks + outbox, re-point
the scraper, retire Admin App editing. Decision points: hosting (Containers paid
vs Vercel), DB (Atlas M0 vs Neon Postgres), whether news moves from WordPress
into Payload.

## 9. Risks & mitigations

- **`eventKey` stability**: reminder dedup + FCM deep-links key on
  `month-day-sport-opponent`. Keep the exact format and the Greek opponent
  strings; date-TBD confirmation changes the key (it already does today when the
  scraper corrects `day`) — same blast radius as now, no regression.
- **World-writable data**: JS key is public, so CLPs are the only wall. Phase 0
  must land before any data does; verify with an anonymous-write smoke test.
- **Dual-write drift** (phases 2, and 5's Payload→Parse sync): parity check in CI;
  outbox + retry in the Payload hooks.
- **Back4App quotas**: edge caching in the Worker keeps request volume ~constant;
  budget for the MVP plan (~$15/mo) once Back4App is on the read path.
- **Offline-first**: unchanged — bundled snapshot → file cache → network; the
  network layer just gets a different origin server.
- **Timezones**: store `kickoff` as UTC; Cyprus local time is presentation-only.
  `timeTbd` replaces the `time: ""` convention (the cron already skips those).
- **Volleyball**: zero volleyball fixtures in the current file (season reset);
  schema supports them fully — backfill 2025-26 proves it.

## 10. Open decisions (Option A)

1. Worker-cached JSON endpoints (recommended) vs direct Parse reads from Flutter.
2. Ship `Appearance` rows in phase 1, or defer until the first season archives.
3. Payload vs staying on Back4App Admin App (cost/benefit call at phase 5).
4. Payload hosting + DB choice, and whether news authoring moves into Payload.

---

## 11. Option B — Cloudflare-native: Payload + D1 + R2, no Back4App

### Why it is architecturally cleaner

Option A's weakest joint is the Payload→Parse sync (hooks + outbox + drift
monitoring): two databases holding the same data, held together by custom code.
Option B has **one database**:

```
scraper (GH Actions) ──REST──▶ Payload (Workers + OpenNext) ──▶ D1 ◀── rrcalendar Worker ──▶ apps
humans ──admin UI────▶                                          R2 (photos/logos)
```

- Payload officially supports this exact stack: an official Cloudflare template
  runs Payload on Workers via the OpenNext adapter, with a D1 database adapter
  (Drizzle/SQLite-based) and an R2 storage adapter. Cloudflare runs Cloudflare
  TV's own CMS on it (~2,000 episodes, 70k assets), so it is production-tested.
- The **same D1 database is bound into two Workers**: the Payload admin/API
  Worker (write path) and the existing `rrcalendar` Worker (read path). Payload's
  availability is never on the app-serving critical path.
- No sync code, no outbox, no drift. Single write entry point from day 1:
  scraper + humans → Payload → D1.
- One vendor, and one you already run (domain, Worker, Secrets Store all exist).

### Data model translation

The §3 class model carries over nearly 1:1 as Payload collections → D1 tables:
`seasons`, `teams`, `fixtures`, `players`, `squad_memberships`, `appearances`,
`stat_snapshots`. Relational SQL fits `Appearance`/history queries *better* than
Parse pointers. Match-detail arrays (scorers/lineups/sets) become Payload
`array` fields (JSON columns in D1) — same embedded philosophy as §3.
Player photos and team logos become Payload upload collections backed by R2
(an upgrade over hard-coded webp paths). News can later move from WordPress
into a Payload `posts` collection — one editorial system for everything.

### Serving path

`rrcalendar` Worker binds the D1 database and serves the existing contract
(`/events.json`, `/players.json`, plus `/api/seasons/…`, `/api/stats.json`,
optional dynamic `/calendar.ics`) with edge caching — shipped Flutter builds
keep working with zero app update, same as Option A.

**Caveat — schema coupling**: reading D1 directly couples the reader to
Payload's Drizzle-generated table layout (relation tables; `_v` versions tables
if drafts are enabled). Mitigations: disable drafts/versions on the data
collections (they're not editorial prose), pin the Payload version and treat
upgrades as schema-reviewed changes, and keep a CI parity test that diffs the
Worker's JSON output against Payload's REST output. Fallback if this ever gets
painful: proxy Payload REST with edge caching instead (simpler, but puts the
Payload Worker on the read path).

### Real-time match updates from the Payload dashboard

The primary editorial use case: during a match, an admin updates the score and
match data in Payload's UI and apps see it near-instantly. Four design
consequences:

1. **The fixture model needs a live state.** Today `status` is only
   `played | upcoming` — there is no way to represent "match in progress with a
   provisional score". Add `live` to the status enum in the new schema (kept out
   of `events.ts` exports for legacy consumers, mapped to `upcoming` there).
   Flow: admin flips fixture to `live` at kickoff, edits `score` (and optionally
   `scorers`) as the match runs, flips to `played` at full time. Stats code
   continues to count only `played`.
2. **Cache invalidation, not short TTLs.** A fixed 5-min edge cache would defeat
   live editing. Use purge-on-write: a Payload `afterChange` hook on fixtures
   calls the Cloudflare cache-purge API (or bumps a version key the Worker
   embeds in its cache key). Result: reads are cached indefinitely *until* an
   edit lands, then fresh within seconds. A short TTL (30–60s) on a dedicated
   `/live.json` endpoint is the simpler fallback if purge plumbing is annoying.
3. **App polling cadence.** Flutter syncs on launch/resume, throttled to 5 min —
   fine for fixtures, useless for live scores. Add a live-mode poll: when any
   fixture is `live` (or within its match window), poll `/live.json` every
   30–60s while the app is foregrounded. Cheap against the edge cache.
4. **Real-time push becomes possible.** `NotifPreference.notifyScoreUpdates`
   exists but today only fires post-scrape. The same `afterChange` hook can
   enqueue a score-update push (goal notifications, effectively) — optional,
   later phase, but this architecture is what makes it feasible.

**Scraper reconciliation with live edits**: manual live scores are provisional;
when the admin flips to `played` the result is final and the scraper's existing
rule applies (never overwrite a played fixture's result; enrichment only *fills*
detail arrays — scorers/lineups/sets — it never replaces manual entries).
D1 read replicas add sub-second lag on the read path; irrelevant at this cadence.

### The one genuinely fiddly part: push infrastructure must move too

Removing Back4App entirely means the four notification classes become D1 tables
(`push_subscriptions`, `notif_preferences`, `telegram_subscribers`,
`reminder_logs`). The catch: **shipped Flutter builds and the web Settings page
write to Back4App directly** (JS key). Cutover plan:

1. Add Worker endpoints `/api/push/register|prefs|unregister` writing to D1
   (a security upgrade — no more world-readable/writable-by-JS-key classes;
   the Worker validates every write).
2. One-time export of existing Back4App subscription rows into D1.
3. Reminder sender reads D1 only; **keep Back4App alive read-only for a
   transition window** so pref edits from old app builds aren't silently lost —
   either mirror them in during the window or accept the gap and note it in
   release comms. Retire Back4App when old-build traffic dies off.
4. Flutter: replace `parse_client.dart` with the Worker endpoints (simpler than
   what it replaces); web app likewise if it still matters pre-sunset.

The reminders sender itself can stay a GH Actions cron initially (query D1 via a
token-authed Worker admin endpoint or the D1 HTTP API), and later move onto a
**Cloudflare Cron Trigger** on the Worker (Telegram is trivial; Web Push VAPID
signing and FCM OAuth are both doable with WebCrypto) — at which point the
`.github/scripts` Node project retires entirely.

### Limitations to accept

- Payload's D1 adapter is the newest of its adapters — less battle-tested than
  Postgres/Mongo; GraphQL is incomplete on Workers (we only need REST).
- D1 has no interactive transactions and a 10 GB cap — irrelevant at this scale
  (decades of seasons fit in megabytes).
- Payload admin on Workers needs the Workers paid plan (~$5/mo) for CPU/bundle
  headroom; D1/R2 free tiers are ample. Net cheaper than Option A's likely
  Back4App MVP plan + Payload hosting.

### Revised phases (Option B)

0. Stand up Payload from the official Cloudflare template (Workers + D1 + R2);
   define collections (§3 model); disable drafts on data collections.
1. Seed via Payload Local/REST API — same sources as §8 phase 1, including the
   git-history backfill of season 2025-26.
2. Bind D1 into `rrcalendar`; implement dynamic `/events.json` + `/players.json`
   (contract unchanged); parity check against generated files.
3. Scraper → Payload REST writes, porting the merge rules (played-locked,
   manual-locked, TBD confirmation, change log for notifications).
4. Cron cutover + push-infra migration (the careful phase — see above).
5. StatSnapshot writer; retire `events.ts` as store (export for web until
   sunset); retire Back4App once old-build traffic drains.

### Open decisions (Option B)

1. Worker reads D1 directly (recommended) vs proxies Payload REST.
2. Timing/comms for the push-infra cutover (the only user-visible risk).
3. Reminders: keep GH Actions initially vs move straight to Cron Triggers.
4. Whether news moves into Payload (retiring the WordPress dependency).
