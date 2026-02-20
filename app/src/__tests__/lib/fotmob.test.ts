import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  tApi,
  parseLeagueTables,
  parseTopScorers,
  parseLeagueRankings,
  parseVenueInfo,
  parseNextMatch,
  fetchTeamData,
} from '@/lib/fotmob';
import type { FotMobTeamData } from '@/lib/fotmob';

// Helper to create a mock TFunction
function mockT(translations: Record<string, string> = {}) {
  return ((key: string, opts?: { defaultValue?: string }) => {
    return translations[key] || opts?.defaultValue || '';
  }) as unknown as import('i18next').TFunction;
}

describe('tApi', () => {
  it('returns translated value when key exists', () => {
    const t = mockT({ 'fotmob.stats.Goals': 'Γκολ' });
    expect(tApi(t, 'stats', 'Goals')).toBe('Γκολ');
  });

  it('falls back to raw API string when no translation', () => {
    const t = mockT({});
    expect(tApi(t, 'stats', 'Goals')).toBe('Goals');
  });
});

describe('parseLeagueTables', () => {
  it('returns empty array when no overview', () => {
    expect(parseLeagueTables({})).toEqual([]);
  });

  it('returns empty array when no table data', () => {
    expect(parseLeagueTables({ overview: {} })).toEqual([]);
  });

  it('returns empty array when table array is empty', () => {
    expect(parseLeagueTables({ overview: { table: [] } })).toEqual([]);
  });

  it('returns empty array when data object is missing', () => {
    expect(parseLeagueTables({ overview: { table: [{}] } })).toEqual([]);
  });

  it('returns empty array when nested tables are missing', () => {
    expect(parseLeagueTables({ overview: { table: [{ data: {} }] } })).toEqual([]);
  });

  it('parses league table correctly', () => {
    const data: FotMobTeamData = {
      overview: {
        table: [{
          data: {
            tables: [{
              leagueName: 'Cyprus First Division',
              table: {
                all: [{
                  id: 8590, name: 'Nea Salamina', shortName: 'SAL',
                  played: 10, wins: 6, draws: 2, losses: 2,
                  goalConDiff: 5, pts: 20, idx: 3,
                }],
              },
              legend: [{ color: '#00FF00', title: 'Promotion' }],
            }],
          },
        }],
      },
    };

    const result = parseLeagueTables(data);
    expect(result).toHaveLength(1);
    expect(result[0].leagueName).toBe('Cyprus First Division');
    expect(result[0].rows).toHaveLength(1);
    expect(result[0].rows[0]).toEqual({
      id: 8590,
      name: 'Nea Salamina',
      shortName: 'SAL',
      played: 10,
      wins: 6,
      draws: 2,
      losses: 2,
      goalDifference: 5,
      pts: 20,
      position: 3,
      qualColor: undefined,
    });
    expect(result[0].legend).toHaveLength(1);
  });
});

describe('parseTopScorers', () => {
  it('returns empty array when no overview', () => {
    expect(parseTopScorers({})).toEqual([]);
  });

  it('returns empty array when no topPlayers', () => {
    expect(parseTopScorers({ overview: {} })).toEqual([]);
  });

  it('returns empty array when no byGoals', () => {
    expect(parseTopScorers({ overview: { topPlayers: {} } })).toEqual([]);
  });

  it('parses top scorers correctly', () => {
    const data: FotMobTeamData = {
      overview: {
        topPlayers: {
          byGoals: {
            players: [
              { id: 1, name: 'Player A', rank: 1, teamId: 8590, teamName: 'SAL', value: 8, stat: { name: 'Goals', value: 8 } },
              { id: 2, name: 'Player B', rank: 2, teamId: 8590, teamName: 'SAL', value: 5, stat: { name: 'Goals', value: 5 } },
              { id: 3, name: 'Player C', rank: 3, teamId: 8590, teamName: 'SAL', value: 3, stat: { name: 'Goals', value: 3 } },
              { id: 4, name: 'Player D', rank: 4, teamId: 8590, teamName: 'SAL', value: 1, stat: { name: 'Goals', value: 1 } },
            ],
          },
        },
      },
    };

    const result = parseTopScorers(data);
    expect(result).toHaveLength(3); // Only top 3
    expect(result[0]).toEqual({ name: 'Player A', goals: 8 });
    expect(result[2]).toEqual({ name: 'Player C', goals: 3 });
  });

  it('uses stat.value over top-level value', () => {
    const data: FotMobTeamData = {
      overview: {
        topPlayers: {
          byGoals: {
            players: [
              { id: 1, name: 'Player A', rank: 1, teamId: 8590, teamName: 'SAL', value: 10, stat: { name: 'Goals', value: 7 } },
            ],
          },
        },
      },
    };

    const result = parseTopScorers(data);
    expect(result[0].goals).toBe(7);
  });
});

describe('parseLeagueRankings', () => {
  it('returns empty array when no stats', () => {
    expect(parseLeagueRankings({})).toEqual([]);
  });

  it('returns empty array when no teams stats', () => {
    expect(parseLeagueRankings({ stats: {} })).toEqual([]);
  });

  it('filters to only Nea Salamina (id 8590)', () => {
    const data: FotMobTeamData = {
      stats: {
        teams: [
          {
            header: 'Goals',
            localizedTitleId: 'goals',
            participant: { name: 'SAL', teamId: 8590, teamName: 'Nea Salamina', value: 15, rank: 3 },
            topThree: [
              { name: 'Team A', teamId: 1, teamName: 'A', value: 20, rank: 1 },
              { name: 'Team B', teamId: 2, teamName: 'B', value: 18, rank: 2 },
              { name: 'SAL', teamId: 8590, teamName: 'Nea Salamina', value: 15, rank: 3 },
            ],
          },
          {
            header: 'Assists',
            localizedTitleId: 'assists',
            participant: { name: 'Other', teamId: 9999, teamName: 'Other Team', value: 10, rank: 1 },
            topThree: [],
          },
        ],
      },
    };

    const result = parseLeagueRankings(data);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Goals');
    expect(result[0].rank).toBe(3);
    expect(result[0].value).toBe('15');
    expect(result[0].totalTeams).toBeGreaterThanOrEqual(3);
  });
});

describe('parseVenueInfo', () => {
  it('returns null when no overview', () => {
    expect(parseVenueInfo({})).toBeNull();
  });

  it('returns null when no venue', () => {
    expect(parseVenueInfo({ overview: {} })).toBeNull();
  });

  it('parses venue info correctly', () => {
    const data: FotMobTeamData = {
      overview: {
        venue: {
          widget: { name: 'Ammochostos Stadium', city: 'Larnaca' },
          statPairs: [
            ['Capacity', '5000'],
            ['Surface', 'Grass'],
            ['Year opened', '1990'],
          ],
        },
      },
    };

    const result = parseVenueInfo(data);
    expect(result).toEqual({
      name: 'Ammochostos Stadium',
      city: 'Larnaca',
      capacity: '5000',
      surface: 'Grass',
      yearOpened: '1990',
    });
  });

  it('handles missing stat pairs gracefully', () => {
    const data: FotMobTeamData = {
      overview: {
        venue: {
          widget: { name: 'Stadium', city: 'City' },
          statPairs: [],
        },
      },
    };

    const result = parseVenueInfo(data);
    expect(result).toEqual({ name: 'Stadium', city: 'City' });
  });
});

describe('parseNextMatch', () => {
  it('returns null when no overview', () => {
    expect(parseNextMatch({})).toBeNull();
  });

  it('returns null when no nextMatch', () => {
    expect(parseNextMatch({ overview: {} })).toBeNull();
  });

  it('returns null when match has started', () => {
    const data: FotMobTeamData = {
      overview: {
        nextMatch: {
          id: '1', opponent: { id: 100, name: 'Opponent' },
          notStarted: false,
          status: { utcTime: '2026-02-20T15:00:00Z', started: true, finished: false },
        },
      },
    };
    expect(parseNextMatch(data)).toBeNull();
  });

  it('returns null when match has finished', () => {
    const data: FotMobTeamData = {
      overview: {
        nextMatch: {
          id: '1', opponent: { id: 100, name: 'Opponent' },
          notStarted: false,
          status: { utcTime: '2026-02-20T15:00:00Z', started: true, finished: true },
        },
      },
    };
    expect(parseNextMatch(data)).toBeNull();
  });

  it('parses home match correctly', () => {
    const data: FotMobTeamData = {
      overview: {
        nextMatch: {
          id: '1',
          opponent: { id: 100, name: 'Opponent' },
          home: { id: 8590, name: 'Nea Salamina' },
          away: { id: 100, name: 'Opponent FC' },
          notStarted: true,
          status: { utcTime: '2026-03-01T15:00:00Z', started: false, finished: false },
        },
      },
    };

    const result = parseNextMatch(data);
    expect(result).toEqual({
      opponentName: 'Opponent FC',
      utcTime: '2026-03-01T15:00:00Z',
      isHome: true,
    });
  });

  it('parses away match correctly', () => {
    const data: FotMobTeamData = {
      overview: {
        nextMatch: {
          id: '1',
          opponent: { id: 100, name: 'Opponent' },
          home: { id: 100, name: 'Opponent FC' },
          away: { id: 8590, name: 'Nea Salamina' },
          notStarted: true,
          status: { utcTime: '2026-03-01T15:00:00Z', started: false, finished: false },
        },
      },
    };

    const result = parseNextMatch(data);
    expect(result).toEqual({
      opponentName: 'Opponent FC',
      utcTime: '2026-03-01T15:00:00Z',
      isHome: false,
    });
  });
});

describe('fetchTeamData', () => {
  beforeEach(() => {
    // Reset module-level cache by clearing it
    vi.restoreAllMocks();
  });

  it('returns null on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    const result = await fetchTeamData();
    expect(result).toBeNull();
  });

  it('returns null on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);
    const result = await fetchTeamData();
    expect(result).toBeNull();
  });

  it('returns parsed data on success', async () => {
    const mockData = { overview: { table: [] } };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const result = await fetchTeamData();
    expect(result).toEqual(mockData);
  });
});
