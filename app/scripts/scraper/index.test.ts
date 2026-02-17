import { describe, it, expect, vi } from 'vitest';
import {
  makeSafeFilename,
  parseFixtureDate,
  deduplicateCfaFixtures,
  normalizeOpponent,
  fixtureToEvent,
  mergeVolleyballFixtures,
  findExistingLogo,
  type Fixture,
} from './index.js';

// Suppress console.log from mergeVolleyballFixtures
vi.spyOn(console, 'log').mockImplementation(() => {});

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    date: '5 Οκτωβρίου 2025',
    homeTeam: 'ΝΕΑ ΣΑΛΑΜΙΝΑ ΑΜΜΟΧΩΣΤΟΥ',
    homeLogo: null,
    scoreTime: '2-1',
    awayTeam: 'ΟΜΟΝΟΙΑ',
    awayLogo: null,
    venue: '',
    status: 'Played',
    sport: 'football-men',
    ...overrides,
  };
}

describe('makeSafeFilename', () => {
  it('converts Greek team name to underscored safe name', () => {
    expect(makeSafeFilename('ΝΕΑ ΣΑΛΑΜΙΝΑ ΑΜΜΟΧΩΣΤΟΥ')).toBe('ΝΕΑ_ΣΑΛΑΜΙΝΑ_ΑΜΜΟΧΩΣΤΟΥ');
  });

  it('removes special characters', () => {
    expect(makeSafeFilename('TEAM (Γ)!')).toBe('TEAM_Γ');
  });

  it('collapses multiple spaces and hyphens', () => {
    expect(makeSafeFilename('FOO   BAR--BAZ')).toBe('FOO_BAR_BAZ');
  });
});

describe('parseFixtureDate', () => {
  it('parses CFA format with Greek month', () => {
    expect(parseFixtureDate('5 Οκτωβρίου 2025')).toEqual({ day: 5, monthNum: 10 });
  });

  it('parses volleyball full date DD/MM/YYYY', () => {
    expect(parseFixtureDate('17/10/2025')).toEqual({ day: 17, monthNum: 10 });
  });

  it('parses volleyball short date DD/MM', () => {
    expect(parseFixtureDate('17/10')).toEqual({ day: 17, monthNum: 10 });
  });

  it('returns null for invalid date', () => {
    expect(parseFixtureDate('not a date')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseFixtureDate('')).toBeNull();
  });
});

describe('deduplicateCfaFixtures', () => {
  it('returns empty array for empty input', () => {
    expect(deduplicateCfaFixtures([])).toEqual([]);
  });

  it('returns fixtures unchanged when no duplicates', () => {
    const fixtures = [
      makeFixture({ date: '5 Οκτωβρίου 2025' }),
      makeFixture({ date: '12 Οκτωβρίου 2025' }),
    ];
    expect(deduplicateCfaFixtures(fixtures)).toHaveLength(2);
  });

  it('keeps Played over Upcoming when duplicate exists', () => {
    const upcoming = makeFixture({ status: 'Upcoming', scoreTime: '18:00' });
    const played = makeFixture({ status: 'Played', scoreTime: '2-1' });
    const result = deduplicateCfaFixtures([upcoming, played]);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Played');
    expect(result[0].scoreTime).toBe('2-1');
  });
});

describe('normalizeOpponent', () => {
  it('uppercases and strips (Γ) suffix', () => {
    expect(normalizeOpponent('Ομόνοια (Γ)')).toBe('ΟΜΌΝΟΙΑ');
  });

  it('returns already normalized name unchanged', () => {
    expect(normalizeOpponent('ΟΜΟΝΟΙΑ')).toBe('ΟΜΟΝΟΙΑ');
  });
});

describe('fixtureToEvent', () => {
  it('returns home location when team is home', () => {
    const result = fixtureToEvent(makeFixture({
      homeTeam: 'ΝΕΑ ΣΑΛΑΜΙΝΑ',
      awayTeam: 'ΟΜΟΝΟΙΑ',
    }));
    expect(result).not.toBeNull();
    expect(result!.event.location).toBe('home');
    expect(result!.event.opponent).toBe('ΟΜΟΝΟΙΑ');
  });

  it('returns away location when team is away', () => {
    const result = fixtureToEvent(makeFixture({
      homeTeam: 'ΟΜΟΝΟΙΑ',
      awayTeam: 'ΝΕΑ ΣΑΛΑΜΙΝΑ',
    }));
    expect(result).not.toBeNull();
    expect(result!.event.location).toBe('away');
    expect(result!.event.opponent).toBe('ΟΜΟΝΟΙΑ');
  });

  it('sets status played and score for played fixture', () => {
    const result = fixtureToEvent(makeFixture({
      homeTeam: 'ΝΕΑ ΣΑΛΑΜΙΝΑ',
      awayTeam: 'ΟΜΟΝΟΙΑ',
      status: 'Played',
      scoreTime: '3-0',
    }));
    expect(result!.event.status).toBe('played');
    expect(result!.event.score).toBe('3-0');
  });

  it('sets time from matchTime for upcoming fixture', () => {
    const result = fixtureToEvent(makeFixture({
      homeTeam: 'ΝΕΑ ΣΑΛΑΜΙΝΑ',
      awayTeam: 'ΟΜΟΝΟΙΑ',
      status: 'Upcoming',
      scoreTime: '18:00',
      matchTime: '18:00',
    }));
    expect(result!.event.time).toBe('18:00');
    expect(result!.event.status).toBeUndefined();
  });

  it('returns null for invalid date', () => {
    const result = fixtureToEvent(makeFixture({ date: 'invalid' }));
    expect(result).toBeNull();
  });

  it('returns correct monthName', () => {
    const result = fixtureToEvent(makeFixture({ date: '5 Οκτωβρίου 2025' }));
    expect(result!.monthName).toBe('october');
  });
});

describe('mergeVolleyballFixtures', () => {
  it('returns primary unchanged when secondary is empty', () => {
    const primary = [makeFixture({ sport: 'volleyball-men', date: '17/10/2025' })];
    const result = mergeVolleyballFixtures(primary, []);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(primary[0]);
  });

  it('adds new match from secondary', () => {
    const primary = [makeFixture({ sport: 'volleyball-men', date: '17/10/2025' })];
    const secondary = [makeFixture({ sport: 'volleyball-men', date: '24/10/2025' })];
    const result = mergeVolleyballFixtures(primary, secondary);
    expect(result).toHaveLength(2);
  });

  it('updates score from secondary when primary is upcoming', () => {
    const primary = [makeFixture({
      sport: 'volleyball-men',
      date: '17/10/2025',
      status: 'Upcoming',
      scoreTime: '18:00',
    })];
    const secondary = [makeFixture({
      sport: 'volleyball-men',
      date: '17/10/2025',
      status: 'Played',
      scoreTime: '3-1',
    })];
    const result = mergeVolleyballFixtures(primary, secondary);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Played');
    expect(result[0].scoreTime).toBe('3-1');
  });

  it('concatenates when no overlap', () => {
    const primary = [makeFixture({ sport: 'volleyball-men', date: '17/10/2025' })];
    const secondary = [makeFixture({ sport: 'volleyball-women', date: '18/10/2025' })];
    const result = mergeVolleyballFixtures(primary, secondary);
    expect(result).toHaveLength(2);
  });
});

describe('findExistingLogo', () => {
  it('returns null when no logo file exists', () => {
    expect(findExistingLogo('NONEXISTENT TEAM')).toBeNull();
  });
});
