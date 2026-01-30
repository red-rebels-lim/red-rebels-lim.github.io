/**
 * Multi-Sport Fixtures Scraper (CFA Football + volleyball.org.cy Volleyball + dataproject cross-verification)
 *
 * Run with: npx tsx scripts/scraper/index.ts
 */

import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEAM_FILTER_CFA = 'ΝΕΑ ΣΑΛΑΜΙΝΑ ΑΜΜΟΧΩΣΤΟΥ';
const TEAM_FILTER_VOLLEYBALL = 'ΝΕΑ ΣΑΛΑΜΙΝΑ';

const CFA_URLS = [
  'https://cfa.com.cy/Gr/fixtures/65409603',   // Preliminary phase (Sep-Jan)
  'https://cfa.com.cy/Gr/fixtures/66686780',   // Championship phase (Jan-Apr)
];

const VOLLEYBALL_URLS: Record<string, string> = {
  'volleyball-men': 'https://volleyball.org.cy/all-programs?ajax_post=17958',
  'volleyball-women': 'https://volleyball.org.cy/all-programs?ajax_post=17960',
};

const DATAPROJECT_URLS: Record<string, string> = {
  'volleyball-men': 'https://kop-web.dataproject.com/CompetitionMatches.aspx?ID=42&PID=71',
  'volleyball-women': 'https://kop-web.dataproject.com/CompetitionMatches.aspx?ID=43&PID=72',
};

const SCRAPED_SPORTS = ['football-men', 'volleyball-men', 'volleyball-women'];

const LOGOS_DIR = path.resolve(__dirname, '../../public/images/team_logos');
const EVENTS_FILE = path.resolve(__dirname, '../../src/data/events.ts');

interface Fixture {
  date: string;
  homeTeam: string;
  homeLogo: string | null;
  scoreTime: string;        // CFA: score if played, time if upcoming
  awayTeam: string;
  awayLogo: string | null;
  venue: string;
  status: 'Played' | 'Upcoming';
  sport: string;            // 'football-men' | 'volleyball-men' | 'volleyball-women'
  matchTime?: string;       // Actual kick-off/start time
}

interface SportEvent {
  day: number;
  sport: string;
  location: string;
  opponent: string;
  time: string;
  venue?: string;
  logo?: string;
  status?: string;
  score?: string;
}

// Greek month names mapping
const GREEK_MONTHS: Record<string, number> = {
  'Σεπτεμβρίου': 9,
  'Οκτωβρίου': 10,
  'Νοεμβρίου': 11,
  'Δεκεμβρίου': 12,
  'Ιανουαρίου': 1,
  'Φεβρουαρίου': 2,
  'Μαρτίου': 3,
  'Απριλίου': 4,
  'Μαΐου': 5,
  'Ιουνίου': 6,
  'Ιουλίου': 7,
  'Αυγούστου': 8,
};

const MONTH_NAMES: Record<number, string> = {
  1: 'january',
  2: 'february',
  3: 'march',
  4: 'april',
  5: 'may',
  6: 'june',
  7: 'july',
  8: 'august',
  9: 'september',
  10: 'october',
  11: 'november',
  12: 'december',
};

function hasExistingLogos(): boolean {
  if (!fs.existsSync(LOGOS_DIR)) return false;

  const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif'];
  try {
    const files = fs.readdirSync(LOGOS_DIR);
    return files.some(file =>
      imageExtensions.some(ext => file.toLowerCase().endsWith(ext))
    );
  } catch {
    return false;
  }
}

function makeSafeFilename(teamName: string): string {
  return teamName
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/[-\s]+/g, '_');
}

async function downloadLogo(
  logoUrl: string,
  teamName: string,
  baseUrl: string
): Promise<string | null> {
  if (!logoUrl) return null;

  try {
    fs.mkdirSync(LOGOS_DIR, { recursive: true });

    const fullUrl = new URL(logoUrl, baseUrl).toString();
    const safeName = makeSafeFilename(teamName);

    // Determine extension
    let ext = 'png';
    const urlPath = logoUrl.split('/').pop() || '';
    if (urlPath.includes('.')) {
      const potentialExt = urlPath.split('.').pop()?.toLowerCase();
      if (['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(potentialExt || '')) {
        ext = potentialExt!;
      }
    }

    const filename = `${safeName}.${ext}`;
    const filepath = path.join(LOGOS_DIR, filename);

    if (!fs.existsSync(filepath)) {
      const response = await fetch(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(filepath, buffer);
      console.log(`  ✓ Downloaded logo: ${filename}`);
    }

    return `images/team_logos/${filename}`;
  } catch (e) {
    console.error(`  ✗ Failed to download logo for ${teamName}:`, e);
    return null;
  }
}

function parseFixtureDate(dateStr: string): { day: number; monthNum: number } | null {
  // CFA format: "DD GreekMonth YYYY"
  const cfaParts = dateStr.split(' ');
  if (cfaParts.length >= 2 && GREEK_MONTHS[cfaParts[1]]) {
    return { day: parseInt(cfaParts[0]), monthNum: GREEK_MONTHS[cfaParts[1]] };
  }
  // Volleyball format: "DD/MM/YYYY"
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    return { day: parseInt(slashMatch[1]), monthNum: parseInt(slashMatch[2]) };
  }
  return null;
}

function deduplicateCfaFixtures(fixtures: Fixture[]): Fixture[] {
  const seen = new Map<string, Fixture>();
  for (const f of fixtures) {
    const key = `${f.date}|${f.homeTeam}|${f.awayTeam}`;
    const existing = seen.get(key);
    if (!existing || (f.status === 'Played' && existing.status !== 'Played')) {
      seen.set(key, f);
    }
  }
  return Array.from(seen.values());
}

async function scrapeCfaFixtures(
  url: string,
  teamFilter: string | null,
  downloadLogos: boolean
): Promise<Fixture[]> {
  console.log(`🔄 Fetching CFA fixtures: ${url}`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const fixtures: Fixture[] = [];
  let currentDate = '';

  // Parse dates and fixtures sequentially from raw HTML
  // Structure: <!-- <h5 class="fixures-game-date">DD-Month-YYYY</h5> --> followed by mob-fixtures divs
  const dateRegex = /<!--\s*<h5[^>]*fixures-game-date[^>]*>(\d{1,2})-(\S+)-(\d{4})<\/h5>\s*-->/g;

  // Build a map of position -> date for all date comments
  const datePositions: { pos: number; date: string }[] = [];
  let dateMatch;
  while ((dateMatch = dateRegex.exec(html)) !== null) {
    datePositions.push({
      pos: dateMatch.index,
      date: `${dateMatch[1]} ${dateMatch[2]} ${dateMatch[3]}`,
    });
  }

  // Find positions of all mob-fixtures divs in raw HTML
  const fixturePositions: number[] = [];
  const mobFixtureRegex = /<div class="mob-fixtures/g;
  let mobMatch;
  while ((mobMatch = mobFixtureRegex.exec(html)) !== null) {
    fixturePositions.push(mobMatch.index);
  }

  // Find all fixture containers using cheerio
  const fixtureDivs = $('div.mob-fixtures');

  for (let i = 0; i < fixtureDivs.length; i++) {
    const fixtureDiv = $(fixtureDivs[i]);
    const fixturePos = fixturePositions[i] || 0;

    // Find the most recent date before this fixture's position
    for (let j = datePositions.length - 1; j >= 0; j--) {
      if (datePositions[j].pos < fixturePos) {
        currentDate = datePositions[j].date;
        break;
      }
    }

    // Extract teams and score
    const cols = fixtureDiv.children('div');
    if (cols.length < 3) continue;

    // Home team
    const homeCol = $(cols[0]);
    const homeTeamDiv = homeCol.find('div.col-xs-7');
    const homeTeam = homeTeamDiv.text().trim();
    const homeLogoImg = homeCol.find('img');
    const homeLogoUrl = homeLogoImg.attr('src') || null;

    // Score/Time
    const scoreCol = $(cols[1]);
    const scoreTime = scoreCol.text().trim();

    // Away team
    const awayCol = $(cols[2]);
    const awayTeamDiv = awayCol.find('div.col-xs-7');
    const awayTeam = awayTeamDiv.text().trim();
    const awayLogoImg = awayCol.find('img');
    const awayLogoUrl = awayLogoImg.attr('src') || null;

    // Venue (from comments in 4th column if exists)
    let venue = '';
    if (cols.length >= 4) {
      const venueCol = $(cols[3]);
      const venueHtml = $.html(venueCol);
      const venueMatch = venueHtml.match(/<!--[^]*?<div>([^<]+)<\/div>[^]*?-->/);
      if (venueMatch && venueMatch[1].includes('ΓΗΠΕΔΟ')) {
        venue = venueMatch[1].trim();
      }
    }

    // Validate
    if (!homeTeam || !awayTeam || !scoreTime) continue;
    if (homeTeam.length <= 3 || awayTeam.length <= 3) continue;

    const skipTerms = ['πρωτάθλημα', 'κατηγορία', 'κύπελλο', 'διοργανώσεις'];
    if (skipTerms.some(t => homeTeam.toLowerCase().includes(t) || awayTeam.toLowerCase().includes(t))) {
      continue;
    }

    // Handle logos
    let homeLogo: string | null = null;
    let awayLogo: string | null = null;

    if (downloadLogos) {
      if (homeLogoUrl) homeLogo = await downloadLogo(homeLogoUrl, homeTeam, 'https://cfa.com.cy');
      if (awayLogoUrl) awayLogo = await downloadLogo(awayLogoUrl, awayTeam, 'https://cfa.com.cy');
    } else {
      if (homeLogoUrl) homeLogo = `images/team_logos/${makeSafeFilename(homeTeam)}.png`;
      if (awayLogoUrl) awayLogo = `images/team_logos/${makeSafeFilename(awayTeam)}.png`;
    }

    const fixture: Fixture = {
      date: currentDate,
      homeTeam,
      homeLogo,
      scoreTime,
      awayTeam,
      awayLogo,
      venue,
      status: /^\d+-\d+$/.test(scoreTime.trim()) ? 'Played' : 'Upcoming',
      sport: 'football-men',
    };

    fixtures.push(fixture);
  }

  // Apply team filter
  if (teamFilter) {
    const upperFilter = teamFilter.toUpperCase();
    return fixtures.filter(f =>
      f.homeTeam.toUpperCase().includes(upperFilter) ||
      f.awayTeam.toUpperCase().includes(upperFilter)
    );
  }

  return fixtures;
}

async function scrapeVolleyballFixtures(
  url: string,
  sport: string,
): Promise<Fixture[]> {
  console.log(`🔄 Fetching volleyball fixtures (${sport}): ${url}`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const fixtures: Fixture[] = [];

  // volleyball.org.cy returns a SportsPress table with columns:
  // Date | Match | Time/Result | Category | Venue
  $('table.sp-data-table tbody tr').each((_: number, row: Element) => {
    const cells = $(row).find('td');
    if (cells.length < 5) return;

    // Date cell contains a <date> element with sortable datetime followed by visible DD/MM/YYYY.
    // Remove the <date> element before extracting text to avoid concatenated output.
    const dateCell = $(cells[0]).clone();
    dateCell.find('date').remove();
    const dateStr = dateCell.text().trim();

    const matchText = $(cells[1]).text().trim();

    // Score/time cell may also contain a <date> element with machine-readable time
    const scoreTimeCell = $(cells[2]).clone();
    scoreTimeCell.find('date').remove();
    const scoreTimeRaw = scoreTimeCell.text().trim();
    const category = $(cells[3]).text().trim();
    const venueCell = $(cells[4]);
    const venue = venueCell.find('a').text().trim() || venueCell.text().trim();

    // Filter to senior matches only (category starts with Α)
    if (!category.startsWith('Α\'') && !category.startsWith("Α\u2019")) return;

    // Parse match: "TEAM A — TEAM B" (em-dash) or "TEAM A VS TEAM B"
    let teams = matchText.split(' — ');
    if (teams.length !== 2) {
      teams = matchText.split(/ VS /i);
    }
    if (teams.length !== 2) return;

    const homeTeam = teams[0].trim();
    const awayTeam = teams[1].trim();
    if (!homeTeam || !awayTeam) return;

    // Parse score/time: "3 - 0" (played) or time string (upcoming)
    const scoreMatch = scoreTimeRaw.match(/^(\d+)\s*-\s*(\d+)$/);
    let scoreTime: string;
    let status: 'Played' | 'Upcoming';
    let matchTime: string | undefined;

    if (scoreMatch) {
      scoreTime = `${scoreMatch[1]}-${scoreMatch[2]}`;
      status = 'Played';
    } else {
      // Extract HH:MM from the <date> element (e.g. " 18:00:00") for a clean 24h time
      const dateEl = $(cells[2]).find('date').text().trim();
      const timeMatch = dateEl.match(/(\d{2}:\d{2})/);
      scoreTime = timeMatch ? timeMatch[1] : scoreTimeRaw;
      matchTime = scoreTime;
      status = 'Upcoming';
    }

    // No logos available from volleyball.org.cy — try to find existing on disk
    const opponentName = homeTeam.toUpperCase().includes(TEAM_FILTER_VOLLEYBALL)
      ? awayTeam : homeTeam;
    const opponentLogoPath = findExistingLogo(opponentName);

    const isHome = homeTeam.toUpperCase().includes(TEAM_FILTER_VOLLEYBALL);
    const homeLogo = isHome ? null : opponentLogoPath;
    const awayLogo = isHome ? opponentLogoPath : null;

    fixtures.push({
      date: dateStr,
      homeTeam,
      homeLogo,
      scoreTime,
      awayTeam,
      awayLogo,
      venue,
      status,
      sport,
      matchTime,
    });
  });

  return fixtures;
}

function findExistingLogo(teamName: string): string | null {
  // Strip women's team marker (Γ)
  const cleanName = teamName.replace(/\s*\(Γ\)\s*$/, '').trim();
  const extensions = ['png', 'jpg', 'jpeg', 'svg', 'gif'];

  // Try exact name first (logos uploaded with Greek names and spaces)
  for (const ext of extensions) {
    const filepath = path.join(LOGOS_DIR, `${cleanName}.${ext}`);
    if (fs.existsSync(filepath)) {
      return `images/team_logos/${cleanName}.${ext}`;
    }
  }
  // Fallback: try safe filename (underscores instead of spaces)
  const safeName = makeSafeFilename(cleanName);
  for (const ext of extensions) {
    const filepath = path.join(LOGOS_DIR, `${safeName}.${ext}`);
    if (fs.existsSync(filepath)) {
      return `images/team_logos/${safeName}.${ext}`;
    }
  }
  return null;
}

async function scrapeDataprojectFixtures(
  url: string,
  sport: string,
): Promise<Fixture[]> {
  console.log(`🔄 Fetching dataproject fixtures (${sport}): ${url}`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const fixtures: Fixture[] = [];

  // dataproject uses Telerik RadListView with labeled spans
  $('[id*="RadListView1"] .rlvI, [id*="RadListView1"] .rlvA').each((_: number, row: Element) => {
    const el = $(row);

    // Team names: Label2 = home, Label4 = away
    const homeTeam = el.find('[id*="Label2"]').text().trim();
    const awayTeam = el.find('[id*="Label4"]').text().trim();
    if (!homeTeam || !awayTeam) return;

    // Filter to Nea Salamina matches
    const upperHome = homeTeam.toUpperCase();
    const upperAway = awayTeam.toUpperCase();
    if (!upperHome.includes('NEA SALAMINA') && !upperAway.includes('NEA SALAMINA') &&
        !upperHome.includes('SALAMINA') && !upperAway.includes('SALAMINA')) {
      return;
    }

    // Date/time: LB_DataOra contains "DD/MM/YYYY HH:MM"
    const dateTimeStr = el.find('[id*="LB_DataOra"]').text().trim();
    const dateTimeMatch = dateTimeStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}:\d{2})/);
    if (!dateTimeMatch) return;

    const dateStr = `${dateTimeMatch[1]}/${dateTimeMatch[2]}/${dateTimeMatch[3]}`;
    const matchTime = dateTimeMatch[4];

    // Scores: LB_SetCasa = home sets, LB_SetOspiti = away sets
    const homeScore = el.find('[id*="LB_SetCasa"]').text().trim();
    const awayScore = el.find('[id*="LB_SetOspiti"]').text().trim();

    let scoreTime: string;
    let status: 'Played' | 'Upcoming';

    const hasScore = homeScore && awayScore && (homeScore !== '0' || awayScore !== '0');
    if (hasScore) {
      scoreTime = `${homeScore}-${awayScore}`;
      status = 'Played';
    } else {
      scoreTime = matchTime;
      status = 'Upcoming';
    }

    fixtures.push({
      date: dateStr,
      homeTeam,
      homeLogo: null,
      scoreTime,
      awayTeam,
      awayLogo: null,
      venue: '',
      status,
      sport,
      matchTime,
    });
  });

  return fixtures;
}

function mergeVolleyballFixtures(
  primary: Fixture[],
  secondary: Fixture[],
): Fixture[] {
  // Dedup by date+sport: Nea Salamina can only play one match per date per sport
  const primaryKeys = new Set<string>();
  for (const f of primary) {
    const parsed = parseFixtureDate(f.date);
    if (parsed) {
      primaryKeys.add(`${parsed.day}/${parsed.monthNum}|${f.sport}`);
    }
  }

  const merged = [...primary];
  let addedFromSecondary = 0;
  let updatedFromSecondary = 0;
  let inBoth = 0;

  for (const sf of secondary) {
    const parsed = parseFixtureDate(sf.date);
    if (!parsed) continue;

    const key = `${parsed.day}/${parsed.monthNum}|${sf.sport}`;

    if (primaryKeys.has(key)) {
      inBoth++;
      // If primary has no score but secondary does, update it
      const primaryMatch = merged.find(f => {
        const pp = parseFixtureDate(f.date);
        return pp && `${pp.day}/${pp.monthNum}|${f.sport}` === key;
      });
      if (primaryMatch && primaryMatch.status === 'Upcoming' && sf.status === 'Played') {
        primaryMatch.scoreTime = sf.scoreTime;
        primaryMatch.status = 'Played';
        updatedFromSecondary++;
        console.log(`  ↻ Updated score from dataproject: ${sf.date} ${sf.sport} → ${sf.scoreTime}`);
      }
    } else {
      // Match only in secondary — add it
      merged.push(sf);
      primaryKeys.add(key);
      addedFromSecondary++;
      console.log(`  + Added from dataproject: ${sf.homeTeam} vs ${sf.awayTeam} (${sf.date})`);
    }
  }

  console.log();
  console.log(`  Cross-verification summary:`);
  console.log(`    In both sources: ${inBoth}`);
  console.log(`    Added from dataproject: ${addedFromSecondary}`);
  console.log(`    Scores updated from dataproject: ${updatedFromSecondary}`);

  return merged;
}

function loadExistingEvents(): Record<string, SportEvent[]> {
  try {
    const content = fs.readFileSync(EVENTS_FILE, 'utf-8');
    const match = content.match(/export const eventsData[^=]*=\s*({[\s\S]*});?\s*$/);
    if (match) {
      // Use Function constructor to safely parse the object literal
      const fn = new Function(`return ${match[1]}`);
      return fn();
    }
  } catch {
    console.log('Creating new events file');
  }
  return {};
}

function normalizeOpponent(opponent: string): string {
  return opponent.toUpperCase().replace(/\s*\(Γ\)\s*$/, '').trim();
}

function fixtureToEvent(fixture: Fixture): { monthName: string; event: SportEvent } | null {
  const parsed = parseFixtureDate(fixture.date);
  if (!parsed) return null;

  const { day, monthNum } = parsed;
  const monthName = MONTH_NAMES[monthNum];
  if (!monthName) return null;

  const isHome = fixture.homeTeam.toUpperCase().includes('ΝΕΑ ΣΑΛΑΜΙΝΑ');
  const location = isHome ? 'home' : 'away';
  const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
  const logo = isHome ? fixture.awayLogo : fixture.homeLogo;

  let time: string;
  if (fixture.matchTime) {
    time = fixture.matchTime;
  } else {
    time = fixture.status === 'Played' ? '' : fixture.scoreTime;
  }

  const event: SportEvent = {
    day,
    sport: fixture.sport,
    location,
    opponent,
    time,
  };

  if (fixture.venue) event.venue = fixture.venue;
  if (logo) event.logo = logo;
  if (fixture.status === 'Played') {
    event.status = 'played';
    event.score = fixture.scoreTime;
  }

  return { monthName, event };
}

function updateCalendarData(fixtures: Fixture[]): void {
  const existingEvents = loadExistingEvents();

  // Build scraped events indexed by month
  const scrapedByMonth: Record<string, SportEvent[]> = {};
  for (const fixture of fixtures) {
    const result = fixtureToEvent(fixture);
    if (!result) continue;
    if (!scrapedByMonth[result.monthName]) scrapedByMonth[result.monthName] = [];
    scrapedByMonth[result.monthName].push(result.event);
  }

  const allMonths = [
    'september', 'october', 'november', 'december',
    'january', 'february', 'march', 'april',
    'may', 'june', 'july', 'august',
  ];

  for (const monthName of allMonths) {
    const existing = existingEvents[monthName] || [];
    const scraped = scrapedByMonth[monthName] || [];

    // Preserve non-scraped events (meetings, etc.)
    const preserved = existing.filter(e => !SCRAPED_SPORTS.includes(e.sport));

    // Build a key set for scraped events
    const scrapedKeys = new Map<string, SportEvent>();
    for (const e of scraped) {
      const key = `${monthName}|${e.day}|${e.sport}|${normalizeOpponent(e.opponent)}`;
      scrapedKeys.set(key, e);
    }

    // For existing scraped-sport events: update if matching scraped event exists, preserve if not (manual addition)
    const existingScraped = existing.filter(e => SCRAPED_SPORTS.includes(e.sport));
    const matchedKeys = new Set<string>();

    for (const existingEvent of existingScraped) {
      const key = `${monthName}|${existingEvent.day}|${existingEvent.sport}|${normalizeOpponent(existingEvent.opponent)}`;
      const scrapedEvent = scrapedKeys.get(key);

      if (scrapedEvent) {
        // Update existing with scraped data (score, time, status)
        existingEvent.time = scrapedEvent.time;
        if (scrapedEvent.status) existingEvent.status = scrapedEvent.status;
        if (scrapedEvent.score) existingEvent.score = scrapedEvent.score;
        if (scrapedEvent.logo) existingEvent.logo = scrapedEvent.logo;
        if (scrapedEvent.venue) existingEvent.venue = scrapedEvent.venue;
        existingEvent.location = scrapedEvent.location;
        matchedKeys.add(key);
        preserved.push(existingEvent);
      } else {
        // No matching scraped event — preserve manually-added event
        preserved.push(existingEvent);
      }
    }

    // Add new scraped events that didn't match any existing event
    for (const [key, scrapedEvent] of scrapedKeys) {
      if (!matchedKeys.has(key)) {
        preserved.push(scrapedEvent);
      }
    }

    const combined = preserved.sort((a, b) => a.day - b.day);

    if (combined.length > 0 || existing.length > 0) {
      existingEvents[monthName] = combined;
    }
  }

  // Generate TypeScript output
  let tsContent = `// Auto-generated events data
// This file is automatically updated by the scraper
import type { EventsData } from '@/types/events';

export const eventsData: EventsData = `;

  tsContent += JSON.stringify(existingEvents, null, 2)
    .replace(/"(\w+)":/g, '$1:')  // Remove quotes from keys
    .replace(/"/g, "'");          // Use single quotes for strings

  tsContent += ';\n';

  fs.writeFileSync(EVENTS_FILE, tsContent, 'utf-8');
  console.log(`✓ Calendar events.ts synced with ${fixtures.length} fixtures (preserving manual edits)`);
}

function saveToJson(fixtures: Fixture[]): void {
  const footballFixtures = fixtures.filter(f => f.sport === 'football-men');
  const volleyballMenFixtures = fixtures.filter(f => f.sport === 'volleyball-men');
  const volleyballWomenFixtures = fixtures.filter(f => f.sport === 'volleyball-women');

  const jsonData = {
    metadata: {
      title: 'Nea Salamina Fixtures - Season 2025/2026',
      scrapedAt: new Date().toISOString(),
      sources: {
        football: 'https://cfa.com.cy',
        volleyball: 'https://volleyball.org.cy',
        volleyballVerification: 'https://kop-web.dataproject.com',
      },
      totalFixtures: fixtures.length,
      footballFixtures: footballFixtures.length,
      volleyballMenFixtures: volleyballMenFixtures.length,
      volleyballWomenFixtures: volleyballWomenFixtures.length,
      playedFixtures: fixtures.filter(f => f.status === 'Played').length,
      upcomingFixtures: fixtures.filter(f => f.status === 'Upcoming').length,
    },
    fixtures,
  };

  const outputPath = path.resolve(__dirname, '../../cfa_fixtures.json');
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf-8');
  console.log(`✓ JSON data saved to cfa_fixtures.json`);
}

async function main() {
  console.log('🔄 Scraping multi-sport fixtures for Nea Salamina...');
  console.log();

  const logosExist = hasExistingLogos();
  const shouldDownloadLogos = !logosExist;

  if (logosExist) {
    console.log('ℹ️  Team logos already exist - skipping logo downloads');
  } else {
    console.log('📥 Team logos will be downloaded');
  }
  console.log();

  try {
    // 1. Scrape CFA football fixtures from both URLs
    const allCfaFixtures: Fixture[] = [];
    for (const url of CFA_URLS) {
      const fixtures = await scrapeCfaFixtures(url, TEAM_FILTER_CFA, shouldDownloadLogos);
      console.log(`  Found ${fixtures.length} CFA fixtures from ${url}`);
      allCfaFixtures.push(...fixtures);
    }

    // 2. Deduplicate CFA fixtures (matches may appear on both pages)
    const cfaFixtures = deduplicateCfaFixtures(allCfaFixtures);
    console.log(`  After deduplication: ${cfaFixtures.length} CFA fixtures`);
    console.log();

    // 3. Scrape volleyball.org.cy volleyball fixtures (primary)
    const allVolleyballFixtures: Fixture[] = [];
    for (const [sport, url] of Object.entries(VOLLEYBALL_URLS)) {
      const fixtures = await scrapeVolleyballFixtures(url, sport);
      console.log(`  Found ${fixtures.length} ${sport} fixtures`);
      allVolleyballFixtures.push(...fixtures);
    }
    console.log();

    // 4. Scrape dataproject fixtures (secondary/verification)
    const dataprojectFixtures: Fixture[] = [];
    for (const [sport, url] of Object.entries(DATAPROJECT_URLS)) {
      try {
        const fixtures = await scrapeDataprojectFixtures(url, sport);
        console.log(`  Found ${fixtures.length} ${sport} dataproject fixtures`);
        dataprojectFixtures.push(...fixtures);
      } catch (e) {
        console.warn(`  ⚠ Failed to fetch dataproject ${sport}:`, e);
      }
    }
    console.log();

    // 5. Merge volleyball fixtures (primary + secondary)
    const mergedVolleyball = mergeVolleyballFixtures(allVolleyballFixtures, dataprojectFixtures);
    console.log();

    // 6. Combine all fixtures
    const allFixtures = [...cfaFixtures, ...mergedVolleyball];

    if (allFixtures.length > 0) {
      saveToJson(allFixtures);
      updateCalendarData(allFixtures);

      const footballCount = cfaFixtures.length;
      const vbMenCount = mergedVolleyball.filter(f => f.sport === 'volleyball-men').length;
      const vbWomenCount = mergedVolleyball.filter(f => f.sport === 'volleyball-women').length;
      const playedCount = allFixtures.filter(f => f.status === 'Played').length;
      const upcomingCount = allFixtures.filter(f => f.status === 'Upcoming').length;

      console.log();
      console.log('='.repeat(80));
      console.log('✅ Scraping completed successfully!');
      console.log(`  Football:        ${footballCount} fixtures`);
      console.log(`  Volleyball Men:  ${vbMenCount} fixtures`);
      console.log(`  Volleyball Women: ${vbWomenCount} fixtures`);
      console.log(`  Total:           ${allFixtures.length} fixtures`);
      console.log(`  Played: ${playedCount}, Upcoming: ${upcomingCount}`);
      console.log('='.repeat(80));
    } else {
      console.log('❌ No fixtures found');
    }
  } catch (error) {
    console.error('❌ Failed to scrape data:', error);
    process.exit(1);
  }
}

main();
