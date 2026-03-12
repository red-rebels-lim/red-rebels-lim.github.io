import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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
    screen.getByText('stats.leagueStanding');
    screen.getByText('Nea Salamis');
    screen.getByText('APOEL');
  });

  it('renders compact table header columns (# / Team / GD / PTS)', () => {
    render(<LeagueTable tables={[mockTable]} />);
    screen.getByText('stats.team');
    screen.getByText('stats.goalDifference');
    screen.getByText('stats.points');
  });

  it('has View Full button', () => {
    render(<LeagueTable tables={[mockTable]} />);
    screen.getByText('stats.viewFull');
  });

  it('renders multiple tables with sub-headings', () => {
    const secondTable: LeagueTableData = {
      leagueName: 'Second Division',
      rows: [{ id: NEA_SALAMINA_ID, name: 'Nea Salamis', shortName: 'NS', position: 1, played: 5, wins: 5, draws: 0, losses: 0, goalDifference: 20, pts: 15 }],
      legend: [],
    };
    render(<LeagueTable tables={[mockTable, secondTable]} />);
    screen.getByText('First Division');
    screen.getByText('Second Division');
  });

  describe('compact mode', () => {
    const compactTable: LeagueTableData = {
      leagueName: 'Second Division',
      rows: [
        { id: 1, name: 'Team A', shortName: 'TA', position: 1, played: 26, wins: 18, draws: 4, losses: 4, goalDifference: 25, pts: 58 },
        { id: 2, name: 'Team B', shortName: 'TB', position: 2, played: 26, wins: 16, draws: 5, losses: 5, goalDifference: 18, pts: 53 },
        { id: 3, name: 'Anorthosis', shortName: 'ANO', position: 3, played: 26, wins: 15, draws: 6, losses: 5, goalDifference: 15, pts: 51 },
        { id: NEA_SALAMINA_ID, name: 'Nea Salamis', shortName: 'NS', position: 4, played: 26, wins: 14, draws: 5, losses: 7, goalDifference: 13, pts: 47, qualColor: '#00ff00' },
        { id: 5, name: 'Team E', shortName: 'TE', position: 5, played: 26, wins: 12, draws: 7, losses: 7, goalDifference: 8, pts: 43 },
        { id: 6, name: 'Team F', shortName: 'TF', position: 6, played: 26, wins: 10, draws: 8, losses: 8, goalDifference: 3, pts: 38 },
        { id: 7, name: 'Team G', shortName: 'TG', position: 7, played: 26, wins: 8, draws: 6, losses: 12, goalDifference: -5, pts: 30 },
        { id: 8, name: 'Team H', shortName: 'TH', position: 8, played: 26, wins: 5, draws: 5, losses: 16, goalDifference: -20, pts: 20 },
      ],
      legend: [],
    };

    it('shows only 3 rows initially (compact view)', () => {
      render(<LeagueTable tables={[compactTable]} />);
      const rows = screen.getAllByRole('row');
      // 1 header row + 3 data rows = 4 total
      expect(rows.length).toBe(4);
    });

    it('always shows Nea Salamina row in compact view', () => {
      render(<LeagueTable tables={[compactTable]} />);
      screen.getByText('Nea Salamis');
    });

    it('shows compact columns: #, Club, GD, PTS', () => {
      render(<LeagueTable tables={[compactTable]} />);
      screen.getByText('stats.goalDifference');
      screen.getByText('stats.points');
    });

    it('does NOT show Pld, W, D, L columns in compact mode', () => {
      render(<LeagueTable tables={[compactTable]} />);
      expect(screen.queryByText('stats.played')).toBeNull();
      expect(screen.queryByText('stats.w')).toBeNull();
      expect(screen.queryByText('stats.d')).toBeNull();
      expect(screen.queryByText('stats.l')).toBeNull();
    });

    it('has a "View Full" button/link', () => {
      render(<LeagueTable tables={[compactTable]} />);
      screen.getByText('stats.viewFull');
    });

    it('expands to show all rows when "View Full" is clicked', () => {
      render(<LeagueTable tables={[compactTable]} />);
      fireEvent.click(screen.getByText('stats.viewFull'));
      const rows = screen.getAllByRole('row');
      // 1 header + 8 data rows = 9
      expect(rows.length).toBe(9);
    });

    it('Nea Salamina row is highlighted', () => {
      render(<LeagueTable tables={[compactTable]} />);
      const nsRow = screen.getByText('Nea Salamis').closest('tr');
      expect(nsRow?.className).toContain('bg-primary/10');
    });
  });
});
