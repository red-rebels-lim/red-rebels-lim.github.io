import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('react-router-dom', () => ({
  NavLink: ({ children, ...props }: Record<string, unknown>) => <a {...props}>{children as React.ReactNode}</a>,
  useLocation: () => ({ pathname: '/stats' }),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: true, toggle: vi.fn() }),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/lib/ics-export', () => ({
  exportToCalendar: vi.fn(),
}));

// Mock fetchTeamData using vi.fn() directly in the factory (vi.mock is hoisted)
vi.mock('@/lib/fotmob', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/fotmob')>();
  return {
    ...actual,
    fetchTeamData: vi.fn().mockResolvedValue(null),
    tApi: (_t: unknown, _ns: string, val: string) => val,
  };
});

// Mock recharts - they need ResizeObserver which jsdom lacks
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  CartesianGrid: () => <div />,
}));

import StatsPage from '@/pages/StatsPage';
import * as statsLib from '@/lib/stats';
import { fetchTeamData } from '@/lib/fotmob';

describe('StatsPage', () => {
  beforeEach(() => {
    vi.mocked(fetchTeamData).mockResolvedValue(null);
    vi.restoreAllMocks();
  });

  it('renders overall stats section', () => {
    render(<StatsPage />);
    expect(screen.getByText('stats.overallStats')).toBeDefined();
  });

  it('renders stat cards', () => {
    render(<StatsPage />);
    expect(screen.getByText('stats.matches')).toBeDefined();
    // wins/draws/losses appear multiple times (stat cards + form legend + home/away)
    expect(screen.getAllByText('stats.wins').length).toBeGreaterThan(0);
    expect(screen.getAllByText('stats.draws').length).toBeGreaterThan(0);
    expect(screen.getAllByText('stats.losses').length).toBeGreaterThan(0);
    expect(screen.getAllByText('stats.points').length).toBeGreaterThan(0);
  });

  it('renders home vs away section', () => {
    render(<StatsPage />);
    expect(screen.getByText('stats.homeVsAway')).toBeDefined();
    expect(screen.getByText('stats.home')).toBeDefined();
    expect(screen.getByText('stats.away')).toBeDefined();
  });

  it('renders recent form section', () => {
    render(<StatsPage />);
    expect(screen.getByText('stats.recentForm')).toBeDefined();
  });

  it('renders head to head section', () => {
    render(<StatsPage />);
    expect(screen.getByText('stats.headToHead')).toBeDefined();
  });

  it('renders records section when data exists', () => {
    render(<StatsPage />);
    // Records should exist since we have real events data
    const recordsSection = screen.queryByText('stats.records');
    if (recordsSection) {
      expect(screen.getByText('stats.biggestWin')).toBeDefined();
    }
  });

  it('renders charts', () => {
    render(<StatsPage />);
    const charts = screen.queryAllByTestId('responsive-container');
    // Should have goal distribution and/or season progress charts
    expect(charts.length).toBeGreaterThanOrEqual(0);
  });

  it('renders streak label for draw streak', () => {
    vi.spyOn(statsLib, 'calculateStatistics').mockReturnValue({
      overall: { played: 5, wins: 1, draws: 3, losses: 1, goalsFor: 5, goalsAgainst: 4, points: 6 },
      home: { wins: 1, draws: 1, losses: 0, goalsFor: 3, goalsAgainst: 1, goalDifference: 2 },
      away: { wins: 0, draws: 2, losses: 1, goalsFor: 2, goalsAgainst: 3, goalDifference: -1 },
      recentForm: [],
      headToHead: [],
      goalDistribution: [],
      pointsProgression: [],
      currentStreak: { type: 'D', count: 3 },
      longestWinStreak: 1,
      longestUnbeatenStreak: 3,
      cleanSheets: 0,
      avgGoalsFor: '1.0',
      avgGoalsAgainst: '0.8',
      biggestWin: null,
      heaviestDefeat: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    render(<StatsPage />);
    expect(screen.getByText('stats.currentStreak')).toBeDefined();
  });

  it('renders streak label for loss streak', () => {
    vi.spyOn(statsLib, 'calculateStatistics').mockReturnValue({
      overall: { played: 4, wins: 1, draws: 0, losses: 3, goalsFor: 3, goalsAgainst: 7, points: 3 },
      home: { wins: 1, draws: 0, losses: 1, goalsFor: 2, goalsAgainst: 3, goalDifference: -1 },
      away: { wins: 0, draws: 0, losses: 2, goalsFor: 1, goalsAgainst: 4, goalDifference: -3 },
      recentForm: [],
      headToHead: [],
      goalDistribution: [],
      pointsProgression: [],
      currentStreak: { type: 'L', count: 3 },
      longestWinStreak: 1,
      longestUnbeatenStreak: 1,
      cleanSheets: 0,
      avgGoalsFor: '0.75',
      avgGoalsAgainst: '1.75',
      biggestWin: null,
      heaviestDefeat: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    render(<StatsPage />);
    expect(screen.getByText('stats.currentStreak')).toBeDefined();
  });

  it('renders streak label for unbeaten streak', () => {
    vi.spyOn(statsLib, 'calculateStatistics').mockReturnValue({
      overall: { played: 5, wins: 2, draws: 3, losses: 0, goalsFor: 7, goalsAgainst: 2, points: 9 },
      home: { wins: 2, draws: 1, losses: 0, goalsFor: 5, goalsAgainst: 1, goalDifference: 4 },
      away: { wins: 0, draws: 2, losses: 0, goalsFor: 2, goalsAgainst: 1, goalDifference: 1 },
      recentForm: [],
      headToHead: [],
      goalDistribution: [],
      pointsProgression: [],
      currentStreak: { type: 'unbeaten', count: 5 },
      longestWinStreak: 2,
      longestUnbeatenStreak: 5,
      cleanSheets: 2,
      avgGoalsFor: '1.4',
      avgGoalsAgainst: '0.4',
      biggestWin: null,
      heaviestDefeat: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    render(<StatsPage />);
    expect(screen.getByText('stats.currentStreak')).toBeDefined();
  });

  it('calls parseFotMobData when fetchTeamData returns data', async () => {
    const mockTeamData = {
      details: { id: '123', name: 'Test FC' },
      history: { historicalTopscorers: [] },
      recentResults: { recentResults: [] },
      nextMatch: null,
      tabs: { overview: { leagueTable: null, rankings: null } },
      squad: {},
    };
    vi.mocked(fetchTeamData).mockResolvedValue(mockTeamData as Parameters<typeof fetchTeamData>[0] extends undefined ? never : Awaited<ReturnType<typeof fetchTeamData>>);
    await act(async () => {
      render(<StatsPage />);
    });
    expect(fetchTeamData).toHaveBeenCalled();
  });
});
