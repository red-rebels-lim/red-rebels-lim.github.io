/**
 * FotMob enrichment for played football matches.
 *
 * Fetches scorers, bookings, lineups, substitutions, duration and matchday
 * from the FotMob API and merges them into the existing events data.
 *
 * Only football-men played events are enriched.
 * Existing fields (competition, penalties, reportEN/EL) are never overwritten.
 */

import type { SportEvent } from './index.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FotMobMatchEvent {
  type: string;           // 'Goal' | 'Card' | 'Substitution' | ...
  time: number;
  addedTime?: number;
  isHome: boolean;
  player?: { id?: number; name: string };
  newPlayer?: { id?: number; name: string };
  card?: string;          // 'Yellow' | 'Red' | 'YellowRed'
  isPenalty?: boolean;
  isOwnGoal?: boolean;
}

export interface FotMobLineupPlayer {
  name: string;
  shirt?: number;
  positionStringShort?: string;
}

export interface FotMobTeamLineup {
  teamId: number;
  teamName?: string;
  lineup?: FotMobLineupPlayer[];
  bench?: FotMobLineupPlayer[];
}

export interface FotMobMatchDetails {
  general?: {
    matchId?: string;
    matchRound?: number;
    homeTeam?: { id: number; name: string };
    awayTeam?: { id: number; name: string };
  };
  header?: {
    status?: {
      addedTime?: { regularTime?: number; halfTime?: number };
    };
  };
  content?: {
    matchFacts?: {
      events?: {
        events?: FotMobMatchEvent[];
      };
    };
  };
  lineup?: {
    lineup?: FotMobTeamLineup[];
  };
}

export interface FotMobResultsMatch {
  id: string;
  pageUrl?: string;
  utcTime: string;
  home: { id: number; name: string };
  away: { id: number; name: string };
  status: { finished: boolean };
}

// Raw shape returned by /api/teams endpoint
interface FotMobTeamApiFixture {
  id: number;
  pageUrl: string;
  home: { id: number; name: string };
  away: { id: number; name: string };
  status: { utcTime: string; finished: boolean };
}

export interface FotMobResultsResponse {
  fixtures?: {
    allFixtures?: {
      fixtures?: FotMobTeamApiFixture[];
    };
  };
}

export interface MatchEnrichment {
  matchday?: number;
  duration?: string;
  scorers: Scorer[];
  bookings: Booking[];
  lineup: { home: LineupPlayer[]; away: LineupPlayer[] };
  subs: Substitution[];
}

// Locally redefined so this module is self-contained (mirrors types/events.ts)
interface Scorer {
  name: string;
  minute: string;
  team: 'home' | 'away';
  type?: 'pen' | 'og';
}

interface Booking {
  name: string;
  minute: string;
  team: 'home' | 'away';
  card: 'yellow' | 'red';
}

interface LineupPlayer {
  name: string;
  number?: number;
  position?: string;
}

interface Substitution {
  playerOn: string;
  playerOff: string;
  minute: string;
  team: 'home' | 'away';
}

const MONTH_TO_NUM: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4,
  may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
};

// ── Parsing ───────────────────────────────────────────────────────────────────

export function parseFotMobMatchDetails(
  details: FotMobMatchDetails,
  ourTeamId: number,
): MatchEnrichment {
  const homeTeamId = details.general?.homeTeam?.id;
  const weAreHome = homeTeamId === ourTeamId;

  // Duration
  let duration: string | undefined;
  const addedTime = details.header?.status?.addedTime;
  if (addedTime?.regularTime !== undefined) {
    duration = `90+${addedTime.regularTime}'`;
  }

  // Matchday
  const matchday = details.general?.matchRound;

  // Events
  const events = details.content?.matchFacts?.events?.events ?? [];
  const scorers: Scorer[] = [];
  const bookings: Booking[] = [];
  const subs: Substitution[] = [];

  for (const ev of events) {
    if (ev.type === 'Goal') {
      if (!ev.player?.name) continue;
      const isOurHome = weAreHome ? ev.isHome : !ev.isHome;
      const team: 'home' | 'away' = isOurHome ? 'home' : 'away';
      const minute = ev.addedTime
        ? `${ev.time}+${ev.addedTime}`
        : String(ev.time);
      const scorer: Scorer = { name: ev.player.name, minute, team };
      if (ev.isPenalty) scorer.type = 'pen';
      else if (ev.isOwnGoal) scorer.type = 'og';
      scorers.push(scorer);
    } else if (ev.type === 'Card') {
      if (!ev.player?.name || !ev.card) continue;
      const cardLower = ev.card.toLowerCase();
      if (cardLower !== 'yellow' && cardLower !== 'red') continue;
      const isOurHome = weAreHome ? ev.isHome : !ev.isHome;
      bookings.push({
        name: ev.player.name,
        minute: String(ev.time),
        team: isOurHome ? 'home' : 'away',
        card: cardLower as 'yellow' | 'red',
      });
    } else if (ev.type === 'Substitution') {
      if (!ev.player?.name || !ev.newPlayer?.name) continue;
      const isOurHome = weAreHome ? ev.isHome : !ev.isHome;
      subs.push({
        playerOff: ev.player.name,
        playerOn: ev.newPlayer.name,
        minute: String(ev.time),
        team: isOurHome ? 'home' : 'away',
      });
    }
  }

  // Lineups
  const lineupData = details.lineup?.lineup ?? [];
  const homeLineupData = lineupData.find(l => l.teamId === (weAreHome ? ourTeamId : details.general?.awayTeam?.id));
  const awayLineupData = lineupData.find(l => l.teamId === (weAreHome ? details.general?.awayTeam?.id : ourTeamId));

  const toPlayers = (players?: FotMobLineupPlayer[]): LineupPlayer[] =>
    (players ?? []).map(p => {
      const player: LineupPlayer = { name: p.name };
      if (p.shirt !== undefined) player.number = p.shirt;
      if (p.positionStringShort) player.position = p.positionStringShort;
      return player;
    });

  const lineup = {
    home: toPlayers(homeLineupData?.lineup),
    away: toPlayers(awayLineupData?.lineup),
  };

  return {
    matchday: matchday !== undefined ? matchday : undefined,
    duration,
    scorers,
    bookings,
    lineup,
    subs,
  };
}

// ── Matching ──────────────────────────────────────────────────────────────────

/**
 * Try to match a local SportEvent to a FotMob results entry by date and
 * home/away status. Returns null if the event is not football-men or not played.
 */
export function matchFotMobToEvent(
  event: SportEvent,
  monthName: string,
  fotmobMatches: FotMobResultsMatch[],
): FotMobResultsMatch | null {
  if (event.sport !== 'football-men') return null;
  if (event.status !== 'played') return null;

  const monthNum = MONTH_TO_NUM[monthName];
  if (!monthNum) return null;

  for (const match of fotmobMatches) {
    const d = new Date(match.utcTime);
    const matchDay = d.getUTCDate();
    const matchMonth = d.getUTCMonth() + 1;

    if (matchDay !== event.day || matchMonth !== monthNum) continue;
    if (!match.status.finished) continue;

    const fotmobIsHome = match.home.id !== match.away.id &&
      match.home.name !== match.away.name;
    const weAreHome = fotmobIsHome
      ? event.location === 'home'
      : event.location === 'away';

    // Check our team is on the expected side
    const homeIsOurs = match.home.name.toLowerCase().includes('salamina') ||
      match.home.name.toLowerCase().includes('salamis');
    const awayIsOurs = match.away.name.toLowerCase().includes('salamina') ||
      match.away.name.toLowerCase().includes('salamis');

    if (event.location === 'home' && homeIsOurs) return match;
    if (event.location === 'away' && awayIsOurs) return match;

    // Fallback: just match by date if neither side name matches (shouldn't happen)
    if (!homeIsOurs && !awayIsOurs && weAreHome) return match;
  }

  return null;
}

// ── API calls ─────────────────────────────────────────────────────────────────

const FOTMOB_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

export async function fetchFotMobResults(teamId: number): Promise<FotMobResultsMatch[]> {
  const url = `https://www.fotmob.com/api/teams?id=${teamId}&tab=results&type=all&timeZone=UTC`;
  const res = await fetch(url, { headers: FOTMOB_HEADERS });
  if (!res.ok) throw new Error(`FotMob results HTTP ${res.status}`);
  const data = await res.json() as FotMobResultsResponse;
  const raw = data.fixtures?.allFixtures?.fixtures ?? [];
  return raw.map(m => ({
    id: String(m.id),
    pageUrl: m.pageUrl,
    utcTime: m.status.utcTime,
    home: m.home,
    away: m.away,
    status: { finished: m.status.finished },
  }));
}

export async function fetchFotMobMatchDetails(matchId: string): Promise<FotMobMatchDetails> {
  const url = `https://www.fotmob.com/api/matchDetails?matchId=${matchId}`;
  const res = await fetch(url, { headers: FOTMOB_HEADERS });
  if (!res.ok) throw new Error(`FotMob match details HTTP ${res.status}`);
  return res.json() as Promise<FotMobMatchDetails>;
}

/**
 * Fetch match details from the FotMob match page HTML (parses __NEXT_DATA__).
 * Used as a fallback when the /api/matchDetails endpoint returns 403.
 */
export async function fetchFotMobMatchDetailsFromPage(pageUrl: string): Promise<FotMobMatchDetails> {
  const url = `https://www.fotmob.com${pageUrl.split('#')[0]}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`FotMob page HTTP ${res.status}`);
  const html = await res.text();

  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('__NEXT_DATA__ not found in FotMob page');

  const nextData = JSON.parse(match[1]);
  const props = nextData?.props?.pageProps;
  if (!props) throw new Error('pageProps missing in __NEXT_DATA__');

  return normalizeFotMobPageProps(props);
}

function parseHalfTimestamp(s: string): number {
  // Format: "DD.MM.YYYY HH:MM:SS"
  const [date, time] = s.split(' ');
  const [d, mo, y] = date.split('.');
  return new Date(`${y}-${mo}-${d}T${time}Z`).getTime();
}

// FotMob position ID → short string mapping
const FOTMOB_POSITION: Record<number, string> = {
  1: 'GK', 2: 'D', 3: 'D', 4: 'D',
  5: 'DM', 6: 'M', 7: 'M', 8: 'M',
  9: 'AM', 10: 'F', 11: 'F',
};

function normalizeFotMobPageProps(props: Record<string, unknown>): FotMobMatchDetails {
  const general = props.general as Record<string, unknown> | undefined;
  const header = props.header as Record<string, unknown> | undefined;
  const content = props.content as Record<string, unknown> | undefined;

  // Duration from halfs
  let addedTime: { regularTime?: number } | undefined;
  const halfs = (header?.status as Record<string, unknown> | undefined)?.halfs as Record<string, string> | undefined;
  if (halfs?.secondHalfStarted && halfs?.secondHalfEnded) {
    const dur = (parseHalfTimestamp(halfs.secondHalfEnded) - parseHalfTimestamp(halfs.secondHalfStarted)) / 60000;
    const added = Math.max(0, Math.round(dur - 45));
    if (added > 0) addedTime = { regularTime: added };
  }

  // Normalize events
  const rawEvents = ((content?.matchFacts as Record<string, unknown> | undefined)
    ?.events as Record<string, unknown> | undefined)
    ?.events as Record<string, unknown>[] | undefined ?? [];

  const events: FotMobMatchEvent[] = rawEvents.map(ev => {
    const type = ev.type as string;
    if (type === 'Substitution') {
      const swap = (ev.swap as Array<{ name: string }> | undefined) ?? [];
      return {
        type: 'Substitution',
        time: ev.time as number,
        addedTime: (ev.overloadTime as number) || undefined,
        isHome: ev.isHome as boolean,
        player: swap[1] ? { name: swap[1].name } : undefined,    // player going off
        newPlayer: swap[0] ? { name: swap[0].name } : undefined,  // player coming on
      };
    }
    return {
      type,
      time: ev.time as number,
      addedTime: (ev.overloadTime as number) || undefined,
      isHome: ev.isHome as boolean,
      player: ev.player as { name: string } | undefined,
      card: ev.card as string | undefined,
      isPenalty: (ev.goalDescriptionKey as string | undefined)?.includes('penalty') ?? false,
      isOwnGoal: !!(ev.ownGoal),
    };
  });

  // Normalize lineup
  const lineupContent = content?.lineup as Record<string, unknown> | undefined;
  const lineupTeams: FotMobTeamLineup[] = [];
  for (const side of ['homeTeam', 'awayTeam'] as const) {
    const team = lineupContent?.[side] as Record<string, unknown> | undefined;
    if (!team) continue;
    const starters = (team.starters as Array<Record<string, unknown>> | undefined) ?? [];
    lineupTeams.push({
      teamId: team.id as number,
      lineup: starters.map(p => ({
        name: p.name as string,
        shirt: p.shirtNumber ? parseInt(p.shirtNumber as string) || undefined : undefined,
        positionStringShort: FOTMOB_POSITION[p.positionId as number] ?? undefined,
      })),
    });
  }

  return {
    general: {
      matchId: general?.matchId as string | undefined,
      matchRound: general?.matchRound ? parseInt(String(general.matchRound)) : undefined,
      homeTeam: general?.homeTeam as { id: number; name: string } | undefined,
      awayTeam: general?.awayTeam as { id: number; name: string } | undefined,
    },
    header: addedTime ? { status: { addedTime } } : undefined,
    content: {
      matchFacts: {
        events: { events },
      },
    },
    lineup: { lineup: lineupTeams },
  };
}

// ── Enrichment pipeline ───────────────────────────────────────────────────────

/**
 * Enrich all played football-men events in the given calendar data with
 * FotMob match details. Only populates fields that aren't already set.
 * Never touches competition, penalties, reportEN, reportEL.
 */
export async function enrichWithFotMob(
  events: Record<string, SportEvent[]>,
  teamId: number,
  opts: { delayMs?: number; onProgress?: (msg: string) => void } = {},
): Promise<{ enriched: number; skipped: number; failed: number }> {
  const { delayMs = 500, onProgress = console.log } = opts;

  let fotmobMatches: FotMobResultsMatch[];
  try {
    fotmobMatches = await fetchFotMobResults(teamId);
    onProgress(`  FotMob: found ${fotmobMatches.length} results`);
  } catch (e) {
    onProgress(`  ⚠ FotMob results fetch failed: ${e}`);
    return { enriched: 0, skipped: 0, failed: 1 };
  }

  let enriched = 0;
  let skipped = 0;
  let failed = 0;

  for (const [monthName, monthEvents] of Object.entries(events)) {
    for (const event of monthEvents) {
      if (event.sport !== 'football-men' || event.status !== 'played') continue;

      // Clear scorers that don't match the actual score (bad FotMob data)
      if (event.scorers && !validateScorerCounts(event.scorers, event)) {
        onProgress(`  ⚠ Clearing invalid scorers for ${monthName} ${event.day} vs ${event.opponent}`);
        event.scorers = undefined;
      }

      // Skip if already fully enriched with valid data
      if (event.scorers && event.lineup && event.matchday !== undefined) {
        skipped++;
        continue;
      }

      const match = matchFotMobToEvent(event, monthName, fotmobMatches);
      if (!match || !match.pageUrl) {
        skipped++;
        continue;
      }

      try {
        if (delayMs > 0) await delay(delayMs);
        const details = await fetchFotMobMatchDetailsFromPage(match.pageUrl);
        const enrichment = parseFotMobMatchDetails(details, teamId);

        // Only set fields not already present
        if (!event.matchday && enrichment.matchday !== undefined) event.matchday = enrichment.matchday;
        if (!event.duration && enrichment.duration) event.duration = enrichment.duration;
        if (!event.scorers && enrichment.scorers.length > 0) {
          if (validateScorerCounts(enrichment.scorers, event)) {
            event.scorers = enrichment.scorers;
          } else {
            onProgress(`  ⚠ Scorer mismatch for ${monthName} ${event.day} vs ${event.opponent}, skipping scorers`);
          }
        }
        if (!event.bookings && enrichment.bookings.length > 0) event.bookings = enrichment.bookings;
        if (!event.lineup && (enrichment.lineup.home.length > 0 || enrichment.lineup.away.length > 0)) {
          event.lineup = enrichment.lineup;
        }
        if (!event.subs && enrichment.subs.length > 0) event.subs = enrichment.subs;

        enriched++;
        onProgress(`  ✓ Enriched: ${monthName} ${event.day} vs ${event.opponent} (match ${match.id})`);
      } catch (e) {
        failed++;
        onProgress(`  ✗ Failed enrichment for ${monthName} ${event.day} vs ${event.opponent}: ${e}`);
      }
    }
  }

  return { enriched, skipped, failed };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate that scorer counts match the actual event score.
 * Returns true if valid (or if score can't be parsed).
 * Score format is always "home_venue-away_venue".
 * In our data model, team='home' = Nea Salamina (us), team='away' = opponent.
 */
function validateScorerCounts(
  scorers: Array<{ team: 'home' | 'away'; type?: string }>,
  event: SportEvent,
): boolean {
  if (!event.score) return true;
  const scoreStr = event.score.replace(/\s*\(pen\).*/, '').trim();
  const parts = scoreStr.split('-');
  if (parts.length !== 2) return true;
  const [n0, n1] = parts.map(p => parseInt(p.trim()));
  if (isNaN(n0) || isNaN(n1)) return true;

  // our goals = venue home score if we're home, venue away score if we're away
  const ourExpected = event.location === 'home' ? n0 : n1;
  const theirExpected = event.location === 'home' ? n1 : n0;

  // Count actual goals per team (own goals count for the other team)
  let ourActual = 0;
  let theirActual = 0;
  for (const s of scorers) {
    const isOG = s.type === 'og';
    if (s.team === 'home') { if (isOG) { theirActual++; } else { ourActual++; } }
    else                   { if (isOG) { ourActual++;   } else { theirActual++; } }
  }

  return ourActual === ourExpected && theirActual === theirExpected;
}
