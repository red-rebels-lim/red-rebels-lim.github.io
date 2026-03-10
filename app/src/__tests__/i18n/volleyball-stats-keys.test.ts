import { describe, it, expect } from 'vitest';
import en from '@/i18n/en.json';
import el from '@/i18n/el.json';

const VOLLEYBALL_STATS_KEYS = [
  'mensFootball',
  'mensVolleyball',
  'womensVolleyball',
  'setsWon',
  'setsLost',
  'setWinPct',
  'winRate',
  'setBreakdown',
  'threeZero',
  'threeOne',
  'threeTwo',
  'zeroThree',
  'oneThree',
  'twoThree',
  'winsCount',
  'lossesCount',
  'totalPoints',
  'seasonSummary',
  'viewFull',
  'performanceSplit',
  'last5Matches',
] as const;

// Keys that already exist and must NOT be removed
const EXISTING_STATS_KEYS = [
  'matches', 'wins', 'draws', 'losses', 'points', 'goals',
  'goalDifference', 'overallStats', 'homeVsAway', 'home', 'away',
  'recentForm', 'headToHead', 'opponent', 'played', 'w', 'd', 'l',
  'goalsCol', 'winPct', 'noData', 'cleanSheets', 'avgGoalsFor',
  'avgGoalsAgainst', 'goalDistribution', 'scored', 'conceded',
  'streaks', 'currentStreak', 'longestWinStreak', 'longestUnbeatenStreak',
  'records', 'biggestWin', 'heaviestDefeat', 'seasonProgress', 'matchday',
  'leagueStanding', 'team', 'topScorers', 'goalsLabel', 'leagueRankings',
  'outOf', 'venueInfo', 'venueCity', 'venueCapacity', 'venueSurface',
  'venueYear', 'nextMatch', 'homeMatch', 'awayMatch',
] as const;

describe('TASK-02: i18n Volleyball Stats Keys', () => {
  describe('Acceptance Criteria: All new keys in en.json', () => {
    it.each(VOLLEYBALL_STATS_KEYS)('en.json stats.%s exists and is non-empty', (key) => {
      const value = (en.stats as unknown as Record<string, unknown>)[key];
      expect(value, `stats.${key} missing in en.json`).toBeDefined();
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    });
  });

  describe('Acceptance Criteria: All new keys in el.json', () => {
    it.each(VOLLEYBALL_STATS_KEYS)('el.json stats.%s exists and is non-empty', (key) => {
      const value = (el.stats as unknown as Record<string, unknown>)[key];
      expect(value, `stats.${key} missing in el.json`).toBeDefined();
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    });
  });

  describe('Acceptance Criteria: No existing keys removed', () => {
    it.each(EXISTING_STATS_KEYS)('en.json stats.%s still exists', (key) => {
      const value = (en.stats as unknown as Record<string, unknown>)[key];
      expect(value, `existing key stats.${key} was removed from en.json`).toBeDefined();
    });

    it.each(EXISTING_STATS_KEYS)('el.json stats.%s still exists', (key) => {
      const value = (el.stats as unknown as Record<string, unknown>)[key];
      expect(value, `existing key stats.${key} was removed from el.json`).toBeDefined();
    });
  });

  describe('Acceptance Criteria: Valid JSON and naming conventions', () => {
    it('en.json and el.json are parseable objects', () => {
      expect(typeof en).toBe('object');
      expect(typeof el).toBe('object');
      expect(en.stats).toBeDefined();
      expect(el.stats).toBeDefined();
    });

    it('all new keys follow camelCase convention', () => {
      for (const key of VOLLEYBALL_STATS_KEYS) {
        // camelCase: starts with lowercase, no underscores/hyphens
        expect(key).toMatch(/^[a-z][a-zA-Z0-9]*$/);
      }
    });

    it('en and el have matching volleyball keys', () => {
      for (const key of VOLLEYBALL_STATS_KEYS) {
        const enHas = key in (en.stats as unknown as Record<string, unknown>);
        const elHas = key in (el.stats as unknown as Record<string, unknown>);
        expect(enHas, `stats.${key} in en but not el`).toBe(elHas);
      }
    });
  });

  describe('Content correctness', () => {
    it('set score keys display correct patterns', () => {
      const stats = en.stats as unknown as Record<string, string>;
      expect(stats.threeZero).toBe('3-0');
      expect(stats.threeOne).toBe('3-1');
      expect(stats.threeTwo).toBe('3-2');
      expect(stats.zeroThree).toBe('0-3');
      expect(stats.oneThree).toBe('1-3');
      expect(stats.twoThree).toBe('2-3');
    });

    it('sport tab labels contain sport names', () => {
      const stats = en.stats as unknown as Record<string, string>;
      expect(stats.mensFootball).toContain('Football');
      expect(stats.mensVolleyball).toContain('Volleyball');
      expect(stats.womensVolleyball).toContain('Volleyball');
    });

    it('Greek translations are not just English copies', () => {
      const elStats = el.stats as unknown as Record<string, string>;
      // Sport tabs should be in Greek
      expect(elStats.mensFootball).toContain('Ποδόσφαιρο');
      expect(elStats.mensVolleyball).toContain('Βόλεϊ');
      expect(elStats.womensVolleyball).toContain('Βόλεϊ');
      // Score patterns are language-agnostic (same in both)
      expect(elStats.threeZero).toBe('3-0');
    });
  });
});
