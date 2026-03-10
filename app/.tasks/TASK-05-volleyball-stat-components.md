# TASK-05: Create Volleyball-Specific Stat Components

**Status:** done
**Depends on:** TASK-01, TASK-02
**Estimated scope:** Medium

## Objective

Create new components for volleyball-specific stat sections, and adapt shared components to accept volleyball data. Based on the mockups, volleyball tabs share most of the design with football but have two unique sections: **Set Breakdown** and a **volleyball-flavored Season Summary**.

## Design Reference

### Men's Volleyball (`design-mockups/final-volleyball-men.png`):
1. Next Match card (same as football - reuse component)
2. Season Summary: Hero stats are "WIN RATE 67%" and "POINTS 32", grid: Matches 18 / Wins 12 / Losses 6 (no draws)
3. Set Breakdown: Horizontal bars for Sets Won (42) / Sets Lost (22), then 3-0 / 3-1 / 3-2 win counts
4. Recent Form: 5 W/L badges (no D badge needed)

### Women's Volleyball (`design-mockups/final-volleyball-women.png`):
1. Recent Form (5 W/L badges)
2. Season Summary: Hero stats "TOTAL POINTS 45" and "SETS WON 48", grid: Matches 18 / Wins 15 / Losses 3
3. League Table (compact, same style as football)
4. Performance Split (Home/Away)
5. Top Scorers (with points instead of goals)

## New Components

### 1. `src/components/stats/SetBreakdown.tsx`

**Props:**
```typescript
interface SetBreakdownProps {
  setsWon: number;
  setsLost: number;
  breakdown: VolleyballSetBreakdown;
}
```

**UI:**
- Section heading: "SET BREAKDOWN"
- Two horizontal progress bars:
  - "Sets Won" label + bar (red fill) + count on right
  - "Sets Lost" label + bar (gray fill) + count on right
  - Bar width proportional to value (max of setsWon + setsLost = 100%)
- Below bars: 3 columns showing win patterns:
  - "3-0" label + count + "wins" subtitle
  - "3-1" label + count + "wins" subtitle
  - "3-2" label + count + "wins" subtitle
- Styling: Same card style as other stat sections, dark bg, red accents

### 2. `src/components/stats/VolleyballSeasonSummary.tsx`

**Props:**
```typescript
interface VolleyballSeasonSummaryProps {
  overall: VolleyballTeamStats;
}
```

**UI:**
- Two hero stat cards at top:
  - "WIN RATE" + large percentage (e.g. "67%") - matches men's VB mockup
  - "POINTS" + large number (e.g. "32") - total rally points or "SETS WON" for women's
- 2x3 or 2x2 grid below: Matches / Wins / Losses (no Draws column)
- Reuse the same card styling from the football SeasonSummary (TASK-04)

**Note:** Could make the football `SeasonSummary` accept a `sport` prop and render differently, OR create a separate volleyball version. Separate component is cleaner since the data types differ.

### 3. `src/components/stats/VolleyballNextMatch.tsx` (optional - may reuse)

If the football `NextMatch` component can be made sport-agnostic:
```typescript
interface NextMatchProps {
  opponent: string;
  date: Date;
  isHome: boolean;
  competition?: string;  // "Cyprus 2nd Division" for football, "Super League" for VB
  venue?: string;
}
```

Then no separate volleyball component is needed. Just pass different data.

If football's NextMatch is too coupled to FotMob data, create a lightweight `VolleyballNextMatch.tsx` that takes simpler props from `getNextVolleyballMatch()`.

## Adapted Shared Components

These existing components need to accept volleyball data:

### `TopScorers.tsx`
- Currently shows: rank, name, goals
- For volleyball: rank, name, points (not goals)
- Add optional prop `unit?: 'goals' | 'points'` to change the label
- Or accept generic `{ name: string, value: number }[]` + label prop

### `RecentForm.tsx`
- Currently handles W/D/L
- Volleyball only has W/L
- Component already handles this naturally (just won't receive 'D' results)
- No changes needed if it already handles dynamic result types

### `PerformanceSplit.tsx` (renamed HomeVsAway)
- Needs to accept both football stats (with draws) and volleyball stats (without draws)
- Add optional `showDraws?: boolean` prop
- Or make it accept a generic stat shape

### `HeadToHead.tsx`
- Football: played, W, D, L, goals for/against
- Volleyball: played, W, L, sets for/against
- Add column configuration prop or sport-aware rendering

### `LeagueTable.tsx`
- Football: From FotMob API
- Volleyball: Would need local data or skip this section
- For volleyball, could show a simplified standings view if we have the data, or omit

## File Structure

```
src/components/stats/
├── SetBreakdown.tsx              # NEW - volleyball only
├── VolleyballSeasonSummary.tsx    # NEW - volleyball season summary
├── SeasonSummary.tsx             # RENAMED from OverallStats (TASK-04)
├── PerformanceSplit.tsx          # RENAMED from HomeVsAway (TASK-04)
├── RecentForm.tsx                # UPDATED - works for both sports
├── TopScorers.tsx                # UPDATED - accepts unit prop
├── HeadToHead.tsx                # UPDATED - sport-aware columns
├── NextMatch.tsx                 # UPDATED - sport-agnostic
├── LeagueTable.tsx               # UPDATED - compact mode
├── ... (other existing files kept but unused in new design)
```

## Acceptance Criteria

- [ ] `SetBreakdown` renders horizontal bars and 3-0/3-1/3-2 counts
- [ ] `VolleyballSeasonSummary` renders win rate + points hero stats + matches/wins/losses grid
- [ ] `TopScorers` works for both goals (football) and points (volleyball)
- [ ] `RecentForm` works with W/L only (no D) for volleyball
- [ ] `PerformanceSplit` can hide draws column for volleyball
- [ ] All components follow existing styling patterns (Tailwind, dark/light theme)
- [ ] All components use i18n translation keys from TASK-02
- [ ] No `any` types
- [ ] Build passes
