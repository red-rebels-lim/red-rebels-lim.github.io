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

  it('displays goals in for-against format', () => {
    render(<SeasonSummary {...mockProps} />);
    expect(screen.getByText('38-25')).toBeDefined();
  });

  it('displays all 9 stat cards in the grid', () => {
    render(<SeasonSummary {...mockProps} />);
    expect(screen.getByText('26')).toBeDefined();
    expect(screen.getByText('14')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('7')).toBeDefined();
    expect(screen.getByText('stats.matches')).toBeDefined();
    expect(screen.getByText('stats.wins')).toBeDefined();
    expect(screen.getByText('stats.draws')).toBeDefined();
    expect(screen.getByText('stats.losses')).toBeDefined();
    expect(screen.getByText('stats.cleanSheets')).toBeDefined();
    expect(screen.getByText('stats.avgGoalsFor')).toBeDefined();
    expect(screen.getByText('stats.avgGoalsAgainst')).toBeDefined();
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
