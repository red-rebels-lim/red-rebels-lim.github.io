import { describe, it, expect } from 'vitest';
import {
  parseFotMobMatchDetails,
  matchFotMobToEvent,
  type FotMobMatchDetails,
  type FotMobResultsMatch,
} from './fotmob-enrichment.js';
import type { SportEvent } from './index.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const homeMatchDetails: FotMobMatchDetails = {
  general: {
    matchId: '4407437',
    matchRound: 12,
    homeTeam: { id: 8590, name: 'Nea Salamis' },
    awayTeam: { id: 999, name: 'APOEL' },
  },
  header: {
    status: {
      addedTime: { regularTime: 5, halfTime: 2 },
    },
  },
  content: {
    matchFacts: {
      events: {
        events: [
          { type: 'Goal',         time: 23, isHome: true,  player: { name: 'Παπαδόπουλος' }, isPenalty: false, isOwnGoal: false },
          { type: 'Goal',         time: 67, isHome: true,  player: { name: 'Κωστής' },       isPenalty: true,  isOwnGoal: false },
          { type: 'Goal',         time: 45, addedTime: 2,  isHome: false, player: { name: 'Smith' },       isPenalty: false, isOwnGoal: false },
          { type: 'Goal',         time: 70, isHome: false, player: { name: 'OGGuy' },         isPenalty: false, isOwnGoal: true  },
          { type: 'Card',         time: 34, isHome: true,  player: { name: 'Σαμαράς' },      card: 'Yellow' },
          { type: 'Card',         time: 78, isHome: false, player: { name: 'Johnson' },       card: 'Yellow' },
          { type: 'Card',         time: 89, isHome: false, player: { name: 'Brown' },         card: 'Red'    },
          { type: 'Substitution', time: 75, isHome: true,  player: { name: 'Παπαδόπουλος' }, newPlayer: { name: 'Νέος' } },
          { type: 'Substitution', time: 80, isHome: false, player: { name: 'Smith' },         newPlayer: { name: 'Petrov' } },
          // should be ignored
          { type: 'HalfTime',     time: 45, isHome: true },
        ],
      },
    },
  },
  lineup: {
    lineup: [
      {
        teamId: 8590,
        lineup: [
          { name: 'Κυπριανού', shirt: 1, positionStringShort: 'GK' },
          { name: 'Σαμαράς',   shirt: 4, positionStringShort: 'D'  },
        ],
        bench: [
          { name: 'Νέος', shirt: 12, positionStringShort: 'M' },
        ],
      },
      {
        teamId: 999,
        lineup: [
          { name: 'Keeper', shirt: 1, positionStringShort: 'GK' },
          { name: 'Brown',  shirt: 5, positionStringShort: 'D'  },
        ],
        bench: [
          { name: 'Petrov', shirt: 20, positionStringShort: 'F' },
        ],
      },
    ],
  },
};

const awayMatchDetails: FotMobMatchDetails = {
  general: {
    matchId: '4407438',
    matchRound: 13,
    homeTeam: { id: 999, name: 'APOEL' },
    awayTeam: { id: 8590, name: 'Nea Salamis' },
  },
  header: {
    status: {
      addedTime: { regularTime: 3 },
    },
  },
  content: { matchFacts: { events: { events: [] } } },
  lineup: { lineup: [] },
};

const minimalDetails: FotMobMatchDetails = {
  general: { matchId: '999', homeTeam: { id: 8590, name: 'Nea Salamis' }, awayTeam: { id: 1, name: 'Opp' } },
};

// ── parseFotMobMatchDetails ───────────────────────────────────────────────────

describe('parseFotMobMatchDetails – home match', () => {
  const result = parseFotMobMatchDetails(homeMatchDetails, 8590);

  it('extracts matchday', () => {
    expect(result.matchday).toBe(12);
  });

  it('extracts duration with added time', () => {
    expect(result.duration).toBe("90+5'");
  });

  it('extracts home scorer with minute', () => {
    const scorer = result.scorers?.find(s => s.name === 'Παπαδόπουλος');
    expect(scorer).toBeDefined();
    expect(scorer?.minute).toBe('23');
    expect(scorer?.team).toBe('home');
    expect(scorer?.type).toBeUndefined();
  });

  it('extracts penalty scorer', () => {
    const scorer = result.scorers?.find(s => s.name === 'Κωστής');
    expect(scorer?.type).toBe('pen');
    expect(scorer?.team).toBe('home');
  });

  it('extracts away scorer with added time in minute', () => {
    const scorer = result.scorers?.find(s => s.name === 'Smith');
    expect(scorer?.minute).toBe('45+2');
    expect(scorer?.team).toBe('away');
  });

  it('extracts own goal scorer', () => {
    const scorer = result.scorers?.find(s => s.name === 'OGGuy');
    expect(scorer?.type).toBe('og');
    expect(scorer?.team).toBe('away');
  });

  it('extracts yellow card booking', () => {
    const booking = result.bookings?.find(b => b.name === 'Σαμαράς');
    expect(booking?.card).toBe('yellow');
    expect(booking?.team).toBe('home');
    expect(booking?.minute).toBe('34');
  });

  it('extracts red card booking', () => {
    const booking = result.bookings?.find(b => b.name === 'Brown');
    expect(booking?.card).toBe('red');
    expect(booking?.team).toBe('away');
  });

  it('extracts home lineup', () => {
    expect(result.lineup?.home).toHaveLength(2);
    expect(result.lineup?.home[0].name).toBe('Κυπριανού');
    expect(result.lineup?.home[0].number).toBe(1);
    expect(result.lineup?.home[0].position).toBe('GK');
  });

  it('extracts away lineup', () => {
    expect(result.lineup?.away).toHaveLength(2);
    expect(result.lineup?.away[0].name).toBe('Keeper');
  });

  it('extracts home substitution', () => {
    const sub = result.subs?.find(s => s.team === 'home');
    expect(sub?.playerOff).toBe('Παπαδόπουλος');
    expect(sub?.playerOn).toBe('Νέος');
    expect(sub?.minute).toBe('75');
  });

  it('extracts away substitution', () => {
    const sub = result.subs?.find(s => s.team === 'away');
    expect(sub?.playerOff).toBe('Smith');
    expect(sub?.playerOn).toBe('Petrov');
  });

  it('ignores non-goal/card/sub events', () => {
    expect(result.scorers?.some(s => s.name === '')).toBeFalsy();
  });
});

describe('parseFotMobMatchDetails – away match (team perspective flipped)', () => {
  const result = parseFotMobMatchDetails(awayMatchDetails, 8590);

  it('sets matchday', () => {
    expect(result.matchday).toBe(13);
  });

  it('extracts duration without half-time added time', () => {
    expect(result.duration).toBe("90+3'");
  });
});

describe('parseFotMobMatchDetails – missing optional fields', () => {
  const result = parseFotMobMatchDetails(minimalDetails, 8590);

  it('returns empty arrays when no events or lineup', () => {
    expect(result.scorers).toEqual([]);
    expect(result.bookings).toEqual([]);
    expect(result.subs).toEqual([]);
    expect(result.lineup).toEqual({ home: [], away: [] });
  });

  it('returns undefined duration when no addedTime', () => {
    expect(result.duration).toBeUndefined();
  });

  it('returns undefined matchday when not set', () => {
    expect(result.matchday).toBeUndefined();
  });
});

// ── matchFotMobToEvent ────────────────────────────────────────────────────────

describe('matchFotMobToEvent', () => {
  const fotmobMatches: FotMobResultsMatch[] = [
    {
      id: '4407437',
      utcTime: '2025-10-05T12:00:00.000Z',
      home: { id: 8590, name: 'Nea Salamis' },
      away: { id: 999,  name: 'APOEL' },
      status: { finished: true },
    },
    {
      id: '4407438',
      utcTime: '2025-10-12T10:00:00.000Z',
      home: { id: 999,  name: 'APOEL' },
      away: { id: 8590, name: 'Nea Salamis' },
      status: { finished: true },
    },
  ];

  const homeEvent: SportEvent = {
    day: 5,
    sport: 'football-men',
    location: 'home',
    opponent: 'ΟΜΟΝΟΙΑ',
    time: '',
    status: 'played',
    score: '2-1',
  };

  const awayEvent: SportEvent = {
    day: 12,
    sport: 'football-men',
    location: 'away',
    opponent: 'APOEL',
    time: '',
    status: 'played',
    score: '1-0',
  };

  it('matches home event by day and location', () => {
    const match = matchFotMobToEvent(homeEvent, 'october', fotmobMatches);
    expect(match?.id).toBe('4407437');
  });

  it('matches away event by day and location', () => {
    const match = matchFotMobToEvent(awayEvent, 'october', fotmobMatches);
    expect(match?.id).toBe('4407438');
  });

  it('returns null when no match found', () => {
    const noMatch: SportEvent = { ...homeEvent, day: 99 };
    expect(matchFotMobToEvent(noMatch, 'october', fotmobMatches)).toBeNull();
  });

  it('returns null for non-football sport', () => {
    const vb: SportEvent = { ...homeEvent, sport: 'volleyball-men' };
    expect(matchFotMobToEvent(vb, 'october', fotmobMatches)).toBeNull();
  });

  it('returns null for upcoming event', () => {
    const upcoming: SportEvent = { ...homeEvent, status: undefined };
    expect(matchFotMobToEvent(upcoming, 'october', fotmobMatches)).toBeNull();
  });
});
