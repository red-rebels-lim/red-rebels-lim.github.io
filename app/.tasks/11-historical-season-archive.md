# Task 11: Historical Season Archive

## Status: Not Started
## Priority: Low
## Effort: Medium
## Impact: Medium
## Category: Content & Media

## Description
Store past seasons' data (24/25 and earlier). Let fans browse previous seasons and compare stats year-over-year.

## Requirements
- Season selector dropdown (e.g., "2025/26", "2024/25")
- Calendar view for historical seasons
- Stats comparison across seasons
- Data persistence for past seasons when new season starts

## Technical Approach
1. **Data Structure:**
   - Organize event data by season in separate JSON files or Parse collections
   - Season format: `2025-26`, `2024-25`, etc.
   - Archive current season data at end of season
2. **Components:**
   - `SeasonSelector.tsx` — dropdown to switch between seasons
   - Reuse existing `CalendarGrid` and stats components with different data source
3. **Stats Comparison:**
   - Side-by-side season stats (wins, losses, goals, etc.)
   - Year-over-year trend charts using Recharts
4. **Integration:**
   - Add season selector to Navbar or top of CalendarPage
   - Stats page shows comparison view when multiple seasons available

## Relevant Files
- `src/data/` — current season event data
- `src/lib/stats.ts` — stats calculation (needs season parameter)
- `src/pages/StatsPage.tsx` — stats display

## Dependencies
- Historical data collection/archiving process
- Data migration strategy for season transitions

## Acceptance Criteria
- [ ] Season selector allows switching between seasons
- [ ] Calendar displays correct data for selected season
- [ ] Stats calculated per-season
- [ ] Year-over-year comparison available
- [ ] Current season is default selection
