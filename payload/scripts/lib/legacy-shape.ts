// DB → frozen-JSON-contract reshape. Used by seed idempotency checks, the
// parity checker (DATA-06), and — ported or imported — by the serving Worker
// (DATA-07). Changing output shape here means changing the shipped contract.

import { cyprusWallClock } from '../../src/lib/eventKey'
import type { LegacyEvent, LegacyPlayer, MonthName } from './types'

type AnyDoc = Record<string, any>

/** Strip Payload's array-row `id`s and drop null/undefined values. */
function cleanRows(rows: AnyDoc[] | null | undefined): Record<string, unknown>[] | undefined {
  if (!rows || rows.length === 0) return undefined
  return rows.map((row) => {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(row)) {
      if (key === 'id' || value === null || value === undefined) continue
      out[key] = value
    }
    return out
  })
}

function defined<T extends Record<string, unknown>>(obj: T): T {
  for (const key of Object.keys(obj)) {
    if (obj[key] === undefined || obj[key] === null) delete obj[key]
  }
  return obj
}

/** Reshape a fixtures doc to the legacy SportEvent + its month bucket. */
export function fixtureToLegacy(doc: AnyDoc): { monthName: MonthName; event: LegacyEvent } {
  const { monthName, day, time } = cyprusWallClock(doc.kickoff)
  const isMeeting = doc.sport === 'meeting'

  const event: LegacyEvent = defined({
    day,
    sport: doc.sport,
    location: doc.location,
    opponent: doc.opponentName,
    time: doc.timeTbd ? '' : time,
    venue: doc.venue ?? undefined,
    logo: doc.logoUrl ?? undefined,
    // `live` is an internal state — the frozen contract only knows upcoming/played.
    status: isMeeting ? undefined : doc.status === 'live' ? 'upcoming' : doc.status,
    score: doc.score ?? undefined,
    competition: doc.competition ?? undefined,
    penalties: doc.penalties ?? undefined,
    reportEN: doc.reportEN ?? undefined,
    reportEL: doc.reportEL ?? undefined,
    scorers: cleanRows(doc.scorers),
    bookings: cleanRows(doc.bookings),
    duration: doc.duration ?? undefined,
    matchday: doc.matchday ?? undefined,
    dateTbd: doc.dateTbd ? true : undefined,
    lineup:
      doc.lineup && ((doc.lineup.home?.length ?? 0) > 0 || (doc.lineup.away?.length ?? 0) > 0)
        ? {
            home: cleanRows(doc.lineup.home) ?? [],
            away: cleanRows(doc.lineup.away) ?? [],
          }
        : undefined,
    subs: cleanRows(doc.subs),
    sets: cleanRows(doc.sets),
    vbScorers: cleanRows(doc.vbScorers),
  }) as LegacyEvent

  return { monthName: monthName as MonthName, event }
}

/** Reshape a players doc + its (current-season) membership to the legacy Player. */
export function playerToLegacy(doc: AnyDoc, membership: AnyDoc | undefined): LegacyPlayer {
  return defined({
    key: doc.slug,
    sport: doc.sport,
    active: membership?.active ?? false,
    nameEl: doc.nameEl,
    nameEn: doc.nameEn,
    position: doc.position,
    subPosition: doc.subPosition ?? undefined,
    shirtNumber: membership?.shirtNumber ?? undefined,
    dateOfBirth: doc.dateOfBirth ? String(doc.dateOfBirth).slice(0, 10) : undefined,
    nationality: doc.nationality ?? undefined,
    joinedDate: membership?.joinedDate ? String(membership.joinedDate).slice(0, 10) : undefined,
    leftDate: membership?.leftDate ? String(membership.leftDate).slice(0, 10) : undefined,
    photoUrl: doc.photoUrl ?? undefined,
    aliases:
      doc.aliases && doc.aliases.length > 0
        ? doc.aliases.map((a: AnyDoc) => a.name)
        : undefined,
  }) as LegacyPlayer
}
