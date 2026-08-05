# DATA-05: Historical backfill — season 2025-26 from git history

**Status:** todo
**Batch:** seed (`feat/payload-seed`)
**Depends on:** DATA-04
**Estimated scope:** Medium

## Context

The first proof of the historical-data goal: the full 2025-26 season (football +
volleyball, with sets/scorers/lineups) exists in git history — the last revision
of `events.ts` before the July 2026 season reset.

## Implementation notes

- Locate the pre-reset revision: `git log --oneline -- app/src/data/events.ts`
  around late June / early July 2026; `git show <sha>:app/src/data/events.ts`.
- Extend the seed script with `--season 2025-26 --events-file <path>` inputs;
  create the Season row (isCurrent: false); SEASON constants for year mapping
  come from the same historical revision of `constants.ts`.
- Players: 2025-26 memberships for the players.ts entries whose joined/left
  dates place them in that season (the roster deliberately kept 25/26 players
  for exactly this).
- Volleyball fixtures prove the sets/vbScorers array shapes end-to-end.
- Expect opponent/team gaps (relegated/renamed teams) — extend the teams seed
  data as needed; same loud-failure rule as DATA-04.

## Acceptance criteria

- [ ] Season 2025-26 fixtures queryable, including volleyball with set scores
- [ ] No cross-season data bleed (current-season queries unchanged)
- [ ] Re-run idempotent
