/**
 * Post-sync feed parity (DATA-09): after the scraper dual-writes to Payload,
 * everything the freshly written events.ts knows must be reflected in the
 * production /events.json (served from D1 by the rrcalendar Worker).
 *
 * The check is a SUBSET comparison, not equality: the database legitimately
 * knows MORE than the scraper during the transition — admins enter friendly
 * results and venue details the CFA never publishes, and those fields are
 * deliberately preserved by the sync. Such feed-ahead drift is logged as a
 * warning. The run FAILS on real problems only:
 *   - an events.ts fixture missing from the feed (sync failed to create it)
 *   - a value events.ts has that the feed contradicts (a protected DB fixture
 *     disagrees with the scraper — a human must reconcile)
 * One tolerated contradiction: feed 'played' vs events.ts 'upcoming' (an
 * admin result ahead of the scraper), which also exempts the result fields.
 *
 * Retries for up to ~90s: the Worker's edge cache re-keys within ~10s of the
 * sync's version bump.
 *
 *   npx tsx feed-parity.ts            # against https://red-rebels.com/events.json
 *   FEED_URL=... npx tsx feed-parity.ts
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { sortedStringify } from '../../../payload/scripts/lib/compare.ts';
import { loadEventsData } from '../../../payload/scripts/lib/extract.ts';
import type { EventsData, LegacyEvent, MonthName } from '../../../payload/scripts/lib/types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVENTS_PATH = path.resolve(__dirname, '../../src/data/events.ts');
const FEED_URL = process.env.FEED_URL ?? 'https://red-rebels.com/events.json';
const ATTEMPTS = 10;
const DELAY_MS = 10_000;

// Result fields exempt from comparison when the feed is ahead (played in the
// DB, still upcoming in events.ts): the admin's result is authoritative.
const RESULT_FIELDS = new Set([
  'status', 'score', 'penalties', 'scorers', 'bookings', 'lineup', 'subs',
  'sets', 'vbScorers', 'duration', 'reportEN', 'reportEL', 'time',
]);

const expected = loadEventsData(EVENTS_PATH);

function checkMonth(
  month: MonthName,
  expectedEvents: LegacyEvent[],
  feedEvents: LegacyEvent[],
): { problems: string[]; warnings: string[] } {
  const problems: string[] = [];
  const warnings: string[] = [];
  const key = (e: LegacyEvent) => `${e.day}|${e.sport ?? ''}|${e.opponent}`;
  const feedByKey = new Map(feedEvents.map((e) => [key(e), e]));

  for (const exp of expectedEvents) {
    const feed = feedByKey.get(key(exp));
    const desc = `${month} ${exp.day} ${exp.sport} vs ${exp.opponent}`;
    if (!feed) {
      problems.push(`missing from feed: ${desc}`);
      continue;
    }
    const feedAhead =
      feed.status === 'played' && (exp.status === 'upcoming' || exp.status === undefined);
    if (feedAhead) warnings.push(`feed ahead (admin result): ${desc} — feed ${feed.score ?? '?'}`);

    const expRec = exp as unknown as Record<string, unknown>;
    const feedRec = feed as unknown as Record<string, unknown>;
    for (const [field, expValue] of Object.entries(expRec)) {
      if (expValue === undefined) continue;
      if (feedAhead && RESULT_FIELDS.has(field)) continue;
      if (sortedStringify(expValue) !== sortedStringify(feedRec[field])) {
        problems.push(
          `${desc} — ${field} contradicts:\n    events.ts: ${sortedStringify(expValue)}\n    feed:      ${sortedStringify(feedRec[field])}`,
        );
      }
    }
    for (const field of Object.keys(feedRec)) {
      if (expRec[field] === undefined && feedRec[field] !== undefined) {
        warnings.push(`feed ahead (extra field): ${desc} — ${field}`);
      }
    }
  }

  const expectedKeys = new Set(expectedEvents.map(key));
  for (const feed of feedEvents) {
    if (!expectedKeys.has(key(feed))) {
      warnings.push(`feed-only fixture (admin-created): ${month} ${feed.day} ${feed.sport} vs ${feed.opponent}`);
    }
  }
  return { problems, warnings };
}

function check(actual: EventsData): { problems: string[]; warnings: string[] } {
  const problems: string[] = [];
  const warnings: string[] = [];
  for (const month of Object.keys(expected) as MonthName[]) {
    const r = checkMonth(month, expected[month] ?? [], actual[month] ?? []);
    problems.push(...r.problems);
    warnings.push(...r.warnings);
  }
  return { problems, warnings };
}

let last: { problems: string[]; warnings: string[] } = { problems: [], warnings: [] };
for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  const res = await fetch(FEED_URL, { headers: { 'cache-control': 'no-cache' } });
  if (!res.ok) throw new Error(`${FEED_URL} → ${res.status}`);
  const feed = (await res.json()) as { generatedAt: string; events: EventsData };
  last = check(feed.events);
  if (last.problems.length === 0) {
    for (const w of last.warnings) console.log(`⚠ ${w}`);
    console.log(
      `FEED PARITY OK — every events.ts value reflected in ${FEED_URL} ` +
      `(generatedAt ${feed.generatedAt}${last.warnings.length ? `, ${last.warnings.length} tolerated feed-ahead drift(s)` : ''})`,
    );
    process.exit(0);
  }
  console.log(`attempt ${attempt}/${ATTEMPTS}: ${last.problems.length} problem(s), retrying in ${DELAY_MS / 1000}s...`);
  if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, DELAY_MS));
}

console.error(`FEED PARITY FAILED — ${FEED_URL} conflicts with the scraped events.ts:`);
for (const p of last.problems) console.error('\n✗ ' + p);
for (const w of last.warnings) console.error('⚠ ' + w);
process.exit(1);
