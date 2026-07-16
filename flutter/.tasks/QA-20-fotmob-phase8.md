# QA-20: Phase 8 — FotMob blocks (standings, rankings, top scorers, next match)

**Status:** done (PR #94, merged 2026-07-16)
**Batch:** functional-gaps (`fix/qa-functional`) — or its own PR; this is plan **Phase 8**
**Register rows:** STA-07 (P2), STA-06 football half (P2)
**Depends on:** QA-09 (layout slots), QA-11 (shared TopScorers widget)
**Estimated scope:** Large — this is an entire roadmap phase surfaced by QA

## Context

The web football stats tab renders four FotMob-powered blocks the app lacks entirely
(captures `08b/08c-*-pwa`):

1. **LEAGUE STANDING** (+ `VIEW FULL` link): two tables — `PROMOTION GROUP` and
   `2. DIVISION` — columns `# TEAM DIFFERENCE POINTS`, Nea Salamis row highlighted
   (red text, tinted row, red left bar), green/yellow position dots.
2. **TOP SCORERS** (football): same pill-row widget as volleyball (QA-11 builds it),
   fed from FotMob.
3. **LEAGUE RANKINGS**: 2×2 bordered tiles — big red ordinal (`2nd`), value (`1.9`),
   uppercase label (`GOALS PER MATCH`), `out of N teams` footnote.
4. **NEXT MATCH** banner (not capturable now — season over; implement to web spec).

This is IMPLEMENTATION_PLAN **Phase 8** verbatim: fetch like `app/src/lib/fotmob.ts` (same
endpoints/caching intent) through the app's existing HTTP layer, degrade exactly like the
web (loading skeletons, unavailable banner, everything else still renders).

## Ground truth

- `app/src/lib/fotmob.ts` — endpoints, response shapes, cache TTLs.
- `app/src/components/stats/LeagueTable.tsx`, `LeagueRankings.tsx`, `TopScorers.tsx`,
  `NextMatch.tsx` — rendering + degrade behavior.
- Captures 08b/08c.

## Implementation notes

- New `flutter/lib/data/fotmob_client.dart` (mock `http.Client` in tests — injectable-bridge
  convention) + section widgets in the QA-09 slots.
- Airplane-mode behavior: local-computed sections untouched, FotMob blocks hidden/banner —
  copy web's exact conditional (web hides `LeagueTable` when `fotmob.tables` empty —
  `FootballStatsTab.tsx:55`).
- Season constants for competition IDs: **do not** touch scraper constants; FotMob team/league
  ids belong in flutter config — source them from `fotmob.ts`.

## Acceptance criteria

- [ ] Online: standings/rankings/top scorers match PWA side-by-side on the emulator
- [ ] Airplane mode: FotMob blocks degrade exactly like web, local stats intact
- [ ] `flutter analyze && flutter test` green with mocked-client tests per block
- [ ] Pairs 08b/08c re-captured; STA-07 + STA-06 (football) → FIXED
