import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

import { RecentForm } from '@/components/stats/RecentForm';

const mockProps = {
  recentForm: [
    { result: 'W', opponent: 'APOEL', score: '2-0', location: 'home', month: 'march', day: 1 },
    { result: 'D', opponent: 'AEL', score: '1-1', location: 'away', month: 'february', day: 20 },
    { result: 'L', opponent: 'Omonia', score: '0-1', location: 'home', month: 'february', day: 15 },
    { result: 'W', opponent: 'AEK', score: '3-1', location: 'away', month: 'february', day: 8 },
    { result: 'W', opponent: 'Anorthosis', score: '2-1', location: 'home', month: 'january', day: 30 },
  ],
  currentStreak: { type: 'W' as const, count: 1 },
  longestWinStreak: 3,
  longestUnbeatenStreak: 5,
  hasPlayed: true,
};

describe('TASK-04: RecentForm redesign', () => {
  it('renders section title', () => {
    render(<RecentForm {...mockProps} />);
    expect(screen.getByText('stats.recentForm')).toBeDefined();
  });

  it('renders 5 form badges', () => {
    const { container } = render(<RecentForm {...mockProps} />);
    // Look for form badge elements with W, D, L text
    const badges = container.querySelectorAll('[title]');
    expect(badges.length).toBe(5);
  });

  it('does NOT render streaks section in redesigned version', () => {
    render(<RecentForm {...mockProps} />);
    // Streaks section should be hidden - no currentStreak, longestWinStreak, etc.
    expect(screen.queryByText('stats.streaks')).toBeNull();
    expect(screen.queryByText('stats.currentStreak')).toBeNull();
    expect(screen.queryByText('stats.longestWinStreak')).toBeNull();
    expect(screen.queryByText('stats.longestUnbeatenStreak')).toBeNull();
  });

  it('renders circular badges (rounded-full)', () => {
    const { container } = render(<RecentForm {...mockProps} />);
    const badges = container.querySelectorAll('.rounded-full');
    expect(badges.length).toBeGreaterThanOrEqual(5);
  });
});
