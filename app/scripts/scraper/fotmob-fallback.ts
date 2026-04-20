/**
 * FotMob fallback for CFA football fixtures.
 *
 * When cfa.com.cy is unreachable, the team's FotMob page HTML contains the full
 * fixture list (past + upcoming) inside __NEXT_DATA__. We parse that and map
 * FotMob's English team names to the Greek names used throughout the app.
 */

import type { Fixture } from './index.ts';
import { findExistingLogo } from './index.ts';

// Map FotMob English team names → Greek names used in events.ts / CFA.
// Keys are lowercased for case-insensitive matching; values match the existing
// opponent strings so event keys line up with previously-scraped data.
const FOTMOB_TEAM_NAME_MAP: Record<string, string> = {
  'nea salamis': 'ΝΕΑ ΣΑΛΑΜΙΝΑ ΑΜΜΟΧΩΣΤΟΥ',
  'nea salamis famagusta': 'ΝΕΑ ΣΑΛΑΜΙΝΑ ΑΜΜΟΧΩΣΤΟΥ',
  'aez zakakiou': 'ΑΕΖ ΖΑΚΑΚΙΟΥ',
  'apea akrotiri': 'ΑΠΕΑ ΑΚΡΩΤΗΡΙΟΥ',
  'asil lysi': 'ΑΣΙΛ ΛΥΣΗΣ',
  'ayia napa': 'ΑΟΑΝ ΑΓΙΑΣ ΝΑΠΑΣ',
  'chalkanoras idaliou': 'ΧΑΛΚΑΝΟΡΑΣ ΙΔΑΛΙΟΥ',
  'digenis morphou': 'ΔΙΓΕΝΗΣ ΑΚΡΙΤΑΣ ΜΟΡΦΟΥ',
  'doxa katokopia': 'ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ',
  'ethnikos latsion': 'ΕΘΝΙΚΟΣ ΛΑΤΣΙΩΝ',
  'iraklis gerolakkou': 'ΗΡΑΚΛΗΣ ΓΕΡΟΛΑΚΚΟΥ',
  'karmiotissa pano polemidion': 'ΚΑΡΜΙΩΤΙΣΣΑ ΠΟΛΕΜΙΔΙΩΝ',
  'karmiotissa': 'ΚΑΡΜΙΩΤΙΣΣΑ ΠΟΛΕΜΙΔΙΩΝ',
  'krasava ypsonas fc': 'ΚΡΑΣΑΒΑ ΥΨΩΝΑ',
  'krasava ypsonas': 'ΚΡΑΣΑΒΑ ΥΨΩΝΑ',
  'meap nisou': 'ΜΕΑΠ ΠΕΡΑ ΧΩΡΙΟΥ ΝΗΣΟΥ',
  'omonia 29 maiou': 'ΑΛΣ ΟΜΟΝΟΙΑ 29 Μ',
  'paeek': 'ΠΑΕΕΚ ΚΕΡΥΝΕΙΑΣ',
  'po achyronas-onisilos': 'Π.Ο. ΑΧΥΡΩΝΑΣ ΟΝΗΣΙΛΟΣ',
  'spartakos kitiou': 'ΣΠΑΡΤΑΚΟΣ ΚΙΤΙΟΥ',
};

// Raw fixture shape from FotMob team page.
interface FotMobTeamFixture {
  id: number;
  pageUrl?: string;
  home: { id: number; name: string; score?: number };
  away: { id: number; name: string; score?: number };
  notStarted?: boolean;
  tournament?: { name?: string };
  status: {
    utcTime: string;
    finished: boolean;
    started?: boolean;
    cancelled?: boolean;
    scoreStr?: string;
  };
}

export function mapFotMobTeamName(name: string): string {
  const key = name.trim().toLowerCase();
  return FOTMOB_TEAM_NAME_MAP[key] ?? name;
}

/**
 * Format a UTC ISO timestamp as "DD/MM/YYYY" and "HH:MM" in Cyprus time.
 * parseFixtureDate() in index.ts accepts the DD/MM/YYYY format.
 */
export function formatCyprusDateTime(utcIso: string): { date: string; time: string } {
  const d = new Date(utcIso);
  const tz = 'Europe/Nicosia';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
  return {
    date: `${get('day')}/${get('month')}/${get('year')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

export function fotmobFixtureToFixture(f: FotMobTeamFixture): Fixture | null {
  if (f.status.cancelled) return null;
  if (!f.home?.name || !f.away?.name) return null;

  const { date, time } = formatCyprusDateTime(f.status.utcTime);

  const homeTeam = mapFotMobTeamName(f.home.name);
  const awayTeam = mapFotMobTeamName(f.away.name);

  const played = f.status.finished && !f.notStarted;
  let scoreTime: string;
  if (played && typeof f.home.score === 'number' && typeof f.away.score === 'number') {
    scoreTime = `${f.home.score}-${f.away.score}`;
  } else {
    scoreTime = time;
  }

  // Cup matches: tag so downstream logic can differentiate from league
  const tournamentName = f.tournament?.name?.toLowerCase() ?? '';
  const competition = tournamentName.includes('cup') ? 'cup' : undefined;

  // No venue in the list — existing events.ts venues are preserved by
  // mergeExistingWithScraped when the scraped fixture has no venue.
  const fixture: Fixture = {
    date,
    homeTeam,
    homeLogo: findExistingLogo(homeTeam),
    scoreTime,
    awayTeam,
    awayLogo: findExistingLogo(awayTeam),
    venue: '',
    status: played ? 'Played' : 'Upcoming',
    sport: 'football-men',
    matchTime: time,
  };
  if (competition) fixture.competition = competition;
  return fixture;
}

/**
 * Current season start (Sep 1). Fixtures before this are from prior seasons
 * and would collide with current-season events (parseFixtureDate discards
 * the year when the event is indexed into events.ts).
 */
export function seasonStartDate(now: Date = new Date()): Date {
  const year = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(Date.UTC(year, 8, 1));
}

/**
 * Fetch the team page HTML and extract all fixtures from __NEXT_DATA__.
 * teamSlug is the URL slug FotMob uses (e.g. "nea-salamina"); any slug works
 * since the server redirects to the canonical one, but we pass the real one
 * to avoid the redirect cost.
 */
export async function fetchFotMobTeamFixtures(
  teamId: number,
  teamSlug = 'nea-salamina',
): Promise<Fixture[]> {
  const url = `https://www.fotmob.com/teams/${teamId}/overview/${teamSlug}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`FotMob team page HTTP ${res.status}`);
  const html = await res.text();

  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('__NEXT_DATA__ not found in FotMob team page');

  const data = JSON.parse(match[1]);
  const teamData = data?.props?.pageProps?.fallback?.[`team-${teamId}`];
  const raw: FotMobTeamFixture[] = teamData?.fixtures?.allFixtures?.fixtures ?? [];
  if (raw.length === 0) throw new Error('No fixtures found in FotMob team data');

  const seasonStart = seasonStartDate().getTime();
  const mapped: Fixture[] = [];
  for (const f of raw) {
    if (new Date(f.status.utcTime).getTime() < seasonStart) continue;
    const fx = fotmobFixtureToFixture(f);
    if (fx) mapped.push(fx);
  }
  return mapped;
}
