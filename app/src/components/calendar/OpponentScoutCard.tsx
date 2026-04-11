import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getLastMeeting, getOpponentH2H } from '@/lib/stats';
import type { HeadToHead } from '@/types/events';

interface OpponentScoutCardProps {
  opponent: string;
  sport: string;
}

function ResultDot({ result }: { result: 'win' | 'draw' | 'loss' }) {
  const colors = {
    win: 'bg-green-500',
    draw: 'bg-yellow-500',
    loss: 'bg-red-500',
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[result]}`} />;
}

function H2HMini({ h2h, isVolleyball }: { h2h: HeadToHead; isVolleyball: boolean }) {
  const { t } = useTranslation();
  return (
    <div>
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 font-condensed">
        {t('popover.h2hRecord')}
      </h4>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-green-500/10 rounded-lg p-2">
          <div className="text-lg font-black text-green-400 font-condensed tabular-nums">{h2h.wins}</div>
          <div className="text-[10px] font-bold text-green-400/70 uppercase">{t('stats.w')}</div>
        </div>
        {!isVolleyball && (
          <div className="bg-yellow-500/10 rounded-lg p-2">
            <div className="text-lg font-black text-yellow-400 font-condensed tabular-nums">{h2h.draws}</div>
            <div className="text-[10px] font-bold text-yellow-400/70 uppercase">{t('stats.d')}</div>
          </div>
        )}
        <div className="bg-red-500/10 rounded-lg p-2">
          <div className="text-lg font-black text-red-400 font-condensed tabular-nums">{h2h.losses}</div>
          <div className="text-[10px] font-bold text-red-400/70 uppercase">{t('stats.l')}</div>
        </div>
      </div>
      {!isVolleyball && (
        <div className="text-center mt-2 text-xs text-muted-foreground tabular-nums">
          {t('stats.goals')}: {h2h.goalsFor}-{h2h.goalsAgainst}
        </div>
      )}
    </div>
  );
}

export function OpponentScoutCard({ opponent, sport }: OpponentScoutCardProps) {
  const { t } = useTranslation();
  const isVolleyball = sport.startsWith('volleyball');

  const h2h = useMemo(() => getOpponentH2H(opponent, sport), [opponent, sport]);
  const lastMeeting = useMemo(() => getLastMeeting(opponent, sport), [opponent, sport]);

  if (!h2h && !lastMeeting) {
    return (
      <div className="mt-4 bg-white/5 border border-primary-border-subtle rounded-xl p-4 text-center">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-condensed mb-1">
          {t('popover.scouting')}
        </p>
        <p className="text-sm text-muted-foreground">{t('popover.firstMeeting')}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-white/5 border border-primary-border-subtle rounded-xl p-4 space-y-4">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-condensed text-center">
        {t('popover.scouting')}
      </h3>

      {h2h && <H2HMini h2h={h2h} isVolleyball={isVolleyball} />}

      {lastMeeting && (
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 font-condensed">
            {t('popover.lastMeeting')}
          </h4>
          <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
            <ResultDot result={lastMeeting.result} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-foreground tabular-nums">{lastMeeting.score}</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({lastMeeting.location === 'home' ? t('popover.homeGround') : t('popover.awayGround')})
              </span>
            </div>
            <span className="text-xs text-muted-foreground capitalize">
              {t(`months.${lastMeeting.month}`).slice(0, 3)} {lastMeeting.day}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
