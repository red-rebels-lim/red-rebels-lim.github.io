import { describe, it, expect, vi } from 'vitest';
import {
  makeSafeFilename,
  parseFixtureDate,
  deduplicateCfaFixtures,
  normalizeOpponent,
  normalizeOpponentFuzzy,
  monthDayToSeasonDate,
  confirmTbdDates,
  fixtureToEvent,
  mergeVolleyballFixtures,
  findExistingLogo,
  type Fixture,
  type SportEvent,
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

describe('normalizeOpponentFuzzy', () => {
  it('bridges CFA punctuation variants of the same club', () => {
    expect(normalizeOpponentFuzzy('KRASAVA Ε.Ν. Y')).toBe(normalizeOpponentFuzzy('KRASAVA Ε.Ν.Y.'));
    expect(normalizeOpponentFuzzy('ΠΑΦΟΣ FC')).toBe(normalizeOpponentFuzzy('ΠΑΦΟΣ F.C.'));
  });

  it('does not conflate different clubs', () => {
    expect(normalizeOpponentFuzzy('ΟΜΟΝΟΙΑ ΛΕΥΚΩΣΙΑΣ')).not.toBe(normalizeOpponentFuzzy('ΟΜΟΝΟΙΑ ΑΡΑΔΙΠΠΟΥ'));
  });
});

describe('monthDayToSeasonDate', () => {
  const now = new Date(2026, 6, 24); // 2026-07-24 → season 26/27

  it('maps July–December to the season start year', () => {
    expect(monthDayToSeasonDate('august', 28, now)).toEqual(new Date(2026, 7, 28));
  });

  it('maps January–June to the season end year', () => {
    expect(monthDayToSeasonDate('february', 5, now)).toEqual(new Date(2027, 1, 5));
  });

  it('returns null for an unknown month', () => {
    expect(monthDayToSeasonDate('smarch', 1, now)).toBeNull();
  });
});

describe('confirmTbdDates', () => {
  const now = new Date(2026, 6, 24); // 2026-07-24 → season 26/27

  function tbdEntry(overrides: Partial<SportEvent> = {}): SportEvent {
    return {
      day: 28,
      sport: 'football-men',
      location: 'away',
      opponent: 'ΟΛΥΜΠΙΑΚΟΣ ΛΕΥΚΩΣΙΑΣ',
      time: '',
      status: 'upcoming',
      competition: 'league',
      matchday: 1,
      dateTbd: true,
      ...overrides,
    };
  }

  function scrapedEvent(overrides: Partial<SportEvent> = {}): SportEvent {
    return {
      day: 29,
      sport: 'football-men',
      location: 'away',
      opponent: 'ΟΛΥΜΠΙΑΚΟΣ ΛΕΥΚΩΣΙΑΣ',
      time: '19:00',
      ...overrides,
    };
  }

  function emptyChanges() {
    return { added: [], scoreUpdated: [], timeUpdated: [], venueUpdated: [], dateConfirmed: [], unchanged: 0 };
  }

  it('moves a TBD entry onto the scraped date within the window', () => {
    const existing: Record<string, SportEvent[]> = { august: [tbdEntry()] };
    const changes = emptyChanges();
    confirmTbdDates(existing, { august: [scrapedEvent()] }, changes, now);

    expect(existing.august).toHaveLength(1);
    expect(existing.august[0].day).toBe(29);
    expect(existing.august[0].dateTbd).toBeUndefined();
    expect(existing.august[0].matchday).toBe(1);
    expect(changes.dateConfirmed).toHaveLength(1);
  });

  it('moves a TBD entry across a month boundary', () => {
    // MD8 window 30 Oct – 2 Nov: anchor Oct 30, real date Nov 2
    const existing: Record<string, SportEvent[]> = {
      october: [tbdEntry({ day: 30, opponent: 'ΑΛΣ ΟΜΟΝΟΙΑ 29 Μ', matchday: 8 })],
    };
    const changes = emptyChanges();
    confirmTbdDates(existing, { november: [scrapedEvent({ day: 2, opponent: 'ΑΛΣ ΟΜΟΝΟΙΑ 29 Μ' })] }, changes, now);

    expect(existing.october).toHaveLength(0);
    expect(existing.november).toHaveLength(1);
    expect(existing.november[0].day).toBe(2);
    expect(existing.november[0].matchday).toBe(8);
    expect(existing.november[0].dateTbd).toBeUndefined();
  });

  it('matches across CFA punctuation variants and adopts the scraped name form', () => {
    const existing: Record<string, SportEvent[]> = {
      december: [tbdEntry({ day: 1, opponent: 'KRASAVA Ε.Ν. Y', matchday: 12 })],
    };
    const changes = emptyChanges();
    confirmTbdDates(existing, { december: [scrapedEvent({ day: 3, opponent: 'KRASAVA Ε.Ν.Y.' })] }, changes, now);

    expect(existing.december[0].day).toBe(3);
    expect(existing.december[0].opponent).toBe('KRASAVA Ε.Ν.Y.');
    expect(existing.december[0].dateTbd).toBeUndefined();
  });

  it('does not adopt the reverse fixture (different location)', () => {
    const existing: Record<string, SportEvent[]> = { august: [tbdEntry()] };
    const changes = emptyChanges();
    confirmTbdDates(existing, { august: [scrapedEvent({ location: 'home' })] }, changes, now);

    expect(existing.august[0].dateTbd).toBe(true);
    expect(existing.august[0].day).toBe(28);
    expect(changes.dateConfirmed).toHaveLength(0);
  });

  it('does not adopt a fixture more than 10 days from the anchor', () => {
    const existing: Record<string, SportEvent[]> = { august: [tbdEntry()] };
    const changes = emptyChanges();
    confirmTbdDates(existing, { september: [scrapedEvent({ day: 20 })] }, changes, now);

    expect(existing.august[0].dateTbd).toBe(true);
    expect(changes.dateConfirmed).toHaveLength(0);
  });

  it('leaves everything alone when the scraped event already matches an exact key', () => {
    const confirmed = tbdEntry({ day: 29 });
    delete confirmed.dateTbd;
    const existing: Record<string, SportEvent[]> = { august: [confirmed, tbdEntry({ day: 28, opponent: 'ΑΕΚ ΛΑΡΝΑΚΑΣ', location: 'home', matchday: 2 })] };
    const changes = emptyChanges();
    confirmTbdDates(existing, { august: [scrapedEvent()] }, changes, now);

    expect(existing.august).toHaveLength(2);
    expect(changes.dateConfirmed).toHaveLength(0);
  });
});
