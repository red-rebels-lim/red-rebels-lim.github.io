/**
 * Payload write-protection planner + REST client.
 *
 * RETIRED as an automated sync (2026-08-07): the database is the
 * human-managed source of truth — nothing writes to it from scripts or
 * workflows anymore. This module is kept (with its tests) as the foundation
 * for the planned MCP tool that will execute chat commands against the
 * Payload API: it already provides the authenticated REST client, eventKey/
 * kickoff computation, team resolution via aliases, and the tested rules for
 * what a fixture row may receive:
 *
 *   - locked or source 'manual'  → never touched
 *   - status 'live'              → never touched (being live-edited mid-scrape)
 *   - status 'played' in the DB  → result fields frozen; enrichment may only
 *                                  FILL empty detail arrays, never replace
 *   - everything else            → full field sync when the legacy shape differs
 *   - no match                   → created with source 'scraper'
 *
 * Matching is by season-scoped eventKey, with the same ±10-day window the
 * events.ts merge uses to confirm dateTbd draw fixtures onto their real date.
 * Unknown opponents abort before any write — same rule as seeding.
 *
 * The imported payload/ modules are dependency-free TS shared with the seed
 * and parity scripts; the field mapping here mirrors payload/scripts/seed.ts.
 */

import { computeEventKey } from '../../../payload/src/lib/eventKey.ts';
import { cyprusToUtc } from '../../../payload/scripts/lib/cyprus.ts';
import { fixtureToLegacy } from '../../../payload/scripts/lib/legacy-shape.ts';
import { MONTH_TO_INDEX_AND_YEAR, type MonthName } from '../../../payload/scripts/lib/types.ts';
import { DATE_TBD_TOLERANCE_MS, normalizeOpponentFuzzy, type SportEvent } from './index.ts';

type Doc = Record<string, unknown>;

export interface SeasonInfo {
  id: string | number;
  startYear: number;
  endYear: number;
}

export interface SyncPlan {
  creates: Array<{ eventKey: string; data: Doc }>;
  updates: Array<{ id: string | number; eventKey: string; data: Doc; reason: 'changed' | 'fill-detail' }>;
  skips: Array<{ eventKey: string; reason: 'locked' | 'manual' | 'live' | 'played-unchanged' | 'unchanged' }>;
  unknownOpponents: string[];
}

/** Mirror of the seed script's event → fixture-collection mapping. */
export function eventToFixtureData(
  monthName: string,
  event: SportEvent,
  season: SeasonInfo,
  teamId: string | number | undefined,
): { data: Doc; eventKey: string } {
  const { monthIndex, yearOf } = MONTH_TO_INDEX_AND_YEAR[monthName as MonthName];
  const year = yearOf === 'start' ? season.startYear : season.endYear;
  const timeTbd = !event.time || !/^\d{2}:\d{2}$/.test(event.time);
  const [hh, mm] = timeTbd ? [0, 0] : event.time.split(':').map(Number);
  const kickoff = cyprusToUtc(year, monthIndex, event.day, hh, mm);
  const isMeeting = event.sport === 'meeting';
  const e = event as SportEvent & { sets?: unknown[]; vbScorers?: unknown[] };

  const data: Doc = {
    season: season.id,
    sport: event.sport,
    kickoff: kickoff.toISOString(),
    dateTbd: event.dateTbd === true,
    timeTbd,
    location: event.location,
    opponent: teamId,
    opponentName: event.opponent,
    venue: event.venue ?? undefined,
    logoUrl: event.logo ?? undefined,
    status: isMeeting ? 'upcoming' : (event.status ?? 'upcoming'),
    score: event.score ?? undefined,
    penalties: event.penalties ?? undefined,
    competition: event.competition ?? undefined,
    matchday: event.matchday ?? undefined,
    duration: event.duration ?? undefined,
    reportEN: event.reportEN ?? undefined,
    reportEL: event.reportEL ?? undefined,
    scorers: event.scorers ?? undefined,
    bookings: event.bookings ?? undefined,
    lineup: event.lineup ?? undefined,
    subs: event.subs ?? undefined,
    sets: e.sets ?? undefined,
    vbScorers: e.vbScorers ?? undefined,
    source: 'scraper',
  };
  return { data, eventKey: computeEventKey(kickoff, event.sport ?? '', event.opponent) };
}

const hasRows = (v: unknown): boolean => Array.isArray(v) && v.length > 0;

function lineupHasRows(lineup: unknown): boolean {
  const l = lineup as { home?: unknown[]; away?: unknown[] } | undefined;
  return hasRows(l?.home) || hasRows(l?.away);
}

/** Detail arrays enrichment may FILL (never replace) on played DB fixtures. */
function fillOnlyPatch(existing: Doc, data: Doc): Doc {
  const patch: Doc = {};
  for (const field of ['scorers', 'bookings', 'subs', 'sets', 'vbScorers'] as const) {
    if (!hasRows(existing[field]) && hasRows(data[field])) patch[field] = data[field];
  }
  if (!lineupHasRows(existing.lineup) && lineupHasRows(data.lineup)) patch.lineup = data.lineup;
  return patch;
}

function legacyShape(doc: Doc): string {
  return JSON.stringify(fixtureToLegacy(doc).event);
}

/** Drop undefined values — a PATCH omitting a field leaves it untouched. */
function compact(data: Doc): Doc {
  const out: Doc = {};
  for (const [k, v] of Object.entries(data)) if (v !== undefined) out[k] = v;
  return out;
}

export function planSync(
  events: Record<string, SportEvent[]>,
  existingFixtures: Doc[],
  teams: Doc[],
  season: SeasonInfo,
): SyncPlan {
  const plan: SyncPlan = { creates: [], updates: [], skips: [], unknownOpponents: [] };

  const teamIdByName = new Map<string, string | number>();
  for (const team of teams) {
    const id = team.id as string | number;
    if (typeof team.nameEl === 'string') teamIdByName.set(team.nameEl, id);
    for (const alias of (team.aliases as Array<{ name: string }> | undefined) ?? []) {
      teamIdByName.set(alias.name, id);
    }
  }

  const byEventKey = new Map<string, Doc>();
  for (const doc of existingFixtures) byEventKey.set(String(doc.eventKey), doc);

  const unknown = new Set<string>();

  for (const [monthName, monthEvents] of Object.entries(events)) {
    for (const event of monthEvents ?? []) {
      const isMeeting = event.sport === 'meeting';
      const teamId = isMeeting ? undefined : teamIdByName.get(event.opponent);
      if (!isMeeting && teamId === undefined) {
        unknown.add(event.opponent);
        continue;
      }

      const { data, eventKey } = eventToFixtureData(monthName, event, season, teamId);

      // Exact season-scoped eventKey match, else the ±10-day dateTbd window:
      // a DB draw fixture adopts the scraped real date (kickoff update makes
      // the beforeValidate hook recompute its eventKey).
      let existing = byEventKey.get(eventKey);
      if (!existing && !event.dateTbd) {
        const kickoffMs = new Date(data.kickoff as string).getTime();
        existing = existingFixtures.find(
          (d) =>
            d.dateTbd === true &&
            d.sport === event.sport &&
            d.location === event.location &&
            normalizeOpponentFuzzy(String(d.opponentName)) === normalizeOpponentFuzzy(event.opponent) &&
            Math.abs(new Date(String(d.kickoff)).getTime() - kickoffMs) <= DATE_TBD_TOLERANCE_MS,
        );
      }

      if (!existing) {
        plan.creates.push({ eventKey, data });
        continue;
      }

      const id = existing.id as string | number;
      if (existing.locked === true) {
        plan.skips.push({ eventKey, reason: 'locked' });
      } else if (existing.source === 'manual') {
        plan.skips.push({ eventKey, reason: 'manual' });
      } else if (existing.status === 'live') {
        plan.skips.push({ eventKey, reason: 'live' });
      } else if (existing.status === 'played') {
        const patch = fillOnlyPatch(existing, data);
        if (Object.keys(patch).length > 0) {
          plan.updates.push({ id, eventKey, data: patch, reason: 'fill-detail' });
        } else {
          plan.skips.push({ eventKey, reason: 'played-unchanged' });
        }
      } else {
        // Mirror mergeExistingWithScraped: scraped values overwrite, but
        // fields the scrape lacks (admin-enriched venue on a friendly, say)
        // are preserved — the PATCH simply omits them. Change detection must
        // therefore compare against the MERGED shape, or an admin-enriched
        // fixture would be flagged "changed" on every run without converging.
        const patch = compact(data);
        if (legacyShape({ ...existing, ...patch }) === legacyShape(existing)) {
          plan.skips.push({ eventKey, reason: 'unchanged' });
        } else {
          plan.updates.push({ id, eventKey, data: patch, reason: 'changed' });
        }
      }
    }
  }

  plan.unknownOpponents = [...unknown];
  return plan;
}

// ─── REST client + executor ──────────────────────────────────────────────────

export interface SyncOptions {
  apiUrl: string; // e.g. https://admin.red-rebels.com/api
  apiKey: string; // Payload users API key (scraper service account)
  dryRun?: boolean;
  /** Abort if the plan creates more fixtures than this (default 15). */
  maxCreates?: number;
}

/**
 * Safety cap: a normal scrape creates a handful of fixtures (a cup draw, a
 * rescheduled friendly); dozens means something is wrong — the 2026-08-06
 * soak run scraped stale season URLs and planned 78 creations of last
 * season's fixtures. Season population goes through the seed script, never
 * through this sync. Raise PAYLOAD_MAX_CREATES only after reviewing the plan.
 */
export function assertPlanSafe(plan: SyncPlan, maxCreates: number): void {
  if (plan.unknownOpponents.length > 0) {
    throw new Error(
      `Payload sync aborted before any write — unknown opponents (add the team via the admin or the add-team skill): ${plan.unknownOpponents.join(' | ')}`,
    );
  }
  if (plan.creates.length > maxCreates) {
    throw new Error(
      `Payload sync aborted before any write — ${plan.creates.length} fixture creations exceed the safety cap of ${maxCreates}. ` +
        `A stale-source scrape looks exactly like this. If the plan is genuinely correct, re-run with PAYLOAD_MAX_CREATES=${plan.creates.length}. ` +
        `Would create: ${plan.creates.map((c) => c.eventKey).join(' | ')}`,
    );
  }
}

async function api<T>(opts: SyncOptions, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${opts.apiUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `users API-Key ${opts.apiKey}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Payload API ${init?.method ?? 'GET'} ${path} → ${res.status}: ${body.slice(0, 500)}`);
  }
  return res.json() as Promise<T>;
}

export interface SyncSummary {
  created: number;
  updated: number;
  filled: number;
  skipped: Record<string, number>;
}

export async function syncEventsToPayload(
  events: Record<string, SportEvent[]>,
  opts: SyncOptions,
): Promise<SyncSummary> {
  const seasons = await api<{ docs: Doc[] }>(opts, '/seasons?where[isCurrent][equals]=true&limit=1&depth=0');
  const seasonDoc = seasons.docs[0];
  if (!seasonDoc) throw new Error('Payload sync: no current season in the database');
  const season: SeasonInfo = {
    id: seasonDoc.id as string | number,
    startYear: seasonDoc.startYear as number,
    endYear: seasonDoc.endYear as number,
  };

  const [fixtures, teams] = await Promise.all([
    api<{ docs: Doc[] }>(opts, `/fixtures?where[season][equals]=${season.id}&limit=1000&depth=0`),
    api<{ docs: Doc[] }>(opts, '/teams?limit=1000&depth=0'),
  ]);

  const plan = planSync(events, fixtures.docs, teams.docs, season);
  const maxCreates = opts.maxCreates ?? Number(process.env.PAYLOAD_MAX_CREATES ?? 15);

  const skipped: Record<string, number> = {};
  for (const s of plan.skips) skipped[s.reason] = (skipped[s.reason] ?? 0) + 1;

  if (opts.dryRun) {
    console.log(`  [dry-run] creates: ${plan.creates.length}, updates: ${plan.updates.length}, skips:`, skipped);
    for (const c of plan.creates) console.log(`  [dry-run] + ${c.eventKey}`);
    for (const u of plan.updates) console.log(`  [dry-run] ~ ${u.eventKey} (${u.reason})`);
    // Surface what a real run would refuse, so the reviewer sees it in the log.
    assertPlanSafe(plan, maxCreates);
    return { created: 0, updated: 0, filled: 0, skipped };
  }

  assertPlanSafe(plan, maxCreates);

  let created = 0;
  let updated = 0;
  let filled = 0;
  for (const c of plan.creates) {
    await api(opts, '/fixtures', { method: 'POST', body: JSON.stringify(c.data) });
    console.log(`  + created ${c.eventKey}`);
    created++;
  }
  for (const u of plan.updates) {
    await api(opts, `/fixtures/${u.id}`, { method: 'PATCH', body: JSON.stringify(u.data) });
    console.log(`  ~ ${u.reason === 'fill-detail' ? 'filled detail on' : 'updated'} ${u.eventKey}`);
    if (u.reason === 'fill-detail') filled++;
    else updated++;
  }

  return { created, updated, filled, skipped };
}
