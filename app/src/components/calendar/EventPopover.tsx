import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { getMatchResult } from '@/lib/stats';
import type { CalendarEvent } from '@/types/events';

interface EventPopoverProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
}

export function EventPopover({ event, open, onClose }: EventPopoverProps) {
  const { t } = useTranslation();

  if (!event) return null;

  const result = event.status === 'played' ? getMatchResult(event.score, event.location, event.penalties) : null;
  const opponent = event.title.replace('Νέα Σαλαμίνα vs ', '').replace(/ vs Νέα Σαλαμίνα/, '');
  const subtitleParts = event.subtitle.split(' - ');
  const emoji = subtitleParts[0] ?? '';
  const rawTime = subtitleParts[1];
  const hasValidTime = rawTime && rawTime.includes(':');
  const time = hasValidTime ? rawTime : t('popover.tbd');
  const isHome = event.title.startsWith('Νέα Σαλαμίνα vs');

  const resultBadge = event.status === 'played'
    ? result === 'win'
      ? { bg: 'bg-gradient-to-br from-[#4CAF50] to-[#388E3C]', text: `\u2705 ${t('popover.win')}` }
      : result === 'draw'
        ? { bg: 'bg-gradient-to-br from-[#FFC107] to-[#FFA000]', text: `\u{1F91D} ${t('popover.draw')}` }
        : result === 'loss'
          ? { bg: 'bg-gradient-to-br from-[#F44336] to-[#D32F2F]', text: `\u274C ${t('popover.loss')}` }
          : { bg: 'bg-gradient-to-br from-emerald-600 to-emerald-700', text: `\u2705 ${t('popover.completed')}` }
    : { bg: 'bg-gradient-to-br from-[#E02520] to-[#b91c1c]', text: `\u{1F4C5} ${t('popover.upcoming')}` };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-gradient-to-br from-[#1a0f0f] to-[#0a1810] border-3 border-[rgba(224,37,32,0.6)] rounded-3xl max-w-lg shadow-[0_25px_50px_rgba(0,0,0,0.8),0_0_100px_rgba(224,37,32,0.3)]">
        <DialogTitle className="sr-only">{event.title}</DialogTitle>

        {event.isMeeting ? (
          <div className="text-center py-4">
            <div className="text-6xl mb-4">{'\u{1F4C5}'}</div>
            <div className="text-2xl font-extrabold text-foreground mb-4">{event.title}</div>
            <div className="bg-white/5 border-2 border-[rgba(224,37,32,0.2)] rounded-xl p-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {t('popover.time')}
              </div>
              <div className="text-lg font-bold text-foreground">{'\u23F0'} {time}</div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b-2 border-[rgba(224,37,32,0.3)]">
              <span className="text-5xl shrink-0">{emoji}</span>
              {event.logo && (
                <img
                  src={`/${event.logo}`}
                  alt={opponent}
                  className="w-14 h-14 object-contain rounded-lg bg-white/95 p-1 shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xl font-extrabold text-foreground leading-tight mb-2">
                  {event.title}
                </div>
                <span className={`${resultBadge.bg} text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg inline-block`}>
                  {resultBadge.text}
                </span>
              </div>
            </div>

            {/* Competition badge */}
            {event.competition === 'cup' && (
              <div className="text-center my-2">
                <span className="bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg inline-block border border-amber-500/30">
                  🏆 Κύπελλο
                </span>
              </div>
            )}

            {/* Score */}
            {event.status === 'played' && event.score && (
              <div className="text-center py-3 bg-yellow-300/10 border-2 border-yellow-300/30 rounded-xl my-4">
                <div className="text-3xl font-black text-yellow-300">
                  {'\u26BD'} {event.score}
                </div>
                {event.penalties && (
                  <div className="text-sm font-bold text-yellow-300/80 mt-1">
                    Πέναλτι: {event.penalties}
                  </div>
                )}
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/5 border-2 border-[rgba(224,37,32,0.2)] rounded-xl p-3 hover:bg-white/8 transition-all">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  {t('popover.time')}
                </div>
                <div className="text-base font-bold text-foreground">{'\u23F0'} {time}</div>
              </div>
              <div className="bg-white/5 border-2 border-[rgba(224,37,32,0.2)] rounded-xl p-3 hover:bg-white/8 transition-all">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  {t('popover.location')}
                </div>
                <div className="text-base font-bold text-foreground">
                  {isHome ? `\u{1F3E0} ${t('popover.homeGround')}` : `\u2708\uFE0F ${t('popover.awayGround')}`}
                </div>
              </div>
              {event.venue && (
                <div className="bg-white/5 border-2 border-[rgba(224,37,32,0.2)] rounded-xl p-3 hover:bg-white/8 transition-all sm:col-span-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    {t('popover.venue')}
                  </div>
                  <div className="text-base font-bold text-foreground">{'\u{1F4CD}'} {event.venue}</div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
