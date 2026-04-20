import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mapFotMobTeamName,
  formatCyprusDateTime,
  fotmobFixtureToFixture,
  seasonStartDate,
  fetchFotMobTeamFixtures,
} from './fotmob-fallback.ts';

describe('mapFotMobTeamName', () => {
  it('maps Nea Salamis to Greek name', () => {
    expect(mapFotMobTeamName('Nea Salamis')).toBe('ΝΕΑ ΣΑΛΑΜΙΝΑ ΑΜΜΟΧΩΣΤΟΥ');
  });

  it('maps known opponents to Greek names', () => {
    expect(mapFotMobTeamName('AEZ Zakakiou')).toBe('ΑΕΖ ΖΑΚΑΚΙΟΥ');
    expect(mapFotMobTeamName('PO Achyronas-Onisilos')).toBe('Π.Ο. ΑΧΥΡΩΝΑΣ ΟΝΗΣΙΛΟΣ');
    expect(mapFotMobTeamName('Omonia 29 Maiou')).toBe('ΑΛΣ ΟΜΟΝΟΙΑ 29 Μ');
  });

  it('is case-insensitive', () => {
    expect(mapFotMobTeamName('NEA SALAMIS')).toBe('ΝΕΑ ΣΑΛΑΜΙΝΑ ΑΜΜΟΧΩΣΤΟΥ');
    expect(mapFotMobTeamName('asil lysi')).toBe('ΑΣΙΛ ΛΥΣΗΣ');
  });

  it('returns original name for unknown teams', () => {
    expect(mapFotMobTeamName('Some New Team FC')).toBe('Some New Team FC');
  });
});

describe('formatCyprusDateTime', () => {
  it('formats UTC as DD/MM/YYYY and HH:MM in Cyprus time (EEST +3)', () => {
    // 2026-04-25 14:00 UTC = 17:00 Cyprus (summer)
    const { date, time } = formatCyprusDateTime('2026-04-25T14:00:00.000Z');
    expect(date).toBe('25/04/2026');
    expect(time).toBe('17:00');
  });

  it('formats winter time correctly (EET +2)', () => {
    // 2026-01-15 14:00 UTC = 16:00 Cyprus (winter)
    const { date, time } = formatCyprusDateTime('2026-01-15T14:00:00.000Z');
    expect(date).toBe('15/01/2026');
    expect(time).toBe('16:00');
  });
});

describe('fotmobFixtureToFixture', () => {
  it('converts a finished home match to Played fixture with score', () => {
    const fixture = fotmobFixtureToFixture({
      id: 1,
      home: { id: 8590, name: 'Nea Salamis', score: 3 },
      away: { id: 7, name: 'AEZ Zakakiou', score: 1 },
      status: { utcTime: '2026-04-04T12:00:00.000Z', finished: true, scoreStr: '3 - 1' },
      tournament: { name: '2. Division' },
    });
    expect(fixture).not.toBeNull();
    expect(fixture).toMatchObject({
      date: '04/04/2026',
      homeTeam: 'ΝΕΑ ΣΑΛΑΜΙΝΑ ΑΜΜΟΧΩΣΤΟΥ',
      awayTeam: 'ΑΕΖ ΖΑΚΑΚΙΟΥ',
      scoreTime: '3-1',
      status: 'Played',
      sport: 'football-men',
    });
    expect(fixture?.competition).toBeUndefined();
  });

  it('converts an upcoming match with kickoff time', () => {
    const fixture = fotmobFixtureToFixture({
      id: 2,
      home: { id: 8590, name: 'Nea Salamis' },
      away: { id: 154788, name: 'ASIL Lysi' },
      notStarted: true,
      status: { utcTime: '2026-04-25T14:00:00.000Z', finished: false },
      tournament: { name: '2. Division' },
    });
    expect(fixture).toMatchObject({
      date: '25/04/2026',
      status: 'Upcoming',
      scoreTime: '17:00',
      matchTime: '17:00',
    });
  });

  it('tags cup matches with competition=cup', () => {
    const fixture = fotmobFixtureToFixture({
      id: 3,
      home: { id: 8590, name: 'Nea Salamis', score: 0 },
      away: { id: 9999, name: 'APOEL', score: 2 },
      status: { utcTime: '2025-10-10T17:00:00.000Z', finished: true },
      tournament: { name: 'Cup' },
    });
    expect(fixture?.competition).toBe('cup');
  });

  it('skips cancelled matches', () => {
    const fixture = fotmobFixtureToFixture({
      id: 4,
      home: { id: 8590, name: 'Nea Salamis' },
      away: { id: 7, name: 'AEZ Zakakiou' },
      status: { utcTime: '2026-02-01T12:00:00.000Z', finished: false, cancelled: true },
    });
    expect(fixture).toBeNull();
  });

  it('treats not-finished matches as Upcoming even if started flag exists', () => {
    const fixture = fotmobFixtureToFixture({
      id: 5,
      home: { id: 8590, name: 'Nea Salamis' },
      away: { id: 7, name: 'AEZ Zakakiou' },
      notStarted: true,
      status: { utcTime: '2026-05-01T12:00:00.000Z', finished: false },
    });
    expect(fixture?.status).toBe('Upcoming');
  });
});

describe('seasonStartDate', () => {
  it('returns Sep 1 of previous year during spring', () => {
    const d = seasonStartDate(new Date('2026-04-20T00:00:00Z'));
    expect(d.getUTCFullYear()).toBe(2025);
    expect(d.getUTCMonth()).toBe(8); // Sep = 8
    expect(d.getUTCDate()).toBe(1);
  });

  it('returns Sep 1 of current year during autumn', () => {
    const d = seasonStartDate(new Date('2025-10-15T00:00:00Z'));
    expect(d.getUTCFullYear()).toBe(2025);
    expect(d.getUTCMonth()).toBe(8);
  });
});

describe('fetchFotMobTeamFixtures', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-20T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.fetch = originalFetch;
  });

  function makeTeamPageHtml(fixtures: unknown[]): string {
    const nextData = {
      props: {
        pageProps: {
          fallback: {
            'team-8590': {
              fixtures: { allFixtures: { fixtures } },
            },
          },
        },
      },
    };
    return `<html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(nextData)}</script></body></html>`;
  }

  it('filters out fixtures from prior seasons', async () => {
    const html = makeTeamPageHtml([
      {
        id: 1,
        home: { id: 8590, name: 'Nea Salamis', score: 2 },
        away: { id: 4126, name: 'Enosis Paralimni', score: 2 },
        status: { utcTime: '2025-04-28T16:00:00.000Z', finished: true },
      },
      {
        id: 2,
        home: { id: 8590, name: 'Nea Salamis', score: 3 },
        away: { id: 7, name: 'AEZ Zakakiou', score: 1 },
        status: { utcTime: '2026-04-04T12:00:00.000Z', finished: true },
      },
    ]);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => html,
    } as Response) as unknown as typeof fetch;

    const fixtures = await fetchFotMobTeamFixtures(8590);
    expect(fixtures).toHaveLength(1);
    expect(fixtures[0].awayTeam).toBe('ΑΕΖ ΖΑΚΑΚΙΟΥ');
  });

  it('throws if the team page returns non-ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    } as Response) as unknown as typeof fetch;

    await expect(fetchFotMobTeamFixtures(8590)).rejects.toThrow(/503/);
  });

  it('throws if __NEXT_DATA__ is missing', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><body>no data</body></html>',
    } as Response) as unknown as typeof fetch;

    await expect(fetchFotMobTeamFixtures(8590)).rejects.toThrow(/__NEXT_DATA__/);
  });
});
