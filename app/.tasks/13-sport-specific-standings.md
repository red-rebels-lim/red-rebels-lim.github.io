# Task 13: Sport-Specific Standings

## Status: Partially Implemented
## Priority: Medium
## Effort: Medium
## Impact: High
## Category: Multi-Sport Enhancements

## Description
Fetch and show volleyball league standings alongside football standings on the Stats page.

## What Already Exists
- `src/lib/fotmob.ts` — fetches football league standings from FotMob
- `src/pages/StatsPage.tsx` — displays football standings table

## What's Missing
- Volleyball league standings data source
- Multi-sport standings display on Stats page
- Standings tabs or sections per sport

## Technical Approach
1. **Data Sources:**
   - Football: FotMob API (already integrated)
   - Volleyball: Find API or scrape from Cyprus Volleyball Federation website
   - Alternative: manually maintain standings in Back4App Parse
2. **Components:**
   - Reuse existing standings table component
   - Add sport tabs to switch between football/volleyball standings
3. **Integration:**
   - Extend StatsPage with standings per sport
   - Highlight Nea Salamina's position in each table

## Relevant Files
- `src/lib/fotmob.ts` — football standings fetching
- `src/pages/StatsPage.tsx` — standings display

## Dependencies
- Volleyball league standings data source identification
- Task 12 (Volleyball Statistics) — shared sport selector UI

## Acceptance Criteria
- [ ] Football standings displayed (already working)
- [ ] Volleyball standings displayed for both men's and women's teams
- [ ] Sport tabs to switch between standings
- [ ] Nea Salamina highlighted in each table
- [ ] Auto-refresh standings on page load
