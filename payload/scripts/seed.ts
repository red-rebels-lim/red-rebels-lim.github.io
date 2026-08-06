// Seed the database from the legacy TS sources (DATA-04/DATA-05).
//
//   npx payload run scripts/seed.ts                          # local D1, current season
//   NODE_ENV=production npx payload run scripts/seed.ts      # remote D1
//
// Historical backfill (DATA-05): point at files extracted from git history:
//   SEED_EVENTS=/path/events.ts SEED_CONSTANTS=/path/constants.ts \
//   SEED_SKIP_PLAYERS=1 SEED_NOT_CURRENT=1 npx payload run scripts/seed.ts
//
// Idempotent: rows are matched by unique keys (season.code / team.slug /
// player.slug / fixture.eventKey) and only written when their legacy shape
// differs. Unknown opponents abort before any write.

import path from 'path'
import { getPayload } from 'payload'
import config from '@payload-config'

import { computeEventKey } from '../src/lib/eventKey'
import { cyprusToUtc } from './lib/cyprus'
import {
  loadEventsData,
  loadGreekToTeamKey,
  loadPlayers,
  loadSeasonYears,
  loadTeamNamesEn,
} from './lib/extract'
import { fixtureToLegacy, playerToLegacy } from './lib/legacy-shape'
import { MONTH_TO_INDEX_AND_YEAR, type LegacyEvent, type MonthName } from './lib/types'

const APP_SRC = path.resolve(import.meta.dirname, '../../app/src')
const EVENTS_PATH = process.env.SEED_EVENTS ?? path.join(APP_SRC, 'data/events.ts')
const PLAYERS_PATH = process.env.SEED_PLAYERS ?? path.join(APP_SRC, 'data/players.ts')
const CONSTANTS_PATH = process.env.SEED_CONSTANTS ?? path.join(APP_SRC, 'data/constants.ts')
const TRANSLATE_PATH = process.env.SEED_TRANSLATE ?? path.join(APP_SRC, 'lib/translate.ts')
const I18N_EN_PATH = process.env.SEED_I18N_EN ?? path.join(APP_SRC, 'i18n/en.json')
const SKIP_PLAYERS = process.env.SEED_SKIP_PLAYERS === '1'
const NOT_CURRENT = process.env.SEED_NOT_CURRENT === '1'

const stats = { created: 0, updated: 0, unchanged: 0 }
const payload = await getPayload({ config })

function track(action: 'created' | 'updated' | 'unchanged', what: string) {
  stats[action]++
  if (action !== 'unchanged') payload.logger.info(`${action}: ${what}`)
}

async function upsert(
  collection: 'seasons' | 'teams' | 'players' | 'squad-memberships' | 'fixtures',
  where: Record<string, unknown>,
  data: Record<string, unknown>,
  isSame: (existing: Record<string, any>) => boolean,
  label: string,
): Promise<string | number> {
  const found = await payload.find({ collection, where: where as any, limit: 1 })
  if (found.docs.length === 0) {
    const doc = await payload.create({ collection, data: data as any })
    track('created', `${collection}/${label}`)
    return doc.id
  }
  const existing = found.docs[0] as Record<string, any>
  if (isSame(existing)) {
    track('unchanged', `${collection}/${label}`)
  } else {
    await payload.update({ collection, id: existing.id, data: data as any })
    track('updated', `${collection}/${label}`)
  }
  return existing.id
}

// ---------- load sources ----------
const eventsData = loadEventsData(EVENTS_PATH)
const { startYear, endYear } = loadSeasonYears(CONSTANTS_PATH)
const greekToTeamKey = loadGreekToTeamKey(TRANSLATE_PATH)
const teamNamesEn = loadTeamNamesEn(I18N_EN_PATH)
const seasonCode = `${startYear}-${String(endYear).slice(-2)}`

payload.logger.info(`Seeding season ${seasonCode} from ${EVENTS_PATH}`)

// ---------- validate opponents resolve before writing anything ----------
const allEvents: { monthName: MonthName; event: LegacyEvent }[] = []
for (const [monthName, events] of Object.entries(eventsData) as [MonthName, LegacyEvent[]][]) {
  for (const event of events ?? []) allEvents.push({ monthName, event })
}
const unknownOpponents = new Set<string>()
for (const { event } of allEvents) {
  if (event.sport !== 'meeting' && !greekToTeamKey[event.opponent]) {
    unknownOpponents.add(event.opponent)
  }
}
if (unknownOpponents.size > 0) {
  payload.logger.error(
    `Unknown opponents (add to GREEK_TO_TEAM_KEY / teams seed): ${[...unknownOpponents].join(' | ')}`,
  )
  process.exit(1)
}

// eventKey collision check (two fixtures collapsing onto one key = data bug)
const seenKeys = new Map<string, string>()
for (const { monthName, event } of allEvents) {
  const key = `${monthName}-${event.day}-${event.sport ?? ''}-${event.opponent}`
  if (seenKeys.has(key)) {
    payload.logger.error(`eventKey collision: ${key}`)
    process.exit(1)
  }
  seenKeys.set(key, monthName)
}

// ---------- season ----------
const seasonId = await upsert(
  'seasons',
  { code: { equals: seasonCode } },
  { code: seasonCode, startYear, endYear, isCurrent: !NOT_CURRENT },
  (ex) => ex.startYear === startYear && ex.endYear === endYear && ex.isCurrent === !NOT_CURRENT,
  seasonCode,
)

// ---------- teams (registry from translate.ts + i18n + logos seen in events) ----------
const logoByOpponent = new Map<string, string>()
for (const { event } of allEvents) {
  if (event.logo && !logoByOpponent.has(event.opponent)) {
    logoByOpponent.set(event.opponent, event.logo)
  }
}
const sportsByTeamKey = new Map<string, Set<string>>()
for (const { event } of allEvents) {
  if (event.sport === 'meeting' || !event.sport) continue
  const slug = greekToTeamKey[event.opponent]
  if (!sportsByTeamKey.has(slug)) sportsByTeamKey.set(slug, new Set())
  sportsByTeamKey.get(slug)!.add(event.sport)
}

// Multiple Greek spellings can map to one slug — the spelling used in events.ts
// is canonical (nameEl), the rest become aliases.
const opponentsInEvents = new Set(allEvents.map(({ event }) => event.opponent))
const spellingsBySlug = new Map<string, string[]>()
for (const [nameEl, slug] of Object.entries(greekToTeamKey)) {
  if (!spellingsBySlug.has(slug)) spellingsBySlug.set(slug, [])
  spellingsBySlug.get(slug)!.push(nameEl)
}

// Fields are MERGED with any existing row (union of sports/aliases, keep an
// existing logo) so seeding different seasons never ping-pongs team data.
const teamIdBySlug = new Map<string, string | number>()
for (const [slug, spellings] of spellingsBySlug) {
  const found = await payload.find({
    collection: 'teams',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const existing = found.docs[0] as Record<string, any> | undefined
  // Canonical Greek name is sticky once a row exists — per-season spellings
  // live on fixtures.opponentName, so parity never depends on this choice.
  const nameEl = existing?.nameEl ?? spellings.find((s) => opponentsInEvents.has(s)) ?? spellings[0]

  const aliases = [
    ...new Set([
      ...spellings.filter((s) => s !== nameEl),
      ...((existing?.aliases ?? []) as { name: string }[])
        .map((a) => a.name)
        .filter((n) => n !== nameEl),
    ]),
  ].sort()
  const sports = [
    ...new Set([...(sportsByTeamKey.get(slug) ?? []), ...(existing?.sports ?? [])]),
  ].sort()
  const data = {
    slug,
    nameEl,
    nameEn: teamNamesEn[slug] ?? existing?.nameEn ?? slug,
    sports,
    // Existing logo wins — different seasons scraped different crest paths and
    // the registry logo is cosmetic; per-fixture logoUrl carries the contract.
    logoUrl: existing?.logoUrl ?? logoByOpponent.get(nameEl) ?? undefined,
    aliases: aliases.map((name) => ({ name })),
  }
  if (!existing) {
    const doc = await payload.create({ collection: 'teams', data: data as any })
    track('created', `teams/${slug}`)
    teamIdBySlug.set(slug, doc.id)
    continue
  }
  const same =
    existing.nameEl === data.nameEl &&
    existing.nameEn === data.nameEn &&
    (existing.logoUrl ?? undefined) === data.logoUrl &&
    JSON.stringify([...(existing.sports ?? [])].sort()) === JSON.stringify(sports) &&
    JSON.stringify(((existing.aliases ?? []) as { name: string }[]).map((a) => a.name).sort()) ===
      JSON.stringify(aliases)
  if (same) {
    track('unchanged', `teams/${slug}`)
  } else {
    await payload.update({ collection: 'teams', id: existing.id, data: data as any })
    track('updated', `teams/${slug}`)
  }
  teamIdBySlug.set(slug, existing.id)
}

// ---------- players + memberships ----------
if (!SKIP_PLAYERS) {
  const players = loadPlayers(PLAYERS_PATH)
  for (const p of players) {
    const playerData = {
      slug: p.key,
      sport: p.sport,
      nameEl: p.nameEl,
      nameEn: p.nameEn,
      position: p.position,
      subPosition: p.subPosition ?? undefined,
      dateOfBirth: p.dateOfBirth || undefined,
      nationality: p.nationality || undefined,
      photoUrl: p.photoUrl ?? undefined,
      aliases: (p.aliases ?? []).map((name) => ({ name })),
    }
    const membershipData = {
      season: seasonId,
      sport: p.sport,
      shirtNumber: p.shirtNumber ?? undefined,
      active: p.active,
      joinedDate: p.joinedDate || undefined,
      leftDate: p.leftDate || undefined,
    }
    const playerId = await upsert(
      'players',
      { slug: { equals: p.key } },
      playerData,
      (ex) => {
        const mem = { ...membershipData, player: ex.id }
        void mem
        return (
          JSON.stringify(playerToLegacy(ex, undefined)) ===
          JSON.stringify(playerToLegacy({ ...playerData, aliases: playerData.aliases }, undefined))
        )
      },
      p.key,
    )
    await upsert(
      'squad-memberships',
      { and: [{ player: { equals: playerId } }, { season: { equals: seasonId } }] },
      { ...membershipData, player: playerId },
      (ex) =>
        JSON.stringify(playerToLegacy({ slug: p.key }, ex)) ===
        JSON.stringify(playerToLegacy({ slug: p.key }, membershipData)),
      `${p.key}@${seasonCode}`,
    )
  }
}

// ---------- fixtures ----------
for (const { monthName, event } of allEvents) {
  const { monthIndex, yearOf } = MONTH_TO_INDEX_AND_YEAR[monthName]
  const year = yearOf === 'start' ? startYear : endYear
  const timeTbd = !event.time || !/^\d{2}:\d{2}$/.test(event.time)
  const [hh, mm] = timeTbd ? [0, 0] : event.time.split(':').map(Number)
  const kickoff = cyprusToUtc(year, monthIndex, event.day, hh, mm)
  const isMeeting = event.sport === 'meeting'
  const slug = isMeeting ? undefined : greekToTeamKey[event.opponent]

  const data = {
    season: seasonId,
    sport: event.sport,
    kickoff: kickoff.toISOString(),
    dateTbd: event.dateTbd === true,
    timeTbd,
    location: event.location,
    opponent: slug ? teamIdBySlug.get(slug) : undefined,
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
    sets: event.sets ?? undefined,
    vbScorers: event.vbScorers ?? undefined,
    source: 'scraper' as const,
  }
  const eventKey = computeEventKey(kickoff, event.sport ?? '', event.opponent)
  const incomingLegacy = JSON.stringify(
    fixtureToLegacy({ ...data, kickoff: kickoff.toISOString() }).event,
  )
  await upsert(
    'fixtures',
    { and: [{ eventKey: { equals: eventKey } }, { season: { equals: seasonId } }] },
    data,
    (ex) => JSON.stringify(fixtureToLegacy(ex).event) === incomingLegacy,
    eventKey,
  )
}

payload.logger.info(
  `Seed done — created: ${stats.created}, updated: ${stats.updated}, unchanged: ${stats.unchanged}`,
)
process.exit(0)
