import { describe, it, expect } from 'vitest';
import { planSync, eventToFixtureData, assertPlanSafe, type SeasonInfo, type SyncPlan } from './payload-sync.ts';
import type { SportEvent } from './index.ts';

const season: SeasonInfo = { id: 1, startYear: 2026, endYear: 2027 };
const teams = [
  { id: 5, nameEl: 'ΕΝΠ', aliases: [{ name: 'ENP' }] },
  { id: 6, nameEl: 'ΑΕΛ', aliases: [] },
];

const enpEvent = (over: Partial<SportEvent> = {}): SportEvent => ({
  day: 8,
  sport: 'football-men',
  location: 'away',
  opponent: 'ΕΝΠ',
  time: '19:00',
  venue: 'Tasos Markou Stadium',
  status: 'upcoming',
  competition: 'friendly',
  ...over,
});

/** An existing DB doc that legacy-round-trips identically to enpEvent(). */
const enpDoc = (over: Record<string, unknown> = {}) => ({
  id: 42,
  eventKey: 'august-8-football-men-ΕΝΠ',
  season: 1,
  sport: 'football-men',
  kickoff: '2026-08-08T16:00:00.000Z', // 19:00 Cyprus (UTC+3 in August)
  dateTbd: false,
  timeTbd: false,
  location: 'away',
  opponent: 5,
  opponentName: 'ΕΝΠ',
  venue: 'Tasos Markou Stadium',
  status: 'upcoming',
  competition: 'friendly',
  source: 'scraper',
  locked: false,
  ...over,
});

describe('eventToFixtureData', () => {
  it('converts Cyprus wall-clock to UTC and computes the frozen eventKey', () => {
    const { data, eventKey } = eventToFixtureData('august', enpEvent(), season, 5);
    expect(data.kickoff).toBe('2026-08-08T16:00:00.000Z');
    expect(data.timeTbd).toBe(false);
    expect(data.source).toBe('scraper');
    expect(eventKey).toBe('august-8-football-men-ΕΝΠ');
  });

  it('flags TBD times and uses the season start year for July/August', () => {
    const { data } = eventToFixtureData('august', enpEvent({ time: '' }), season, 5);
    expect(data.timeTbd).toBe(true);
    expect(String(data.kickoff)).toMatch(/^2026-08-0[78]T21:00/); // midnight Cyprus = 21:00Z prev day
  });
});

describe('planSync — creation and team resolution', () => {
  it('creates unmatched events with source scraper and the resolved team id', () => {
    const plan = planSync({ august: [enpEvent()] }, [], teams, season);
    expect(plan.creates).toHaveLength(1);
    expect(plan.creates[0].eventKey).toBe('august-8-football-men-ΕΝΠ');
    expect(plan.creates[0].data.opponent).toBe(5);
    expect(plan.updates).toHaveLength(0);
  });

  it('resolves opponents via team aliases', () => {
    const plan = planSync({ august: [enpEvent({ opponent: 'ENP' })] }, [], teams, season);
    expect(plan.creates).toHaveLength(1);
    expect(plan.creates[0].data.opponent).toBe(5);
  });

  it('collects unknown opponents without planning any write', () => {
    const plan = planSync({ august: [enpEvent({ opponent: 'ΑΓΝΩΣΤΗ ΟΜΑΔΑ' })] }, [], teams, season);
    expect(plan.unknownOpponents).toEqual(['ΑΓΝΩΣΤΗ ΟΜΑΔΑ']);
    expect(plan.creates).toHaveLength(0);
    expect(plan.updates).toHaveLength(0);
  });

  it('allows meetings without an opponent team', () => {
    const meeting: SportEvent = {
      day: 20, sport: 'meeting', location: 'home', opponent: 'Red Rebels Annual Party', time: '20:00',
    };
    const plan = planSync({ march: [meeting] }, [], teams, season);
    expect(plan.creates).toHaveLength(1);
    expect(plan.creates[0].data.opponent).toBeUndefined();
    expect(plan.unknownOpponents).toHaveLength(0);
  });
});

describe('planSync — protection rules', () => {
  it('never touches locked fixtures', () => {
    const plan = planSync(
      { august: [enpEvent({ score: '3-0', status: 'played' })] },
      [enpDoc({ locked: true })],
      teams, season,
    );
    expect(plan.updates).toHaveLength(0);
    expect(plan.creates).toHaveLength(0);
    expect(plan.skips).toEqual([{ eventKey: 'august-8-football-men-ΕΝΠ', reason: 'locked' }]);
  });

  it('never touches manual fixtures', () => {
    const plan = planSync(
      { august: [enpEvent({ score: '3-0' })] },
      [enpDoc({ source: 'manual' })],
      teams, season,
    );
    expect(plan.updates).toHaveLength(0);
    expect(plan.skips[0].reason).toBe('manual');
  });

  it('never touches live fixtures (mid-match edit protection)', () => {
    const plan = planSync(
      { august: [enpEvent({ status: 'played', score: '2-1' })] },
      [enpDoc({ status: 'live', score: '1-0' })],
      teams, season,
    );
    expect(plan.updates).toHaveLength(0);
    expect(plan.skips[0].reason).toBe('live');
  });

  it('freezes result fields on played DB fixtures even when the scrape differs', () => {
    const plan = planSync(
      { august: [enpEvent({ status: 'played', score: '9-9', venue: 'Elsewhere' })] },
      [enpDoc({ status: 'played', score: '2-1' })],
      teams, season,
    );
    expect(plan.updates).toHaveLength(0);
    expect(plan.skips[0].reason).toBe('played-unchanged');
  });

  it('fills empty detail arrays on played fixtures, and only those', () => {
    const scorers = [{ name: 'Παίκτης Α', minute: '12', team: 'away' as const }];
    const plan = planSync(
      { august: [enpEvent({ status: 'played', score: '9-9', scorers })] },
      [enpDoc({ status: 'played', score: '2-1', scorers: [] })],
      teams, season,
    );
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].reason).toBe('fill-detail');
    expect(Object.keys(plan.updates[0].data)).toEqual(['scorers']); // no score, no venue
  });

  it('never replaces detail arrays already present on played fixtures', () => {
    const plan = planSync(
      { august: [enpEvent({ status: 'played', scorers: [{ name: 'Άλλος', minute: '80', team: 'away' as const }] })] },
      [enpDoc({ status: 'played', score: '2-1', scorers: [{ id: 'x', name: 'Παίκτης Α', minute: '12', team: 'away' }] })],
      teams, season,
    );
    expect(plan.updates).toHaveLength(0);
    expect(plan.skips[0].reason).toBe('played-unchanged');
  });
});

describe('assertPlanSafe', () => {
  const planWith = (creates: number): SyncPlan => ({
    creates: Array.from({ length: creates }, (_, i) => ({ eventKey: `key-${i}`, data: {} })),
    updates: [],
    skips: [],
    unknownOpponents: [],
  });

  it('aborts when creations exceed the safety cap (stale-source scrape)', () => {
    expect(() => assertPlanSafe(planWith(78), 15)).toThrow(/78 fixture creations exceed the safety cap of 15/);
  });

  it('passes normal-sized plans and honours a raised cap', () => {
    expect(() => assertPlanSafe(planWith(3), 15)).not.toThrow();
    expect(() => assertPlanSafe(planWith(78), 78)).not.toThrow();
  });

  it('aborts on unknown opponents', () => {
    expect(() => assertPlanSafe({ ...planWith(0), unknownOpponents: ['ΧΧΧ'] }, 15)).toThrow(/unknown opponents/);
  });
});

describe('planSync — updates and matching', () => {
  it('fully updates an upcoming fixture when the result arrives', () => {
    const plan = planSync(
      { august: [enpEvent({ status: 'played', score: '0-2' })] },
      [enpDoc()],
      teams, season,
    );
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].reason).toBe('changed');
    expect(plan.updates[0].data.status).toBe('played');
    expect(plan.updates[0].data.score).toBe('0-2');
  });

  it('skips as unchanged when the legacy shape is identical', () => {
    const plan = planSync({ august: [enpEvent()] }, [enpDoc()], teams, season);
    expect(plan.creates).toHaveLength(0);
    expect(plan.updates).toHaveLength(0);
    expect(plan.skips).toEqual([{ eventKey: 'august-8-football-men-ΕΝΠ', reason: 'unchanged' }]);
  });

  it('preserves admin-enriched fields the scrape lacks (no perpetual churn)', () => {
    // events.ts has no venue for this fixture; an admin added one in the DB.
    const plan = planSync(
      { august: [enpEvent({ venue: undefined })] },
      [enpDoc()], // doc has venue "Tasos Markou Stadium"
      teams, season,
    );
    expect(plan.updates).toHaveLength(0);
    expect(plan.skips).toEqual([{ eventKey: 'august-8-football-men-ΕΝΠ', reason: 'unchanged' }]);
  });

  it('overwrites a field when the scrape genuinely has a new value', () => {
    const plan = planSync(
      { august: [enpEvent({ venue: 'New Stadium' })] },
      [enpDoc()],
      teams, season,
    );
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].data.venue).toBe('New Stadium');
    // the patch never carries undefined keys — omitted fields stay untouched
    expect(Object.values(plan.updates[0].data)).not.toContain(undefined);
  });

  it('adopts dateTbd draw fixtures within the ±10-day window instead of duplicating', () => {
    const drawDoc = enpDoc({
      eventKey: 'august-12-football-men-ΕΝΠ',
      kickoff: '2026-08-11T21:00:00.000Z', // Aug 12 Cyprus, matchday-window anchor
      dateTbd: true,
      timeTbd: true,
    });
    const plan = planSync({ august: [enpEvent()] }, [drawDoc], teams, season);
    expect(plan.creates).toHaveLength(0);
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].id).toBe(42);
    expect(plan.updates[0].data.dateTbd).toBe(false);
    expect(plan.updates[0].data.kickoff).toBe('2026-08-08T16:00:00.000Z');
  });

  it('does not adopt a dateTbd fixture outside the window', () => {
    const drawDoc = enpDoc({
      eventKey: 'september-8-football-men-ΕΝΠ',
      kickoff: '2026-09-07T21:00:00.000Z', // 30 days away
      dateTbd: true,
    });
    const plan = planSync({ august: [enpEvent()] }, [drawDoc], teams, season);
    expect(plan.creates).toHaveLength(1);
    expect(plan.updates).toHaveLength(0);
  });
});
