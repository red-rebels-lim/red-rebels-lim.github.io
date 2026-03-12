import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

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

import StatsPage from '@/pages/StatsPage';
import { fetchTeamData } from '@/lib/fotmob';

describe('StatsPage', () => {
  beforeEach(() => {
    vi.mocked(fetchTeamData).mockResolvedValue(null);
    vi.restoreAllMocks();
  });

  it('renders season summary section', async () => {
    await act(async () => { render(<StatsPage />); });
    screen.getByText('stats.seasonSummary');
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
    screen.getByText('stats.performanceSplit');
    screen.getByText('stats.home');
    screen.getByText('stats.away');
  });

  it('renders recent form section', async () => {
    await act(async () => { render(<StatsPage />); });
    screen.getByText('stats.recentForm');
  });

  it('renders head to head section', async () => {
    await act(async () => { render(<StatsPage />); });
    screen.getByText('stats.headToHead');
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

  describe('section layout', () => {
    it('renders Season Summary (not Overall Stats)', async () => {
      await act(async () => { render(<StatsPage />); });
      screen.getByText('stats.seasonSummary');
      expect(screen.queryByText('stats.overallStats')).toBeNull();
    });

    it('renders Performance Split (not Home vs Away)', async () => {
      await act(async () => { render(<StatsPage />); });
      screen.getByText('stats.performanceSplit');
      expect(screen.queryByText('stats.homeVsAway')).toBeNull();
    });

    it('renders Recent Form section', async () => {
      await act(async () => { render(<StatsPage />); });
      screen.getByText('stats.recentForm');
    });

    it('does NOT render removed sections', async () => {
      await act(async () => { render(<StatsPage />); });
      expect(screen.queryByText('stats.goalDistribution')).toBeNull();
      expect(screen.queryByText('stats.records')).toBeNull();
      expect(screen.queryByText('stats.seasonProgress')).toBeNull();
      expect(screen.queryByText('stats.leagueRankings')).toBeNull();
      expect(screen.queryByText('stats.venueInfo')).toBeNull();
    });

    it('section order matches mockup: Season Summary -> Recent Form -> Performance Split', async () => {
      await act(async () => { render(<StatsPage />); });
      const body = document.body.textContent ?? '';
      const seasonSummaryIdx = body.indexOf('stats.seasonSummary');
      const recentFormIdx = body.indexOf('stats.recentForm');
      const performanceSplitIdx = body.indexOf('stats.performanceSplit');

      expect(seasonSummaryIdx).toBeGreaterThan(-1);
      expect(recentFormIdx).toBeGreaterThan(-1);
      expect(performanceSplitIdx).toBeGreaterThan(-1);
      expect(seasonSummaryIdx).toBeLessThan(recentFormIdx);
      expect(recentFormIdx).toBeLessThan(performanceSplitIdx);
    });
  });

  describe('sport tabs', () => {
    describe('3 sport tabs displayed', () => {
      it('renders Men\'s Football tab trigger', async () => {
        await act(async () => { render(<StatsPage />); });
        screen.getByText('stats.mensFootball');
      });

      it('renders Men\'s Volleyball tab trigger', async () => {
        await act(async () => { render(<StatsPage />); });
        screen.getByText('stats.mensVolleyball');
      });

      it('renders Women\'s Volleyball tab trigger', async () => {
        await act(async () => { render(<StatsPage />); });
        screen.getByText('stats.womensVolleyball');
      });
    });

    describe('Football tab shows redesigned layout', () => {
      it('defaults to football tab', async () => {
        await act(async () => { render(<StatsPage />); });
        screen.getByText('stats.seasonSummary');
        screen.getByText('stats.performanceSplit');
        screen.getByText('stats.recentForm');
      });

      it('football tab renders head-to-head', async () => {
        await act(async () => { render(<StatsPage />); });
        screen.getByText('stats.headToHead');
      });
    });

    describe('Volleyball tabs show volleyball stats', () => {
      it('men\'s volleyball tab shows volleyball season summary with win rate', async () => {
        await act(async () => { render(<StatsPage />); });
        await act(async () => { fireEvent.click(screen.getByText('stats.mensVolleyball')); });
        screen.getByText('stats.winRate');
        screen.getByText('stats.setBreakdown');
      });

      it('men\'s volleyball tab shows set breakdown', async () => {
        await act(async () => { render(<StatsPage />); });
        await act(async () => { fireEvent.click(screen.getByText('stats.mensVolleyball')); });
        screen.getByText('stats.setsWon');
        screen.getByText('stats.setsLost');
      });

      it('women\'s volleyball tab shows volleyball stats with sets won hero', async () => {
        await act(async () => { render(<StatsPage />); });
        await act(async () => { fireEvent.click(screen.getByText('stats.womensVolleyball')); });
        screen.getByText('stats.totalPoints');
        screen.getByText('stats.setsWon');
      });

      it('volleyball tabs show performance split without draws', async () => {
        await act(async () => { render(<StatsPage />); });
        await act(async () => { fireEvent.click(screen.getByText('stats.mensVolleyball')); });
        screen.getByText('stats.performanceSplit');
        const performanceSplitSection = screen.getByText('stats.performanceSplit').closest('section');
        const sectionText = performanceSplitSection?.textContent ?? '';
        expect(sectionText).not.toContain('stats.d');
      });
    });

    describe('Tab switching behavior', () => {
      it('switching to volleyball hides football content', async () => {
        await act(async () => { render(<StatsPage />); });
        screen.getByText('stats.headToHead');
        await act(async () => { fireEvent.click(screen.getByText('stats.mensVolleyball')); });
        expect(screen.queryByText('stats.headToHead')).toBeNull();
      });

      it('switching back to football restores football content', async () => {
        await act(async () => { render(<StatsPage />); });
        await act(async () => { fireEvent.click(screen.getByText('stats.mensVolleyball')); });
        await act(async () => { fireEvent.click(screen.getByText('stats.mensFootball')); });
        screen.getByText('stats.headToHead');
      });
    });

    describe('FotMob loading/error states for football tab', () => {
      it('fetches FotMob data on mount', async () => {
        await act(async () => { render(<StatsPage />); });
        expect(fetchTeamData).toHaveBeenCalled();
      });

      it('shows error banner when FotMob fetch fails', async () => {
        vi.mocked(fetchTeamData).mockResolvedValue(null);
        await act(async () => { render(<StatsPage />); });
        screen.getByText('errors.fetchFailed');
      });
    });

    describe('i18n translations', () => {
      it('all tab labels use translation keys', async () => {
        await act(async () => { render(<StatsPage />); });
        screen.getByText('stats.mensFootball');
        screen.getByText('stats.mensVolleyball');
        screen.getByText('stats.womensVolleyball');
      });
    });
  });
});
