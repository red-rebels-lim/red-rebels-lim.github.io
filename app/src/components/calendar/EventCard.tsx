import { memo } from 'react';
import type { CalendarEvent } from '@/types/events';
import { getMatchResult } from '@/lib/stats';
import { CountdownTimer } from './CountdownTimer';
import { monthMap } from '@/data/month-config';
import type { MonthName } from '@/types/events';
import { trackEvent } from '@/lib/analytics';

function truncateTeamName(name: string, maxLength = 12): string {
  if (!name) return '';
  const shortened = name
    .replace(/^(ΑΕ|ΑΟ|ΑΣ|ΠΟ|ΠΑΕ|ΠΑΕΕΚ|ΑΛΣ|ΜΕΑΠ|ΑΟΑΝ|ΑΠΕΑ)\s+/g, '')
    .trim();
  if (shortened.length <= maxLength) return shortened;
  return shortened.substring(0, maxLength - 1) + '\u2026';
}

interface EventCardProps {
  event: CalendarEvent;
  dayNumber: number;
  monthName: MonthName;
  onClick: () => void;
}

export const EventCard = memo(function EventCard({ event, dayNumber, monthName, onClick }: EventCardProps) {
  const result = event.status === 'played' ? getMatchResult(event.score, event.location, event.penalties) : null;

  const bgClass = event.isMeeting
    ? 'bg-gradient-to-br from-gray-400 to-gray-500'
    : result === 'win'
      ? 'bg-gradient-to-br from-[#4CAF50] to-[#388E3C]'
      : result === 'draw'
        ? 'bg-gradient-to-br from-[#FFC107] to-[#FFA000]'
        : result === 'loss'
          ? 'bg-gradient-to-br from-[#F44336] to-[#D32F2F]'
          : 'bg-gradient-to-br from-gray-400 to-gray-500';

  const subtitleParts = event.subtitle.split(' - ');
  const emoji = subtitleParts[0] ?? '';
  const timePart = subtitleParts[1];
  const opponent = event.title.replace('Νέα Σαλαμίνα vs ', '').replace(/ vs Νέα Σαλαμίνα/, '');

  // Compute countdown timestamp for upcoming events
  let countdownTimestamp: number | null = null;
  const hasKickoffTime = timePart && timePart.includes(':');
  if (event.status !== 'played' && hasKickoffTime) {
    const [hours, minutes] = timePart.split(':').map(Number);
    const info = monthMap[monthName];
    countdownTimestamp = new Date(info.year, info.monthIndex, dayNumber, hours, minutes).getTime();
  }

  return (
    <div
      className={`${bgClass} text-white py-1.5 px-2 rounded-lg text-xs mb-1 border border-white/20 shadow-md cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg`}
      onClick={() => { trackEvent('view_match', { opponent, status: event.status ?? 'upcoming' }); onClick(); }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-base leading-none shrink-0">
          {event.isMeeting ? '\u{1F4C5}' : emoji}
        </span>
        {event.logo && (
          <img
            src={`/${event.logo}`}
            alt={opponent}
            loading="lazy"
            className="w-5 h-5 object-contain rounded bg-white/90 p-0.5 shrink-0"
          />
        )}
        <span className="font-bold text-xs leading-tight overflow-hidden text-ellipsis whitespace-nowrap">
          {event.isMeeting ? event.title : truncateTeamName(opponent)}
        </span>
        {event.status === 'played' && event.score && (
          <span className="ml-auto font-extrabold text-xs text-yellow-300 whitespace-nowrap px-1 py-0.5 bg-black/30 rounded shrink-0">
            {event.score}{event.penalties ? ' (πεν)' : ''}
          </span>
        )}
        {event.competition === 'cup' && (
          <span className="text-xs shrink-0" title="Κύπελλο">🏆</span>
        )}
      </div>
      {countdownTimestamp && <CountdownTimer timestamp={countdownTimestamp} />}
    </div>
  );
});
