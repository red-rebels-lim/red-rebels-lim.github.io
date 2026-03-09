import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'popover.matchday' && opts?.number !== undefined) return `MATCHDAY ${opts.number}`;
      const map: Record<string, string> = {
        'popover.goalscorers': 'GOALSCORERS',
        'popover.bookings': 'BOOKINGS',
        'popover.lineup': 'LINEUPS',
        'popover.substitutions': 'SUBSTITUTIONS',
        'popover.competition': 'Cyprus 2nd Division',
        'popover.matchday': 'MATCHDAY',
        'popover.pen': 'pen',
        'popover.og': 'og',
        'popover.viewAllStats': 'View All Statistics',
        'popover.readFullReport': 'READ FULL REPORT',
        'popover.matchResult': 'MATCH RESULT',
        'popover.win': 'Win',
        'popover.draw': 'Draw',
        'popover.loss': 'Loss',
        'popover.homeGround': 'Home',
        'popover.awayGround': 'Away',
        'popover.tbd': 'TBD',
      };
      return map[key] ?? key;
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

import { EventPopover } from '@/components/calendar/EventPopover';
import type { CalendarEvent } from '@/types/events';

const playedFootballEvent: CalendarEvent = {
  day: 8,
  title: 'Νέα Σαλαμίνα vs ΑΕΖ ΖΑΚΑΚΙΟΥ',
  subtitle: '⚽ - 15:30',
  location: 'home',
  sport: 'football-men',
  isMeeting: false,
  status: 'played',
  score: '2-1',
  logo: 'images/team_logos/ΑΕΖ_ΖΑΚΑΚΙΟΥ.webp',
  matchday: 22,
  duration: "90+5'",
  scorers: [
    { name: 'Παπαδόπουλος', minute: '23', team: 'home' },
    { name: 'Κωστής', minute: '67', team: 'home', type: 'pen' },
    { name: 'Smith', minute: '45+2', team: 'away' },
  ],
  bookings: [
    { name: 'Σαμαράς', minute: '34', team: 'home', card: 'yellow' },
    { name: 'Johnson', minute: '78', team: 'away', card: 'yellow' },
    { name: 'Brown', minute: '89', team: 'away', card: 'red' },
  ],
  lineup: {
    home: [
      { number: 1, name: 'Κυπριανού', position: 'GK' },
      { number: 4, name: 'Σαμαράς', position: 'CB' },
      { number: 5, name: 'Νικολάου', position: 'CB' },
      { number: 2, name: 'Χρίστου', position: 'RB' },
      { number: 3, name: 'Αντρέου', position: 'LB' },
      { number: 8, name: 'Παπαδόπουλος', position: 'CM' },
      { number: 6, name: 'Γεωργίου', position: 'CM' },
      { number: 7, name: 'Ιωάννου', position: 'RM' },
      { number: 11, name: 'Κωστής', position: 'LM' },
      { number: 9, name: 'Μιχαήλ', position: 'ST' },
      { number: 10, name: 'Σταύρου', position: 'ST' },
    ],
    away: [
      { number: 1, name: 'Keeper', position: 'GK' },
      { number: 4, name: 'Defender1', position: 'CB' },
      { number: 5, name: 'Defender2', position: 'CB' },
      { number: 2, name: 'Defender3', position: 'RB' },
      { number: 3, name: 'Defender4', position: 'LB' },
      { number: 8, name: 'Smith', position: 'CM' },
      { number: 6, name: 'Jones', position: 'CM' },
      { number: 7, name: 'Brown', position: 'RM' },
      { number: 11, name: 'White', position: 'LM' },
      { number: 9, name: 'Black', position: 'ST' },
      { number: 10, name: 'Green', position: 'ST' },
    ],
  },
  subs: [
    { playerOn: 'Νέος', playerOff: 'Παπαδόπουλος', minute: '75', team: 'home' },
    { playerOn: 'Petrov', playerOff: 'Smith', minute: '80', team: 'away' },
  ],
};

describe('EventPopover – new match details sections', () => {
  it('shows GOALSCORERS section heading', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('GOALSCORERS')).toBeDefined();
  });

  it('shows home scorer name and minute', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Παπαδόπουλος');
    expect(dialog?.textContent).toContain("23'");
  });

  it('shows away scorer name and minute', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Smith');
    expect(dialog?.textContent).toContain("45+2'");
  });

  it('shows pen annotation on penalty scorer', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('pen');
  });

  it('shows BOOKINGS section heading', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('BOOKINGS')).toBeDefined();
  });

  it('shows booked player names', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Σαμαράς');
    expect(dialog?.textContent).toContain('Johnson');
    expect(dialog?.textContent).toContain('Brown');
  });

  it('shows competition line with matchday', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Cyprus 2nd Division');
    expect(dialog?.textContent).toContain('22');
  });

  it('shows duration chip', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain("90+5'");
  });

  it('shows LINEUPS section heading', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('LINEUPS')).toBeDefined();
  });

  it('shows home lineup player', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Κυπριανού');
  });

  it('shows away lineup player', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Keeper');
  });

  it('shows SUBSTITUTIONS section heading', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('SUBSTITUTIONS')).toBeDefined();
  });

  it('shows substitution player names and minute', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Νέος');
    expect(dialog?.textContent).toContain('Petrov');
    expect(dialog?.textContent).toContain("75'");
  });

  it('shows View All Statistics button', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('View All Statistics')).toBeDefined();
  });

  it('hides GOALSCORERS section when no scorers', () => {
    const noScorers: CalendarEvent = { ...playedFootballEvent, scorers: undefined };
    render(<EventPopover event={noScorers} open={true} onClose={vi.fn()} />);
    expect(screen.queryByText('GOALSCORERS')).toBeNull();
  });

  it('hides BOOKINGS section when no bookings', () => {
    const noBookings: CalendarEvent = { ...playedFootballEvent, bookings: undefined };
    render(<EventPopover event={noBookings} open={true} onClose={vi.fn()} />);
    expect(screen.queryByText('BOOKINGS')).toBeNull();
  });

  it('hides LINEUPS section when no lineup', () => {
    const noLineup: CalendarEvent = { ...playedFootballEvent, lineup: undefined };
    render(<EventPopover event={noLineup} open={true} onClose={vi.fn()} />);
    expect(screen.queryByText('LINEUPS')).toBeNull();
  });

  it('hides SUBSTITUTIONS section when no subs', () => {
    const noSubs: CalendarEvent = { ...playedFootballEvent, subs: undefined };
    render(<EventPopover event={noSubs} open={true} onClose={vi.fn()} />);
    expect(screen.queryByText('SUBSTITUTIONS')).toBeNull();
  });

  it('shows og annotation on own-goal scorer', () => {
    const ogEvent: CalendarEvent = {
      ...playedFootballEvent,
      scorers: [{ name: 'OwnGoalGuy', minute: '10', team: 'away', type: 'og' }],
    };
    render(<EventPopover event={ogEvent} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('og');
  });
});

describe('EventPopover – useCalendar new fields passthrough', () => {
  it('CalendarEvent type accepts all new fields', () => {
    // This is a compile-time check via the type used above.
    // If types are wrong the test file itself won't compile.
    const event: CalendarEvent = playedFootballEvent;
    expect(event.scorers?.length).toBe(3);
    expect(event.bookings?.length).toBe(3);
    expect(event.lineup?.home.length).toBe(11);
    expect(event.lineup?.away.length).toBe(11);
    expect(event.subs?.length).toBe(2);
    expect(event.duration).toBe("90+5'");
    expect(event.matchday).toBe(22);
  });
});
