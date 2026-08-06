/**
 * D1-backed builders for the /events.json and /players.json feeds (DATA-07).
 *
 * Queries the raw Payload-managed D1 tables (Payload itself stays off the
 * read path) and reshapes rows through the shared legacy-shape module — the
 * same code the seed/parity scripts use, so the serving output is guaranteed
 * to match the frozen JSON contract. The payload/ files imported here are
 * dependency-free TS: wrangler bundles them into the Worker, tsc type-checks
 * them via this import.
 */

import { fixtureToLegacy, playerToLegacy } from '../../../payload/scripts/lib/legacy-shape'
import type { EventsData, LegacyEvent, MonthName } from '../../../payload/scripts/lib/types'

// Minimal structural typing for the binding — same approach as the hand-rolled
// SecretsStoreBinding in _worker.ts.
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  all(): Promise<{ results: Record<string, unknown>[] }>
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement
  batch(statements: D1PreparedStatement[]): Promise<{ results: Record<string, unknown>[] }[]>
}

export interface EventsFeed {
  season: string
  generatedAt: string
  events: EventsData
}

export interface PlayersFeed {
  generatedAt: string
  players: unknown[]
}

// The static feed lists month buckets in season order starting at July
// (pre-season friendlies belong to the start year).
const SEASON_MONTH_ORDER: MonthName[] = [
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
]

type Row = Record<string, unknown>

/** Group child-table rows (fetched ORDER BY _parent_id, _order) by parent id. */
function groupByParent(rows: Row[], pick: (row: Row) => Row): Map<unknown, Row[]> {
  const byParent = new Map<unknown, Row[]>()
  for (const row of rows) {
    const parent = row._parent_id
    if (!byParent.has(parent)) byParent.set(parent, [])
    byParent.get(parent)!.push(pick(row))
  }
  return byParent
}

async function currentSeason(d1: D1Database): Promise<Row> {
  const { results } = await d1
    .prepare('SELECT id, start_year, end_year FROM seasons WHERE is_current = 1 LIMIT 1')
    .all()
  if (results.length === 0) throw new Error('no current season in D1')
  return results[0]
}

function childQuery(d1: D1Database, table: string, seasonId: unknown): D1PreparedStatement {
  return d1
    .prepare(
      `SELECT c.* FROM ${table} c JOIN fixtures f ON c._parent_id = f.id
       WHERE f.season_id = ?1 ORDER BY c._parent_id, c._order`,
    )
    .bind(seasonId)
}

export async function buildEventsFeed(d1: D1Database): Promise<EventsFeed> {
  const season = await currentSeason(d1)

  const [fixtures, scorers, bookings, lineupHome, lineupAway, subs, sets, vbScorers] =
    await d1.batch([
      // id order = seed/scraper insertion order = the source file's order
      // within each month bucket (parity CI guards this holds across writers).
      d1.prepare('SELECT * FROM fixtures WHERE season_id = ?1 ORDER BY id').bind(season.id),
      childQuery(d1, 'fixtures_scorers', season.id),
      childQuery(d1, 'fixtures_bookings', season.id),
      childQuery(d1, 'fixtures_lineup_home', season.id),
      childQuery(d1, 'fixtures_lineup_away', season.id),
      childQuery(d1, 'fixtures_subs', season.id),
      childQuery(d1, 'fixtures_sets', season.id),
      childQuery(d1, 'fixtures_vb_scorers', season.id),
    ])

  const scorersByFixture = groupByParent(scorers.results, (r) => ({
    name: r.name,
    minute: r.minute,
    team: r.team,
    type: r.type,
  }))
  const bookingsByFixture = groupByParent(bookings.results, (r) => ({
    name: r.name,
    minute: r.minute,
    team: r.team,
    card: r.card,
  }))
  const lineupRow = (r: Row) => ({ name: r.name, number: r.number, position: r.position })
  const lineupHomeByFixture = groupByParent(lineupHome.results, lineupRow)
  const lineupAwayByFixture = groupByParent(lineupAway.results, lineupRow)
  const subsByFixture = groupByParent(subs.results, (r) => ({
    playerOn: r.player_on,
    playerOff: r.player_off,
    minute: r.minute,
    team: r.team,
  }))
  const setsByFixture = groupByParent(sets.results, (r) => ({ home: r.home, away: r.away }))
  const vbScorersByFixture = groupByParent(vbScorers.results, (r) => ({
    name: r.name,
    points: r.points,
    team: r.team,
  }))

  const buckets = new Map<MonthName, LegacyEvent[]>()
  for (const row of fixtures.results) {
    const doc = {
      sport: row.sport,
      kickoff: row.kickoff,
      dateTbd: !!row.date_tbd,
      timeTbd: !!row.time_tbd,
      location: row.location,
      opponentName: row.opponent_name,
      venue: row.venue,
      logoUrl: row.logo_url,
      status: row.status,
      score: row.score,
      penalties: row.penalties,
      competition: row.competition,
      matchday: row.matchday,
      duration: row.duration,
      reportEN: row.report_e_n,
      reportEL: row.report_e_l,
      scorers: scorersByFixture.get(row.id),
      bookings: bookingsByFixture.get(row.id),
      lineup: {
        home: lineupHomeByFixture.get(row.id) ?? [],
        away: lineupAwayByFixture.get(row.id) ?? [],
      },
      subs: subsByFixture.get(row.id),
      sets: setsByFixture.get(row.id),
      vbScorers: vbScorersByFixture.get(row.id),
    }
    const { monthName, event } = fixtureToLegacy(doc)
    if (!buckets.has(monthName)) buckets.set(monthName, [])
    buckets.get(monthName)!.push(event)
  }

  // The contract carries all 12 buckets — months without fixtures are [].
  const events: EventsData = {}
  for (const month of SEASON_MONTH_ORDER) {
    events[month] = buckets.get(month) ?? []
  }

  return {
    season: `${season.start_year}/${season.end_year}`,
    generatedAt: new Date().toISOString(),
    events,
  }
}

export async function buildPlayersFeed(d1: D1Database): Promise<PlayersFeed> {
  const season = await currentSeason(d1)

  const [players, aliases, memberships] = await d1.batch([
    // id order = seed insertion order = players.ts source order.
    d1.prepare('SELECT * FROM players ORDER BY id'),
    d1.prepare(
      'SELECT * FROM players_aliases ORDER BY _parent_id, _order',
    ),
    d1
      .prepare('SELECT * FROM squad_memberships WHERE season_id = ?1')
      .bind(season.id),
  ])

  const aliasesByPlayer = groupByParent(aliases.results, (r) => ({ name: r.name }))
  const membershipByPlayer = new Map<unknown, Row>()
  for (const row of memberships.results) {
    membershipByPlayer.set(row.player_id, {
      active: !!row.active,
      shirtNumber: row.shirt_number,
      joinedDate: row.joined_date,
      leftDate: row.left_date,
    })
  }

  const legacyPlayers = players.results.map((row) =>
    playerToLegacy(
      {
        slug: row.slug,
        sport: row.sport,
        nameEl: row.name_el,
        nameEn: row.name_en,
        position: row.position,
        subPosition: row.sub_position,
        dateOfBirth: row.date_of_birth,
        nationality: row.nationality,
        photoUrl: row.photo_url,
        aliases: aliasesByPlayer.get(row.id),
      },
      membershipByPlayer.get(row.id),
    ),
  )

  return { generatedAt: new Date().toISOString(), players: legacyPlayers }
}
