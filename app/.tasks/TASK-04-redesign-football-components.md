# TASK-04: Redesign Football Stat Components to Match Mockup

**Status:** done
**Depends on:** TASK-02
**Estimated scope:** Medium

## Objective

Update the existing football stat components to match the new unified design from `design-mockups/final-football.png`. The mockup has a cleaner, more compact layout compared to the current implementation.

## Design Reference

See `design-mockups/final-football.png`:

### Section order (top to bottom):
1. **Next Match** - Compact card: "Tomorrow, 19:00" red pill badge, "Red Rebels vs Omonia", "Cyprus 2nd Division" subtitle
2. **Recent Form** - "Last 5 Matches" subtitle, 5 circular W/D/L badges (green/yellow/red)
3. **Season Summary** - Two hero numbers ("TOTAL POINTS 47" and "TOTAL GOALS 38" with mini sparklines), then 2x2 grid below: Matches 26 / Wins 14 / Draws 5 / Losses 7
4. **League Table** - Compact 3-row table with "VIEW FULL" link, columns: # / CLUB / GD / PTS, Nea Salamina row highlighted in red
5. **Performance Split** (was "Home vs Away") - Two rows: Home icon + "13 Matches" with W/D/L mini stats, Away icon + "13 Matches" with W/D/L mini stats
6. **Top Scorers** - Numbered list: rank, player name, "Forward · 15 Appearances" subtitle, goal count on right

### Removed from current design:
- LeagueRankings (removed from mockup)
- GoalDistribution chart (removed)
- Records section (removed)
- SeasonProgress chart (removed)
- VenueInfo (removed)
- Streaks display (removed from visible UI, still calculated)

## Changes Per Component

### `OverallStats.tsx` → Rename to `SeasonSummary.tsx`
**Current:** 9-card grid with all stats
**New:** Two hero stat cards at top (Total Points, Total Goals) + 4 smaller stat boxes below in 2x2 grid

- Hero cards: Large number, small label, optional sparkline (can use Recharts Sparkline or a simple SVG)
- Smaller cards: Label on top (muted), bold number below
- Props stay the same: `overall`, `cleanSheets`, `avgGoalsFor`, `avgGoalsAgainst`
- Only display: points, goals (goalsFor), matches, wins, draws, losses
- Remove: cleanSheets, avgGoalsFor, avgGoalsAgainst from UI (keep in props for backward compat)

### `HomeVsAway.tsx` → Rename to `PerformanceSplit.tsx`
**Current:** Two side-by-side columns with full stat breakdown
**New:** Two horizontal rows (Home / Away) with icon, match count, and inline W/D/L

- Home row: 🏠 icon + "Home" + "13 Matches" + compact W/D/L numbers
- Away row: ✈️ icon + "Away" + "13 Matches" + compact W/D/L numbers
- Simpler, more scannable layout

### `RecentForm.tsx` → Update styling
**Current:** Form badges + streaks section below
**New:** Just the 5 form badges in a row, "Last 5 Matches" subtitle. No streaks visible.
- Remove streaks display from this component (data still calculated but not shown in football tab per mockup)
- Badges: Circular, colored (green W / yellow D / red L)

### `LeagueTable.tsx` → Make compact
**Current:** Full table with all rows
**New:** Compact 3-row view with "VIEW FULL" link
- Show only 3 rows around Nea Salamina (one above, Nea Salamina, one below)
- Or show top 3 with Nea Salamina always visible
- Columns reduced to: # / CLUB / GD / PTS
- "VIEW FULL" link expands to show all rows (could use Sheet/Dialog or inline expand)

### `TopScorers.tsx` → Update layout
**Current:** 3-column grid with medal emojis
**New:** Vertical list, each row: rank number (circled), player name, subtitle (position · appearances), goals on right
- Cleaner vertical list layout
- Add subtitle line under player name (if data available, otherwise just name)

### `NextMatch.tsx` → Compact card style
**Current:** Shows home/away badge, opponent, date
**New:** Compact card with:
  - Red pill badge "Tomorrow, 19:00" (or "In 3 Days" etc.) on top-right
  - "Red Rebels vs [Opponent]" centered
  - Competition name below
  - This component should be made sport-agnostic so volleyball can reuse it

### Components to remove from football rendering:
- `LeagueRankings.tsx` - Not in mockup (keep file, just don't render)
- `GoalDistribution.tsx` - Not in mockup
- `Records.tsx` - Not in mockup
- `SeasonProgress.tsx` - Not in mockup
- `VenueInfo.tsx` - Not in mockup

## Important Notes

- Do NOT delete removed component files - they may be used in the future
- The redesign should be purely visual; data sources and calculation logic remain unchanged
- Component renames should use proper git moves to preserve history
- All components must support dark/light theme (existing Tailwind dark: classes)

## Acceptance Criteria

- [ ] Football tab matches `design-mockups/final-football.png` layout
- [ ] Section order matches mockup: Next Match → Recent Form → Season Summary → League Table → Performance Split → Top Scorers
- [ ] Hero stats (Total Points, Total Goals) are prominently displayed
- [ ] League table is compact (3 rows) with "View Full" option
- [ ] Form badges are circular and color-coded
- [ ] No regressions in existing functionality
- [ ] Dark and light theme both work
- [ ] Build passes (`npm run build`)
