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

import { SeasonSummary } from '@/components/stats/SeasonSummary';
import { VolleyballSeasonSummary } from '@/components/stats/VolleyballSeasonSummary';
import { PerformanceSplit } from '@/components/stats/PerformanceSplit';
import { TopScorers } from '@/components/stats/TopScorers';
import { RecentForm } from '@/components/stats/RecentForm';
import type { TeamStatsWithPercentage } from '@/types/events';

const footballOverall: TeamStatsWithPercentage = {
  played: 26, wins: 14, draws: 5, losses: 7,
  goalsFor: 38, goalsAgainst: 26, goalDifference: 12,
  winPercentage: 54, points: 47,
};

const volleyballOverall = {
  played: 18, wins: 12, losses: 6,
  setsWon: 42, setsLost: 28,
  setWinPercentage: 60, winPercentage: 67,
  pointsScored: 1200, pointsConceded: 1050,
};

describe('TASK-08: Stitch Design System Alignment', () => {
  describe('Pill-style tabs', () => {
    it('tab buttons use rounded-full pill style', async () => {
      const { act } = await import('@testing-library/react');
      vi.mock('react-router-dom', () => ({
        NavLink: ({ children, to, ...props }: Record<string, unknown>) => {
          const className = typeof props.className === 'function'
            ? (props.className as (args: { isActive: boolean }) => string)({ isActive: false })
            : props.className;
          return <a href={to as string} className={className as string}>{children as React.ReactNode}</a>;
        },
        useLocation: () => ({ pathname: '/stats' }),
      }));
      vi.mock('@/hooks/useTheme', () => ({ useTheme: () => ({ isDark: true, toggle: vi.fn() }) }));
      vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
      vi.mock('@/lib/ics-export', () => ({ exportToCalendar: vi.fn() }));

      const { default: StatsPage } = await import('@/pages/StatsPage');
      await act(async () => { render(<StatsPage />); });

      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab.className).toContain('rounded-full');
      });
    });
  });

  describe('Season Summary — Stitch card system', () => {
    it('football stat cards do NOT use red gradient background', () => {
      const { container } = render(<SeasonSummary overall={footballOverall} cleanSheets={5} avgGoalsFor={1.8} avgGoalsAgainst={0.9} />);
      const cards = container.querySelectorAll('.grid.grid-cols-3 > div');
      cards.forEach(card => {
        expect(card.className).not.toContain('from-[rgba(224,37,32');
      });
    });

    it('football stat cards use neutral border (slate)', () => {
      const { container } = render(<SeasonSummary overall={footballOverall} cleanSheets={5} avgGoalsFor={1.8} avgGoalsAgainst={0.9} />);
      const cards = container.querySelectorAll('.grid.grid-cols-3 > div');
      expect(cards.length).toBe(9);
      cards.forEach(card => {
        expect(card.className).toContain('border-slate-');
      });
    });

    it('football stat grid uses 3-column layout with text-center', () => {
      const { container } = render(<SeasonSummary overall={footballOverall} cleanSheets={5} avgGoalsFor={1.8} avgGoalsAgainst={0.9} />);
      const grid = container.querySelector('.grid.grid-cols-3');
      expect(grid).toBeTruthy();
      const hasTextCenter = Array.from(container.querySelectorAll('div')).some(
        el => el.className.includes('text-center')
      );
      expect(hasTextCenter).toBe(true);
    });

    it('volleyball hero cards use neutral border (slate)', () => {
      const { container } = render(<VolleyballSeasonSummary overall={volleyballOverall} />);
      const heroCards = container.querySelectorAll('.grid.grid-cols-2 > div');
      expect(heroCards.length).toBeGreaterThan(0);
      heroCards.forEach(card => {
        expect(card.className).toContain('border-slate-');
      });
    });
  });

  describe('Performance Split — 2-col grid layout', () => {
    it('renders as a 2-column grid (not stacked list)', () => {
      const home = { played: 13, wins: 9, draws: 2, losses: 2 };
      const away = { played: 13, wins: 5, draws: 3, losses: 5 };
      const { container } = render(<PerformanceSplit home={home} away={away} />);

      // Should have a grid-cols-2 container wrapping home and away cards
      const gridContainer = container.querySelector('.grid.grid-cols-2');
      expect(gridContainer).not.toBeNull();
    });

    it('renders icon circles for home and away', () => {
      const home = { played: 13, wins: 9, draws: 2, losses: 2 };
      const away = { played: 13, wins: 5, draws: 3, losses: 5 };
      const { container } = render(<PerformanceSplit home={home} away={away} />);

      // Should have circular icon containers (rounded-full with fixed dimensions)
      const iconCircles = container.querySelectorAll('.rounded-full');
      expect(iconCircles.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Top Scorers — avatar circles', () => {
    it('renders avatar placeholder for each scorer', () => {
      const scorers = [
        { name: 'Player A', goals: 12 },
        { name: 'Player B', goals: 8 },
        { name: 'Player C', goals: 6 },
      ];
      const { container } = render(<TopScorers scorers={scorers} />);

      // Each scorer row should have an avatar circle with slate bg (Stitch: bg-slate-300 dark:bg-slate-700)
      // This is a SEPARATE element from the rank number — it's a person icon placeholder
      const avatarCircles = container.querySelectorAll('.rounded-full.bg-slate-300');
      expect(avatarCircles.length).toBe(3);
    });

    it('first scorer has primary accent border', () => {
      const scorers = [
        { name: 'Player A', goals: 12 },
        { name: 'Player B', goals: 8 },
      ];
      const { container } = render(<TopScorers scorers={scorers} />);

      // First scorer row should have primary border accent
      const scorerRows = container.querySelectorAll('.space-y-2 > div');
      expect(scorerRows[0]?.className).toContain('border-primary');
    });

    it('rank display is plain text (not a colored badge)', () => {
      const scorers = [{ name: 'Player A', goals: 12 }];
      const { container } = render(<TopScorers scorers={scorers} />);

      // Rank should be plain text with slate color, not a red circle badge
      const rankEl = container.querySelector('.text-slate-400');
      expect(rankEl).not.toBeNull();
      expect(rankEl?.textContent).toBe('1');
    });
  });

  describe('Recent Form — badge sizing', () => {
    it('form badges use w-10 h-10 sizing', () => {
      const recentForm = [
        { result: 'W' as const, opponent: 'A', score: '2-1', location: 'home' as const, month: 'march', day: 1 },
        { result: 'L' as const, opponent: 'B', score: '0-1', location: 'away' as const, month: 'march', day: 8 },
      ];
      const { container } = render(
        <RecentForm
          recentForm={recentForm}
          currentStreak={{ type: 'W', count: 1 }}
          longestWinStreak={1}
          longestUnbeatenStreak={1}
          hasPlayed={true}
        />
      );

      const badges = container.querySelectorAll('.rounded-full');
      badges.forEach(badge => {
        expect(badge.className).toContain('w-10');
        expect(badge.className).toContain('h-10');
      });
    });
  });

  describe('Shared card styling', () => {
    it('SeasonSummary stat cards use shadow-sm (Stitch card system)', () => {
      const { container } = render(<SeasonSummary overall={footballOverall} cleanSheets={5} avgGoalsFor={1.8} avgGoalsAgainst={0.9} />);
      const cards = container.querySelectorAll('.grid.grid-cols-3 > div');
      expect(cards.length).toBeGreaterThan(0);
      cards.forEach(card => {
        expect(card.className).toContain('shadow-sm');
      });
    });

    it('VolleyballSeasonSummary cards use neutral borders', () => {
      const { container } = render(<VolleyballSeasonSummary overall={volleyballOverall} variant="women" />);
      const cards = container.querySelectorAll('[class*="border"]');
      const hasRedTintedBorder = Array.from(cards).some(
        el => el.className.includes('rgba(224,37,32')
      );
      expect(hasRedTintedBorder).toBe(false);
    });
  });
});
