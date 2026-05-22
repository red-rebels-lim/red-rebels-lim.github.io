import { describe, it, expect } from 'vitest';
import { aggregateSquadStats } from '@/lib/football-stats';
import type { EventsData, SportEvent } from '@/types/events';
import type { Player } from '@/types/players';

function makeRoster(): Player[] {
  return [
    {
      key: 'panagiotis_louka',
      sport: 'football-men',
      active: true,
      nameEl: 'Παναγιώτης Λούκα',
      nameEn: 'Panagiotis Louka',
      position: 'FWD',
      shirtNumber: 89,
      aliases: ['ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', 'P. Louka'],
    },
    {
      key: 'daniel_perez',
      sport: 'football-men',
      active: true,
      nameEl: 'Daniel Perez',
      nameEn: 'Daniel Perez',
      position: 'FWD',
      shirtNumber: 9,
      aliases: ['ALEJANDRO PEREZ CORDOVA DANIEL', 'Daniel Pérez'],
    },
    {
      key: 'alberto_varo_lara',
      sport: 'football-men',
      active: true,
      nameEl: 'Alberto Varo Lara',
      nameEn: 'Alberto Varo Lara',
      position: 'GK',
      shirtNumber: 1,
      aliases: ['ALBERTO VARO LARA'],
    },
    {
      key: 'never_played',
      sport: 'football-men',
      active: true,
      nameEl: 'Νέος Παίκτης',
      nameEn: 'New Player',
      position: 'MID',
    },
  ];
}

function makeEvent(overrides: Partial<SportEvent> = {}): SportEvent {
  return {
    day: 1,
    sport: 'football-men',
    location: 'home',
    opponent: 'TEST OPPONENT',
    time: '',
    status: 'played',
    score: '1-0',
    ...overrides,
  };
}

function wrap(events: SportEvent[]): EventsData {
  return { september: events };
}

describe('aggregateSquadStats', () => {
  const roster = makeRoster();

  it('returns empty stats for every roster player when no events are played', () => {
    const result = aggregateSquadStats({ roster, events: wrap([]) });
    expect(result.size).toBe(4);
    for (const p of roster) {
      const s = result.get(p.key)!;
      expect(s.apps).toBe(0);
      expect(s.goals).toBe(0);
      expect(s.matchLog).toEqual([]);
    }
  });

  it('counts a lineup appearance as a start', () => {
    const events = [
      makeEvent({
        lineup: { home: [{ name: 'ΠΑΝΑΓΙΩΤΗΣ  ΛΟΥΚΑ' }], away: [] },
      }),
    ];
    const result = aggregateSquadStats({ roster, events: wrap(events) });
    const s = result.get('panagiotis_louka')!;
    expect(s.starts).toBe(1);
    expect(s.subAppearances).toBe(0);
    expect(s.apps).toBe(1);
    expect(s.matchLog).toHaveLength(1);
    expect(s.matchLog[0].appearance).toBe('start');
  });

  it('counts a subs.playerOn entry as a sub appearance', () => {
    const events = [
      makeEvent({
        subs: [{ playerOn: 'P. Louka', playerOff: 'X', minute: '60', team: 'home' }],
      }),
    ];
    const result = aggregateSquadStats({ roster, events: wrap(events) });
    const s = result.get('panagiotis_louka')!;
    expect(s.subAppearances).toBe(1);
    expect(s.starts).toBe(0);
    expect(s.apps).toBe(1);
    expect(s.matchLog[0].appearance).toBe('sub');
  });

  it('start beats sub when player appears in both', () => {
    const events = [
      makeEvent({
        lineup: { home: [{ name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ' }], away: [] },
        subs: [{ playerOn: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', playerOff: 'X', minute: '60', team: 'home' }],
      }),
    ];
    const result = aggregateSquadStats({ roster, events: wrap(events) });
    const s = result.get('panagiotis_louka')!;
    expect(s.starts).toBe(1);
    expect(s.subAppearances).toBe(0);
    expect(s.apps).toBe(1);
  });

  it('separates penalty goals, own goals, and open-play goals', () => {
    const events = [
      makeEvent({
        lineup: { home: [{ name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ' }], away: [] },
        scorers: [
          { name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '12', team: 'home' },
          { name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ (Πέναλτι)', minute: '45', team: 'home', type: 'pen' },
          { name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '60', team: 'home', type: 'og' },
        ],
      }),
    ];
    const result = aggregateSquadStats({ roster, events: wrap(events) });
    const s = result.get('panagiotis_louka')!;
    expect(s.goals).toBe(2);
    expect(s.goalsOpenPlay).toBe(1);
    expect(s.goalsPenalty).toBe(1);
    expect(s.ownGoals).toBe(1);
  });

  it('counts yellow and red cards independently per match', () => {
    const events = [
      makeEvent({
        lineup: { home: [{ name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ' }], away: [] },
        bookings: [
          { name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '20', team: 'home', card: 'yellow' },
          { name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '88', team: 'home', card: 'red' },
        ],
      }),
    ];
    const result = aggregateSquadStats({ roster, events: wrap(events) });
    const s = result.get('panagiotis_louka')!;
    expect(s.yellowCards).toBe(1);
    expect(s.redCards).toBe(1);
    expect(s.matchLog[0].yellowCard).toBe(true);
    expect(s.matchLog[0].redCard).toBe(true);
  });

  it('does not double-count two yellows in the same match', () => {
    const events = [
      makeEvent({
        lineup: { home: [{ name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ' }], away: [] },
        bookings: [
          { name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '20', team: 'home', card: 'yellow' },
          { name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '40', team: 'home', card: 'yellow' },
        ],
      }),
    ];
    const result = aggregateSquadStats({ roster, events: wrap(events) });
    expect(result.get('panagiotis_louka')!.yellowCards).toBe(1);
  });

  it('resolves Latin alias forms to the canonical roster key', () => {
    const events = [
      makeEvent({
        lineup: { home: [{ name: 'ALEJANDRO PEREZ CORDOVA DANIEL' }], away: [] },
        scorers: [{ name: 'Daniel Pérez', minute: '12', team: 'home' }],
      }),
    ];
    const result = aggregateSquadStats({ roster, events: wrap(events) });
    const s = result.get('daniel_perez')!;
    expect(s.starts).toBe(1);
    expect(s.goals).toBe(1);
  });

  it('ignores names that do not resolve to any roster player', () => {
    const events = [
      makeEvent({
        lineup: { home: [{ name: 'UNKNOWN OPPONENT' }], away: [] },
        scorers: [{ name: 'UNKNOWN OPPONENT', minute: '12', team: 'home' }],
      }),
    ];
    const result = aggregateSquadStats({ roster, events: wrap(events) });
    for (const s of result.values()) {
      expect(s.apps).toBe(0);
      expect(s.goals).toBe(0);
    }
  });

  it('attributes correctly when the same player appears on lineup.away (mixed convention)', () => {
    // The football scraper sometimes writes our team to lineup.away; the aggregator
    // must not trust the side and still resolve the player by name.
    const events = [
      makeEvent({
        location: 'away',
        lineup: { home: [], away: [{ name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ' }] },
      }),
    ];
    const result = aggregateSquadStats({ roster, events: wrap(events) });
    expect(result.get('panagiotis_louka')!.starts).toBe(1);
  });

  it('skips events that are not played football matches', () => {
    const events = [
      makeEvent({ status: 'upcoming', lineup: { home: [{ name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ' }], away: [] } }),
      makeEvent({ sport: 'volleyball-men', lineup: { home: [{ name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ' }], away: [] } }),
    ];
    const result = aggregateSquadStats({ roster, events: wrap(events) });
    expect(result.get('panagiotis_louka')!.apps).toBe(0);
  });

  it('coerces a scorer-only appearance to "sub" so totals reconcile with match log', () => {
    // Partial-scrape edge case: scorer is set but lineup/subs are not. Without coercion
    // we'd credit a goal without an appearance — confusing in the UI.
    const events = [
      makeEvent({
        lineup: { home: [], away: [] },
        scorers: [{ name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '12', team: 'home' }],
      }),
    ];
    const result = aggregateSquadStats({ roster, events: wrap(events) });
    const s = result.get('panagiotis_louka')!;
    expect(s.goals).toBe(1);
    expect(s.apps).toBe(1);
    expect(s.subAppearances).toBe(1);
    expect(s.matchLog[0].appearance).toBe('sub');
  });

  it('logs every match where the player tallied any event', () => {
    const events = [
      makeEvent({ day: 1, opponent: 'A', lineup: { home: [{ name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ' }], away: [] } }),
      makeEvent({ day: 8, opponent: 'B', subs: [{ playerOn: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', playerOff: 'x', minute: '70', team: 'home' }] }),
    ];
    const result = aggregateSquadStats({ roster, events: wrap(events) });
    const s = result.get('panagiotis_louka')!;
    expect(s.matchLog.map((m) => `${m.day}-${m.appearance}`)).toEqual(['1-start', '8-sub']);
  });
});
