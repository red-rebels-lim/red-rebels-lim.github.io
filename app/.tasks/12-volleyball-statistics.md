# Task 12: Volleyball Statistics Page

## Status: Partially Implemented
## Priority: High
## Effort: Medium
## Impact: High
## Category: Multi-Sport Enhancements

## Description
Currently stats only cover Men's Football. Extend the stats engine to also calculate and display Men's Volleyball and Women's Volleyball statistics (W/D/L, set ratios, form, streaks).

## What Already Exists
- `src/data/sport-config.ts` — defines volleyball sports (`volleyball-men`, `volleyball-women`)
- `src/components/filters/FilterPanel.tsx` — supports volleyball sport filtering
- `src/lib/stats.ts` — stats calculation engine (football-men only, line 63)
- `src/pages/StatsPage.tsx` — stats display page
- `src/components/stats/` — GoalDistribution, SeasonProgress charts

## What's Missing
- `stats.ts` hardcodes `football-men` — needs to support all sports
- Volleyball-specific stats: sets won/lost, set ratio, points
- Sport selector on Stats page
- Volleyball-appropriate chart labels (sets instead of goals)

## Technical Approach
1. **Extend `stats.ts`:**
   - Remove hardcoded `football-men` filter
   - Add sport parameter to `calculateStats()` function
   - Add volleyball-specific calculations (set wins, set ratio)
   - Handle different scoring systems (football: goals, volleyball: sets/points)
2. **Stats Page Updates:**
   - Add sport tabs/selector at top of StatsPage (Football / Volleyball Men / Volleyball Women)
   - Adapt chart labels based on selected sport
   - `GoalDistribution` becomes `ScoringDistribution` with sport-aware labels
3. **New Volleyball Stats:**
   - Win/Loss record (no draws in volleyball)
   - Sets won vs sets lost
   - Home/Away performance
   - Form and streaks (reuse existing logic)

## Relevant Files
- `src/lib/stats.ts:63` — hardcoded `football-men` filter to change
- `src/pages/StatsPage.tsx` — add sport selector
- `src/components/stats/GoalDistribution.tsx` — adapt for volleyball
- `src/components/stats/SeasonProgress.tsx` — adapt for volleyball
- `src/data/sport-config.ts` — sport definitions
- `src/types/events.ts` — event type with sport field

## Dependencies
- Volleyball match data with scores in the event dataset

## Acceptance Criteria
- [ ] Stats page has sport selector (Football / Volleyball Men / Volleyball Women)
- [ ] Win/Loss/Draw calculated per sport
- [ ] Volleyball stats show sets won/lost instead of goals
- [ ] Charts adapt labels based on selected sport
- [ ] Form and streaks work for all sports
- [ ] Default view shows football stats (backward compatible)
