/**
 * CFA (Cyprus Football Association) enrichment for played football matches.
 *
 * Fetches scorers, bookings, lineups and substitutions from the official CFA
 * website game-details pages. Used as primary data source after FotMob
 * enrichment, to fill in any fields that FotMob couldn't provide.
 *
 * Data source: https://www.cfa.com.cy/Gr/game_details/{leagueId}/{gameId}
 */

import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import type { SportEvent } from './index.js';

// ── Types ─────────────────────────────────────────────────────────────────────

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
}

interface Substitution {
  playerOn: string;
  playerOff: string;
  minute: string;
  team: 'home' | 'away';
}

export interface CfaMatchEnrichment {
  scorers: Scorer[];
  bookings: Booking[];
  lineup: { home: LineupPlayer[]; away: LineupPlayer[] };
  subs: Substitution[];
}

interface CfaGameRef {
  day: number;
  monthNum: number;
  leagueId: string;
  gameId: string;
  /** Whether Nea Salamina is the home team on the CFA page (left column). */
  isHome: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GREEK_MONTHS: Record<string, number> = {
  'Σεπτεμβρίου': 9, 'Οκτωβρίου': 10, 'Νοεμβρίου': 11, 'Δεκεμβρίου': 12,
  'Ιανουαρίου': 1, 'Φεβρουαρίου': 2, 'Μαρτίου': 3, 'Απριλίου': 4,
  'Μαΐου': 5, 'Ιουνίου': 6, 'Ιουλίου': 7, 'Αυγούστου': 8,
};

const MONTH_TO_NUM: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4,
  may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
};

const NEA_SALAMINA_KEY = 'ΝΕΑ ΣΑΛΑΜΙΝΑ';

const CFA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

// ── Fixture page: extract game refs ──────────────────────────────────────────

/**
 * Fetch a CFA fixtures page and return game refs for Nea Salamina matches.
 * The game ID is extracted from commented-out game_details links that appear
 * in the HTML within ~1300 chars after each mob-fixtures div.
 */
export async function fetchCfaGameRefs(url: string): Promise<CfaGameRef[]> {
  const res = await fetch(url, { headers: CFA_HEADERS });
  if (!res.ok) throw new Error(`CFA fixtures HTTP ${res.status}`);
  const html = await res.text();
  return parseCfaFixtureRefs(html);
}

/** Exported for testing */
export function parseCfaFixtureRefs(html: string): CfaGameRef[] {
  const $ = cheerio.load(html);
  const refs: CfaGameRef[] = [];

  // 1. Build a date-position map from commented date markers
  //    Format: <!-- <h5 class="fixures-game-date">DD-MonthName-YYYY</h5> -->
  const dateRegex = /<!--\s*<h5[^>]*fixures-game-date[^>]*>(\d{1,2})-(\S+)-(\d{4})<\/h5>\s*-->/g;
  const datePositions: { pos: number; day: number; monthNum: number }[] = [];
  let dm: RegExpExecArray | null;
  while ((dm = dateRegex.exec(html)) !== null) {
    const monthNum = GREEK_MONTHS[dm[2]];
    if (monthNum) datePositions.push({ pos: dm.index, day: parseInt(dm[1]), monthNum });
  }

  // 2. Build a game_details position map from commented-out links
  //    Format: href="/Gr/game_details/{leagueId}/{gameId}"
  const gdRegex = /href="\/Gr\/game_details\/(\d+)\/(\d+)"/g;
  const gdPositions: { pos: number; leagueId: string; gameId: string }[] = [];
  let gm: RegExpExecArray | null;
  while ((gm = gdRegex.exec(html)) !== null) {
    gdPositions.push({ pos: gm.index, leagueId: gm[1], gameId: gm[2] });
  }

  // 3. Find mob-fixtures div positions
  const mobRegex = /<div class="mob-fixtures/g;
  const fixturePositions: number[] = [];
  let mm: RegExpExecArray | null;
  while ((mm = mobRegex.exec(html)) !== null) {
    fixturePositions.push(mm.index);
  }

  // 4. For each mob-fixtures div, match it to a date and the nearest game_details link
  const fixtureDivs = $('div.mob-fixtures');
  fixtureDivs.each((i, el) => {
    const fixturePos = fixturePositions[i] ?? 0;

    // Most recent date before this fixture
    let day = 0, monthNum = 0;
    for (let j = datePositions.length - 1; j >= 0; j--) {
      if (datePositions[j].pos < fixturePos) {
        ({ day, monthNum } = datePositions[j]);
        break;
      }
    }
    if (!day || !monthNum) return;

    // Extract team names from the fixture div
    const cols = $(el).children('div');
    if (cols.length < 3) return;
    const homeTeam = $(cols[0]).find('div.col-xs-7').text().trim().toUpperCase();
    const awayTeam = $(cols[2]).find('div.col-xs-7').text().trim().toUpperCase();

    // Only Nea Salamina matches
    const nsIsHome = homeTeam.includes(NEA_SALAMINA_KEY);
    const nsIsAway = awayTeam.includes(NEA_SALAMINA_KEY);
    if (!nsIsHome && !nsIsAway) return;

    // First game_details link that appears after this fixture's position
    const ref = gdPositions.find(gd => gd.pos > fixturePos);
    if (!ref) return;

    refs.push({ day, monthNum, leagueId: ref.leagueId, gameId: ref.gameId, isHome: nsIsHome });
  });

  return refs;
}

// ── Game details page: fetch + parse ─────────────────────────────────────────

export async function fetchCfaGameDetailsHtml(leagueId: string, gameId: string): Promise<string> {
  const url = `https://www.cfa.com.cy/Gr/game_details/${leagueId}/${gameId}`;
  const res = await fetch(url, { headers: CFA_HEADERS });
  if (!res.ok) throw new Error(`CFA game details HTTP ${res.status}`);
  return res.text();
}

/** Strip &nbsp; and extra whitespace from a cheerio cell's text. */
function cellText(el: cheerio.Cheerio<Element>): string {
  return el.text().replace(/\u00a0/g, ' ').trim();
}

/** Parse "9'" → "9", "45+2'" → "45+2" */
function parseMinute(raw: string): string {
  return raw.replace(/\u00a0/g, ' ').trim().replace(/'$/, '').trim();
}

/**
 * Parse CFA game details HTML into structured match enrichment.
 *
 * @param html       Raw HTML from /Gr/game_details/{leagueId}/{gameId}
 * @param isHomeTeam Whether Nea Salamina is the CFA-home (left) team.
 */
export function parseCfaGameDetails(html: string, isHomeTeam: boolean): CfaMatchEnrichment {
  const $ = cheerio.load(html);

  const scorers: Scorer[] = [];
  const bookings: Booking[] = [];
  const subs: Substitution[] = [];
  const homeLineup: LineupPlayer[] = [];
  const awayLineup: LineupPlayer[] = [];

  /**
   * Convert CFA-perspective (left = home, right = away) to our data model
   * (home = Nea Salamina, away = opponent).
   */
  function cfaTeam(cfaIsHome: boolean): 'home' | 'away' {
    return (isHomeTeam === cfaIsHome) ? 'home' : 'away';
  }

  // ── Goals + cards ──────────────────────────────────────────────────────────
  // The events table is identified by containing the <!--lblscorers--> marker.
  // Structure: [homePlayer, minute, awayPlayer] rows.
  // Sections separated by <!--lblyellows--> and <!--lblreds--> markers.

  $('table').each((_, tableEl) => {
    const tableHtml = $.html(tableEl);
    if (!tableHtml.includes('<!--lblscorers-->')) return;

    let section: 'goals' | 'yellow' | 'red' | null = null;

    $(tableEl).find('tr').each((_, row) => {
      const rowHtml = $.html(row);

      if (rowHtml.includes('<!--lblscorers-->')) { section = 'goals';  return; }
      if (rowHtml.includes('<!--lblyellows-->')) { section = 'yellow'; return; }
      if (rowHtml.includes('<!--lblreds-->'))    { section = 'red';    return; }
      if (rowHtml.includes('spacer.gif') || !section) return;

      const cells = $(row).find('td');
      if (cells.length < 3) return;

      const homePlayer = cellText($(cells[0]));
      const minuteRaw  = cellText($(cells[1]));
      const awayPlayer = cellText($(cells[2]));
      const minute = parseMinute(minuteRaw);
      if (!minute) return;

      if (section === 'goals') {
        if (homePlayer) scorers.push({ name: homePlayer, minute, team: cfaTeam(true) });
        if (awayPlayer) scorers.push({ name: awayPlayer, minute, team: cfaTeam(false) });
      } else {
        const card = section === 'red' ? 'red' : 'yellow';
        if (homePlayer) bookings.push({ name: homePlayer, minute, team: cfaTeam(true), card });
        if (awayPlayer) bookings.push({ name: awayPlayer, minute, team: cfaTeam(false), card });
      }
    });

    return false; // stop iterating tables
  });

  // ── Substitutions ──────────────────────────────────────────────────────────
  // Table identified by <th>Αλλαγές</th>.
  // Columns (including img spacers): [homeIn, img, homeOut, img, minute, img, awayIn, img, awayOut]

  $('table').each((_, tableEl) => {
    const th = $(tableEl).find('th').first().text().trim();
    if (th !== 'Αλλαγές') return;

    $(tableEl).find('tr').each((rowIdx, row) => {
      if (rowIdx <= 1) return; // skip header + column-label rows

      const cells = $(row).find('td');
      if (cells.length < 9) return;

      const homeIn  = cellText($(cells[0]));
      const homeOut = cellText($(cells[2]));
      const minute  = parseMinute(cellText($(cells[4])));
      const awayIn  = cellText($(cells[6]));
      const awayOut = cellText($(cells[8]));

      if (!minute) return;

      if (homeIn && homeOut) {
        subs.push({ playerOn: homeIn, playerOff: homeOut, minute, team: cfaTeam(true) });
      }
      if (awayIn && awayOut) {
        subs.push({ playerOn: awayIn, playerOff: awayOut, minute, team: cfaTeam(false) });
      }
    });

    return false; // stop iterating tables
  });

  // ── Starting lineups ───────────────────────────────────────────────────────
  // The "Αρχικές Ενδεκάδες" th marks the header row; the next sibling tr has
  // two td cells, the first for the CFA home team and the second for the away.

  const lineupTh = $('th, td').filter((_, el) => $(el).text().trim() === 'Αρχικές Ενδεκάδες').first();
  if (lineupTh.length) {
    const lineupDataRow = lineupTh.closest('tr').next();
    const lineupCells   = lineupDataRow.children('td');

    const extractNames = (cell: cheerio.Cheerio<Element>): LineupPlayer[] =>
      cell.find('a[href*="/Gr/player/77/"]').map((_, a) => ({
        name: $(a).text().trim(),
      })).get();

    const cfaHomePlayers = extractNames($(lineupCells[0]));
    const cfaAwayPlayers = extractNames($(lineupCells[1]));

    if (isHomeTeam) {
      homeLineup.push(...cfaHomePlayers);
      awayLineup.push(...cfaAwayPlayers);
    } else {
      homeLineup.push(...cfaAwayPlayers);
      awayLineup.push(...cfaHomePlayers);
    }
  }

  return { scorers, bookings, lineup: { home: homeLineup, away: awayLineup }, subs };
}

// ── Enrichment pipeline ───────────────────────────────────────────────────────

/**
 * Enrich played football-men events with CFA match data.
 * Only fills fields not already set (e.g. by FotMob enrichment).
 */
export async function enrichWithCfa(
  events: Record<string, SportEvent[]>,
  cfaUrls: string[],
  opts: { delayMs?: number; onProgress?: (msg: string) => void } = {},
): Promise<{ enriched: number; skipped: number; failed: number }> {
  const { delayMs = 500, onProgress = console.log } = opts;

  // 1. Collect all CFA game refs from fixture pages
  const allRefs: CfaGameRef[] = [];
  for (const url of cfaUrls) {
    try {
      const refs = await fetchCfaGameRefs(url);
      onProgress(`  CFA: found ${refs.length} game refs from ${url}`);
      allRefs.push(...refs);
    } catch (e) {
      onProgress(`  ⚠ CFA refs fetch failed for ${url}: ${e}`);
    }
  }

  if (allRefs.length === 0) {
    onProgress('  ⚠ No CFA game refs found');
    return { enriched: 0, skipped: 0, failed: 0 };
  }

  // 2. Deduplicate by day+month (a match appears on both fixture pages)
  const refsByKey = new Map<string, CfaGameRef>();
  for (const ref of allRefs) {
    const key = `${ref.day}/${ref.monthNum}`;
    if (!refsByKey.has(key)) refsByKey.set(key, ref);
  }

  let enriched = 0;
  let skipped  = 0;
  let failed   = 0;

  for (const [monthName, monthEvents] of Object.entries(events)) {
    const monthNum = MONTH_TO_NUM[monthName];
    if (!monthNum) continue;

    for (const event of monthEvents) {
      if (event.sport !== 'football-men' || event.status !== 'played') continue;

      // Skip if already fully enriched by FotMob (or a previous CFA run)
      if (event.scorers && event.lineup && event.subs) {
        skipped++;
        continue;
      }

      const ref = refsByKey.get(`${event.day}/${monthNum}`);
      if (!ref) {
        skipped++;
        continue;
      }

      try {
        if (delayMs > 0) await delay(delayMs);
        const html = await fetchCfaGameDetailsHtml(ref.leagueId, ref.gameId);
        const enrichment = parseCfaGameDetails(html, ref.isHome);

        let didEnrich = false;

        if (!event.scorers && enrichment.scorers.length > 0) {
          event.scorers  = enrichment.scorers;
          didEnrich = true;
        }
        if (!event.bookings && enrichment.bookings.length > 0) {
          event.bookings = enrichment.bookings;
          didEnrich = true;
        }
        if (!event.lineup && (enrichment.lineup.home.length > 0 || enrichment.lineup.away.length > 0)) {
          event.lineup   = enrichment.lineup;
          didEnrich = true;
        }
        if (!event.subs && enrichment.subs.length > 0) {
          event.subs     = enrichment.subs;
          didEnrich = true;
        }

        if (didEnrich) {
          enriched++;
          onProgress(`  ✓ CFA enriched: ${monthName} ${event.day} vs ${event.opponent} (game ${ref.gameId})`);
        } else {
          skipped++;
          onProgress(`  · CFA no new data: ${monthName} ${event.day} vs ${event.opponent}`);
        }
      } catch (e) {
        failed++;
        onProgress(`  ✗ CFA enrichment failed for ${monthName} ${event.day} vs ${event.opponent}: ${e}`);
      }
    }
  }

  return { enriched, skipped, failed };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
