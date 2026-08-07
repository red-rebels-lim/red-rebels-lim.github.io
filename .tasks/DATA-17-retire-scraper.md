# DATA-17: Retire the scraper

**Status:** todo
**Batch:** retire-scraper (`chore/retire-scraper`)
**Depends on:** DATA-16 (payload-sync.ts needs its new home first)
**Estimated scope:** Small/Medium

## Context

Decision 2026-08-07: the scraper retires completely — fixtures, results and
detail are entered by humans (dashboard / MCP). Its write target (`events.ts`)
is frozen legacy anyway, and its season-scoped URLs were already stale (the
2026-08-06 soak incident). No scout/report mode — full retirement.

## Implementation notes

- **First relocate the keepers** out of `app/scripts/scraper/`:
  - `payload-sync.ts` + `payload-sync.test.ts` → wherever DATA-16 puts the
    MCP foundation.
  - `feed-parity.ts` → optional; delete unless DATA-16 wants it as a
    diagnostic.
- Delete `.github/workflows/scrape.yml` and `app/scripts/scraper/` (git
  history preserves everything).
- `send-notifications.js` (new-fixture push notifications) consumed the
  scraper's `changes.json` — decide its future: retire with the scraper, or
  re-point at Payload afterChange hooks (deferred item). Don't leave it
  half-wired.
- Update: root CLAUDE.md (scraper sections, three-name-maps gotcha, directory
  map), `app/src/data/CLAUDE.md` (events.ts regeneration warnings),
  `.claude/skills/` — `run-scraper-locally` and `gather-season-schedule`
  become obsolete; `add-team` simplifies (teams now live in the DB).
- Remove the `PAYLOAD_API_KEY` GH secret only if DATA-16 doesn't reuse it.

## Acceptance criteria

- [ ] No scraper code or workflow remains; payload-sync.ts lives on in its
      new home with tests green
- [ ] CLAUDE.md files + skills no longer instruct anyone to run a scraper
- [ ] Notification path for new fixtures has an explicit answer (retired or
      hook-driven)
