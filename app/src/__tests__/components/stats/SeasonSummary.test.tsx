import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { SeasonSummary } from '@/components/stats/SeasonSummary';

const mockProps = {
  overall: {
    played: 26,
    wins: 14,
    draws: 5,
    losses: 7,
    goalsFor: 38,
    goalsAgainst: 25,
    goalDifference: 13,
    winPercentage: 54,
    points: 47,
  },
  cleanSheets: 8,
  avgGoalsFor: 1.5,
  avgGoalsAgainst: 1.0,
};

describe('TASK-04: SeasonSummary', () => {
  it('renders the section title', () => {
    render(<SeasonSummary {...mockProps} />);
    expect(screen.getByText('stats.seasonSummary')).toBeDefined();
  });

  it('displays total points prominently', () => {
    render(<SeasonSummary {...mockProps} />);
    expect(screen.getByText('47')).toBeDefined();
    expect(screen.getByText('stats.points')).toBeDefined();
  });

  it('displays total goals prominently', () => {
    render(<SeasonSummary {...mockProps} />);
    expect(screen.getByText('38')).toBeDefined();
  });

  it('displays matches, wins, draws, losses in grid', () => {
    render(<SeasonSummary {...mockProps} />);
    expect(screen.getByText('26')).toBeDefined();
    expect(screen.getByText('14')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('7')).toBeDefined();
    expect(screen.getByText('stats.matches')).toBeDefined();
    expect(screen.getByText('stats.wins')).toBeDefined();
    expect(screen.getByText('stats.draws')).toBeDefined();
    expect(screen.getByText('stats.losses')).toBeDefined();
  });

  it('does NOT display cleanSheets, avgGoalsFor, avgGoalsAgainst in UI', () => {
    render(<SeasonSummary {...mockProps} />);
    expect(screen.queryByText('stats.cleanSheets')).toBeNull();
    expect(screen.queryByText('stats.avgGoalsFor')).toBeNull();
    expect(screen.queryByText('stats.avgGoalsAgainst')).toBeNull();
  });

  it('renders with zero stats without errors', () => {
    const emptyProps = {
      overall: {
        played: 0, wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
        winPercentage: 0, points: 0,
      },
      cleanSheets: 0, avgGoalsFor: 0, avgGoalsAgainst: 0,
    };
    render(<SeasonSummary {...emptyProps} />);
    expect(screen.getByText('stats.seasonSummary')).toBeDefined();
  });
});
