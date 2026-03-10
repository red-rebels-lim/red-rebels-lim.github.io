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
        'popover.sets': 'SETS',
        'popover.set': 'SET',
        'popover.vbScorers': 'TOP SCORERS',
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

describe('EventPopover – tabbed match details', () => {
  it('shows GOALSCORERS tab', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'GOALSCORERS' })).toBeDefined();
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

  it('shows BOOKINGS tab', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'BOOKINGS' })).toBeDefined();
  });

  it('shows booked player names in bookings panel', () => {
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

  it('shows LINEUPS tab', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'LINEUPS' })).toBeDefined();
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

  it('shows SUBSTITUTIONS tab', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'SUBSTITUTIONS' })).toBeDefined();
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

  it('hides GOALSCORERS tab when no scorers', () => {
    const noScorers: CalendarEvent = { ...playedFootballEvent, scorers: undefined };
    render(<EventPopover event={noScorers} open={true} onClose={vi.fn()} />);
    expect(screen.queryByRole('tab', { name: 'GOALSCORERS' })).toBeNull();
  });

  it('hides BOOKINGS tab when no bookings', () => {
    const noBookings: CalendarEvent = { ...playedFootballEvent, bookings: undefined };
    render(<EventPopover event={noBookings} open={true} onClose={vi.fn()} />);
    expect(screen.queryByRole('tab', { name: 'BOOKINGS' })).toBeNull();
  });

  it('hides LINEUPS tab when no lineup', () => {
    const noLineup: CalendarEvent = { ...playedFootballEvent, lineup: undefined };
    render(<EventPopover event={noLineup} open={true} onClose={vi.fn()} />);
    expect(screen.queryByRole('tab', { name: 'LINEUPS' })).toBeNull();
  });

  it('hides SUBSTITUTIONS tab when no subs', () => {
    const noSubs: CalendarEvent = { ...playedFootballEvent, subs: undefined };
    render(<EventPopover event={noSubs} open={true} onClose={vi.fn()} />);
    expect(screen.queryByRole('tab', { name: 'SUBSTITUTIONS' })).toBeNull();
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

describe('EventPopover – volleyball tabbed details', () => {
  const playedVolleyballEvent: CalendarEvent = {
    day: 2,
    title: 'Νέα Σαλαμίνα vs ΟΜΟΝΟΙΑ',
    subtitle: '👨🏐 - 20:00',
    location: 'home',
    sport: 'volleyball-men',
    isMeeting: false,
    status: 'played',
    score: '3-0',
    logo: 'images/team_logos/ΟΜΟΝΟΙΑ.webp',
    sets: [
      { home: 25, away: 16 },
      { home: 25, away: 20 },
      { home: 25, away: 19 },
    ],
    vbScorers: [
      { name: 'Peemuller', points: 19, team: 'home' },
      { name: 'Sinhayeuski', points: 13, team: 'away' },
    ],
    subs: [
      { playerOn: 'SubIn', playerOff: 'SubOut', minute: '2', team: 'home' },
    ],
  };

  it('shows SETS tab for volleyball', () => {
    render(<EventPopover event={playedVolleyballEvent} open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'SETS' })).toBeDefined();
  });

  it('shows set scores in SETS panel', () => {
    render(<EventPopover event={playedVolleyballEvent} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('25');
    expect(dialog?.textContent).toContain('16');
  });

  it('shows TOP SCORERS tab for volleyball', () => {
    render(<EventPopover event={playedVolleyballEvent} open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'TOP SCORERS' })).toBeDefined();
  });

  it('shows volleyball scorer names and points', () => {
    render(<EventPopover event={playedVolleyballEvent} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Peemuller');
    expect(dialog?.textContent).toContain('19pts');
    expect(dialog?.textContent).toContain('Sinhayeuski');
    expect(dialog?.textContent).toContain('13pts');
  });

  it('shows SUBSTITUTIONS tab for volleyball when subs exist', () => {
    render(<EventPopover event={playedVolleyballEvent} open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'SUBSTITUTIONS' })).toBeDefined();
  });

  it('does not show football tabs (GOALSCORERS/BOOKINGS) for volleyball', () => {
    render(<EventPopover event={playedVolleyballEvent} open={true} onClose={vi.fn()} />);
    expect(screen.queryByRole('tab', { name: 'GOALSCORERS' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'BOOKINGS' })).toBeNull();
  });

  it('does not show volleyball tabs (SETS/TOP SCORERS) for football', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    expect(screen.queryByRole('tab', { name: 'SETS' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'TOP SCORERS' })).toBeNull();
  });

  it('handles women volleyball sport type', () => {
    const womensVb: CalendarEvent = {
      ...playedVolleyballEvent,
      sport: 'volleyball-women',
      title: 'Νέα Σαλαμίνα vs ΑΕΚ',
    };
    render(<EventPopover event={womensVb} open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'SETS' })).toBeDefined();
    expect(screen.getByRole('tab', { name: 'TOP SCORERS' })).toBeDefined();
  });
});

describe('EventPopover – tab edge cases', () => {
  it('does not render tabs for upcoming matches', () => {
    const upcoming: CalendarEvent = {
      day: 13,
      title: 'Νέα Σαλαμίνα vs ΠΑΕΕΚ ΚΕΡΥΝΕΙΑΣ',
      subtitle: '⚽ - 15:30',
      location: 'home',
      sport: 'football-men',
      isMeeting: false,
      status: 'upcoming',
      logo: 'images/team_logos/ΠΑΕΕΚ_ΚΕΡΥΝΕΙΑΣ.webp',
    };
    render(<EventPopover event={upcoming} open={true} onClose={vi.fn()} />);
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('does not render tabs when played match has no detail data', () => {
    const noData: CalendarEvent = {
      ...playedFootballEvent,
      scorers: undefined,
      bookings: undefined,
      lineup: undefined,
      subs: undefined,
    };
    render(<EventPopover event={noData} open={true} onClose={vi.fn()} />);
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('renders only available tabs (scorers only)', () => {
    const scorersOnly: CalendarEvent = {
      ...playedFootballEvent,
      bookings: undefined,
      lineup: undefined,
      subs: undefined,
    };
    render(<EventPopover event={scorersOnly} open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'GOALSCORERS' })).toBeDefined();
    expect(screen.queryByRole('tab', { name: 'BOOKINGS' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'LINEUPS' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'SUBSTITUTIONS' })).toBeNull();
  });

  it('first available tab is selected by default', () => {
    render(<EventPopover event={playedFootballEvent} open={true} onClose={vi.fn()} />);
    const firstTab = screen.getByRole('tab', { name: 'GOALSCORERS' });
    expect(firstTab.getAttribute('data-state')).toBe('active');
  });

  it('shows away match with scorers on correct sides', () => {
    const awayMatch: CalendarEvent = {
      ...playedFootballEvent,
      title: 'ΑΕΖ ΖΑΚΑΚΙΟΥ vs Νέα Σαλαμίνα',
      location: 'away',
      scorers: [
        { name: 'AwayScorer', minute: '10', team: 'away' },
        { name: 'HomeScorer', minute: '20', team: 'home' },
      ],
      bookings: undefined,
      lineup: undefined,
      subs: undefined,
    };
    render(<EventPopover event={awayMatch} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('AwayScorer');
    expect(dialog?.textContent).toContain('HomeScorer');
  });

  it('shows lineups tab when only home lineup exists', () => {
    const homeOnly: CalendarEvent = {
      ...playedFootballEvent,
      scorers: undefined,
      bookings: undefined,
      subs: undefined,
      lineup: {
        home: [{ number: 1, name: 'GKPlayer', position: 'GK' }],
        away: [],
      },
    };
    render(<EventPopover event={homeOnly} open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'LINEUPS' })).toBeDefined();
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('GKPlayer');
  });

  it('shows lineup player without number or position', () => {
    const noNumberPos: CalendarEvent = {
      ...playedFootballEvent,
      scorers: undefined,
      bookings: undefined,
      subs: undefined,
      lineup: {
        home: [{ name: 'NoNumberPlayer' }],
        away: [{ name: 'OpponentPlayer' }],
      },
    };
    render(<EventPopover event={noNumberPos} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('NoNumberPlayer');
    expect(dialog?.textContent).toContain('OpponentPlayer');
  });

  it('shows red card icon in bookings', () => {
    const redCardEvent: CalendarEvent = {
      ...playedFootballEvent,
      scorers: undefined,
      lineup: undefined,
      subs: undefined,
      bookings: [{ name: 'RedCarded', minute: '45', team: 'home', card: 'red' }],
    };
    render(<EventPopover event={redCardEvent} open={true} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('RedCarded');
    expect(dialog?.querySelector('[aria-label="red card"]')).toBeDefined();
  });
});

describe('EventPopover – useCalendar new fields passthrough', () => {
  it('CalendarEvent type accepts all new fields', () => {
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
