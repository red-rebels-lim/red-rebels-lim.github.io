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

describe('TASK-05: TopScorers volleyball mode', () => {
  it('displays points (not goals) when unit is "points"', () => {
    const scorers = [
      { name: 'Eleni Kyprianou', value: 215 },
      { name: 'Maria Papadopoulou', value: 182 },
    ];
    render(<TopScorers scorers={scorers} unit="points" />);
    expect(screen.getByText('215')).toBeDefined();
    expect(screen.getByText('182')).toBeDefined();
    expect(screen.getByText('Eleni Kyprianou')).toBeDefined();
  });

  it('works with football scorers using goals (backward compat)', () => {
    const scorers = [
      { name: 'Player A', goals: 10 },
      { name: 'Player B', goals: 7 },
    ];
    render(<TopScorers scorers={scorers} />);
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('7')).toBeDefined();
  });

  it('accepts generic { name, value } scorers', () => {
    const scorers = [
      { name: 'Scorer 1', value: 100 },
    ];
    render(<TopScorers scorers={scorers} unit="points" />);
    expect(screen.getByText('100')).toBeDefined();
    expect(screen.getByText('Scorer 1')).toBeDefined();
  });
});
