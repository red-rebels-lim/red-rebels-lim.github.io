# Volleyball Statistics Implementation Plan

## Overview

Add volleyball statistics (men's and women's) to the Stats page, alongside existing football stats. The page will have a 3-tab sport selector ("Men's Football" | "Men's Volleyball" | "Women's Volleyball") with a unified design across all tabs based on the approved Stitch mockups in `app/design-mockups/`.

## Design Reference

- `design-mockups/final-football.png` - Football tab (redesigned)
- `design-mockups/final-volleyball-men.png` - Men's Volleyball tab
- `design-mockups/final-volleyball-women.png` - Women's Volleyball tab

## Architecture Decisions

1. **Shared component pattern**: Reuse stat components across sports by making them sport-agnostic where possible (RecentForm, HeadToHead, TopScorers, HomeVsAway, SeasonProgress). Create volleyball-specific components only where the data model differs (SetBreakdown).

2. **Volleyball stats engine**: Create `lib/volleyball-stats.ts` mirroring `lib/stats.ts` but using volleyball scoring rules (no draws, set-based scoring, points instead of goals).

3. **No external API for volleyball**: Football uses FotMob API for league tables, rankings, venue, next match. Volleyball has no equivalent API - all stats calculated from local `events.ts` data. The "Next Match" and "League Table" sections for volleyball will use local data only.

4. **Sport selector on StatsPage**: Convert StatsPage to use Radix Tabs (already in `components/ui/tabs.tsx`) with controlled state. Each tab renders its own stat sections. Football tab keeps FotMob integration; volleyball tabs use local-only calculations.

5. **Type extensions**: Add volleyball-specific stat types alongside existing football types in `types/events.ts`.

## Task Dependency Graph

```
TASK-01 (Types) ──────────────────────┐
                                       ├── TASK-03 (Stats Engine)
TASK-02 (i18n) ────────────────────────┤
                                       │
TASK-03 (Stats Engine) ────────────────┤
                                       ├── TASK-06 (StatsPage Tabs)
TASK-04 (Redesign Football Components)─┤
                                       │
TASK-05 (New VB Components) ───────────┤
                                       │
TASK-06 (StatsPage Tabs) ─────────────── TASK-07 (Tests)
```

## Tasks

| ID | Title | Status | Depends On |
|----|-------|--------|------------|
| TASK-01 | Volleyball stat types | done | - |
| TASK-02 | i18n keys for volleyball stats | done | - |
| TASK-03 | Volleyball stats calculation engine | done | TASK-01 |
| TASK-04 | Redesign football stat components to match mockup | done | TASK-02 |
| TASK-05 | Create volleyball-specific stat components | done | TASK-01, TASK-02 |
| TASK-06 | StatsPage sport selector tabs & integration | done | TASK-03, TASK-04, TASK-05 |
| TASK-07 | Tests for volleyball stats | done | TASK-03, TASK-06 |
