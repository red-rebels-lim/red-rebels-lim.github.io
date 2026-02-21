import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { MonthData, CalendarEvent, CalendarDay, MonthName } from '@/types/events';
import { EventCard } from './EventCard';
import { EventPopover } from './EventPopover';

const monthIndexMap: Record<string, number> = {
  september: 8, october: 9, november: 10, december: 11,
  january: 0, february: 1, march: 2, april: 3,
  may: 4, june: 5, july: 6, august: 7,
};
const yearMap: Record<string, number> = {
  september: 2025, october: 2025, november: 2025, december: 2025,
  january: 2026, february: 2026, march: 2026, april: 2026,
  may: 2026, june: 2026, july: 2026, august: 2026,
};
const dayNames = ['days.monday', 'days.tuesday', 'days.wednesday', 'days.thursday', 'days.friday', 'days.saturday', 'days.sunday'];

interface DesktopDayCellProps {
  day: CalendarDay;
  currentMonth: MonthName;
  isToday: boolean;
  onSelectEvent: (event: CalendarEvent) => void;
}

function DesktopDayCell({ day, currentMonth, isToday, onSelectEvent }: DesktopDayCellProps) {
  const events = day.events ?? [];
  const hasEvents = events.length > 0;
  const isCarousel = events.length > 1;
  const [activeIdx, setActiveIdx] = useState(0);

  const prev = useCallback(() => setActiveIdx((i) => (i - 1 + events.length) % events.length), [events.length]);
  const next = useCallback(() => setActiveIdx((i) => (i + 1) % events.length), [events.length]);

  return (
    <div
      {...(isToday ? { 'data-today': '' } : {})}
      className={`
        aspect-square min-h-[120px] max-h-[180px] p-2 rounded-2xl border-2 flex flex-col transition-all overflow-hidden
        ${hasEvents
          ? 'bg-[rgba(224,37,32,0.15)] border-[rgba(224,37,32,0.4)]'
          : 'bg-[rgba(255,255,255,0.05)] border-[rgba(224,37,32,0.25)]'
        }
        ${isToday
          ? 'bg-gradient-to-br from-[rgba(224,37,32,0.3)] to-[rgba(185,28,28,0.2)] !border-[#E02520] !border-3 shadow-[0_0_50px_rgba(224,37,32,0.5),0_15px_35px_rgba(0,0,0,0.4)] animate-pulse'
          : ''
        }
        hover:bg-[rgba(255,255,255,0.12)] hover:border-[rgba(224,37,32,0.5)] hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(224,37,32,0.3)]
        ${isCarousel ? 'group/carousel' : ''}
      `}
    >
      <div className={`text-base font-extrabold shrink-0 mb-1 ${isToday ? 'text-[#E02520] text-xl' : hasEvents ? 'text-red-300' : 'text-slate-300'}`}>
        {day.number}
        {day.name && (
          <span className="block text-[0.7rem] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">
            {day.name}
          </span>
        )}
      </div>

      {isCarousel ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <EventCard
              key={activeIdx}
              event={events[activeIdx]}
              dayNumber={day.number!}
              monthName={currentMonth}
              onClick={() => onSelectEvent(events[activeIdx])}
            />
          </div>
          {/* Carousel controls */}
          <div className="flex items-center justify-center gap-1 mt-auto pt-0.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity"
              aria-label="Previous event"
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            {events.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIdx ? 'bg-[#E02520] scale-125' : 'bg-slate-500 hover:bg-slate-400'}`}
                aria-label={`Event ${i + 1} of ${events.length}`}
              />
            ))}
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity"
              aria-label="Next event"
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {events.map((event, i) => (
            <EventCard
              key={i}
              event={event}
              dayNumber={day.number!}
              monthName={currentMonth}
              onClick={() => onSelectEvent(event)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CalendarGridProps {
  monthData: MonthData;
  currentMonth: MonthName;
}

export function CalendarGrid({ monthData, currentMonth }: CalendarGridProps) {
  const { t } = useTranslation();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const isCurrentMonth = monthIndexMap[currentMonth] === todayMonth && yearMap[currentMonth] === todayYear;

  return (
    <>
      <div className="bg-[rgba(10,24,16,0.2)] backdrop-blur-sm rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] border-2 border-[rgba(224,37,32,0.3)] overflow-hidden">
        {/* Header - weekday names (desktop only) */}
        <div className="hidden md:grid grid-cols-7 bg-gradient-to-br from-[#E02520] to-[#b91c1c] py-3">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-white font-bold text-sm uppercase tracking-wider px-2">
              {t(day)}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="hidden md:grid grid-cols-7 gap-3 p-4">
          {monthData.days.map((day, idx) => {
            if (day.empty) {
              return <div key={`empty-${idx}`} className="aspect-square min-h-[120px] max-h-[180px] rounded-2xl bg-transparent border border-white/5" />;
            }

            return (
              <DesktopDayCell
                key={`day-${day.number}`}
                day={day}
                currentMonth={currentMonth}
                isToday={isCurrentMonth && day.number === todayDay}
                onSelectEvent={setSelectedEvent}
              />
            );
          })}
        </div>

        {/* Mobile: single column, events only */}
        <div className="md:hidden p-4 space-y-4">
          {(() => {
            const eventDays = monthData.days.filter(
              (day) => !day.empty && day.events && day.events.length > 0,
            );

            // Find the nearest event day to today (>= today, or last day if all past)
            let nearestIdx = -1;
            if (isCurrentMonth) {
              nearestIdx = eventDays.findIndex((d) => d.number! >= todayDay);
              if (nearestIdx === -1) nearestIdx = eventDays.length - 1;
            }

            return eventDays.map((day, idx) => {
              const isToday = isCurrentMonth && day.number === todayDay;
              const isNearest = idx === nearestIdx;
              return (
                <div
                  key={`mobile-${day.number}`}
                  {...(isToday ? { 'data-today': '' } : {})}
                  {...(isNearest ? { 'data-nearest-event': '' } : {})}
                  className={`
                    p-4 rounded-2xl border-2
                    ${isToday
                      ? 'bg-gradient-to-br from-[rgba(224,37,32,0.3)] to-[rgba(185,28,28,0.2)] border-[#E02520] shadow-[0_0_50px_rgba(224,37,32,0.5)]'
                      : 'bg-[rgba(224,37,32,0.15)] border-[rgba(224,37,32,0.4)]'
                    }
                  `}
                >
                  <div className={`text-2xl font-extrabold inline-block pr-3 ${isToday ? 'text-[#E02520]' : 'text-red-300'}`}>
                    {day.number}
                    {day.name && (
                      <span className="inline text-lg font-bold text-red-300 ml-2">
                        {day.name}
                      </span>
                    )}
                  </div>
                  {day.events?.map((event, i) => (
                    <EventCard
                      key={i}
                      event={event}
                      dayNumber={day.number!}
                      monthName={currentMonth}
                      onClick={() => setSelectedEvent(event)}
                    />
                  ))}
                </div>
              );
            });
          })()}
        </div>
      </div>

      <EventPopover
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </>
  );
}
