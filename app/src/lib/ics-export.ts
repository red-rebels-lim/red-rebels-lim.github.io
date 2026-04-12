import { eventsData } from '@/data/events';
import { SEASON_START_YEAR, SEASON_END_YEAR } from '@/data/constants';
import i18n from '@/i18n';
import { generateIcsString } from '@/lib/ics-core';

export function exportToCalendar() {
  const lang = (i18n.language === 'el' ? 'el' : 'en') as 'en' | 'el';
  const ics = generateIcsString(eventsData, { lang });

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `red-rebels-calendar-${SEASON_START_YEAR}-${String(SEASON_END_YEAR).slice(-2)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
