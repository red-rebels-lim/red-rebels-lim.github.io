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

describe('TASK-04: LeagueTable compact mode', () => {
  it('shows only 3 rows initially (compact view)', () => {
    render(<LeagueTable tables={[mockTable]} />);
    // In compact mode, should show rows around Nea Salamina: positions 3, 4, 5
    const rows = screen.getAllByRole('row');
    // 1 header row + 3 data rows = 4 total
    expect(rows.length).toBe(4);
  });

  it('always shows Nea Salamina row in compact view', () => {
    render(<LeagueTable tables={[mockTable]} />);
    expect(screen.getByText('Nea Salamis')).toBeDefined();
  });

  it('shows compact columns: #, Club, GD, PTS', () => {
    render(<LeagueTable tables={[mockTable]} />);
    expect(screen.getByText('stats.goalDifference')).toBeDefined();
    expect(screen.getByText('stats.points')).toBeDefined();
  });

  it('does NOT show Pld, W, D, L columns in compact mode', () => {
    render(<LeagueTable tables={[mockTable]} />);
    expect(screen.queryByText('stats.played')).toBeNull();
    expect(screen.queryByText('stats.w')).toBeNull();
    expect(screen.queryByText('stats.d')).toBeNull();
    expect(screen.queryByText('stats.l')).toBeNull();
  });

  it('has a "View Full" button/link', () => {
    render(<LeagueTable tables={[mockTable]} />);
    expect(screen.getByText('stats.viewFull')).toBeDefined();
  });

  it('expands to show all rows when "View Full" is clicked', () => {
    render(<LeagueTable tables={[mockTable]} />);
    fireEvent.click(screen.getByText('stats.viewFull'));
    const rows = screen.getAllByRole('row');
    // 1 header + 8 data rows = 9
    expect(rows.length).toBe(9);
  });

  it('Nea Salamina row is highlighted', () => {
    render(<LeagueTable tables={[mockTable]} />);
    const nsRow = screen.getByText('Nea Salamis').closest('tr');
    expect(nsRow?.className).toContain('bg-primary/10');
  });
});
