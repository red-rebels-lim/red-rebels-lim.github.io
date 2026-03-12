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
    fetchTeamData: vi.fn().mockResolvedValue(null),
    tApi: (_t: unknown, _ns: string, val: string) => val,
  };
});

import { FootballStatsTab } from '@/components/stats/FootballStatsTab';
import type { FormattedStats } from '@/types/events';

const mockStats: FormattedStats = {
  overall: { played: 26, wins: 14, draws: 5, losses: 7, goalsFor: 38, goalsAgainst: 25, goalDifference: 13, winPercentage: 54, points: 47 },
  home: { played: 13, wins: 8, draws: 3, losses: 2, goalsFor: 22, goalsAgainst: 10, goalDifference: 12, winPercentage: 62 },
  away: { played: 13, wins: 6, draws: 2, losses: 5, goalsFor: 16, goalsAgainst: 15, goalDifference: 1, winPercentage: 46 },
  recentForm: [
    { result: 'W', opponent: 'A', score: '2-0', location: 'home', month: 'march', day: 1 },
  ],
  headToHead: [{ opponent: 'A', played: 2, wins: 1, draws: 1, losses: 0, goalsFor: 3, goalsAgainst: 1 }],
  cleanSheets: 8,
  avgGoalsFor: 1.5,
  avgGoalsAgainst: 1.0,
  goalDistribution: [],
  currentStreak: { type: 'W' as const, count: 3 },
  longestWinStreak: 5,
  longestUnbeatenStreak: 8,
  biggestWin: null,
  heaviestDefeat: null,
  pointsProgression: [],
};

describe('TASK-06: FootballStatsTab', () => {
  it('renders season summary', () => {
    render(<FootballStatsTab stats={mockStats} fotmob={null} loading={false} />);
    screen.getByText('stats.seasonSummary');
  });

  it('renders recent form', () => {
    render(<FootballStatsTab stats={mockStats} fotmob={null} loading={false} />);
    screen.getByText('stats.recentForm');
  });

  it('renders performance split with draws', () => {
    const { container } = render(<FootballStatsTab stats={mockStats} fotmob={null} loading={false} />);
    screen.getByText('stats.performanceSplit');
    // Should include draws
    expect(container.textContent).toContain('stats.d');
  });

  it('renders head to head', () => {
    render(<FootballStatsTab stats={mockStats} fotmob={null} loading={false} />);
    screen.getByText('stats.headToHead');
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(<FootballStatsTab stats={mockStats} fotmob={null} loading={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
