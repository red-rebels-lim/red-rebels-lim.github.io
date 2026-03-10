/**
 * DataProject volleyball enrichment
 * Fetches set scores and top scorers from kop-web.dataproject.com
 *
 * Parsing strategy:
 * - Match list page: HF_MatchDatetime, onclick mID/CID, Label2/Label4 for team names
 * - Stats page: set scores from "NN/NN NN/NN" pattern, player stats from RG_HomeTeam/RG_GuestTeam
 */
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type {
  EventsData,
  VolleyballSet,
  VolleyballScorer,
} from '../../src/types/events.js';

const BASE_URL = 'https://kop-web.dataproject.com';
const TEAM_KEYWORD = 'NEA SALAMINA';

const MONTH_INDEX_TO_NAME: Record<number, string> = {
  9: 'september', 10: 'october', 11: 'november', 12: 'december',
  1: 'january', 2: 'february', 3: 'march', 4: 'april',
  5: 'may', 6: 'june', 7: 'july', 8: 'august',
};

export interface DataprojectMatchRef {
  mId: string;
  compId: string;
  pid: string;
  cid: string;
  day: number;
  monthNum: number;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  /** Whether NEA SALAMINA is the match home team */
  isHome: boolean;
}

export interface DataprojectMatchDetails {
  sets: VolleyballSet[];
  vbScorers: VolleyballScorer[];
}

/**
 * Parse match refs from a CompetitionMatches.aspx HTML page.
 * Extracts only matches involving NEA SALAMINA.
 *
 * Strategy: iterate all span[id$="Label2"] elements (home team spans).
 * These are present in both the RadListView section AND the round-by-round grid section,
 * making this approach robust across page layouts.
 */
export function parseMatchRefs(html: string, sport: string): DataprojectMatchRef[] {
  const $ = cheerio.load(html);
  const refs: DataprojectMatchRef[] = [];
  const seen = new Set<string>();

  function processTeamSpan(
    el: AnyNode,
    homeTeamSuffix: string,
    awayTeamSuffix: string,
  ) {
    const homeTeam = $(el).text().trim();
    if (!homeTeam) return;

    const elId = $(el).attr('id') || '';
    const ctrlBase = elId.slice(0, elId.length - homeTeamSuffix.length);

    const awayTeam = $(`span[id="${ctrlBase}${awayTeamSuffix}"]`).text().trim();
    if (!awayTeam) return;

    const neaIsHome = homeTeam.toUpperCase().includes(TEAM_KEYWORD);
    const neaIsAway = awayTeam.toUpperCase().includes(TEAM_KEYWORD);
    if (!neaIsHome && !neaIsAway) return;

    // Get the date from LB_DataOra span with the same control base
    const dateStr = $(`span[id="${ctrlBase}LB_DataOra"]`).first().text().trim()
      || $(`input[id="${ctrlBase}HF_MatchDatetime"]`).val() as string || '';
    const dateMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!dateMatch) return;
    const day = parseInt(dateMatch[1], 10);
    const monthNum = parseInt(dateMatch[2], 10);

    // Get mId/CID/PID from the nearest onclick containing MatchStatistics
    const onclick = $(el).closest('[onclick*="MatchStatistics"]').attr('onclick')
      || $(el).parent().attr('onclick')
      || $(`span[id="${ctrlBase}StatsIcon"]`).closest('[onclick*="MatchStatistics"]').attr('onclick')
      || $(`[id*="${ctrlBase}"][onclick*="MatchStatistics"]`).first().attr('onclick')
      || '';
    const mIdMatch = onclick.match(/mID=(\d+)/);
    const cidMatch = onclick.match(/CID=(\d+)/);
    const pidMatch = onclick.match(/PID=(\d+)/);
    const idMatch = onclick.match(/&ID=(\d+)/);
    if (!mIdMatch || !cidMatch) return;

    const mId = mIdMatch[1];
    if (seen.has(mId)) return;
    seen.add(mId);

    refs.push({
      mId,
      compId: idMatch?.[1] ?? '',
      pid: pidMatch?.[1] ?? '',
      cid: cidMatch[1],
      day,
      monthNum,
      homeTeam,
      awayTeam,
      sport,
      isHome: neaIsHome,
    });
  }

  // Pattern 1: RadListView section — Label2 (home) / Label4 (away)
  $('span[id$="Label2"]').each((_, el) => processTeamSpan(el, 'Label2', 'Label4'));

  // Pattern 2: Round-grid section — LBL_HomeTeamName (home) / LBL_GuestTeamName (away)
  $('span[id$="LBL_HomeTeamName"]').each((_, el) => processTeamSpan(el, 'LBL_HomeTeamName', 'LBL_GuestTeamName'));

  return refs;
}

/**
 * Parse match statistics from a MatchStatistics.aspx HTML page.
 * team='home' convention: always refers to NEA SALAMINA (same as football convention).
 */
export function parseMatchStats(html: string, isHomeTeam: boolean): DataprojectMatchDetails {
  // 1. Set scores — first "NN/MM NN/MM ..." pattern in the HTML
  const setScoresMatch = html.match(/(\d+\/\d+(?:\s+\d+\/\d+)+)/);
  const sets: VolleyballSet[] = [];
  if (setScoresMatch) {
    for (const setStr of setScoresMatch[1].trim().split(/\s+/)) {
      const parts = setStr.split('/');
      if (parts.length === 2) {
        sets.push({ home: parseInt(parts[0], 10), away: parseInt(parts[1], 10) });
      }
    }
  }

  // 2. Player stats from the overall match section (RG_HomeTeam / RG_GuestTeam)
  //    Use .first() to get the overall stats tables (set _0), not per-set tables.
  const $ = cheerio.load(html);
  const vbScorers: VolleyballScorer[] = [];

  function extractPlayers(tableId: string, team: 'home' | 'away') {
    $(`#${tableId}`).first().find('tbody tr').each((_, row) => {
      const name = $(row).find('span[id="PlayerName"]').text().trim();
      const ptsText = $(row).find('span[id="PointsTot"]').text().trim();
      if (!name || name === 'TOTALS') return;
      const pts = parseInt(ptsText, 10);
      if (isNaN(pts) || pts <= 0) return;
      vbScorers.push({ name, points: pts, team });
    });
  }

  // RG_HomeTeam = match home team; map to Nea Salamina convention
  extractPlayers('RG_HomeTeam', isHomeTeam ? 'home' : 'away');
  extractPlayers('RG_GuestTeam', isHomeTeam ? 'away' : 'home');

  // Keep top 5 per team, sorted by points descending
  const homeTop = vbScorers
    .filter(s => s.team === 'home')
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);
  const awayTop = vbScorers
    .filter(s => s.team === 'away')
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  return { sets, vbScorers: [...homeTop, ...awayTop] };
}

export async function fetchMatchRefs(url: string, sport: string): Promise<DataprojectMatchRef[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const html = await res.text();
  return parseMatchRefs(html, sport);
}

export async function fetchMatchStats(ref: DataprojectMatchRef): Promise<DataprojectMatchDetails> {
  const url = `${BASE_URL}/MatchStatistics.aspx?mID=${ref.mId}&ID=${ref.compId}&CID=${ref.cid}&PID=${ref.pid}&type=LegList`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const html = await res.text();
  return parseMatchStats(html, ref.isHome);
}

export async function enrichWithDataproject(
  events: EventsData,
  urls: Record<string, string | string[]>,
  opts: { delayMs?: number; onProgress?: (msg: string) => void } = {},
): Promise<{ enriched: number; skipped: number; failed: number }> {
  const { delayMs = 300, onProgress } = opts;
  let enriched = 0, skipped = 0, failed = 0;

  for (const [sport, urlOrUrls] of Object.entries(urls)) {
    const urlList = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
    const allRefs: DataprojectMatchRef[] = [];
    const seenMIds = new Set<string>();

    for (const url of urlList) {
      try {
        const refs = await fetchMatchRefs(url, sport);
        for (const ref of refs) {
          if (!seenMIds.has(ref.mId)) {
            seenMIds.add(ref.mId);
            allRefs.push(ref);
          }
        }
      } catch (e) {
        onProgress?.(`  ✗ Failed to fetch ${sport} match list (${url}): ${e}`);
        failed++;
      }
    }

    const refs = allRefs;
    onProgress?.(`  Found ${refs.length} ${sport} NEA SALAMINA match refs`);

    for (const ref of refs) {
      const monthName = MONTH_INDEX_TO_NAME[ref.monthNum];
      if (!monthName) { skipped++; continue; }

      const monthEvents = events[monthName as keyof EventsData];
      if (!monthEvents) { skipped++; continue; }

      const event = monthEvents.find(e =>
        e.day === ref.day &&
        e.sport === ref.sport &&
        e.status === 'played',
      );
      if (!event) { skipped++; continue; }

      // Skip if already enriched
      if (event.sets && event.sets.length > 0) { skipped++; continue; }

      try {
        await new Promise(r => setTimeout(r, delayMs));
        const details = await fetchMatchStats(ref);

        if (details.sets.length > 0) event.sets = details.sets;
        if (details.vbScorers.length > 0) event.vbScorers = details.vbScorers;

        enriched++;
        onProgress?.(`  ✓ ${sport} ${ref.day}/${ref.monthNum}: ${ref.homeTeam} vs ${ref.awayTeam}`);
      } catch (e) {
        failed++;
        onProgress?.(`  ✗ Failed ${ref.day}/${ref.monthNum}: ${e}`);
      }
    }
  }

  return { enriched, skipped, failed };
}
