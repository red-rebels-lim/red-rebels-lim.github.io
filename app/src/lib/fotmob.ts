// FotMob API types (only fields we use)
// Types match the actual API response from /api/data/teams?id=8590&ccode3=CYP

export interface FotMobTableRow {
  id: number;
  name: string;
  shortName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalConDiff: number;
  pts: number;
  idx: number;
  qualColor?: string;
}

export interface FotMobTableLegend {
  color: string;
  title: string;
}

export interface FotMobTopPlayer {
  id: number;
  name: string;
  rank: number;
  teamId: number;
  teamName: string;
  value: number;
  stat: { name: string; value: number };
}

export interface FotMobNextMatch {
  id: string;
  opponent: { id: number; name: string };
  home?: { id: number; name: string; score?: number };
  away?: { id: number; name: string; score?: number };
  notStarted: boolean;
  status?: { utcTime: string; started: boolean; finished: boolean };
}

export interface FotMobVenue {
  widget: {
    name: string;
    city: string;
  };
  statPairs: Array<[string, string | number]>;
}

export interface FotMobTeamStatParticipant {
  name: string;
  teamId: number;
  teamName: string;
  value: number;
  rank: number;
}

export interface FotMobTeamStatCategory {
  header: string;
  localizedTitleId: string;
  participant: FotMobTeamStatParticipant;
  topThree: FotMobTeamStatParticipant[];
}

export interface FotMobTeamData {
  overview?: {
    table?: Array<{
      data?: {
        tables?: Array<{
          leagueName?: string;
          table?: { all?: FotMobTableRow[] };
          legend?: FotMobTableLegend[];
        }>;
        legend?: FotMobTableLegend[];
      };
    }>;
    topPlayers?: {
      byGoals?: { players: FotMobTopPlayer[] };
    };
    nextMatch?: FotMobNextMatch;
    venue?: FotMobVenue;
  };
  stats?: {
    teams?: FotMobTeamStatCategory[];
  };
}

// Parsed types for components
export interface LeagueTableRow {
  id: number;
  name: string;
  shortName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  pts: number;
  position: number;
  qualColor?: string;
}

export interface LeagueTableData {
  leagueName: string;
  rows: LeagueTableRow[];
  legend: FotMobTableLegend[];
}

export interface TopScorer {
  name: string;
  goals: number;
}

export interface LeagueRanking {
  label: string;
  translationKey: string;
  value: string;
  rank: number;
  totalTeams: number;
}

export interface VenueInfo {
  name: string;
  city: string;
  capacity?: string;
  surface?: string;
  yearOpened?: string;
}

export interface NextMatchInfo {
  opponentName: string;
  utcTime?: string;
  isHome: boolean;
}

// Translation helper: looks up fotmob.{category}.{apiString}, falls back to the raw API string
import type { TFunction } from 'i18next';

export function tApi(t: TFunction, category: string, apiString: string): string {
  const key = `fotmob.${category}.${apiString}`;
  const translated = t(key, { defaultValue: '' });
  return translated || apiString;
}

// In-memory cache
let cachedData: FotMobTeamData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const NEA_SALAMINA_ID = 8590;
const API_URL = `https://www.fotmob.com/api/data/teams?id=${NEA_SALAMINA_ID}&ccode3=CYP`;

export async function fetchTeamData(): Promise<FotMobTeamData | null> {
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_TTL) {
    return cachedData;
  }

  try {
    const res = await fetch(API_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });
    if (!res.ok) return null;
    const data: FotMobTeamData = await res.json();
    cachedData = data;
    cacheTimestamp = now;
    return data;
  } catch {
    return null;
  }
}

// Parsers

export function parseLeagueTables(data: FotMobTeamData): LeagueTableData[] {
  // API nests table data under overview.table[0].data.tables[].table.all
  const tableWrapper = data.overview?.table;
  if (!tableWrapper || tableWrapper.length === 0) return [];

  const dataObj = tableWrapper[0].data;
  if (!dataObj) return [];

  const nestedTables = dataObj.tables;
  if (!nestedTables || nestedTables.length === 0) return [];

  return nestedTables.map((t) => {
    const rawRows = t.table?.all || [];
    return {
      leagueName: t.leagueName || '',
      rows: rawRows.map((row) => ({
        id: row.id,
        name: row.name,
        shortName: row.shortName,
        played: row.played,
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        goalDifference: row.goalConDiff,
        pts: row.pts,
        position: row.idx,
        qualColor: row.qualColor,
      })),
      legend: t.legend || [],
    };
  });
}

export function parseTopScorers(data: FotMobTeamData): TopScorer[] {
  // Players have goals in stat.value (or top-level value), not a "goals" field
  const players = data.overview?.topPlayers?.byGoals?.players;
  if (!players) return [];
  return players.slice(0, 3).map((p) => ({
    name: p.name,
    goals: p.stat?.value ?? p.value ?? 0,
  }));
}

export function parseLeagueRankings(data: FotMobTeamData): LeagueRanking[] {
  // Each category has a .participant (our team) and .topThree, not a teamData array
  const categories = data.stats?.teams;
  if (!categories) return [];

  const rankings: LeagueRanking[] = [];
  for (const cat of categories) {
    const participant = cat.participant;
    if (participant && participant.teamId === NEA_SALAMINA_ID) {
      // topThree gives us a rough sense of total; use length as minimum
      const totalTeams = cat.topThree?.length || 0;
      rankings.push({
        label: cat.header,
        translationKey: cat.localizedTitleId || cat.header,
        value: String(participant.value),
        rank: participant.rank,
        totalTeams: Math.max(totalTeams, participant.rank),
      });
    }
  }
  return rankings;
}

export function parseVenueInfo(data: FotMobTeamData): VenueInfo | null {
  // statPairs are [label, value] tuples, not objects
  const venue = data.overview?.venue;
  if (!venue) return null;

  const info: VenueInfo = {
    name: venue.widget.name,
    city: venue.widget.city,
  };

  for (const pair of venue.statPairs || []) {
    const label = String(pair[0]).toLowerCase();
    const value = String(pair[1]);
    if (label.includes('capacity')) info.capacity = value;
    if (label.includes('surface')) info.surface = value;
    if (label.includes('opened') || label.includes('year')) info.yearOpened = value;
  }

  return info;
}

export function parseNextMatch(data: FotMobTeamData): NextMatchInfo | null {
  const next = data.overview?.nextMatch;
  if (!next) return null;

  // If the match has already started or finished, don't show it as "next"
  if (next.status?.started || next.status?.finished) return null;

  const isHome = next.home?.id === NEA_SALAMINA_ID;
  const opponentName = isHome
    ? (next.away?.name || next.opponent?.name || '')
    : (next.home?.name || next.opponent?.name || '');

  return {
    opponentName,
    utcTime: next.status?.utcTime,
    isHome,
  };
}
