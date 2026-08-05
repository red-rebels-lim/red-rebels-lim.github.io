# DATA-15: Decommission — events.ts export-only, retire Back4App

**Status:** todo
**Batch:** decommission (`chore/retire-back4app`)
**Depends on:** DATA-09…DATA-13 (+ drained old-build traffic per DATA-12 logs)
**Estimated scope:** Medium

## Context

D1 becomes the sole source of truth. `events.ts` flips from store to export
(kept only for the web app until its sunset + the ICS build). Back4App retires.

## Implementation notes

- Scraper: drop the events.ts write path; `payload-sync` (DATA-09) becomes the
  only write. New export script `payload/scripts/export-events-ts.ts` generates
  `events.ts` + `players.ts`-compatible files from D1 for the web build (plain
  literal format preserved — nothing evals it anymore after DATA-10, but the
  web bundle still imports it until sunset).
- Flutter bundled snapshots (`assets/data/*.json`): regenerate from the live
  endpoints (`tool/generate_*.mjs` simplify to a fetch).
- Back4App retirement gate: DATA-12 per-store logs show ~zero Parse-only
  activity for 2+ weeks → remove dual-read, remove web `lib/parse.ts`/
  `lib/push.ts`/`lib/preferences.ts` Parse usage (or freeze if web sunset lands
  first), export final Parse data dump for archive, then delete the Back4App app.
- Remove `BACK4APP_*` from: GH secrets usage, wrangler.jsonc secrets_store
  bindings (coordinate — real resource IDs), `.env.example`, docs.
- Update CLAUDE.md (root + data + scraper): new source-of-truth story, D1/Payload
  workflow, kill the "events.ts is externally parsed" gotcha (now false).
- Update docs/back4app-data-architecture.md status → implemented.

## Acceptance criteria

- [ ] A scrape cycle + a reminders cycle + a Flutter cold start all work with
      Back4App deleted (staging check before actual deletion)
- [ ] Archive dump of final Parse data stored (location documented)
- [ ] CLAUDE.md files reflect the new architecture
