import { describe, it, expect } from 'vitest';
import { getMatchResult, getFormColor, calculateStatistics } from '@/lib/stats';

describe('getMatchResult', () => {
  it('returns null for undefined score', () => {
    expect(getMatchResult(undefined, 'home')).toBeNull();
  });

  it('returns null for undefined location', () => {
    expect(getMatchResult('2-1', undefined)).toBeNull();
  });

  it('returns null for score without dash', () => {
    expect(getMatchResult('invalid', 'home')).toBeNull();
  });

  it('returns null for non-numeric score', () => {
    expect(getMatchResult('a-b', 'home')).toBeNull();
  });

  it('returns win for home team with higher home score', () => {
    expect(getMatchResult('3-1', 'home')).toBe('win');
  });

  it('returns loss for home team with lower home score', () => {
    expect(getMatchResult('0-2', 'home')).toBe('loss');
  });

  it('returns draw for equal scores', () => {
    expect(getMatchResult('1-1', 'home')).toBe('draw');
  });

  it('returns win for away team with higher away score (score is home-away)', () => {
    // Score "1-3" means home scored 1, away scored 3
    // For away team: gf=3, ga=1 → win
    expect(getMatchResult('1-3', 'away')).toBe('win');
  });

  it('returns loss for away team with lower away score', () => {
    expect(getMatchResult('3-1', 'away')).toBe('loss');
  });

  it('returns draw for away team with equal scores', () => {
    expect(getMatchResult('2-2', 'away')).toBe('draw');
  });

  // Penalty handling
  it('returns win when draw with penalties won (home)', () => {
    expect(getMatchResult('1-1', 'home', '5-3')).toBe('win');
  });

  it('returns loss when draw with penalties lost (home)', () => {
    expect(getMatchResult('1-1', 'home', '3-5')).toBe('loss');
  });

  it('returns win when draw with penalties won (away)', () => {
    expect(getMatchResult('2-2', 'away', '2-4')).toBe('win');
  });

  it('returns draw when penalties also draw (edge case)', () => {
    expect(getMatchResult('0-0', 'home', '3-3')).toBe('draw');
  });

  it('returns draw when no penalties on a draw', () => {
    expect(getMatchResult('0-0', 'home')).toBe('draw');
  });

  it('returns null for empty score string', () => {
    expect(getMatchResult('', 'home')).toBeNull();
  });

  it('returns null for score with only a dash', () => {
    expect(getMatchResult('-', 'home')).toBeNull();
  });
});

describe('getFormColor', () => {
  it('returns green for W', () => {
    expect(getFormColor('W')).toBe('#4CAF50');
  });

  it('returns yellow for D', () => {
    expect(getFormColor('D')).toBe('#FFC107');
  });

  it('returns red for L', () => {
    expect(getFormColor('L')).toBe('#F44336');
  });

  it('returns gray for unknown', () => {
    expect(getFormColor('X')).toBe('#999');
  });

  it('returns gray for empty string', () => {
    expect(getFormColor('')).toBe('#999');
  });
});

describe('calculateStatistics', () => {
  // This function reads from eventsData directly - we test it as an integration test
  it('returns a FormattedStats object with expected shape', () => {
    const stats = calculateStatistics();

    expect(stats).toHaveProperty('overall');
    expect(stats).toHaveProperty('home');
    expect(stats).toHaveProperty('away');
    expect(stats).toHaveProperty('recentForm');
    expect(stats).toHaveProperty('headToHead');
    expect(stats).toHaveProperty('cleanSheets');
    expect(stats).toHaveProperty('avgGoalsFor');
    expect(stats).toHaveProperty('avgGoalsAgainst');
    expect(stats).toHaveProperty('goalDistribution');
    expect(stats).toHaveProperty('currentStreak');
    expect(stats).toHaveProperty('longestWinStreak');
    expect(stats).toHaveProperty('longestUnbeatenStreak');
    expect(stats).toHaveProperty('biggestWin');
    expect(stats).toHaveProperty('heaviestDefeat');
    expect(stats).toHaveProperty('pointsProgression');
  });

  it('overall stats have correct structure', () => {
    const stats = calculateStatistics();
    const { overall } = stats;

    expect(overall.played).toBeGreaterThanOrEqual(0);
    expect(overall.wins + overall.draws + overall.losses).toBe(overall.played);
    expect(overall.goalDifference).toBe(overall.goalsFor - overall.goalsAgainst);
    expect(overall).toHaveProperty('winPercentage');
    expect(overall).toHaveProperty('points');
  });

  it('points calculation is correct: wins*3 + draws', () => {
    const stats = calculateStatistics();
    const { overall } = stats;
    expect(overall.points).toBe(overall.wins * 3 + overall.draws);
  });

  it('home + away stats sum to overall', () => {
    const stats = calculateStatistics();
    expect(stats.home.played + stats.away.played).toBe(stats.overall.played);
    expect(stats.home.wins + stats.away.wins).toBe(stats.overall.wins);
    expect(stats.home.draws + stats.away.draws).toBe(stats.overall.draws);
    expect(stats.home.losses + stats.away.losses).toBe(stats.overall.losses);
    expect(stats.home.goalsFor + stats.away.goalsFor).toBe(stats.overall.goalsFor);
    expect(stats.home.goalsAgainst + stats.away.goalsAgainst).toBe(stats.overall.goalsAgainst);
  });

  it('recentForm has at most 5 entries', () => {
    const stats = calculateStatistics();
    expect(stats.recentForm.length).toBeLessThanOrEqual(5);
  });

  it('recentForm entries have required fields', () => {
    const stats = calculateStatistics();
    for (const form of stats.recentForm) {
      expect(form).toHaveProperty('result');
      expect(form).toHaveProperty('opponent');
      expect(form).toHaveProperty('score');
      expect(form).toHaveProperty('location');
      expect(['W', 'D', 'L']).toContain(form.result);
    }
  });

  it('headToHead entries are sorted by games played descending', () => {
    const stats = calculateStatistics();
    for (let i = 1; i < stats.headToHead.length; i++) {
      expect(stats.headToHead[i - 1].played).toBeGreaterThanOrEqual(stats.headToHead[i].played);
    }
  });

  it('winPercentage is between 0 and 100', () => {
    const stats = calculateStatistics();
    expect(stats.overall.winPercentage).toBeGreaterThanOrEqual(0);
    expect(stats.overall.winPercentage).toBeLessThanOrEqual(100);
  });

  it('cleanSheets is non-negative', () => {
    const stats = calculateStatistics();
    expect(stats.cleanSheets).toBeGreaterThanOrEqual(0);
  });

  it('avgGoalsFor and avgGoalsAgainst are non-negative', () => {
    const stats = calculateStatistics();
    expect(stats.avgGoalsFor).toBeGreaterThanOrEqual(0);
    expect(stats.avgGoalsAgainst).toBeGreaterThanOrEqual(0);
  });

  it('longestWinStreak and longestUnbeatenStreak are non-negative', () => {
    const stats = calculateStatistics();
    expect(stats.longestWinStreak).toBeGreaterThanOrEqual(0);
    expect(stats.longestUnbeatenStreak).toBeGreaterThanOrEqual(stats.longestWinStreak);
  });

  it('goalDistribution length matches played matches', () => {
    const stats = calculateStatistics();
    expect(stats.goalDistribution.length).toBe(stats.overall.played);
  });

  it('pointsProgression length matches played matches', () => {
    const stats = calculateStatistics();
    expect(stats.pointsProgression.length).toBe(stats.overall.played);
  });

  it('pointsProgression is monotonically non-decreasing', () => {
    const stats = calculateStatistics();
    for (let i = 1; i < stats.pointsProgression.length; i++) {
      expect(stats.pointsProgression[i].points).toBeGreaterThanOrEqual(stats.pointsProgression[i - 1].points);
    }
  });
});
