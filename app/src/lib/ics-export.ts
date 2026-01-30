import { eventsData } from '@/data/events';
import { sportConfig } from '@/data/sport-config';
import { monthMap, MONTH_ORDER } from '@/data/month-config';
import type { MonthName } from '@/types/events';

const TEAM_NAME = 'Νέα Σαλαμίνα';

export function exportToCalendar() {
  let ics = 'BEGIN:VCALENDAR\r\n';
  ics += 'VERSION:2.0\r\n';
  ics += 'PRODID:-//Red Rebels Calendar//EN\r\n';
  ics += 'CALSCALE:GREGORIAN\r\n';
  ics += 'METHOD:PUBLISH\r\n';
  ics += 'X-WR-CALNAME:Red Rebels Events 2025\r\n';
  ics += 'X-WR-TIMEZONE:Europe/Athens\r\n';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatDate = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  for (const monthName of MONTH_ORDER) {
    const events = eventsData[monthName] || [];
    const info = monthMap[monthName as MonthName];

    for (const ev of events) {
      const cfg = sportConfig[ev.sport];
      const isMeeting = ev.sport === 'meeting';

      let title: string;
      if (isMeeting) title = ev.opponent;
      else if (ev.location === 'home') title = `${TEAM_NAME} vs ${ev.opponent}`;
      else title = `${ev.opponent} vs ${TEAM_NAME}`;

      const subtitle = cfg?.emoji ? `${cfg.emoji} - ${ev.time}` : `${cfg?.name ?? ''} - ${ev.time}`;
      const timePart = subtitle.split(' - ')[1];
      if (!timePart || !timePart.includes(':')) continue;

      const [hours, minutes] = timePart.split(':').map(Number);
      const start = new Date(info.year, info.monthIndex, ev.day, hours, minutes);
      const durationHours = isMeeting ? 1 : 2;
      const end = new Date(start.getTime() + durationHours * 3600000);

      const uid = `${start.getTime()}-${title.replace(/\s/g, '-')}@redrebels.cy`;

      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${uid}\r\n`;
      ics += `DTSTAMP:${formatDate(new Date())}\r\n`;
      ics += `DTSTART:${formatDate(start)}\r\n`;
      ics += `DTEND:${formatDate(end)}\r\n`;
      ics += `SUMMARY:${title}\r\n`;

      let description = title;
      if (ev.venue) {
        description += `\\nΓήπεδο: ${ev.venue}`;
        ics += `LOCATION:${ev.venue}\r\n`;
      }
      if (ev.status === 'played' && ev.score) {
        description += `\\nΑποτέλεσμα: ${ev.score}`;
      }
      ics += `DESCRIPTION:${description}\r\n`;
      ics += ev.status === 'played' ? 'STATUS:CONFIRMED\r\n' : 'STATUS:TENTATIVE\r\n';

      const sportNames: Record<string, string> = {
        'football-men': 'Ανδρικό Ποδόσφαιρο',
        'volleyball-men': 'Ανδρικό Βόλεϊ',
        'volleyball-women': 'Γυναικείο Βόλεϊ',
        'meeting': 'Συνάντηση',
      };
      ics += `CATEGORIES:${sportNames[ev.sport] || 'Εκδήλωση'}\r\n`;
      ics += 'END:VEVENT\r\n';
    }
  }

  ics += 'END:VCALENDAR\r\n';

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'red-rebels-calendar-2025.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
