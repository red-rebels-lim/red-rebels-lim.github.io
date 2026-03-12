import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { HomeVsAway } from '@/components/stats/HomeVsAway';

const mockHome = {
  played: 13,
  wins: 9,
  draws: 2,
  losses: 2,
  goalsFor: 24,
  goalsAgainst: 10,
  goalDifference: 14,
};

const mockAway = {
  played: 13,
  wins: 5,
  draws: 3,
  losses: 5,
  goalsFor: 14,
  goalsAgainst: 15,
  goalDifference: -1,
};

describe('HomeVsAway', () => {
  it('renders the section title', () => {
    render(<HomeVsAway home={mockHome} away={mockAway} />);
    expect(screen.getByText('stats.homeVsAway')).toBeDefined();
  });

  it('renders home and away sections', () => {
    render(<HomeVsAway home={mockHome} away={mockAway} />);
    expect(screen.getByText('stats.home')).toBeDefined();
    expect(screen.getByText('stats.away')).toBeDefined();
  });

  it('displays W/D/L values for both sections', () => {
    render(<HomeVsAway home={mockHome} away={mockAway} />);
    // Home: 9W 2D 2L, Away: 5W 3D 5L
    expect(screen.getByText('9')).toBeDefined();
    expect(screen.getAllByText('5')).toHaveLength(2); // away wins=5 and away losses=5
  });

  it('displays goal line with signed positive goal difference', () => {
    render(<HomeVsAway home={mockHome} away={mockAway} />);
    // Home: 24-10 (+14)
    expect(screen.getByText(/24-10.*\+14/)).toBeDefined();
  });

  it('displays goal line with negative goal difference (no plus)', () => {
    render(<HomeVsAway home={mockHome} away={mockAway} />);
    // Away: 14-15 (-1) — no '+' prefix
    expect(screen.getByText(/14-15.*-1/)).toBeDefined();
  });

  it('handles zero goal difference', () => {
    const zeroGD = { ...mockAway, goalDifference: 0, goalsFor: 10, goalsAgainst: 10 };
    render(<HomeVsAway home={mockHome} away={zeroGD} />);
    expect(screen.getByText(/10-10.*\(0\)/)).toBeDefined();
  });
});
