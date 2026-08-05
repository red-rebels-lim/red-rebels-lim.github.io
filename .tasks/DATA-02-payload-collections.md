# DATA-02: Payload collections — seasons/teams/players/fixtures

**Status:** todo
**Batch:** scaffold (`feat/payload-cms`)
**Depends on:** DATA-01
**Estimated scope:** Large

## Context

Define the data model from docs/back4app-data-architecture.md §3 (as amended by
§11) as Payload collections. These generate the D1 tables the serving Worker
will read directly — so field names/shapes here ARE the de-facto DB contract.

## Implementation notes

Collections (slugs are table names — keep them boring and singular-free):
- `seasons`: code (unique, e.g. "2026-27"), startYear, endYear, isCurrent.
- `teams`: slug (unique, = i18n `fotmob.teams.*` keys), nameEl (canonical Greek
  uppercase), nameEn, shortName?, aliases[], sports[], fotmobId?, logo (upload).
- `players`: slug (unique, = players.ts `key`), sport, nameEl, nameEn, position,
  subPosition?, dateOfBirth?, nationality?, aliases[], photo (upload).
- `squad-memberships`: player (rel), season (rel), sport, shirtNumber?, active,
  joinedDate?, leftDate?.
- `fixtures`: season (rel), sport, kickoff (date, UTC), dateTbd, timeTbd,
  location, opponent (rel, nullable for meetings), opponentName (denormalized),
  venue?, **status: upcoming | live | played**, score?, penalties?, competition?,
  matchday?, duration?, reportEN?, reportEL?, eventKey (unique — legacy format),
  source (scraper|manual), locked (bool), and embedded arrays: scorers, bookings,
  subs, sets, vbScorers, lineup {home[], away[]} — same member shapes as
  `app/src/types/events.ts`.
- Upload collections `team-logos`, `player-photos` → R2 storage adapter
  (local file storage in dev).

Config rules:
- **No drafts/versions on any data collection** (architecture doc §11 — keeps
  the D1 schema flat for the direct reader).
- Access: admin-only for everything (reads happen via rrcalendar/D1, not the
  Payload API); plus an API-key-auth'd service account for the scraper (used in
  DATA-09).
- `eventKey`: compute in a `beforeChange` hook from kickoff+sport+opponentName
  (Athens/Nicosia month-day semantics — must match `send-reminders.js` exactly).
- Fixtures list view: default sort kickoff desc, columns sport/opponent/score/
  status — this is the live-editing surface, make it comfortable.
- Generate and commit the initial D1 migration.

## Acceptance criteria

- [ ] Local admin can create a season, team, player, membership, and fixture
- [ ] `status` enum includes `live`; eventKey auto-computed and unique
- [ ] No versions/drafts tables in the generated migration
- [ ] Migration committed; collection sanity tests green
