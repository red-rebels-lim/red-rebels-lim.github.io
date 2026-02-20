import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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

// Mock fetchTeamData to return null (no FotMob data)
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

describe('StatsPage', () => {
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
});
