import { eventsData } from '@/data/events';
import { sportConfig } from '@/data/sport-config';
import { monthMap, MONTH_ORDER } from '@/data/month-config';
import { TEAM_NAME, SEASON_START_YEAR, SEASON_END_YEAR } from '@/data/constants';
import i18n from '@/i18n';

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function exportToCalendar() {
  const t = i18n.t.bind(i18n);

  let ics = 'BEGIN:VCALENDAR\r\n';
  ics += 'VERSION:2.0\r\n';
  ics += 'PRODID:-//Red Rebels Calendar//EN\r\n';
  ics += 'CALSCALE:GREGORIAN\r\n';
  ics += 'METHOD:PUBLISH\r\n';
  ics += `X-WR-CALNAME:Red Rebels Events ${SEASON_START_YEAR}/${String(SEASON_END_YEAR).slice(-2)}\r\n`;
  ics += 'X-WR-TIMEZONE:Europe/Nicosia\r\n';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatDate = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const sportI18nKeys: Record<string, string> = {
    'football-men': 'ics.sportFootballMen',
    'volleyball-men': 'ics.sportVolleyballMen',
    'volleyball-women': 'ics.sportVolleyballWomen',
    'meeting': 'ics.sportMeeting',
  };

  for (const monthName of MONTH_ORDER) {
    const events = eventsData[monthName] || [];
    const info = monthMap[monthName];

    for (const ev of events) {
      if (!ev.sport) continue;
      const cfg = sportConfig[ev.sport];
      const isMeeting = ev.sport === 'meeting';

      let title: string;
      if (isMeeting) title = ev.opponent;
      else if (ev.location === 'home') title = `${TEAM_NAME} vs ${ev.opponent}`;
      else title = `${ev.opponent} vs ${TEAM_NAME}`;

      const subtitle = cfg?.emoji ? `${cfg.emoji} - ${ev.time}` : `${cfg?.name ?? ''} - ${ev.time}`;
      const timePart = subtitle.split(' - ')[1];
      const hasValidTime = timePart && timePart.includes(':');

      const dateStr = `${info.year}${pad(info.monthIndex + 1)}${pad(ev.day)}`;

      if (!hasValidTime) {
        // Export as all-day event
        ics += 'BEGIN:VEVENT\r\n';
        ics += `UID:${dateStr}-${title.replace(/\s/g, '-')}@redrebels.cy\r\n`;
        ics += `DTSTAMP:${formatDate(new Date())}\r\n`;
        ics += `DTSTART;VALUE=DATE:${dateStr}\r\n`;
        ics += `DTEND;VALUE=DATE:${dateStr}\r\n`;
        ics += `SUMMARY:${escapeIcs(title)}\r\n`;
        ics += `CATEGORIES:${t(sportI18nKeys[ev.sport] ?? 'ics.sportEvent')}\r\n`;
        ics += 'END:VEVENT\r\n';
        continue;
      }

      const [hours, minutes] = timePart.split(':').map(Number);
      const start = new Date(info.year, info.monthIndex, ev.day, hours, minutes);
      const durationHours = isMeeting ? 1 : 2;
      const end = new Date(start.getTime() + durationHours * 3600000);

      const uid = `${start.getTime()}-${title.replace(/\s/g, '-')}@redrebels.cy`;

      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${uid}\r\n`;
      ics += `DTSTAMP:${formatDate(new Date())}\r\n`;
      ics += `DTSTART;TZID=Europe/Nicosia:${formatDate(start)}\r\n`;
      ics += `DTEND;TZID=Europe/Nicosia:${formatDate(end)}\r\n`;
      ics += `SUMMARY:${escapeIcs(title)}\r\n`;

      let description = title;
      if (ev.venue) {
        description += `\\n${t('ics.venue')}: ${ev.venue}`;
        ics += `LOCATION:${escapeIcs(ev.venue)}\r\n`;
      }
      if (ev.status === 'played' && ev.score) {
        description += `\\n${t('ics.result')}: ${ev.score}`;
      }
      ics += `DESCRIPTION:${escapeIcs(description)}\r\n`;
      ics += ev.status === 'played' ? 'STATUS:CONFIRMED\r\n' : 'STATUS:TENTATIVE\r\n';
      ics += `CATEGORIES:${t(sportI18nKeys[ev.sport] ?? 'ics.sportEvent')}\r\n`;
      ics += 'END:VEVENT\r\n';
    }
  }

  ics += 'END:VCALENDAR\r\n';

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `red-rebels-calendar-${SEASON_START_YEAR}-${String(SEASON_END_YEAR).slice(-2)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
