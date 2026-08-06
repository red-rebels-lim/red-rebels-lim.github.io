// Legacy shapes from the web app's TS sources (app/src/types/*). Kept minimal —
// these describe the frozen JSON contract, not the DB.

export type MonthName =
  | 'september'
  | 'october'
  | 'november'
  | 'december'
  | 'january'
  | 'february'
  | 'march'
  | 'april'
  | 'may'
  | 'june'
  | 'july'
  | 'august'

export interface LegacyEvent {
  day: number
  sport?: string
  location: 'home' | 'away'
  opponent: string
  time: string
  venue?: string
  logo?: string
  status?: 'played' | 'upcoming'
  score?: string
  competition?: string
  penalties?: string
  reportEN?: string
  reportEL?: string
  scorers?: Record<string, unknown>[]
  bookings?: Record<string, unknown>[]
  duration?: string
  matchday?: number
  dateTbd?: boolean
  lineup?: { home: Record<string, unknown>[]; away: Record<string, unknown>[] }
  subs?: Record<string, unknown>[]
  sets?: Record<string, unknown>[]
  vbScorers?: Record<string, unknown>[]
}

export type EventsData = Partial<Record<MonthName, LegacyEvent[]>>

export interface LegacyPlayer {
  key: string
  sport: string
  active: boolean
  nameEl: string
  nameEn: string
  position: string
  subPosition?: string
  shirtNumber?: number
  dateOfBirth?: string
  nationality?: string
  joinedDate?: string
  leftDate?: string
  photoUrl?: string
  aliases?: string[]
}

// July/August belong to the START year (pre-season) — this mirrors
// app/src/data/month-config.ts exactly (CLAUDE.md's "Sept–Dec/Jan–Aug"
// summary is simplified and wrong for July/August).
export const MONTH_TO_INDEX_AND_YEAR: Record<MonthName, { monthIndex: number; yearOf: 'start' | 'end' }> = {
  september: { monthIndex: 8, yearOf: 'start' },
  october: { monthIndex: 9, yearOf: 'start' },
  november: { monthIndex: 10, yearOf: 'start' },
  december: { monthIndex: 11, yearOf: 'start' },
  january: { monthIndex: 0, yearOf: 'end' },
  february: { monthIndex: 1, yearOf: 'end' },
  march: { monthIndex: 2, yearOf: 'end' },
  april: { monthIndex: 3, yearOf: 'end' },
  may: { monthIndex: 4, yearOf: 'end' },
  june: { monthIndex: 5, yearOf: 'end' },
  july: { monthIndex: 6, yearOf: 'start' },
  august: { monthIndex: 7, yearOf: 'start' },
}
