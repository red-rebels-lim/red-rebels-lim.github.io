import { CYPRUS_TZ } from '../../src/lib/eventKey'

// Offset (ms) of Cyprus local time from UTC at a given instant.
function tzOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CYPRUS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(at)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second'),
  )
  return asUtc - at.getTime()
}

/** Convert a Cyprus wall-clock datetime to the UTC instant. */
export function cyprusToUtc(
  year: number,
  monthIndex: number,
  day: number,
  hours: number,
  minutes: number,
): Date {
  const naive = Date.UTC(year, monthIndex, day, hours, minutes)
  // Two passes so DST-boundary conversions land on the correct offset.
  let guess = new Date(naive - tzOffsetMs(new Date(naive)))
  guess = new Date(naive - tzOffsetMs(guess))
  return guess
}
