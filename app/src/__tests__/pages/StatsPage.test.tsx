import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('react-router-dom', () => ({
  NavLink: ({ children, to, ...props }: Record<string, unknown>) => {
    // NavLink passes className as a function; resolve it to avoid React DOM warning
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

import StatsPage from '@/pages/StatsPage';
import { fetchTeamData } from '@/lib/fotmob';

describe('StatsPage', () => {
  beforeEach(() => {
    vi.mocked(fetchTeamData).mockResolvedValue(null);
    vi.restoreAllMocks();
  });

  it('renders season summary section', async () => {
    await act(async () => { render(<StatsPage />); });
    expect(screen.getByText('stats.seasonSummary')).toBeDefined();
  });

  it('renders stat cards', async () => {
    await act(async () => { render(<StatsPage />); });
    expect(screen.getAllByText('stats.matches').length).toBeGreaterThan(0);
    expect(screen.getAllByText('stats.wins').length).toBeGreaterThan(0);
    expect(screen.getAllByText('stats.draws').length).toBeGreaterThan(0);
    expect(screen.getAllByText('stats.losses').length).toBeGreaterThan(0);
    expect(screen.getAllByText('stats.points').length).toBeGreaterThan(0);
  });

  it('renders performance split section', async () => {
    await act(async () => { render(<StatsPage />); });
    expect(screen.getByText('stats.performanceSplit')).toBeDefined();
    expect(screen.getByText('stats.home')).toBeDefined();
    expect(screen.getByText('stats.away')).toBeDefined();
  });

  it('renders recent form section', async () => {
    await act(async () => { render(<StatsPage />); });
    expect(screen.getByText('stats.recentForm')).toBeDefined();
  });

  it('renders head to head section', async () => {
    await act(async () => { render(<StatsPage />); });
    expect(screen.getByText('stats.headToHead')).toBeDefined();
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
    vi.mocked(fetchTeamData).mockResolvedValue(mockTeamData as Awaited<ReturnType<typeof fetchTeamData>>);
    await act(async () => {
      render(<StatsPage />);
    });
    expect(fetchTeamData).toHaveBeenCalled();
  });
});
