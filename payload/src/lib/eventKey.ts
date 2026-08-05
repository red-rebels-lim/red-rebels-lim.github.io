// eventKey format is FROZEN: `${monthName}-${day}-${sport}-${opponentName}`.
// It must match .github/scripts/send-reminders.js exactly — ReminderLog dedup
// rows and FCM notification deep-links key on it. Month/day are Cyprus
// wall-clock (the legacy events.ts month buckets were Cyprus-local).

const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const

export const CYPRUS_TZ = 'Asia/Nicosia'

export function cyprusWallClock(kickoff: Date | string): {
  monthName: (typeof MONTH_NAMES)[number]
  day: number
  time: string
} {
  const date = typeof kickoff === 'string' ? new Date(kickoff) : kickoff
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: CYPRUS_TZ,
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return {
    monthName: MONTH_NAMES[Number(get('month')) - 1],
    day: Number(get('day')),
    // Intl may render midnight as "24" with h23 quirks on some runtimes; normalise.
    time: `${get('hour').replace(/^24$/, '00')}:${get('minute')}`,
  }
}

export function computeEventKey(kickoff: Date | string, sport: string, opponentName: string): string {
  const { monthName, day } = cyprusWallClock(kickoff)
  return `${monthName}-${day}-${sport}-${opponentName}`
}
