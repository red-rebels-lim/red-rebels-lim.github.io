# QA-10: Stats section content — season summary, set breakdown, performance split, form subtitle

**Status:** todo
**Batch:** stats (`fix/qa-stats`)
**Register rows:** STA-03 (P2), STA-04 (P2), STA-05 (P2), STA-09 (P3)
**Depends on:** QA-09
**Estimated scope:** Medium/Large

## Context (web → app, per section)

1. **STA-03 Season Summary.**
   - Football web: 3×3 grid of bordered tiles, label *above* value; `Wins` green, `Losses`
     red, `Points` red; nine stats: Matches, Wins, Draws, Losses, Goals `56-15`, Points,
     Clean Sheets, Avg Goals Scored, Avg Goals Conceded (`08-*-pwa`). App currently shows an
     `Overall Performance` card with value-above-label rows **and extra stats web doesn't
     show (`W% 83%`, `Difference +41`)** — drop them.
   - Volleyball web: two **hero tiles** first — `Win Rate 48%` and `Points 1813` in big red —
     then a row of small tiles `Matches 23 / Wins 11 / Losses 12` with label-left value-right
     (`09-*-pwa`). App shows a uniform 8-stat card — restructure; `Sets Won/Lost/Set Win %`
     move into Set Breakdown (below), they are not summary tiles on web.
2. **STA-04 Set Breakdown (volleyball).** Web: `Sets Won` red horizontal bar (41) vs
   `Sets Lost` gray bar (44), then three tiles for **wins only** — `3-0 / 5 Wins`,
   `3-1 / 4 Wins`, `3-2 / 2 Wins` (counts red). App: six numeric tiles including loss
   scorelines, no bars. Rebuild to bars + 3 win tiles.
3. **STA-05 Performance Split.** Web: two bordered tiles side by side, emoji avatar circles
   (🏠/✈️), `Home` label, `14 Matches` (count bold), colored `12W 2D 0L` string (W green,
   D yellow, L red) (`08b-*-pwa`). App ("Home vs Away"): rows with red progress bars and
   `%` + `14P 12W 2D 0L · 27-6` strings. Rebuild to the web tiles; volleyball hides draws
   (`8W 3L` — `09b-*-pwa`).
4. **STA-09 Recent Form.** Web has heading `RECENT FORM (LAST 5 MATCHES)` **plus** a
   `Last 5 Matches` subtitle centered above the circles. App misses the subtitle. Circles
   already match (green W / yellow D / red L).

## Ground truth

- `app/src/components/stats/SeasonSummary.tsx`, `VolleyballSeasonSummary.tsx`,
  `SetBreakdown.tsx`, `PerformanceSplit.tsx`, `RecentForm.tsx` — exact classes/labels.
- i18n keys already exist in the flutter JSON copies (`stats.seasonSummary`,
  `stats.setBreakdown`, `stats.performanceSplit`, `stats.last5Matches`, …).
- Captures 08/08b/09/09b.

## Implementation notes

- All in `flutter/lib/pages/stats_page.dart` (+ extracted section widgets if the file is
  getting long — mirror the web's one-component-per-section layout for reviewability).
- Data: everything already computed in `logic/football_stats.dart` /
  `logic/volleyball_stats.dart` — this is presentation-only; delete the W%/Difference
  outputs from the UI only.

## Acceptance criteria

- [ ] Four sections pixel-match the PWA on both sports (where applicable), light + dark
- [ ] No W%/Difference tiles; volleyball hero tiles present; set bars + 3 win tiles
- [ ] `flutter analyze && flutter test` green; per-section widget tests updated
- [ ] Pairs 08/08b/09/09b re-captured; STA-03/04/05/09 → FIXED
