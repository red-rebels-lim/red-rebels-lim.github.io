import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'total' in opts) return `${key} ${opts.total}`;
      return key;
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/lib/fotmob', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/fotmob')>();
  return { ...actual, tApi: (_t: unknown, _ns: string, val: string) => val };
});

import { LeagueRankings } from '@/components/stats/LeagueRankings';

describe('LeagueRankings', () => {
  it('renders nothing when rankings is empty', () => {
    const { container } = render(<LeagueRankings rankings={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders ranking cards', () => {
    const rankings = [
      { label: 'Goals', translationKey: 'goals', rank: 3, value: '15', totalTeams: 14 },
      { label: 'Assists', translationKey: 'assists', rank: 1, value: '20', totalTeams: 14 },
    ];
    render(<LeagueRankings rankings={rankings} />);

    expect(screen.getByText('Goals')).toBeDefined();
    expect(screen.getByText('Assists')).toBeDefined();
    expect(screen.getByText('15')).toBeDefined();
    expect(screen.getByText('20')).toBeDefined();
  });

  it('shows ordinal suffixes in English', () => {
    const rankings = [
      { label: 'Goals', translationKey: 'goals', rank: 1, value: '10', totalTeams: 14 },
      { label: 'Assists', translationKey: 'assists', rank: 2, value: '5', totalTeams: 14 },
      { label: 'Shots', translationKey: 'shots', rank: 3, value: '30', totalTeams: 14 },
    ];
    render(<LeagueRankings rankings={rankings} />);

    expect(screen.getByText('1st')).toBeDefined();
    expect(screen.getByText('2nd')).toBeDefined();
    expect(screen.getByText('3rd')).toBeDefined();
  });
});
