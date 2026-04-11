import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getMatchResult } from '@/lib/stats';
import { monthMap } from '@/data/month-config';
import type { MonthData, MonthName, CalendarEvent } from '@/types/events';

interface CalendarCardsViewProps {
  monthData: MonthData;
  currentMonth: MonthName;
  onEventClick: (event: CalendarEvent) => void;
}

const sportLabelKey: Record<string, string> = {
  'football-men': 'sports.footballMen',
  'volleyball-men': 'sports.volleyballMen',
  'volleyball-women': 'sports.volleyballWomen',
  'meeting': 'sports.meeting',
};

const resultStyles = {
  win: { score: 'text-green-500', badge: 'bg-green-500/10 text-green-500' },
  draw: { score: 'text-yellow-500', badge: 'bg-yellow-500/10 text-yellow-500' },
  loss: { score: 'text-red-500', badge: 'bg-red-500/10 text-red-500' },
};

export function CalendarCardsView({ monthData, currentMonth, onEventClick }: CalendarCardsViewProps) {
  const { t } = useTranslation();

  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    for (const day of monthData.days) {
      if (day.events) events.push(...day.events);
    }
    return events.sort((a, b) => a.day - b.day);
  }, [monthData]);

  if (allEvents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">{t('calendar.noEvents')}</p>
      </div>
    );
  }

  const year = monthMap[currentMonth]?.year ?? '';

  return (
    <div className="px-4 pb-4 flex flex-col gap-3 pt-2">
      {allEvents.map((event, i) => (
        <MatchCard
          key={`${event.day}-${event.sport}-${i}`}
          event={event}
          currentMonth={currentMonth}
          year={year}
          onClick={() => onEventClick(event)}
          t={t}
        />
      ))}
    </div>
  );
}

function MatchCard({ event, currentMonth, year, onClick, t }: {
  event: CalendarEvent; currentMonth: MonthName; year: number; onClick: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const result = event.status === 'played' ? getMatchResult(event.score, event.location, event.penalties) : null;
  const isVB = event.sport?.startsWith('volleyball');
  const sportLabel = sportLabelKey[event.sport] ? t(sportLabelKey[event.sport]) : event.sport;
  const monthAbbrev = t(`months.${currentMonth}`).slice(0, 3);
  const time = event.subtitle?.match(/(\d{1,2}:\d{2})/)?.[1];
  const rs = result ? resultStyles[result] : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className="bg-card border border-primary-border-subtle rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:border-t-[var(--border-subtle)]"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-medium text-muted-foreground">
          {monthAbbrev} {event.day}, {year}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isVB ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'}`}>
          {sportLabel}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-base font-bold mb-2">{event.title}</h4>

      {/* Score or Time */}
      {event.status === 'played' && event.score ? (
        <div className={`text-3xl font-black text-center my-2 tabular-nums font-condensed ${rs?.score ?? ''}`}>
          {event.score.replace('-', ' - ')}
        </div>
      ) : time ? (
        <div className="text-2xl font-black text-center my-2 text-primary tabular-nums font-condensed">
          {time}
        </div>
      ) : null}

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-primary-border-subtle/50 pt-3 mt-2">
        <span>
          {event.location === 'home' ? t('locations.home') : t('locations.away')}
          {event.competition === 'cup' && <span className="ml-1.5 text-amber-500 font-bold">{t('calendar.cup')}</span>}
        </span>
        {result ? (
          <span className={`font-bold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-full ${rs?.badge ?? ''}`}>
            {t(`popover.${result}`)}
          </span>
        ) : (
          <span className="font-bold uppercase text-[10px] tracking-wider text-primary">
            {t('popover.upcoming')}
          </span>
        )}
      </div>
    </div>
  );
}
