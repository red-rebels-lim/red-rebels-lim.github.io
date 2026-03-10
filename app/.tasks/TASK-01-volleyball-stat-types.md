# TASK-01: Volleyball Stat Types

**Status:** done
**Depends on:** -
**Estimated scope:** Small

## Objective

Add TypeScript types for volleyball statistics to `src/types/events.ts`. These types parallel the existing football stat types but reflect volleyball's scoring model (sets, no draws, points instead of goals).

## Context

Existing football stat types in `types/events.ts`:
- `TeamStats` - played, wins, draws, losses, goalsFor, goalsAgainst, goalDifference
- `TeamStatsWithPercentage` - extends TeamStats with winPercentage, points
- `FormMatch` - result, opponent, score, location, month, day
- `HeadToHead` - opponent, played, wins, draws, losses, goalsFor, goalsAgainst
- `GoalDistributionEntry` - match, goalsFor, goalsAgainst
- `PointsProgressionEntry` - match, points, opponent
- `RecordResult` - opponent, score, margin
- `StreakInfo` - type ('W'|'D'|'L'|'unbeaten'), count
- `FormattedStats` - aggregates all above

Existing volleyball types (already in codebase):
- `VolleyballSet` - { home: number, away: number }
- `VolleyballScorer` - { name: string, points: number, team: 'home' | 'away' }

## Implementation

### File: `src/types/events.ts`

Add the following types:

```typescript
// --- Volleyball Stats Types ---

export interface VolleyballTeamStats {
  played: number;
  wins: number;
  losses: number;
  // No draws in volleyball
  setsWon: number;
  setsLost: number;
  setWinPercentage: number;  // setsWon / (setsWon + setsLost) * 100
  winPercentage: number;     // wins / played * 100
  pointsScored: number;      // Total rally points scored across all sets
  pointsConceded: number;    // Total rally points conceded across all sets
}

export interface VolleyballSetBreakdown {
  threeZero: number;  // 3-0 wins
  threeOne: number;   // 3-1 wins
  threeTwo: number;   // 3-2 wins
  zeroThree: number;  // 0-3 losses
  oneThree: number;   // 1-3 losses
  twoThree: number;   // 2-3 losses
}

export interface VolleyballFormMatch {
  result: 'W' | 'L';  // No draws in volleyball
  opponent: string;
  score: string;       // e.g. "3-1"
  location: 'home' | 'away';
  month: string;
  day: number;
}

export interface VolleyballHeadToHead {
  opponent: string;
  played: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
}

export interface VolleyballRecordResult {
  opponent: string;
  score: string;        // e.g. "3-0"
  setScores: string;    // e.g. "25-18, 25-20, 25-15"
}

export interface VolleyballFormattedStats {
  overall: VolleyballTeamStats;
  home: VolleyballTeamStats;
  away: VolleyballTeamStats;
  setBreakdown: VolleyballSetBreakdown;
  recentForm: VolleyballFormMatch[];          // Last 5 matches
  headToHead: VolleyballHeadToHead[];         // All opponents
  streaks: {
    currentStreak: StreakInfo;                 // Reuse existing type (W/L only, no D)
    longestWinStreak: number;
  };
  records: {
    biggestWin: VolleyballRecordResult | null;
    heaviestDefeat: VolleyballRecordResult | null;
  };
  topScorers: VolleyballTopScorer[];          // Aggregated from all matches
  seasonProgress: VolleyballProgressionEntry[];
}

export interface VolleyballTopScorer {
  name: string;
  totalPoints: number;
  matchesPlayed: number;
}

export interface VolleyballProgressionEntry {
  match: number;        // Match index (1, 2, 3...)
  setsWon: number;      // Cumulative sets won
  opponent: string;
}
```

## Acceptance Criteria

- [ ] All volleyball stat types are exported from `types/events.ts`
- [ ] Types don't break any existing imports
- [ ] No `any` types used
- [ ] `VolleyballFormattedStats` is the main output type for the volleyball stats engine (TASK-03)
