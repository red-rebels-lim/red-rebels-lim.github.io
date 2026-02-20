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

import { LeagueTable } from '@/components/stats/LeagueTable';
import type { LeagueTableData } from '@/lib/fotmob';

const NEA_SALAMINA_ID = 8590;

const mockTable: LeagueTableData = {
  leagueName: 'First Division',
  rows: [
    { id: 1, name: 'APOEL', shortName: 'APO', position: 1, played: 10, wins: 8, draws: 1, losses: 1, goalDifference: 15, pts: 25 },
    { id: NEA_SALAMINA_ID, name: 'Nea Salamis', shortName: 'NS', position: 2, played: 10, wins: 7, draws: 2, losses: 1, goalDifference: 10, pts: 23, qualColor: '#00ff00' },
    { id: 3, name: 'AEL', shortName: 'AEL', position: 3, played: 10, wins: 6, draws: 3, losses: 1, goalDifference: 8, pts: 21 },
  ],
  legend: [{ title: 'Promotion', color: '#00ff00' }],
};

describe('LeagueTable', () => {
  it('renders nothing when tables do not contain Nea Salamina', () => {
    const table: LeagueTableData = {
      leagueName: 'Other League',
      rows: [{ id: 999, name: 'Other', shortName: 'OT', position: 1, played: 1, wins: 1, draws: 0, losses: 0, goalDifference: 1, pts: 3 }],
      legend: [],
    };
    const { container } = render(<LeagueTable tables={[table]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders league table with Nea Salamina highlighted', () => {
    render(<LeagueTable tables={[mockTable]} />);
    expect(screen.getByText('stats.leagueStanding')).toBeDefined();
    expect(screen.getByText('Nea Salamis')).toBeDefined();
    expect(screen.getByText('APOEL')).toBeDefined();
  });

  it('renders table header columns', () => {
    render(<LeagueTable tables={[mockTable]} />);
    expect(screen.getByText('stats.team')).toBeDefined();
    expect(screen.getByText('stats.played')).toBeDefined();
    expect(screen.getByText('stats.points')).toBeDefined();
  });

  it('renders legend items', () => {
    render(<LeagueTable tables={[mockTable]} />);
    expect(screen.getByText('Promotion')).toBeDefined();
  });

  it('renders multiple tables with sub-headings', () => {
    const secondTable: LeagueTableData = {
      leagueName: 'Second Division',
      rows: [{ id: NEA_SALAMINA_ID, name: 'Nea Salamis', shortName: 'NS', position: 1, played: 5, wins: 5, draws: 0, losses: 0, goalDifference: 20, pts: 15 }],
      legend: [],
    };
    render(<LeagueTable tables={[mockTable, secondTable]} />);
    expect(screen.getByText('First Division')).toBeDefined();
    expect(screen.getByText('Second Division')).toBeDefined();
  });
});
