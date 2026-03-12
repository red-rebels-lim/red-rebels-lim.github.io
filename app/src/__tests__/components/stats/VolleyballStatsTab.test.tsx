import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/lib/fotmob', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/fotmob')>();
  return {
    ...actual,
    tApi: (_t: unknown, _ns: string, val: string) => val,
  };
});

import { VolleyballStatsTab } from '@/components/stats/VolleyballStatsTab';
import type { VolleyballFormattedStats } from '@/types/events';

const mockStats: VolleyballFormattedStats = {
  overall: {
    played: 18, wins: 12, losses: 6,
    setsWon: 42, setsLost: 28,
    setWinPercentage: 60, winPercentage: 67,
    pointsScored: 1200, pointsConceded: 1050,
  },
  home: {
    played: 9, wins: 7, losses: 2,
    setsWon: 24, setsLost: 10,
    setWinPercentage: 71, winPercentage: 78,
    pointsScored: 650, pointsConceded: 500,
  },
  away: {
    played: 9, wins: 5, losses: 4,
    setsWon: 18, setsLost: 18,
    setWinPercentage: 50, winPercentage: 56,
    pointsScored: 550, pointsConceded: 550,
  },
  setBreakdown: { threeZero: 5, threeOne: 4, threeTwo: 3, zeroThree: 2, oneThree: 3, twoThree: 1 },
  recentForm: [
    { result: 'W' as const, opponent: 'A', score: '3-1', location: 'home' as const, month: 'march', day: 1 },
  ],
  headToHead: [],
  streaks: { currentStreak: { type: 'W' as const, count: 3 }, longestWinStreak: 5 },
  records: { biggestWin: null, heaviestDefeat: null },
  topScorers: [
    { name: 'Player A', totalPoints: 215, matchesPlayed: 18 },
  ],
  seasonProgress: [],
};

describe('TASK-06: VolleyballStatsTab', () => {
  it('renders volleyball season summary with win rate', () => {
    render(<VolleyballStatsTab stats={mockStats} />);
    screen.getByText('stats.seasonSummary');
    screen.getByText('stats.winRate');
    screen.getByText('67%');
  });

  it('renders set breakdown', () => {
    render(<VolleyballStatsTab stats={mockStats} />);
    screen.getByText('stats.setBreakdown');
    screen.getByText('stats.setsWon');
  });

  it('renders recent form', () => {
    render(<VolleyballStatsTab stats={mockStats} />);
    screen.getByText('stats.recentForm');
  });

  it('renders performance split without draws', () => {
    render(<VolleyballStatsTab stats={mockStats} />);
    screen.getByText('stats.performanceSplit');
    const section = screen.getByText('stats.performanceSplit').closest('section');
    expect(section?.textContent).not.toContain('stats.d');
  });

  it('renders top scorers with points', () => {
    render(<VolleyballStatsTab stats={mockStats} />);
    screen.getByText('stats.topScorers');
    screen.getByText('215');
  });

  it('does NOT render head-to-head (football only)', () => {
    render(<VolleyballStatsTab stats={mockStats} />);
    expect(screen.queryByText('stats.headToHead')).toBeNull();
  });

  it('women variant shows totalPoints and setsWon hero stats', () => {
    render(<VolleyballStatsTab stats={mockStats} variant="women" />);
    screen.getByText('stats.totalPoints');
    screen.getByText('stats.setsWon');
    expect(screen.queryByText('stats.winRate')).toBeNull();
  });

  it('women variant does NOT render set breakdown', () => {
    render(<VolleyballStatsTab stats={mockStats} variant="women" />);
    expect(screen.queryByText('stats.setBreakdown')).toBeNull();
  });

  it('handles empty stats gracefully', () => {
    const empty: VolleyballFormattedStats = {
      overall: { played: 0, wins: 0, losses: 0, setsWon: 0, setsLost: 0, setWinPercentage: 0, winPercentage: 0, pointsScored: 0, pointsConceded: 0 },
      home: { played: 0, wins: 0, losses: 0, setsWon: 0, setsLost: 0, setWinPercentage: 0, winPercentage: 0, pointsScored: 0, pointsConceded: 0 },
      away: { played: 0, wins: 0, losses: 0, setsWon: 0, setsLost: 0, setWinPercentage: 0, winPercentage: 0, pointsScored: 0, pointsConceded: 0 },
      setBreakdown: { threeZero: 0, threeOne: 0, threeTwo: 0, zeroThree: 0, oneThree: 0, twoThree: 0 },
      recentForm: [],
      headToHead: [],
      streaks: { currentStreak: { type: 'W' as const, count: 0 }, longestWinStreak: 0 },
      records: { biggestWin: null, heaviestDefeat: null },
      topScorers: [],
      seasonProgress: [],
    };
    render(<VolleyballStatsTab stats={empty} />);
    screen.getByText('stats.seasonSummary');
  });
});
