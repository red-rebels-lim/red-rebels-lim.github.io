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
  return { ...actual, tApi: (_t: unknown, _ns: string, val: string) => val };
});

import { TopScorers } from '@/components/stats/TopScorers';

describe('TopScorers', () => {
  it('renders nothing when scorers array is empty', () => {
    const { container } = render(<TopScorers scorers={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders scorer names and goals', () => {
    const scorers = [
      { name: 'Player A', goals: 10 },
      { name: 'Player B', goals: 7 },
      { name: 'Player C', goals: 5 },
    ];
    render(<TopScorers scorers={scorers} />);

    screen.getByText('Player A');
    screen.getByText('Player B');
    screen.getByText('Player C');
    screen.getByText('10');
    screen.getByText('7');
    screen.getByText('5');
  });

  it('renders section title', () => {
    render(<TopScorers scorers={[{ name: 'Test', goals: 1 }]} />);
    screen.getByText('stats.topScorers');
  });

  describe('layout', () => {
    const scorers = [
      { name: 'Dimitris Christofi', goals: 12 },
      { name: 'Duminsku', goals: 8 },
      { name: 'Diego Berreguery', goals: 6 },
    ];

    it('uses vertical list layout (not 3-column grid)', () => {
      const { container } = render(<TopScorers scorers={scorers} />);
      const gridCols3 = container.querySelector('.sm\\:grid-cols-3');
      expect(gridCols3).toBeNull();
    });

    it('does NOT use medal emojis', () => {
      const { container } = render(<TopScorers scorers={scorers} />);
      expect(container.textContent).not.toContain('🥇');
      expect(container.textContent).not.toContain('🥈');
      expect(container.textContent).not.toContain('🥉');
    });

    it('shows rank numbers', () => {
      const { container } = render(<TopScorers scorers={scorers} />);
      expect(container.textContent).toContain('1');
      expect(container.textContent).toContain('2');
      expect(container.textContent).toContain('3');
    });
  });

  describe('volleyball unit prop', () => {
    it('displays points (not goals) when unit is "points"', () => {
      const scorers = [
        { name: 'Eleni Kyprianou', value: 215 },
        { name: 'Maria Papadopoulou', value: 182 },
      ];
      render(<TopScorers scorers={scorers} unit="points" />);
      screen.getByText('215');
      screen.getByText('182');
      screen.getByText('Eleni Kyprianou');
    });

    it('works with football scorers using goals (backward compat)', () => {
      const scorers = [
        { name: 'Player A', goals: 10 },
        { name: 'Player B', goals: 7 },
      ];
      render(<TopScorers scorers={scorers} />);
      screen.getByText('10');
      screen.getByText('7');
    });

    it('accepts generic { name, value } scorers', () => {
      const scorers = [
        { name: 'Scorer 1', value: 100 },
      ];
      render(<TopScorers scorers={scorers} unit="points" />);
      screen.getByText('100');
      screen.getByText('Scorer 1');
    });
  });
});
