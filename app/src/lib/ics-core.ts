/**
 * Pure .ics calendar generation — no browser APIs, no React.
 * Used by both the browser export (ics-export.ts) and the build-time generator.
 */

import type { SportEvent, MonthName } from '@/types/events';
import { MONTH_ORDER, monthMap } from '@/data/month-config';
import { SEASON_START_YEAR, SEASON_END_YEAR } from '@/data/constants';
import { sportConfig } from '@/data/sport-config';

// Translation lookup tables — imported statically to avoid React i18n dependency
import enJson from '@/i18n/en.json';
import elJson from '@/i18n/el.json';

type Lang = 'en' | 'el';

const translations: Record<Lang, typeof enJson> = { en: enJson, el: elJson };

function tLookup(lang: Lang, key: string, fallback?: string): string {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let obj: any = translations[lang];
  for (const part of parts) {
    obj = obj?.[part];
    if (obj === undefined) return fallback ?? key;
  }
  return typeof obj === 'string' ? obj : (fallback ?? key);
}

// Greek-to-key mapping for team names (reuse the same map from translate.ts)
import { translateTeamName, translateVenue } from '@/lib/translate';
import type { TFunction } from 'i18next';

function makeTFunction(lang: Lang): TFunction {
  return ((key: string, fallbackOrOpts?: string | Record<string, string>) => {
    const fallback = typeof fallbackOrOpts === 'string' ? fallbackOrOpts : undefined;
    return tLookup(lang, key, fallback);
  }) as TFunction;
}

export interface IcsOptions {
  lang: Lang;
  includeAlarms?: boolean;
  alarmMinutesBefore?: number;
  refreshIntervalHours?: number;
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

const pad = (n: number) => n.toString().padStart(2, '0');
const formatDate = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

/**
 * Generate an .ics calendar string from events data.
 * Pure function — no browser APIs, no side effects.
 */
export function generateIcsString(
  eventsData: Partial<Record<MonthName, SportEvent[]>>,
  options: IcsOptions
): string {
  const { lang, includeAlarms = false, alarmMinutesBefore = 120, refreshIntervalHours } = options;
  const t = makeTFunction(lang);

  const sportI18nKeys: Record<string, string> = {
    'football-men': 'ics.sportFootballMen',
    'volleyball-men': 'ics.sportVolleyballMen',
    'volleyball-women': 'ics.sportVolleyballWomen',
    'meeting': 'ics.sportMeeting',
  };

  let ics = 'BEGIN:VCALENDAR\r\n';
  ics += 'VERSION:2.0\r\n';
  ics += 'PRODID:-//Red Rebels Calendar//EN\r\n';
  ics += 'CALSCALE:GREGORIAN\r\n';
  ics += 'METHOD:PUBLISH\r\n';
  ics += `X-WR-CALNAME:Red Rebels Events ${SEASON_START_YEAR}/${String(SEASON_END_YEAR).slice(-2)}\r\n`;
  ics += 'X-WR-TIMEZONE:Europe/Nicosia\r\n';

  if (refreshIntervalHours) {
    ics += `REFRESH-INTERVAL;VALUE=DURATION:PT${refreshIntervalHours}H\r\n`;
    ics += `X-PUBLISHED-TTL:PT${refreshIntervalHours}H\r\n`;
  }

  for (const monthName of MONTH_ORDER) {
    const events = eventsData[monthName] || [];
    const info = monthMap[monthName];

    for (const ev of events) {
      if (!ev.sport) continue;
      const cfg = sportConfig[ev.sport as keyof typeof sportConfig];
      const isMeeting = ev.sport === 'meeting';

      const teamName = translateTeamName('Νέα Σαλαμίνα', t);
      const translatedOpponent = isMeeting ? ev.opponent : translateTeamName(ev.opponent, t);

      let title: string;
      if (isMeeting) title = ev.opponent;
      else if (ev.location === 'home') title = `${teamName} vs ${translatedOpponent}`;
      else title = `${translatedOpponent} vs ${teamName}`;

      const subtitle = cfg?.emoji ? `${cfg.emoji} - ${ev.time}` : `${cfg?.name ?? ''} - ${ev.time}`;
      const timePart = subtitle.split(' - ')[1];
      const hasValidTime = timePart && timePart.includes(':');

      const dateStr = `${info.year}${pad(info.monthIndex + 1)}${pad(ev.day)}`;
      const uid = hasValidTime
        ? `${dateStr}T${timePart.replace(':', '')}00-${escapeIcs(title).replace(/\s/g, '-')}@red-rebels.com`
        : `${dateStr}-${escapeIcs(title).replace(/\s/g, '-')}@red-rebels.com`;

      if (!hasValidTime) {
        ics += 'BEGIN:VEVENT\r\n';
        ics += `UID:${uid}\r\n`;
        ics += `DTSTAMP:${formatDate(new Date())}\r\n`;
        ics += `DTSTART;VALUE=DATE:${dateStr}\r\n`;
        ics += `DTEND;VALUE=DATE:${dateStr}\r\n`;
        ics += `SUMMARY:${escapeIcs(title)}\r\n`;
        ics += `CATEGORIES:${tLookup(lang, sportI18nKeys[ev.sport] ?? 'ics.sportEvent', 'Event')}\r\n`;
        ics += 'END:VEVENT\r\n';
        continue;
      }

      const [hours, minutes] = timePart.split(':').map(Number);
      const start = new Date(info.year, info.monthIndex, ev.day, hours, minutes);
      const durationHours = isMeeting ? 1 : 2;
      const end = new Date(start.getTime() + durationHours * 3600000);

      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${uid}\r\n`;
      ics += `DTSTAMP:${formatDate(new Date())}\r\n`;
      ics += `DTSTART;TZID=Europe/Nicosia:${formatDate(start)}\r\n`;
      ics += `DTEND;TZID=Europe/Nicosia:${formatDate(end)}\r\n`;
      ics += `SUMMARY:${escapeIcs(title)}\r\n`;

      let description = title;
      if (ev.venue) {
        const translatedVenue = translateVenue(ev.venue, t);
        description += `\\n${tLookup(lang, 'ics.venue', 'Venue')}: ${translatedVenue}`;
        ics += `LOCATION:${escapeIcs(translatedVenue)}\r\n`;
      }
      if (ev.status === 'played' && ev.score) {
        description += `\\n${tLookup(lang, 'ics.result', 'Result')}: ${ev.score}`;
      }
      ics += `DESCRIPTION:${escapeIcs(description)}\r\n`;
      ics += ev.status === 'played' ? 'STATUS:CONFIRMED\r\n' : 'STATUS:TENTATIVE\r\n';
      ics += `CATEGORIES:${tLookup(lang, sportI18nKeys[ev.sport] ?? 'ics.sportEvent', 'Event')}\r\n`;

      // Reminder alarm for upcoming matches
      if (includeAlarms && ev.status !== 'played' && !isMeeting) {
        ics += 'BEGIN:VALARM\r\n';
        ics += 'ACTION:DISPLAY\r\n';
        ics += `DESCRIPTION:${escapeIcs(title)}\r\n`;
        ics += `TRIGGER:-PT${alarmMinutesBefore}M\r\n`;
        ics += 'END:VALARM\r\n';
      }

      ics += 'END:VEVENT\r\n';
    }
  }

  ics += 'END:VCALENDAR\r\n';
  return ics;
}
