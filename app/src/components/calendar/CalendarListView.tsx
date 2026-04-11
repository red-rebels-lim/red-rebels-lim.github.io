import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getMatchResult } from '@/lib/stats';
import type { MonthData, MonthName, CalendarEvent } from '@/types/events';

interface CalendarListViewProps {
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

const resultColors = {
  win: 'text-green-500',
  draw: 'text-yellow-500',
  loss: 'text-red-500',
};

export function CalendarListView({ monthData, currentMonth, onEventClick }: CalendarListViewProps) {
  const { t } = useTranslation();

  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    for (const day of monthData.days) {
      if (day.events) events.push(...day.events);
    }
    return events.sort((a, b) => a.day - b.day);
  }, [monthData]);

  const played = allEvents.filter(e => e.status === 'played');
  const upcoming = allEvents.filter(e => e.status !== 'played');

  if (allEvents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">{t('calendar.noEvents')}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      {played.length > 0 && (
        <>
          <SectionLabel text={t('calendar.played', 'Played')} />
          {played.map((event, i) => (
            <ListItem key={`p-${event.day}-${event.sport}-${i}`} event={event} currentMonth={currentMonth} onClick={() => onEventClick(event)} t={t} />
          ))}
        </>
      )}
      {upcoming.length > 0 && (
        <>
          <SectionLabel text={t('calendar.upcomingSection', 'Upcoming')} />
          {upcoming.map((event, i) => (
            <ListItem key={`u-${event.day}-${event.sport}-${i}`} event={event} currentMonth={currentMonth} onClick={() => onEventClick(event)} t={t} />
          ))}
        </>
      )}
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="font-condensed text-xs font-bold uppercase tracking-widest text-muted-foreground py-3 border-b border-primary-border-subtle flex items-center gap-2">
      {text}
      <span className="flex-1 h-px bg-primary-border-subtle" />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ListItem({ event, currentMonth, onClick, t }: { event: CalendarEvent; currentMonth: MonthName; onClick: () => void; t: any }) {
  const result = event.status === 'played' ? getMatchResult(event.score, event.location, event.penalties) : null;
  const isVB = event.sport?.startsWith('volleyball');
  const sportLabel = sportLabelKey[event.sport] ? t(sportLabelKey[event.sport]) : event.sport;
  const monthAbbrev = t(`months.${currentMonth}`).slice(0, 3);
  const time = event.subtitle?.match(/(\d{1,2}:\d{2})/)?.[1];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className="flex items-center gap-3 py-3 border-b border-primary-border-subtle/50 cursor-pointer hover:pl-1 transition-all outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] rounded"
    >
      {/* Date/Score badge */}
      <div className="w-12 text-center flex-shrink-0">
        {event.status === 'played' && event.score ? (
          <div className={`text-base font-bold tabular-nums font-condensed ${result ? resultColors[result] : ''}`}>{event.score}</div>
        ) : (
          <>
            <div className="text-lg font-bold tabular-nums font-condensed">{event.day}</div>
            <div className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">{monthAbbrev}</div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className={`text-[10px] font-bold uppercase tracking-wider ${isVB ? 'text-blue-500' : 'text-primary'}`}>
          {sportLabel}
          {event.competition === 'cup' && <span className="ml-1.5 text-amber-500">{t('calendar.cup')}</span>}
        </div>
        <div className="text-sm font-semibold truncate mt-0.5">{event.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {event.location === 'home' ? t('locations.home') : t('locations.away')}
          {event.venue && ` \u2022 ${event.venue}`}
        </div>
      </div>

      {/* Time or result */}
      <div className="flex-shrink-0 text-right">
        {event.status === 'played' && result ? (
          <span className={`text-xs font-bold uppercase ${resultColors[result]}`}>{t(`popover.${result}`)}</span>
        ) : time ? (
          <span className="text-sm font-bold text-primary tabular-nums font-condensed">{time}</span>
        ) : null}
      </div>
    </div>
  );
}
