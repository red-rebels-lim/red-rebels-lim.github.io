// Parity checker (DATA-06): proves the database reproduces the frozen JSON
// contract byte-for-byte (semantically — key order aside) against the legacy
// TS sources. Run after seeding; wired into CI to guard every cutover step.
//
//   npx payload run scripts/parity.ts             # local D1 vs app/src sources
//   SEED_EVENTS=... SEED_CONSTANTS=...            # same env overrides as seed.ts

import path from 'path'
import { getPayload } from 'payload'
import config from '@payload-config'

import { loadEventsData, loadPlayers, loadSeasonYears } from './lib/extract'
import { fixtureToLegacy, playerToLegacy } from './lib/legacy-shape'
import type { LegacyEvent, MonthName } from './lib/types'

const APP_SRC = path.resolve(import.meta.dirname, '../../app/src')
const EVENTS_PATH = process.env.SEED_EVENTS ?? path.join(APP_SRC, 'data/events.ts')
const PLAYERS_PATH = process.env.SEED_PLAYERS ?? path.join(APP_SRC, 'data/players.ts')
const CONSTANTS_PATH = process.env.SEED_CONSTANTS ?? path.join(APP_SRC, 'data/constants.ts')
const SKIP_PLAYERS = process.env.SEED_SKIP_PLAYERS === '1'

const payload = await getPayload({ config })
const problems: string[] = []

function sortedStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  )
}

function diffObjects(label: string, expected: unknown, actual: unknown) {
  const e = sortedStringify(expected)
  const a = sortedStringify(actual)
  if (e !== a) {
    problems.push(`${label}\n  expected: ${e}\n  actual:   ${a}`)
  }
}

// ---------- expected, from TS sources ----------
const eventsData = loadEventsData(EVENTS_PATH)
const { startYear, endYear } = loadSeasonYears(CONSTANTS_PATH)
const seasonCode = `${startYear}-${String(endYear).slice(-2)}`

const expectedEvents = new Map<string, LegacyEvent>()
for (const [monthName, events] of Object.entries(eventsData) as [MonthName, LegacyEvent[]][]) {
  for (const event of events ?? []) {
    expectedEvents.set(`${monthName}-${event.day}-${event.sport ?? ''}-${event.opponent}`, event)
  }
}

// ---------- actual, from DB ----------
const season = await payload.find({
  collection: 'seasons',
  where: { code: { equals: seasonCode } },
  limit: 1,
})
if (season.docs.length === 0) {
  payload.logger.error(`Season ${seasonCode} not found in DB — seed first`)
  process.exit(1)
}
const seasonId = season.docs[0].id

const fixtures = await payload.find({
  collection: 'fixtures',
  where: { season: { equals: seasonId } },
  limit: 1000,
  depth: 0,
})

const actualEvents = new Map<string, LegacyEvent>()
for (const doc of fixtures.docs) {
  const { monthName, event } = fixtureToLegacy(doc)
  actualEvents.set(`${monthName}-${event.day}-${event.sport ?? ''}-${event.opponent}`, event)
}

// ---------- compare events ----------
for (const [key, expected] of expectedEvents) {
  if (!actualEvents.has(key)) {
    problems.push(`missing in DB: ${key}`)
    continue
  }
  // Known normalization: the DB requires a status, so a source event that never
  // got one (rare historical data bug) round-trips as 'upcoming'.
  const normalized =
    expected.sport !== 'meeting' && expected.status === undefined
      ? { ...expected, status: 'upcoming' as const }
      : expected
  diffObjects(`event ${key}`, normalized, actualEvents.get(key))
}
for (const key of actualEvents.keys()) {
  if (!expectedEvents.has(key)) problems.push(`extra in DB: ${key}`)
}

// ---------- compare players ----------
if (!SKIP_PLAYERS) {
  const expectedPlayers = new Map(loadPlayers(PLAYERS_PATH).map((p) => [p.key, p]))
  const playerDocs = await payload.find({ collection: 'players', limit: 1000, depth: 0 })
  const memberships = await payload.find({
    collection: 'squad-memberships',
    where: { season: { equals: seasonId } },
    limit: 1000,
    depth: 0,
  })
  const membershipByPlayer = new Map(memberships.docs.map((m: any) => [m.player, m]))

  const actualPlayers = new Map(
    playerDocs.docs.map((doc: any) => [
      doc.slug,
      playerToLegacy(doc, membershipByPlayer.get(doc.id)),
    ]),
  )
  for (const [key, expected] of expectedPlayers) {
    if (!actualPlayers.has(key)) {
      problems.push(`player missing in DB: ${key}`)
      continue
    }
    diffObjects(`player ${key}`, expected, actualPlayers.get(key))
  }
  for (const key of actualPlayers.keys()) {
    if (!expectedPlayers.has(key)) problems.push(`player extra in DB: ${key}`)
  }
}

// ---------- verdict ----------
if (problems.length > 0) {
  payload.logger.error(`PARITY FAILED — ${problems.length} problem(s):`)
  for (const p of problems) console.error('\n' + p)
  process.exit(1)
}
payload.logger.info(
  `PARITY OK — ${expectedEvents.size} events${SKIP_PLAYERS ? '' : `, players checked`} match the legacy contract`,
)
process.exit(0)
