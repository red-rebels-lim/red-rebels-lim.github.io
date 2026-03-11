import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { MonthData, MonthName, CalendarDay } from '@/types/events';
import { monthMap } from '@/data/month-config';

const dayHeaders = [
  'days.monday', 'days.tuesday', 'days.wednesday', 'days.thursday',
  'days.friday', 'days.saturday', 'days.sunday',
];

interface MobileCalendarGridProps {
  monthData: MonthData;
  currentMonth: MonthName;
  selectedDay: number | null;
  onDayClick: (day: number) => void;
}

function getDotColors(day: CalendarDay): string[] {
  if (!day.events || day.events.length === 0) return [];
  const sports = new Set(day.events.map((e) => e.sport));
  const colors: string[] = [];
  // Football sports get red dot
  if (sports.has('football-men')) colors.push('bg-[#dc2828]');
  // Volleyball sports get blue dot
  if (sports.has('volleyball-men') || sports.has('volleyball-women')) colors.push('bg-blue-500');
  // Meetings get a gray dot
  if (sports.has('meeting') && colors.length === 0) colors.push('bg-slate-400');
  return colors;
}

export function MobileCalendarGrid({ monthData, currentMonth, selectedDay, onDayClick }: MobileCalendarGridProps) {
  const { t } = useTranslation();

  const { todayDay, isCurrentMonth } = useMemo(() => {
    const now = new Date();
    const info = monthMap[currentMonth];
    return {
      todayDay: now.getDate(),
      isCurrentMonth: info.monthIndex === now.getMonth() && info.year === now.getFullYear(),
    };
  }, [currentMonth]);

  const info = monthMap[currentMonth];

  return (
    <div className="p-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-y-2 text-center mb-2">
        {dayHeaders.map((key) => (
          <div
            key={key}
            className="text-xs font-bold text-slate-700 dark:text-slate-400 pb-2"
            aria-hidden="true"
          >
            {t(key).slice(0, 3).toUpperCase()}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {monthData.days.map((day, idx) => {
          if (day.empty) {
            // Check if it's a trailing overflow day
            const isTrailing = idx >= info.startDay + info.daysInMonth;
            const overflowDay = isTrailing ? idx - info.startDay - info.daysInMonth + 1 : null;

            return (
              <div key={`empty-${idx}`} className="h-12 flex flex-col items-center justify-center">
                {overflowDay != null && overflowDay > 0 && (
                  <span className="text-sm text-slate-300 dark:text-slate-600">{overflowDay}</span>
                )}
              </div>
            );
          }

          const isToday = isCurrentMonth && day.number === todayDay;
          const isSelected = day.number === selectedDay;
          const hasEvents = day.events && day.events.length > 0;
          const dots = getDotColors(day);

          // Selected day: red filled background
          // Today (not selected): subtle ring outline
          let cellStyle = '';
          let textStyle = 'font-medium text-slate-800 dark:text-slate-200';
          if (isSelected) {
            cellStyle = 'bg-[#dc2828]/20 rounded-lg';
            textStyle = 'font-bold text-[#dc2828]';
          } else if (isToday) {
            cellStyle = 'rounded-lg ring-2 ring-[#dc2828]/50';
            textStyle = 'font-semibold text-[#dc2828]';
          }

          return (
            <div
              key={`day-${day.number}`}
              className={`relative h-12 flex flex-col items-center justify-center cursor-pointer ${cellStyle}`}
              onClick={() => { if (day.number != null) onDayClick(day.number); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && day.number != null) { e.preventDefault(); onDayClick(day.number); } }}
              aria-label={day.number != null ? `${t(`months.${currentMonth}`)} ${day.number}${isToday ? ', today' : ''}${hasEvents ? `, ${day.events!.length} events` : ''}` : undefined}
            >
              <span className={`text-base ${textStyle}`}>
                {day.number}
              </span>
              {dots.length > 0 && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {dots.map((color, i) => (
                    <div key={i} className={`size-1 rounded-full ${color}`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
