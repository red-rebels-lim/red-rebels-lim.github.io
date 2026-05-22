import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { translateTeamName } from '@/lib/translate';
import type { Player, PlayerSeasonStats, PlayerMatchAppearance } from '@/types/players';
import { PlayerAvatar } from './PlayerAvatar';

interface PlayerSheetProps {
  player: Player | null;
  stats: PlayerSeasonStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function computeAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function PlayerSheet({ player, stats, open, onOpenChange }: PlayerSheetProps) {
  const { t, i18n } = useTranslation();
  const [matchLogExpanded, setMatchLogExpanded] = useState(false);
  const [lastPlayerKey, setLastPlayerKey] = useState(player?.key);

  // Reset expansion when the sheet hops between players. React 19's recommended
  // "adjust state during render" pattern — collapses cascading effects into one render.
  if (lastPlayerKey !== player?.key) {
    setLastPlayerKey(player?.key);
    setMatchLogExpanded(false);
  }

  if (!player || !stats) return null;

  const displayName = i18n.language === 'el' ? player.nameEl : player.nameEn;
  const positionLabel = t(`squad.positions.${player.position}`);
  const subPositionLabel = player.subPosition ? t(`squad.subPositions.${player.subPosition}`) : null;
  const age = computeAge(player.dateOfBirth);
  const reversedLog = [...stats.matchLog].reverse();
  const visibleLog = matchLogExpanded ? reversedLog : reversedLog.slice(0, 5);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl sm:mx-auto sm:rounded-t-2xl"
      >
        <SheetHeader className="text-left">
          <div className="flex items-center gap-4">
            <PlayerAvatar photoUrl={player.photoUrl} size="lg" />
            <div className="flex-1 min-w-0">
              <SheetTitle className="font-condensed font-bold uppercase tracking-wide text-2xl">
                {player.shirtNumber && (
                  <span className="text-primary mr-2 tabular-nums">#{player.shirtNumber}</span>
                )}
                {displayName}
              </SheetTitle>
              <SheetDescription className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold uppercase tracking-wide text-xs">
                  {positionLabel}
                </span>
                {subPositionLabel && (
                  <span className="text-slate-500 dark:text-slate-400">{subPositionLabel}</span>
                )}
                {age !== null && (
                  <span className="text-slate-500 dark:text-slate-400">
                    {t('squad.modal.age', { age, defaultValue: '{{age}} yrs' })}
                  </span>
                )}
                {player.nationality && (
                  <span className="text-slate-500 dark:text-slate-400">{player.nationality}</span>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-6">
          {stats.apps === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-slate-500 dark:text-slate-400">
              {t('squad.modal.noApps', 'No appearances yet this season')}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <StatTile
                  label={t('squad.modal.played')}
                  value={stats.apps}
                  detail={t('squad.modal.startsAndSubs', {
                    starts: stats.starts,
                    subs: stats.subAppearances,
                    defaultValue: '{{starts}} start · {{subs}} sub',
                  })}
                />
                <StatTile
                  label={t('squad.modal.goals')}
                  value={stats.goals}
                  detail={t('squad.modal.goalBreakdown', {
                    openPlay: stats.goalsOpenPlay,
                    penalty: stats.goalsPenalty,
                    og: stats.ownGoals,
                    defaultValue: '{{openPlay}} open · {{penalty}} pen · {{og}} OG',
                  })}
                  emphasis
                />
                <StatTile
                  label={t('squad.modal.cards')}
                  value={`${stats.yellowCards}/${stats.redCards}`}
                  detail={t('squad.modal.cardsBreakdown', 'Yellow / Red')}
                />
              </div>

              <section aria-labelledby="match-log-heading">
                <div className="flex items-center justify-between mb-3">
                  <h3 id="match-log-heading" className="font-condensed font-bold uppercase tracking-wide text-sm text-slate-700 dark:text-slate-300">
                    {t('squad.modal.matchLog')}
                  </h3>
                  {reversedLog.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setMatchLogExpanded((v) => !v)}
                      className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1 cursor-pointer"
                      aria-expanded={matchLogExpanded}
                    >
                      {matchLogExpanded ? t('squad.modal.collapse') : t('squad.modal.expand')}
                      {matchLogExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                </div>
                <ul className="space-y-1 text-sm">
                  {visibleLog.map((entry, idx) => (
                    <MatchLogRow key={`${entry.month}-${entry.day}-${idx}`} entry={entry} />
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface StatTileProps {
  label: string;
  value: string | number;
  detail?: string;
  emphasis?: boolean;
}

function StatTile({ label, value, detail, emphasis }: StatTileProps) {
  return (
    <div className="rounded-lg bg-white/70 dark:bg-[#1a1a1a]/50 border border-slate-200 dark:border-slate-800 p-3 backdrop-blur-sm">
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">{label}</div>
      <div
        className={`mt-1 text-2xl font-condensed font-bold tabular-nums ${emphasis ? 'text-primary' : 'text-slate-900 dark:text-slate-100'}`}
      >
        {value}
      </div>
      {detail && <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">{detail}</div>}
    </div>
  );
}

interface MatchLogRowProps {
  entry: PlayerMatchAppearance;
}

function MatchLogRow({ entry }: MatchLogRowProps) {
  const { t } = useTranslation();
  const opponent = translateTeamName(entry.opponent, t);
  const appearanceBadge =
    entry.appearance === 'start'
      ? { label: t('squad.modal.start', 'S'), cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' }
      : entry.appearance === 'sub'
        ? { label: t('squad.modal.sub', 'B'), cls: 'bg-slate-500/15 text-slate-600 dark:text-slate-300' }
        : null;

  return (
    <li className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-white/5 dark:hover:bg-white/[0.03]">
      <span className="w-20 shrink-0 text-xs text-slate-500 dark:text-slate-400 tabular-nums uppercase">
        {entry.month.slice(0, 3)} {entry.day}
      </span>
      {appearanceBadge && (
        <span
          className={`inline-flex items-center justify-center size-5 rounded text-[10px] font-bold uppercase ${appearanceBadge.cls}`}
          aria-label={t(`squad.modal.appearance.${entry.appearance}`, entry.appearance)}
        >
          {appearanceBadge.label}
        </span>
      )}
      <span className="flex-1 min-w-0 truncate text-slate-800 dark:text-slate-200">
        {entry.location === 'home' ? '' : '@ '}
        {opponent}
      </span>
      {entry.score && <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{entry.score}</span>}
      {entry.goals > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-primary/15 text-primary text-[10px] font-bold tabular-nums" aria-label={`${entry.goals} goals`}>
          {entry.goals}⚽
        </span>
      )}
      {entry.yellowCard && (
        <span className="inline-block w-2.5 h-3.5 rounded-sm bg-yellow-400" aria-label="yellow card" />
      )}
      {entry.redCard && (
        <span className="inline-block w-2.5 h-3.5 rounded-sm bg-red-500" aria-label="red card" />
      )}
    </li>
  );
}
