import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { OverallStats } from '@/components/stats/OverallStats';

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

describe('OverallStats', () => {
  it('renders the section title', () => {
    render(<OverallStats {...mockProps} />);
    screen.getByText('stats.overallStats');
  });

  it('displays all 9 stat cards with correct values', () => {
    render(<OverallStats {...mockProps} />);
    screen.getByText('26'); // played
    screen.getByText('14'); // wins
    screen.getByText('5');  // draws
    screen.getByText('7');  // losses
    screen.getByText('38-25'); // goals
    screen.getByText('47'); // points
    screen.getByText('8');  // cleanSheets
    screen.getByText('1.5'); // avgGoalsFor
  });

  it('displays all stat labels', () => {
    render(<OverallStats {...mockProps} />);
    screen.getByText('stats.matches');
    screen.getByText('stats.wins');
    screen.getByText('stats.draws');
    screen.getByText('stats.losses');
    screen.getByText('stats.goals');
    screen.getByText('stats.points');
    screen.getByText('stats.cleanSheets');
    screen.getByText('stats.avgGoalsFor');
    screen.getByText('stats.avgGoalsAgainst');
  });
});
