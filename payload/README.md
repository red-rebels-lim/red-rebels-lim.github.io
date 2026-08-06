# solosalamina-payload

Payload CMS on Cloudflare Workers — the **write layer + admin dashboard** of the
SoloSalamina data platform ([docs/back4app-data-architecture.md](../docs/back4app-data-architecture.md)
§11, tracker in [.tasks/](../.tasks/README.md)).

Scaffolded from Payload's official `with-cloudflare-d1` template
(OpenNext adapter, D1 database, R2 media storage).

Apps never read from this Worker: the `rrcalendar` Worker (`app/src/_worker.ts`)
binds the same D1 database and serves the public JSON API. This project exists
for the admin UI, the scraper's REST write path, and D1 migrations.

## Commands (npm, run from `payload/`)

| Command | What |
|---|---|
| `npm run dev` | Next.js dev server + Payload admin at `http://localhost:3000/admin`, against wrangler's **local** D1/R2 simulators (`.wrangler/state`) |
| `npm run devsafe` | dev with `.next`/`.open-next` caches cleared |
| `npm run migrate:create` | generate a D1 migration after collection changes |
| `npm run migrate` | apply migrations (local unless `NODE_ENV=production`) |
| `npm run lint` / `npm test` | eslint / vitest integration tests |
| `npm run generate:types` | regen `cloudflare-env.d.ts` + `payload-types.ts` |
| `npm run deploy` | migrate remote D1 + build with OpenNext + deploy Worker (**needs wrangler auth**, DATA-03) |

## Local setup

```sh
cp .env.example .env        # then set PAYLOAD_SECRET (openssl rand -hex 32)
npm install
npm run dev                 # first visit to /admin prompts to create a user
```

Local dev needs **no Cloudflare account**: `payload.config.ts` uses wrangler's
`getPlatformProxy` with `remoteBindings` only in production, so D1/R2 are
simulated on disk. Real provisioning/deploy is DATA-03.

## Seeding & parity (DATA-04…06)

```sh
npx payload run scripts/seed.ts     # seed local D1 from app/src TS sources (idempotent)
npx payload run scripts/parity.ts   # verify DB reproduces the frozen JSON contract
```

Prefix with `NODE_ENV=production` to run against remote D1. Historical seasons:
extract `events.ts`/`constants.ts`/`translate.ts`/`i18n/en.json` from git history
and point `SEED_EVENTS`/`SEED_CONSTANTS`/`SEED_TRANSLATE`/`SEED_I18N_EN` at them,
with `SEED_SKIP_PLAYERS=1 SEED_NOT_CURRENT=1` (2025-26 lives at revision
`40f6ae7` — the last pure pre-rollover state). `scripts/lib/legacy-shape.ts` is
the DB→contract reshape shared with the parity checker; the serving Worker
(DATA-07) imports it via `app/src/worker/feeds.ts` and
`scripts/worker-parity.ts` proves its output matches too. eventKey is unique
per **(season, eventKey)** — the legacy key carries no year, so league fixtures
recur across seasons. CI runs migrate → test → seed → parity → worker-parity
on every PR (`payload` job).

## Live match flow (DATA-08)

Dashboard flow during a match, from the fixture's edit page:

1. **Kickoff** — set status to `live`. The fixture appears on `/live.json`;
   `/events.json` keeps reporting it as `upcoming` (the frozen contract has no
   live state).
2. **During the match** — edit `score` (and `sets` for volleyball) as it
   changes. Every save is visible on the public endpoints within seconds.
3. **Full time** — set status to `played` with the final score/detail. Played
   results are final: the scraper (DATA-09) only fills missing detail.

How the propagation works: every write to a data collection (fixtures, teams,
players, squad-memberships, seasons) bumps a `dataVersion` row in `payload_kv`
(`src/lib/dataVersion.ts`) — same D1, no external calls. The rrcalendar Worker
keys its edge cache on that value and memoizes the version lookup for ~10s, so
a poll storm costs O(1) D1 reads and an edit shows up in ≤ ~10s regardless of
the entries' `max-age`. Gotcha: this project's pinned `@payloadcms/db-d1-sqlite`
aliases `upsert` to `updateOne`, so `payload.kv.set` on a **missing** key is a
silent no-op — `bumpDataVersion` creates the row at the db layer the first time.

## Rules

- **Payload version is pinned exactly** (currently 3.82.1). The `rrcalendar`
  Worker reads the Drizzle-generated D1 tables directly, so a Payload upgrade is
  a schema-reviewed change (run parity checks), never a routine bump.
- **GraphQL is disabled** (incomplete on Workers) — REST + Local API only.
- **No drafts/versions on data collections** (DATA-02 onward) — keeps the D1
  schema flat for the direct reader.
- Deploying needs the Workers **paid** plan (free tier's 3 MB bundle limit is
  too small for Payload).
