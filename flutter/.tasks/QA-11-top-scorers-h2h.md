# QA-11: Top scorers rows (volleyball) + head-to-head table styling

**Status:** done (PR #86, merged 2026-07-15)
**Batch:** stats (`fix/qa-stats`)
**Register rows:** STA-06 volleyball half (P2), STA-10 (P3)
**Depends on:** QA-09
**Estimated scope:** Medium

## Context

1. **STA-06 (volleyball half).** Web Top Scorers (`09b/09c-*-pwa`): one pill row per player —
   rank number, blue avatar circle, name, points right-aligned; **#1 row highlighted** with
   red border and red count; no per-match figure. App: plain numbered text list inside a
   card showing `179 / 10` (points / matches) — drop the match count, adopt the pill rows +
   #1 highlight. Volleyball scorer data is local (`logic/volleyball_stats.dart`) so this is
   fixable now. The football Top Scorers list is FotMob-fed and lands with QA-20 — build
   this widget shared so QA-20 reuses it.
2. **STA-10.** Head-to-Head (Top 10): web table has a header band (light bg), uppercase
   column headers (`OPPONENT PLD W D L GOALS`), W green / **D yellow** / L red values, and
   generous row spacing (`08d-*-pwa`). App: sentence-case headers, no band, D column
   unstyled. Confirm whether web volleyball renders H2H at all (QA-09 note) before styling
   the volleyball one.

## Ground truth

- `app/src/components/stats/TopScorers.tsx`, `HeadToHead.tsx`.
- Captures 08c/08d (football H2H + rankings context), 09b/09c (volleyball scorers).

## Implementation notes

- Extract a `TopScorersSection` widget in flutter mirroring the web props (list of
  {name, value}, highlight-first) — used now by volleyball, later by QA-20 football.
- H2H: style the existing table in `stats_page.dart`; column color rules W/D/L.

## Acceptance criteria

- [ ] Volleyball Top Scorers matches PWA rows incl. #1 highlight; no `/ matches` suffix
- [ ] H2H header band, uppercase headers, D-column yellow — matching web
- [ ] `flutter analyze && flutter test` green
- [ ] Pairs 08d/09b/09c re-captured; STA-06 (volleyball) + STA-10 → FIXED (STA-06 stays
      half-open with a note pointing at QA-20 for the football list)
