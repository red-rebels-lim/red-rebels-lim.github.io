# QA-09: Stats section design — white cards → frosted-panel sections, web order, drop extras

**Status:** done (PR #86, merged 2026-07-15)
**Batch:** stats (`fix/qa-stats`)
**Register rows:** STA-02 (P1), STA-08 (P2)
**Depends on:** QA-08
**Estimated scope:** Large

## Context

**STA-02.** The web stats page is one frosted panel (`Statistics` heading, sentence-case
bold, dark slate) whose sections are **uppercase condensed headings** directly on the panel
with bordered translucent stat tiles — no white cards anywhere. The app instead renders
independent white Material cards with sentence-case bold headings.

**STA-08.** The app also renders sections the web tabs don't have:
- football: `Records` (Biggest Win / Heaviest Defeat), `Season Progress` (points chart)
- volleyball: `Records`
Remove them (exact copy). If the stakeholder later wants them back it's a web-side feature
request, not app scope.

Web football section order (verified in `app/src/components/stats/FootballStatsTab.tsx` and
captures `08*-pwa`): SEASON SUMMARY → RECENT FORM → LEAGUE STANDING (FotMob, QA-20) →
PERFORMANCE SPLIT → TOP SCORERS (FotMob) → LEAGUE RANKINGS (FotMob) → HEAD-TO-HEAD (TOP 10).

Web volleyball order (captures `09*-pwa`): SEASON SUMMARY → SET BREAKDOWN → RECENT FORM →
PERFORMANCE SPLIT → TOP SCORERS (local data). No Records, no H2H seen for volleyball —
verify against `VolleyballStatsTab.tsx` before deleting the app's volleyball H2H
(the app has one; web capture `09c` ends at Top Scorers #10 — confirm whether web renders
H2H below it on-device before removing).

FotMob-backed sections themselves are QA-20 (Phase 8); this task builds the **layout
skeleton** in web order with the local sections and leaves clearly-marked slots for QA-20.

## Ground truth

- Captures `08/08b/08c/08d/08e` (football PWA full scroll), `09/09b/09c` (volleyball).
- `app/src/components/stats/*.tsx` — headings, tile borders, spacing.
- `app/src/pages/StatsPage.tsx:76` — page heading style.

## Implementation notes

- `flutter/lib/pages/stats_page.dart` — page becomes one frosted panel (reuse the calendar
  grid's panel treatment/tokens); page heading `STATISTICS` → web is sentence-case
  `Statistics` (bold, not condensed) — copy web.
- Section headings: `condensed()` uppercase, sizes from web.
- Kill the white `Card`s; stat tiles = translucent bordered containers.
- Delete Records + Season Progress renderers (football) and Records (volleyball) — keep the
  logic in `logic/football_stats.dart` if other code uses it; remove only presentation.

## Acceptance criteria

- [ ] Football + volleyball tabs: section order, headings, tile design match PWA scroll-through
- [ ] No white cards; no Records/Season Progress sections
- [ ] FotMob slots stubbed with nothing visible (web hides blocks when data absent — verify)
- [ ] `flutter analyze && flutter test` green (section tests rewritten)
- [ ] Full 08/09 pair set re-captured; STA-02/08 → FIXED
