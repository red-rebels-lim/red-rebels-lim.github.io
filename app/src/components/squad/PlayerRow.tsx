import { ChevronRight, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Player, PlayerSeasonStats } from '@/types/players';

interface PlayerRowProps {
  player: Player;
  stats: PlayerSeasonStats;
  onSelect: (player: Player) => void;
}

export function PlayerRow({ player, stats, onSelect }: PlayerRowProps) {
  const { i18n, t } = useTranslation();
  const displayName = i18n.language === 'el' ? player.nameEl : player.nameEn;
  const cardsTotal = stats.yellowCards + stats.redCards;
  const ariaLabel = t('squad.row.ariaLabel', {
    name: displayName,
    apps: stats.apps,
    goals: stats.goals,
    cards: cardsTotal,
    defaultValue: `{{name}}: {{apps}} appearances, {{goals}} goals, {{cards}} cards`,
  });

  return (
    <button
      type="button"
      onClick={() => onSelect(player)}
      aria-label={ariaLabel}
      className="
        group w-full flex items-center gap-3 px-3 py-3 text-left
        min-h-[56px]
        transition-colors duration-150 motion-reduce:transition-none
        hover:bg-white/5 dark:hover:bg-white/[0.03]
        active:bg-white/10 dark:active:bg-white/[0.06]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset
        cursor-pointer
      "
    >
      <span className="w-8 shrink-0 text-right font-condensed font-bold tabular-nums text-slate-400 dark:text-slate-500">
        {player.shirtNumber ? `#${player.shirtNumber}` : '—'}
      </span>
      <span
        className="size-9 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500"
        aria-hidden="true"
      >
        <User size={20} strokeWidth={2} />
      </span>
      <span className="flex-1 min-w-0 font-condensed font-bold uppercase tracking-wide truncate text-slate-900 dark:text-slate-100">
        {displayName}
      </span>
      <span className="flex items-baseline gap-3 tabular-nums shrink-0" aria-hidden="true">
        <span className="w-7 text-right font-bold text-slate-900 dark:text-slate-100">{stats.apps}</span>
        <span className="w-5 text-right font-bold text-primary">{stats.goals}</span>
        <span className="w-5 text-right font-bold text-slate-500 dark:text-slate-400">{cardsTotal}</span>
      </span>
      <ChevronRight
        size={16}
        strokeWidth={2}
        className="shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-150 motion-reduce:transition-none group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </button>
  );
}
