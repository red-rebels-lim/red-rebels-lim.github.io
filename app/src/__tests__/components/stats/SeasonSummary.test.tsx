import { describe, it, vi } from 'vitest';
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
    screen.getByText('stats.seasonSummary');
  });

  it('displays total points prominently', () => {
    render(<SeasonSummary {...mockProps} />);
    screen.getByText('47');
    screen.getByText('stats.points');
  });

  it('displays goals in for-against format', () => {
    render(<SeasonSummary {...mockProps} />);
    screen.getByText('38-25');
  });

  it('displays all 9 stat cards in the grid', () => {
    render(<SeasonSummary {...mockProps} />);
    screen.getByText('26');
    screen.getByText('14');
    screen.getByText('5');
    screen.getByText('7');
    screen.getByText('stats.matches');
    screen.getByText('stats.wins');
    screen.getByText('stats.draws');
    screen.getByText('stats.losses');
    screen.getByText('stats.cleanSheets');
    screen.getByText('stats.avgGoalsFor');
    screen.getByText('stats.avgGoalsAgainst');
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
    screen.getByText('stats.seasonSummary');
  });
});
