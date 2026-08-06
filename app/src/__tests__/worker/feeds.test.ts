import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildEventsFeed,
  buildLiveFeed,
  buildPlayersFeed,
  getDataVersion,
  resetDataVersionMemo,
} from '@/worker/feeds';
import type { D1Database, D1PreparedStatement } from '@/worker/feeds';
import worker from '@/_worker';

type Row = Record<string, unknown>;

/** Fake D1: resolves each query to the table named after its first FROM. */
function fakeD1(tables: Record<string, Row[]>): D1Database {
  const resolve = (sql: string): Row[] => {
    const table = sql.match(/FROM (\w+)/)?.[1] ?? '';
    return tables[table] ?? [];
  };
  const prepare = (sql: string): D1PreparedStatement => ({
    bind: () => prepare(sql),
    all: async () => ({ results: resolve(sql) }),
  });
  return {
    prepare,
    batch: (statements) => Promise.all(statements.map((s) => s.all())),
  };
}

const seasons = [{ id: 1, start_year: 2026, end_year: 2027, is_current: 1 }];

// Kickoffs are UTC; Cyprus is UTC+3 in July/September (EEST).
const fixtures = [
  {
    id: 10,
    season_id: 1,
    sport: 'football-men',
    kickoff: '2026-09-13T16:00:00.000Z',
    date_tbd: 0,
    time_tbd: 0,
    location: 'home',
    opponent_name: 'ΟΜΟΝΟΙΑ',
    venue: 'Αμμόχωστος',
    logo_url: 'https://example.com/omonoia.png',
    status: 'played',
    score: '2-1',
    penalties: null,
    competition: 'league',
    matchday: 2,
    duration: null,
    report_e_n: 'Great win',
    report_e_l: 'Σπουδαία νίκη',
  },
  {
    id: 11,
    season_id: 1,
    sport: 'volleyball-women',
    kickoff: '2026-07-21T15:00:00.000Z',
    date_tbd: 0,
    time_tbd: 1,
    location: 'away',
    opponent_name: 'ΑΕΛ',
    venue: null,
    logo_url: null,
    status: 'live',
    score: null,
    penalties: null,
    competition: 'league',
    matchday: null,
    duration: null,
    report_e_n: null,
    report_e_l: null,
  },
  {
    id: 12,
    season_id: 1,
    sport: 'meeting',
    kickoff: '2026-09-01T15:30:00.000Z',
    date_tbd: 1,
    time_tbd: 0,
    location: 'home',
    opponent_name: 'Γενική Συνέλευση',
    venue: null,
    logo_url: null,
    status: 'upcoming',
    score: null,
    penalties: null,
    competition: null,
    matchday: null,
    duration: null,
    report_e_n: null,
    report_e_l: null,
  },
];

const childTables = {
  fixtures_scorers: [
    { _parent_id: 10, _order: 1, id: 1, name: 'Παίκτης Α (Πέναλτι)', minute: 12, team: 'home', type: null },
    { _parent_id: 10, _order: 2, id: 2, name: 'Παίκτης Β', minute: 88, team: 'home', type: 'own-goal' },
  ],
  fixtures_bookings: [
    { _parent_id: 10, _order: 1, id: 3, name: 'Παίκτης Γ', minute: 45, team: 'away', card: 'yellow' },
  ],
  fixtures_lineup_home: [
    { _parent_id: 10, _order: 1, id: 4, name: 'Τερματοφύλακας', number: 1, position: 'GK' },
  ],
  fixtures_lineup_away: [],
  fixtures_subs: [
    { _parent_id: 10, _order: 1, id: 5, player_on: 'Παίκτης Δ', player_off: 'Παίκτης Ε', minute: 60, team: 'home' },
  ],
  fixtures_sets: [
    { _parent_id: 11, _order: 1, id: 6, home: 25, away: 20 },
    { _parent_id: 11, _order: 2, id: 7, home: 23, away: 25 },
  ],
  fixtures_vb_scorers: [
    { _parent_id: 11, _order: 1, id: 8, name: 'Παίκτρια Α', points: 18, team: 'away' },
  ],
};

describe('buildEventsFeed', () => {
  const d1 = fakeD1({ seasons, fixtures, ...childTables });

  it('produces the frozen contract envelope with season-ordered month buckets', async () => {
    const feed = await buildEventsFeed(d1);
    expect(feed.season).toBe('2026/2027');
    expect(typeof feed.generatedAt).toBe('string');
    // All 12 buckets in season order (July first), empty months as [].
    expect(Object.keys(feed.events)).toEqual([
      'july', 'august', 'september', 'october', 'november', 'december',
      'january', 'february', 'march', 'april', 'may', 'june',
    ]);
    expect(feed.events.august).toEqual([]);
  });

  it('reshapes a played football fixture with all child rows', async () => {
    const feed = await buildEventsFeed(d1);
    const event = feed.events.september!.find((e) => e.opponent === 'ΟΜΟΝΟΙΑ')!;
    expect(event).toEqual({
      day: 13,
      sport: 'football-men',
      location: 'home',
      opponent: 'ΟΜΟΝΟΙΑ',
      time: '19:00',
      venue: 'Αμμόχωστος',
      logo: 'https://example.com/omonoia.png',
      status: 'played',
      score: '2-1',
      competition: 'league',
      matchday: 2,
      reportEN: 'Great win',
      reportEL: 'Σπουδαία νίκη',
      // null type dropped from the first scorer, kept on the second
      scorers: [
        { name: 'Παίκτης Α (Πέναλτι)', minute: 12, team: 'home' },
        { name: 'Παίκτης Β', minute: 88, team: 'home', type: 'own-goal' },
      ],
      bookings: [{ name: 'Παίκτης Γ', minute: 45, team: 'away', card: 'yellow' }],
      lineup: {
        home: [{ name: 'Τερματοφύλακας', number: 1, position: 'GK' }],
        away: [],
      },
      subs: [{ playerOn: 'Παίκτης Δ', playerOff: 'Παίκτης Ε', minute: 60, team: 'home' }],
    });
  });

  it('maps live → upcoming, blanks TBD times, and keeps volleyball child rows', async () => {
    const feed = await buildEventsFeed(d1);
    const event = feed.events.july!.find((e) => e.opponent === 'ΑΕΛ')!;
    expect(event.status).toBe('upcoming');
    expect(event.time).toBe('');
    expect(event.sets).toEqual([
      { home: 25, away: 20 },
      { home: 23, away: 25 },
    ]);
    expect(event.vbScorers).toEqual([{ name: 'Παίκτρια Α', points: 18, team: 'away' }]);
    expect(event.lineup).toBeUndefined();
  });

  it('emits meetings without status and coerces dateTbd to a real boolean', async () => {
    const feed = await buildEventsFeed(d1);
    const meeting = feed.events.september!.find((e) => e.opponent === 'Γενική Συνέλευση')!;
    expect(meeting.status).toBeUndefined();
    expect(meeting.dateTbd).toBe(true);
  });

  it('throws when no current season exists', async () => {
    await expect(buildEventsFeed(fakeD1({ seasons: [] }))).rejects.toThrow('no current season');
  });
});

describe('buildPlayersFeed', () => {
  const d1 = fakeD1({
    seasons,
    players: [
      {
        id: 1,
        slug: 'player-a',
        sport: 'football-men',
        name_el: 'Παίκτης Α',
        name_en: 'Player A',
        position: 'Goalkeeper',
        sub_position: null,
        date_of_birth: '2000-01-15T00:00:00.000Z',
        nationality: 'Cyprus',
        photo_url: null,
      },
      {
        id: 2,
        slug: 'player-b',
        sport: 'football-men',
        name_el: 'Παίκτης Β',
        name_en: 'Player B',
        position: 'Defender',
        sub_position: 'Centre-Back',
        date_of_birth: null,
        nationality: null,
        photo_url: null,
      },
    ],
    players_aliases: [{ _parent_id: 1, _order: 1, id: 1, name: 'Α. Παίκτης' }],
    squad_memberships: [
      {
        id: 1,
        player_id: 1,
        season_id: 1,
        active: 1,
        shirt_number: 1,
        joined_date: '2025-07-01T00:00:00.000Z',
        left_date: null,
      },
    ],
  });

  it('reshapes players with membership, coercing SQLite booleans', async () => {
    const feed = await buildPlayersFeed(d1);
    expect(feed.players[0]).toEqual({
      key: 'player-a',
      sport: 'football-men',
      active: true,
      nameEl: 'Παίκτης Α',
      nameEn: 'Player A',
      position: 'Goalkeeper',
      shirtNumber: 1,
      dateOfBirth: '2000-01-15',
      nationality: 'Cyprus',
      joinedDate: '2025-07-01',
      aliases: ['Α. Παίκτης'],
    });
  });

  it('marks players without a current-season membership inactive', async () => {
    const feed = await buildPlayersFeed(d1);
    expect(feed.players[1]).toEqual({
      key: 'player-b',
      sport: 'football-men',
      active: false,
      nameEl: 'Παίκτης Β',
      nameEn: 'Player B',
      position: 'Defender',
      subPosition: 'Centre-Back',
    });
  });
});

describe('buildLiveFeed', () => {
  it('returns the tiny live shape with sets for a live volleyball match', async () => {
    const feed = await buildLiveFeed(
      fakeD1({
        seasons,
        // fake resolves by first FROM — the live query targets fixtures
        fixtures: [
          {
            id: 11,
            event_key: 'july-21-volleyball-women-ΑΕΛ',
            sport: 'volleyball-women',
            opponent_name: 'ΑΕΛ',
            location: 'away',
            kickoff: '2026-07-21T15:00:00.000Z',
            score: '1-1',
            status: 'live',
          },
        ],
        fixtures_sets: childTables.fixtures_sets,
      }),
    );
    expect(feed).toEqual([
      {
        eventKey: 'july-21-volleyball-women-ΑΕΛ',
        sport: 'volleyball-women',
        opponent: 'ΑΕΛ',
        location: 'away',
        kickoff: '2026-07-21T15:00:00.000Z',
        score: '1-1',
        sets: [
          { home: 25, away: 20 },
          { home: 23, away: 25 },
        ],
      },
    ]);
  });

  it('returns [] when nothing is live', async () => {
    expect(await buildLiveFeed(fakeD1({ seasons, fixtures: [] }))).toEqual([]);
  });
});

describe('getDataVersion', () => {
  beforeEach(() => {
    resetDataVersionMemo();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const countingD1 = (rows: Row[]) => {
    let queries = 0;
    const stmt: D1PreparedStatement = {
      bind: () => stmt,
      all: async () => {
        queries++;
        return { results: rows };
      },
    };
    return {
      d1: { prepare: () => stmt, batch: async () => [] } as D1Database,
      count: () => queries,
    };
  };

  it('reads the payload_kv row and memoizes it for 10s', async () => {
    const { d1, count } = countingD1([{ data: '1754482800000.7' }]);
    expect(await getDataVersion(d1)).toBe('1754482800000.7');
    expect(await getDataVersion(d1)).toBe('1754482800000.7');
    expect(count()).toBe(1);
    vi.advanceTimersByTime(10_001);
    await getDataVersion(d1);
    expect(count()).toBe(2);
  });

  it("degrades to '0' when the row is missing", async () => {
    const { d1 } = countingD1([]);
    expect(await getDataVersion(d1)).toBe('0');
  });
});

describe('worker feed routes', () => {
  const staticResponse = () => new Response('{"static":true}');
  const makeEnv = (d1?: D1Database) =>
    ({
      D1: d1,
      ASSETS: { fetch: vi.fn(async () => staticResponse()) },
    }) as never;
  const ctx = { waitUntil: vi.fn() };

  it('serves /events.json from D1 with cache headers', async () => {
    const env = makeEnv(fakeD1({ seasons, fixtures, ...childTables }));
    const res = await worker.fetch(new Request('https://example.com/events.json'), env, ctx);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=60');
    const body = (await res.json()) as { season: string };
    expect(body.season).toBe('2026/2027');
  });

  it('serves /players.json from D1', async () => {
    const env = makeEnv(fakeD1({ seasons, players: [], players_aliases: [], squad_memberships: [] }));
    const res = await worker.fetch(new Request('https://example.com/players.json'), env, ctx);
    const body = (await res.json()) as { players: unknown[] };
    expect(body.players).toEqual([]);
  });

  it('serves /live.json as a bare array', async () => {
    const env = makeEnv(
      fakeD1({
        seasons,
        fixtures: [
          {
            id: 11,
            event_key: 'july-21-volleyball-women-ΑΕΛ',
            sport: 'volleyball-women',
            opponent_name: 'ΑΕΛ',
            location: 'away',
            kickoff: '2026-07-21T15:00:00.000Z',
            score: null,
            status: 'live',
          },
        ],
        fixtures_sets: [],
      }),
    );
    const res = await worker.fetch(new Request('https://example.com/live.json'), env, ctx);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=30');
    const body = (await res.json()) as { eventKey: string }[];
    expect(body).toHaveLength(1);
    expect(body[0].eventKey).toBe('july-21-volleyball-women-ΑΕΛ');
  });

  it('degrades /live.json to [] when D1 is unavailable (never SPA HTML)', async () => {
    const env = makeEnv(undefined);
    const res = await worker.fetch(new Request('https://example.com/live.json'), env, ctx);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(await res.json()).toEqual([]);
  });

  it('falls back to static assets when the D1 binding is missing', async () => {
    const env = makeEnv(undefined);
    const res = await worker.fetch(new Request('https://example.com/events.json'), env, ctx);
    expect(await res.json()).toEqual({ static: true });
  });

  it('falls back to static assets when D1 queries fail', async () => {
    const stmt: D1PreparedStatement = {
      bind: () => stmt,
      all: async () => {
        throw new Error('D1 down');
      },
    };
    const broken: D1Database = {
      prepare: () => stmt,
      batch: async () => {
        throw new Error('D1 down');
      },
    };
    const env = makeEnv(broken);
    const res = await worker.fetch(new Request('https://example.com/events.json'), env, ctx);
    expect(await res.json()).toEqual({ static: true });
  });

  it('leaves non-GET requests to the assets fallthrough', async () => {
    const env = makeEnv(fakeD1({ seasons, fixtures, ...childTables }));
    const res = await worker.fetch(
      new Request('https://example.com/events.json', { method: 'HEAD' }),
      env,
      ctx,
    );
    expect(await res.text()).toBe('{"static":true}');
  });
});
