# DATA-15: Decommission — retire Back4App

**Status:** todo
**Batch:** decommission (`chore/retire-back4app`)
**Depends on:** DATA-10…DATA-13 (+ drained old-build traffic per DATA-12 logs)
**Estimated scope:** Medium

## Context

The last Back4App dependency dies. Re-scoped 2026-08-07: the old plan's
"events.ts becomes an export of D1" is dropped — the web PWA sunsets instead
(its own plan, out of this sprint), so `events.ts` simply stays frozen until
the web app is wound down. Scraper retirement is DATA-17.

## Implementation notes

- Retirement gate: DATA-12 per-store logs show ~zero Parse-only activity for
  2+ weeks → remove the dual-read, export a final Parse data dump for archive,
  then delete the Back4App app.
- Flutter bundled snapshots (`assets/data/*.json`): regenerate from the live
  endpoints (`tool/generate_*.mjs` simplify to a fetch).
- Telegram webhook (`app/src/_worker.ts`) moves its subscriber store from
  Parse to D1 (part of DATA-11's table design — verify before deleting).
- Remove `BACK4APP_*` from: GH secrets usage, wrangler.jsonc secrets_store
  bindings (coordinate — real resource IDs), `.env.example`, docs. Web
  `lib/parse.ts`/`lib/push.ts` Parse usage: freeze, not refactor — the web
  app is sunsetting.
- Update CLAUDE.md (root + data + scraper): new source-of-truth story; kill
  the "events.ts is externally parsed" gotcha (false after DATA-10).
- Update docs/back4app-data-architecture.md status → implemented/pivoted.

## Acceptance criteria

- [ ] A reminders cycle + a Flutter cold start + Telegram subscribe/unsubscribe
      all work with Back4App deleted (staging check before actual deletion)
- [ ] Archive dump of final Parse data stored (location documented)
- [ ] CLAUDE.md files reflect the new architecture
