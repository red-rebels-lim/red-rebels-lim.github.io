import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { MonthData, MonthName, CalendarEvent } from '@/types/events';
import { UpcomingEventCard } from './UpcomingEventCard';

interface UpcomingEventsListProps {
  monthData: MonthData;
  currentMonth: MonthName;
  selectedDay: number | null;
  onEventClick: (event: CalendarEvent) => void;
}

export function UpcomingEventsList({ monthData, currentMonth, selectedDay, onEventClick }: UpcomingEventsListProps) {
  const { t } = useTranslation();

  const events = useMemo(() => {
    if (selectedDay == null) return [];
    const dayData = monthData.days.find((d) => !d.empty && d.number === selectedDay);
    if (!dayData?.events) return [];
    return [...dayData.events].sort((a, b) => a.day - b.day);
  }, [monthData, selectedDay]);

  // Hide entirely when no day is selected or the selected day has no events
  if (events.length === 0) return null;

  return (
    <section className="px-2 mt-6" aria-live="polite">
      <h3 className="text-xs font-bold uppercase tracking-widest mb-3">
        <span className="bg-white/70 dark:bg-transparent backdrop-blur-sm dark:backdrop-blur-none text-slate-700 dark:text-slate-400 px-2 py-1 rounded">
          {t('calendar.selectedDay', 'Selected Day')}
        </span>
      </h3>
      <div className="space-y-3">
        {events.map((event, idx) => (
          <UpcomingEventCard
            key={`${event.day}-${event.sport}-${idx}`}
            event={event}
            monthName={currentMonth}
            onClick={() => onEventClick(event)}
          />
        ))}
      </div>
    </section>
  );
}
