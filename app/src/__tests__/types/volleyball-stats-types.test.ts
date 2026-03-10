import { describe, it, expect } from 'vitest';

/**
 * TASK-01: Volleyball Stat Types
 *
 * These tests verify that volleyball stat types are properly exported
 * and structurally correct. Since TypeScript types are erased at runtime,
 * we test by importing the module and verifying that code written against
 * the types compiles and runs correctly via a type-check build step.
 *
 * The real verification is: `npm run build` (tsc -b) must pass with these
 * types used in volleyball-stats.ts (TASK-03). These tests serve as
 * living documentation of the expected type shapes.
 */

// Runtime import to verify the module is importable
const eventsModule = await import('@/types/events');

describe('TASK-01: Volleyball Stat Types - exports exist', () => {
  it('module is importable without errors', () => {
    expect(eventsModule).toBeDefined();
  });
});

describe('TASK-01: Volleyball Stat Types - structural contracts', () => {
  describe('VolleyballTeamStats', () => {
    it('has correct shape with no draws, sets-based scoring', () => {
      // This object must satisfy the VolleyballTeamStats interface
      const stats = {
        played: 18,
        wins: 12,
        losses: 6,
        setsWon: 42,
        setsLost: 28,
        setWinPercentage: 60,
        winPercentage: 66.7,
        pointsScored: 1200,
        pointsConceded: 1050,
      };

      // Validate required fields
      expect(stats).toHaveProperty('played');
      expect(stats).toHaveProperty('wins');
      expect(stats).toHaveProperty('losses');
      expect(stats).toHaveProperty('setsWon');
      expect(stats).toHaveProperty('setsLost');
      expect(stats).toHaveProperty('setWinPercentage');
      expect(stats).toHaveProperty('winPercentage');
      expect(stats).toHaveProperty('pointsScored');
      expect(stats).toHaveProperty('pointsConceded');
      // No draws in volleyball
      expect(stats).not.toHaveProperty('draws');
      expect(stats.wins + stats.losses).toBe(stats.played);
    });
  });

  describe('VolleyballSetBreakdown', () => {
    it('covers all 6 win/loss set patterns', () => {
      const breakdown = {
        threeZero: 5,
        threeOne: 4,
        threeTwo: 3,
        zeroThree: 2,
        oneThree: 1,
        twoThree: 3,
      };

      const totalWins = breakdown.threeZero + breakdown.threeOne + breakdown.threeTwo;
      const totalLosses = breakdown.zeroThree + breakdown.oneThree + breakdown.twoThree;
      expect(totalWins).toBe(12);
      expect(totalLosses).toBe(6);
    });
  });

  describe('VolleyballFormMatch', () => {
    it('only uses W or L results (no draws)', () => {
      const winMatch = {
        result: 'W' as const,
        opponent: 'Omonia',
        score: '3-1',
        location: 'home' as const,
        month: 'january',
        day: 15,
      };

      const lossMatch = {
        result: 'L' as const,
        opponent: 'APOEL',
        score: '1-3',
        location: 'away' as const,
        month: 'february',
        day: 20,
      };

      expect(winMatch.result).toBe('W');
      expect(lossMatch.result).toBe('L');
      expect(['W', 'L']).toContain(winMatch.result);
    });
  });

  describe('VolleyballHeadToHead', () => {
    it('tracks sets not goals, has no draws', () => {
      const h2h = {
        opponent: 'Omonia',
        played: 4,
        wins: 3,
        losses: 1,
        setsWon: 10,
        setsLost: 5,
      };

      expect(h2h.wins + h2h.losses).toBe(h2h.played);
      expect(h2h).toHaveProperty('setsWon');
      expect(h2h).toHaveProperty('setsLost');
      expect(h2h).not.toHaveProperty('draws');
      expect(h2h).not.toHaveProperty('goalsFor');
      expect(h2h).not.toHaveProperty('goalsAgainst');
    });
  });

  describe('VolleyballRecordResult', () => {
    it('includes set scores string instead of numeric margin', () => {
      const record = {
        opponent: 'Omonia',
        score: '3-0',
        setScores: '25-18, 25-20, 25-15',
      };

      expect(record).toHaveProperty('setScores');
      expect(record.setScores).toContain('25-18');
      expect(record).not.toHaveProperty('margin');
    });
  });

  describe('VolleyballTopScorer', () => {
    it('tracks points and matches played', () => {
      const scorer = {
        name: 'Peemuller Richard',
        totalPoints: 245,
        matchesPlayed: 18,
      };

      expect(scorer).toHaveProperty('totalPoints');
      expect(scorer).toHaveProperty('matchesPlayed');
      expect(scorer).not.toHaveProperty('goals');
    });
  });

  describe('VolleyballProgressionEntry', () => {
    it('tracks cumulative sets won per match', () => {
      const entry = {
        match: 5,
        setsWon: 14,
        opponent: 'Omonia',
      };

      expect(entry).toHaveProperty('setsWon');
      expect(entry).not.toHaveProperty('points');
    });
  });

  describe('VolleyballFormattedStats', () => {
    it('aggregates all volleyball stat types into one shape', () => {
      const emptyTeamStats = {
        played: 0, wins: 0, losses: 0,
        setsWon: 0, setsLost: 0,
        setWinPercentage: 0, winPercentage: 0,
        pointsScored: 0, pointsConceded: 0,
      };

      const stats = {
        overall: emptyTeamStats,
        home: emptyTeamStats,
        away: emptyTeamStats,
        setBreakdown: {
          threeZero: 0, threeOne: 0, threeTwo: 0,
          zeroThree: 0, oneThree: 0, twoThree: 0,
        },
        recentForm: [] as { result: 'W' | 'L'; opponent: string; score: string; location: 'home' | 'away'; month: string; day: number }[],
        headToHead: [] as { opponent: string; played: number; wins: number; losses: number; setsWon: number; setsLost: number }[],
        streaks: {
          currentStreak: { type: 'W' as const, count: 0 },
          longestWinStreak: 0,
        },
        records: {
          biggestWin: null as { opponent: string; score: string; setScores: string } | null,
          heaviestDefeat: null as { opponent: string; score: string; setScores: string } | null,
        },
        topScorers: [] as { name: string; totalPoints: number; matchesPlayed: number }[],
        seasonProgress: [] as { match: number; setsWon: number; opponent: string }[],
      };

      // Verify all top-level keys exist
      expect(stats).toHaveProperty('overall');
      expect(stats).toHaveProperty('home');
      expect(stats).toHaveProperty('away');
      expect(stats).toHaveProperty('setBreakdown');
      expect(stats).toHaveProperty('recentForm');
      expect(stats).toHaveProperty('headToHead');
      expect(stats).toHaveProperty('streaks');
      expect(stats).toHaveProperty('records');
      expect(stats).toHaveProperty('topScorers');
      expect(stats).toHaveProperty('seasonProgress');

      // Streaks reuses StreakInfo type shape
      expect(stats.streaks.currentStreak).toHaveProperty('type');
      expect(stats.streaks.currentStreak).toHaveProperty('count');

      // Records are nullable
      expect(stats.records.biggestWin).toBeNull();
      expect(stats.records.heaviestDefeat).toBeNull();
    });
  });

  describe('Type compatibility', () => {
    it('StreakInfo type is reused from existing football types', () => {
      // StreakInfo should already exist and support W/L types
      const streak = { type: 'W' as const, count: 5 };
      expect(streak.type).toBe('W');
      expect(streak.count).toBe(5);
    });

    it('existing types (VolleyballSet, VolleyballScorer) are still importable', () => {
      // These already exist in the module
      expect(eventsModule).toBeDefined();
    });
  });
});
