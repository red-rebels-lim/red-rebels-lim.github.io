import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { VolleyballSeasonSummary } from '@/components/stats/VolleyballSeasonSummary';
import type { VolleyballTeamStats } from '@/types/events';

const mockStats: VolleyballTeamStats = {
  played: 18,
  wins: 12,
  losses: 6,
  setsWon: 42,
  setsLost: 28,
  setWinPercentage: 60,
  winPercentage: 67,
  pointsScored: 1200,
  pointsConceded: 1050,
};

describe('TASK-05: VolleyballSeasonSummary', () => {
  it('renders section title', () => {
    render(<VolleyballSeasonSummary overall={mockStats} />);
    expect(screen.getByText('stats.seasonSummary')).toBeDefined();
  });

  it('displays win rate as hero stat', () => {
    render(<VolleyballSeasonSummary overall={mockStats} />);
    expect(screen.getByText('stats.winRate')).toBeDefined();
    expect(screen.getByText('67%')).toBeDefined();
  });

  it('displays points scored as hero stat', () => {
    render(<VolleyballSeasonSummary overall={mockStats} />);
    expect(screen.getByText('stats.totalPoints')).toBeDefined();
    expect(screen.getByText('1200')).toBeDefined();
  });

  it('displays matches, wins, losses in grid', () => {
    render(<VolleyballSeasonSummary overall={mockStats} />);
    expect(screen.getByText('stats.matches')).toBeDefined();
    expect(screen.getByText('18')).toBeDefined();
    expect(screen.getByText('stats.wins')).toBeDefined();
    expect(screen.getByText('12')).toBeDefined();
    expect(screen.getByText('stats.losses')).toBeDefined();
    expect(screen.getByText('6')).toBeDefined();
  });

  it('does NOT display draws', () => {
    render(<VolleyballSeasonSummary overall={mockStats} />);
    expect(screen.queryByText('stats.draws')).toBeNull();
  });

  it('renders with zero stats', () => {
    const empty: VolleyballTeamStats = {
      played: 0, wins: 0, losses: 0,
      setsWon: 0, setsLost: 0,
      setWinPercentage: 0, winPercentage: 0,
      pointsScored: 0, pointsConceded: 0,
    };
    render(<VolleyballSeasonSummary overall={empty} />);
    expect(screen.getByText('stats.seasonSummary')).toBeDefined();
    expect(screen.getByText('0%')).toBeDefined();
  });
});
