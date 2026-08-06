// Worker feed parity (DATA-07): proves the rrcalendar Worker's D1 feed
// builders (app/src/worker/feeds.ts) reproduce the frozen JSON contract from
// the seeded database — the serving-side counterpart of parity.ts. Run after
// seed.ts; wired into the CI payload job.
//
//   npx payload run scripts/worker-parity.ts        # local D1 vs app/src sources
//
// Uses getPlatformProxy directly (same local .wrangler state the seed wrote)
// to get the raw D1 binding the Worker will see in production.

import path from 'path'
import { getPlatformProxy } from 'wrangler'

import { buildEventsFeed, buildPlayersFeed, type D1Database } from '../../app/src/worker/feeds'
import { sortedStringify } from './lib/compare'
import { loadEventsData, loadPlayers, loadSeasonYears } from './lib/extract'
import type { EventsData, LegacyEvent, MonthName } from './lib/types'

const APP_SRC = path.resolve(import.meta.dirname, '../../app/src')
const EVENTS_PATH = process.env.SEED_EVENTS ?? path.join(APP_SRC, 'data/events.ts')
const PLAYERS_PATH = process.env.SEED_PLAYERS ?? path.join(APP_SRC, 'data/players.ts')
const CONSTANTS_PATH = process.env.SEED_CONSTANTS ?? path.join(APP_SRC, 'data/constants.ts')

const proxy = await getPlatformProxy<{ D1: D1Database }>({
  configPath: path.resolve(import.meta.dirname, '../wrangler.jsonc'),
  // The binding is remote:true for deploys, but parity must read the locally
  // seeded simulator (CI has no Cloudflare auth) — same as payload.config.ts
  // outside production.
  remoteBindings: false,
})

const problems: string[] = []

function compare(label: string, expected: unknown, actual: unknown) {
  const e = sortedStringify(expected)
  const a = sortedStringify(actual)
  if (e !== a) problems.push(`${label}\n  expected: ${e}\n  actual:   ${a}`)
}

// ---------- expected, from TS sources ----------
const { startYear, endYear } = loadSeasonYears(CONSTANTS_PATH)
const rawEvents = loadEventsData(EVENTS_PATH)
// Same normalization as parity.ts: the DB requires a status, so a source
// event that never got one round-trips as 'upcoming'.
const expectedEvents: EventsData = {}
for (const [monthName, events] of Object.entries(rawEvents) as [MonthName, LegacyEvent[]][]) {
  expectedEvents[monthName] = (events ?? []).map((event) =>
    event.sport !== 'meeting' && event.status === undefined
      ? { ...event, status: 'upcoming' as const }
      : event,
  )
}

// ---------- actual, through the Worker's builders ----------
const eventsFeed = await buildEventsFeed(proxy.env.D1)
const playersFeed = await buildPlayersFeed(proxy.env.D1)
await proxy.dispose()

compare('events.json season', `${startYear}/${endYear}`, eventsFeed.season)
compare(
  'events.json month bucket order',
  Object.keys(expectedEvents),
  Object.keys(eventsFeed.events),
)
for (const month of Object.keys(expectedEvents) as MonthName[]) {
  compare(`events.json ${month}`, expectedEvents[month], eventsFeed.events[month])
}

const expectedPlayers = loadPlayers(PLAYERS_PATH)
compare('players.json players', expectedPlayers, playersFeed.players)

// ---------- verdict ----------
if (problems.length > 0) {
  console.error(`WORKER PARITY FAILED — ${problems.length} problem(s):`)
  for (const p of problems) console.error('\n' + p)
  process.exit(1)
}
console.log(
  `WORKER PARITY OK — ${Object.keys(expectedEvents).length} month buckets, ` +
    `${expectedPlayers.length} players match the frozen contract through the Worker builders`,
)
process.exit(0)
