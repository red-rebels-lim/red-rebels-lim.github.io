# TASK-03: Volleyball Stats Calculation Engine

**Status:** done
**Depends on:** TASK-01
**Estimated scope:** Medium-Large

## Objective

Create `src/lib/volleyball-stats.ts` - a stats calculation engine for volleyball that mirrors the structure of `lib/stats.ts` but uses volleyball scoring rules. This is the core logic that powers both volleyball tabs.

## Context

### How football stats work (`lib/stats.ts`)

`calculateStatistics()` does the following:
1. Filters `eventsData` for `sport === 'football-men'`, `status === 'played'`, `competition !== 'cup'`
2. Parses score "1-2" using `parseScore()` which returns `[goalsFor, goalsAgainst]` based on home/away
3. Determines result (W/D/L) using goal comparison + penalty handling
4. Accumulates: wins/draws/losses, goals, points (3-1-0), clean sheets
5. Tracks: recent form (last 5), head-to-head, streaks, records, goal distribution, points progression
6. Returns `FormattedStats` object

### How volleyball differs

- **Score format**: "3-1" means sets won (not rally points). Home team listed first in score regardless.
- **No draws**: Someone always wins (best of 5 sets)
- **No cup/league distinction**: No `competition` field filtering needed
- **Sets data**: `sets[]` array contains detailed `{ home, away }` rally point scores per set
- **Scorers**: `vbScorers[]` has `{ name, points, team }` - points not goals
- **No penalty shootouts**
- **Points system**: Volleyball leagues sometimes use 3 pts for 3-0/3-1 win, 2 pts for 3-2 win, 1 pt for 2-3 loss, 0 for 0-3/1-3. For simplicity, use standard 2 pts win / 0 pts loss unless we confirm the league uses a different system.

## Implementation

### File: `src/lib/volleyball-stats.ts`

```typescript
import { eventsData } from '@/data/events';
import type {
  VolleyballFormattedStats,
  VolleyballTeamStats,
  VolleyballFormMatch,
  VolleyballHeadToHead,
  VolleyballSetBreakdown,
  VolleyballTopScorer,
  VolleyballProgressionEntry,
  VolleyballRecordResult,
  StreakInfo,
  CalendarEvent,
} from '@/types/events';

type VolleyballSport = 'volleyball-men' | 'volleyball-women';
```

### Functions to implement

#### 1. `parseVolleyballScore(score: string, location: string): [number, number] | null`
- Input: "3-1", "home"
- The score in events.ts is always home-away order
- For home: returns [3, 1] (setsFor, setsAgainst)
- For away: returns [1, 3] (setsFor, setsAgainst) - swaps
- Returns null if unparseable

#### 2. `getVolleyballResult(setsFor: number, setsAgainst: number): 'W' | 'L'`
- Simple: setsFor > setsAgainst → 'W', else 'L'
- No draw case

#### 3. `calculateSetBreakdown(matches: CalendarEvent[], location?: string): VolleyballSetBreakdown`
- For each match, look at setsFor-setsAgainst
- Categorize: 3-0, 3-1, 3-2 wins and 0-3, 1-3, 2-3 losses
- Optional location filter for home/away breakdown

#### 4. `aggregateTopScorers(matches: CalendarEvent[]): VolleyballTopScorer[]`
- Iterate all matches, collect `vbScorers` where `team` matches our side
- Our side: `team === 'home'` when `location === 'home'`, `team === 'away'` when `location === 'away'`
- Aggregate by player name: sum points, count matches
- Sort by totalPoints descending
- Return top 10

#### 5. `calculateVolleyballStatistics(sport: VolleyballSport): VolleyballFormattedStats`

Main function. Steps:

1. **Filter events**: `eventsData` → flatMap months → filter by `sport` and `status === 'played'`
2. **Sort by date** (month index + day) to ensure chronological order
3. **For each match**, accumulate into `overall`, `home`, `away` TeamStats:
   - Parse score → setsFor, setsAgainst
   - Calculate rally points from `sets[]` array (sum home/away points)
   - Determine W/L result
   - Update wins/losses counters
   - Update setsWon/setsLost
   - Update pointsScored/pointsConceded
4. **Calculate derived fields**:
   - winPercentage = wins / played * 100
   - setWinPercentage = setsWon / (setsWon + setsLost) * 100
5. **Recent form**: Last 5 matches as `VolleyballFormMatch[]`
6. **Head-to-head**: Group by opponent, track wins/losses/sets
7. **Set breakdown**: Count 3-0, 3-1, 3-2, 0-3, 1-3, 2-3 results
8. **Streaks**:
   - currentStreak: consecutive W or L from most recent match
   - longestWinStreak: max consecutive wins
   - (No unbeaten streak concept since no draws)
9. **Records**:
   - biggestWin: Match with largest setsFor - setsAgainst margin, tiebreak by rally point diff
   - heaviestDefeat: Match with largest setsAgainst - setsFor margin
   - Include set scores string (e.g. "25-18, 25-20, 25-15")
10. **Top scorers**: Aggregate from all matches' `vbScorers`
11. **Season progress**: Cumulative sets won over matches

### Return type mapping to mockup sections

| Mockup Section | Data Source |
|---|---|
| Next Match | Filter `status === 'upcoming'`, take first by date |
| Season Summary | `overall.winPercentage`, `overall.setsWon`, `overall.played`, `overall.wins`, `overall.losses` |
| Set Breakdown | `setBreakdown.threeZero/threeOne/threeTwo` + horizontal bars for setsWon/setsLost |
| Recent Form | `recentForm` (last 5) |
| Top Scorers | `topScorers` (top 3-5) |
| Home vs Away | `home` vs `away` stats |
| League Table | Not calculated here (needs separate function or local data) |

### Additional helper: `getNextVolleyballMatch(sport: VolleyballSport)`

```typescript
export function getNextVolleyballMatch(sport: VolleyballSport): {
  opponent: string;
  date: Date;
  location: 'home' | 'away';
  venue?: string;
} | null
```

- Filter events by sport + `status === 'upcoming'`
- Sort by date ascending
- Return first match
- Used by the NextMatch component for volleyball tabs

## Edge Cases

- Matches with no `sets[]` data (just score): Calculate setsFor/setsAgainst from score, but can't get rally points
- Matches with no `vbScorers[]`: Skip in top scorer aggregation
- Zero played matches: Return empty stats with all zeros, empty arrays
- Score format variations: Always expect "X-Y" format

## Acceptance Criteria

- [ ] `calculateVolleyballStatistics('volleyball-men')` returns correct stats
- [ ] `calculateVolleyballStatistics('volleyball-women')` returns correct stats
- [ ] `getNextVolleyballMatch()` returns the next upcoming match or null
- [ ] Top scorers correctly aggregate across matches (same player across different matches)
- [ ] Set breakdown counts match actual data
- [ ] Recent form is last 5 chronologically (most recent first)
- [ ] Streaks calculate correctly (no draw handling needed)
- [ ] Home/away split is accurate
- [ ] Function is memoizable (pure, deterministic)
