import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('react-router-dom', () => ({
  NavLink: ({ children, to, ...props }: Record<string, unknown>) => {
    const className = typeof props.className === 'function'
      ? (props.className as (args: { isActive: boolean }) => string)({ isActive: false })
      : props.className;
    return <a href={to as string} className={className as string}>{children as React.ReactNode}</a>;
  },
  useLocation: () => ({ pathname: '/stats' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: true, toggle: vi.fn() }),
}));

vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/lib/ics-export', () => ({ exportToCalendar: vi.fn() }));

vi.mock('@/lib/fotmob', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/fotmob')>();
  return {
    ...actual,
    fetchTeamData: vi.fn().mockResolvedValue(null),
    tApi: (_t: unknown, _ns: string, val: string) => val,
  };
});

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  CartesianGrid: () => <div />,
}));

import StatsPage from '@/pages/StatsPage';

describe('TASK-04: StatsPage redesign - section order', () => {
  it('renders Season Summary (not Overall Stats)', async () => {
    await act(async () => { render(<StatsPage />); });
    expect(screen.getByText('stats.seasonSummary')).toBeDefined();
    expect(screen.queryByText('stats.overallStats')).toBeNull();
  });

  it('renders Performance Split (not Home vs Away)', async () => {
    await act(async () => { render(<StatsPage />); });
    expect(screen.getByText('stats.performanceSplit')).toBeDefined();
    expect(screen.queryByText('stats.homeVsAway')).toBeNull();
  });

  it('renders Recent Form section', async () => {
    await act(async () => { render(<StatsPage />); });
    expect(screen.getByText('stats.recentForm')).toBeDefined();
  });

  it('does NOT render removed sections', async () => {
    await act(async () => { render(<StatsPage />); });
    // These sections are removed from the mockup
    expect(screen.queryByText('stats.goalDistribution')).toBeNull();
    expect(screen.queryByText('stats.records')).toBeNull();
    expect(screen.queryByText('stats.seasonProgress')).toBeNull();
    expect(screen.queryByText('stats.leagueRankings')).toBeNull();
    expect(screen.queryByText('stats.venueInfo')).toBeNull();
  });

  it('section order matches mockup: Season Summary → Recent Form → Performance Split', async () => {
    await act(async () => { render(<StatsPage />); });
    const body = document.body.textContent ?? '';
    const seasonSummaryIdx = body.indexOf('stats.seasonSummary');
    const recentFormIdx = body.indexOf('stats.recentForm');
    const performanceSplitIdx = body.indexOf('stats.performanceSplit');

    expect(seasonSummaryIdx).toBeGreaterThan(-1);
    expect(recentFormIdx).toBeGreaterThan(-1);
    expect(performanceSplitIdx).toBeGreaterThan(-1);
    // Season Summary before Recent Form
    expect(seasonSummaryIdx).toBeLessThan(recentFormIdx);
    // Recent Form before Performance Split
    expect(recentFormIdx).toBeLessThan(performanceSplitIdx);
  });
});
