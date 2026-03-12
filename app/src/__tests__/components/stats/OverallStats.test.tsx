import { describe, it, expect, vi } from 'vitest';
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
    expect(screen.getByText('stats.overallStats')).toBeDefined();
  });

  it('displays all 9 stat cards with correct values', () => {
    render(<OverallStats {...mockProps} />);
    expect(screen.getByText('26')).toBeDefined(); // played
    expect(screen.getByText('14')).toBeDefined(); // wins
    expect(screen.getByText('5')).toBeDefined();  // draws
    expect(screen.getByText('7')).toBeDefined();  // losses
    expect(screen.getByText('38-25')).toBeDefined(); // goals
    expect(screen.getByText('47')).toBeDefined(); // points
    expect(screen.getByText('8')).toBeDefined();  // cleanSheets
    expect(screen.getByText('1.5')).toBeDefined(); // avgGoalsFor
  });

  it('displays all stat labels', () => {
    render(<OverallStats {...mockProps} />);
    expect(screen.getByText('stats.matches')).toBeDefined();
    expect(screen.getByText('stats.wins')).toBeDefined();
    expect(screen.getByText('stats.draws')).toBeDefined();
    expect(screen.getByText('stats.losses')).toBeDefined();
    expect(screen.getByText('stats.goals')).toBeDefined();
    expect(screen.getByText('stats.points')).toBeDefined();
    expect(screen.getByText('stats.cleanSheets')).toBeDefined();
    expect(screen.getByText('stats.avgGoalsFor')).toBeDefined();
    expect(screen.getByText('stats.avgGoalsAgainst')).toBeDefined();
  });
});
