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

    expect(screen.getByText('Player A')).toBeDefined();
    expect(screen.getByText('Player B')).toBeDefined();
    expect(screen.getByText('Player C')).toBeDefined();
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('7')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
  });

  it('renders section title', () => {
    render(<TopScorers scorers={[{ name: 'Test', goals: 1 }]} />);
    expect(screen.getByText('stats.topScorers')).toBeDefined();
  });
});
