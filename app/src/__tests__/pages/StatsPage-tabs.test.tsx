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

describe('TASK-06: StatsPage tabs integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(fetchTeamData).mockResolvedValue(null);
  });

  describe('3 sport tabs displayed', () => {
    it('renders Men\'s Football tab trigger', async () => {
      await act(async () => { render(<StatsPage />); });
      expect(screen.getByText('stats.mensFootball')).toBeDefined();
    });

    it('renders Men\'s Volleyball tab trigger', async () => {
      await act(async () => { render(<StatsPage />); });
      expect(screen.getByText('stats.mensVolleyball')).toBeDefined();
    });

    it('renders Women\'s Volleyball tab trigger', async () => {
      await act(async () => { render(<StatsPage />); });
      expect(screen.getByText('stats.womensVolleyball')).toBeDefined();
    });
  });

  describe('Football tab shows redesigned layout', () => {
    it('defaults to football tab', async () => {
      await act(async () => { render(<StatsPage />); });
      // Football content should be visible by default
      expect(screen.getByText('stats.seasonSummary')).toBeDefined();
      expect(screen.getByText('stats.performanceSplit')).toBeDefined();
      expect(screen.getByText('stats.recentForm')).toBeDefined();
    });

    it('football tab renders head-to-head', async () => {
      await act(async () => { render(<StatsPage />); });
      expect(screen.getByText('stats.headToHead')).toBeDefined();
    });
  });

  describe('Volleyball tabs show volleyball stats', () => {
    it('men\'s volleyball tab shows volleyball season summary with win rate', async () => {
      await act(async () => { render(<StatsPage />); });
      await act(async () => { fireEvent.click(screen.getByText('stats.mensVolleyball')); });
      // Should show volleyball-specific content
      expect(screen.getByText('stats.winRate')).toBeDefined();
      expect(screen.getByText('stats.setBreakdown')).toBeDefined();
    });

    it('men\'s volleyball tab shows set breakdown', async () => {
      await act(async () => { render(<StatsPage />); });
      await act(async () => { fireEvent.click(screen.getByText('stats.mensVolleyball')); });
      expect(screen.getByText('stats.setsWon')).toBeDefined();
      expect(screen.getByText('stats.setsLost')).toBeDefined();
    });

    it('women\'s volleyball tab shows volleyball stats with sets won hero', async () => {
      await act(async () => { render(<StatsPage />); });
      await act(async () => { fireEvent.click(screen.getByText('stats.womensVolleyball')); });
      expect(screen.getByText('stats.totalPoints')).toBeDefined();
      expect(screen.getByText('stats.setsWon')).toBeDefined();
    });

    it('volleyball tabs show performance split without draws', async () => {
      await act(async () => { render(<StatsPage />); });
      await act(async () => { fireEvent.click(screen.getByText('stats.mensVolleyball')); });
      expect(screen.getByText('stats.performanceSplit')).toBeDefined();
      // The draws column should be hidden (no "D" label in the row)
      const performanceSplitSection = screen.getByText('stats.performanceSplit').closest('section');
      const sectionText = performanceSplitSection?.textContent ?? '';
      expect(sectionText).not.toContain('stats.d');
    });
  });

  describe('Tab switching behavior', () => {
    it('switching to volleyball hides football content', async () => {
      await act(async () => { render(<StatsPage />); });
      // Football content visible initially
      expect(screen.getByText('stats.headToHead')).toBeDefined();
      // Switch to volleyball
      await act(async () => { fireEvent.click(screen.getByText('stats.mensVolleyball')); });
      // Football-specific content should be hidden
      expect(screen.queryByText('stats.headToHead')).toBeNull();
    });

    it('switching back to football restores football content', async () => {
      await act(async () => { render(<StatsPage />); });
      await act(async () => { fireEvent.click(screen.getByText('stats.mensVolleyball')); });
      await act(async () => { fireEvent.click(screen.getByText('stats.mensFootball')); });
      expect(screen.getByText('stats.headToHead')).toBeDefined();
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
      expect(screen.getByText('errors.fetchFailed')).toBeDefined();
    });
  });

  describe('i18n translations', () => {
    it('all tab labels use translation keys', async () => {
      await act(async () => { render(<StatsPage />); });
      // Tab labels should be i18n keys
      expect(screen.getByText('stats.mensFootball')).toBeDefined();
      expect(screen.getByText('stats.mensVolleyball')).toBeDefined();
      expect(screen.getByText('stats.womensVolleyball')).toBeDefined();
    });
  });
});
