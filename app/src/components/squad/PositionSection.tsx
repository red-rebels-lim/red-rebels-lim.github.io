import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Position } from '@/types/players';

interface PositionSectionProps {
  position: Position;
  count: number;
  children: ReactNode;
}

const POSITION_LABEL_KEY: Record<Position, string> = {
  GK: 'squad.positions.GK',
  DEF: 'squad.positions.DEF',
  MID: 'squad.positions.MID',
  FWD: 'squad.positions.FWD',
};

export function PositionSection({ position, count, children }: PositionSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="stat-section" aria-labelledby={`squad-${position}-heading`}>
      <div className="flex items-baseline justify-between mb-3">
        <h2 id={`squad-${position}-heading`} className="stat-section-title mb-0">
          {t(POSITION_LABEL_KEY[position])}
          <span className="text-slate-400 dark:text-slate-500 font-normal ml-2">({count})</span>
        </h2>
        <div
          className="flex items-baseline gap-3 text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 pr-7 tabular-nums"
          aria-hidden="true"
        >
          <span className="w-7 text-right">{t('squad.colApps')}</span>
          <span className="w-5 text-right">{t('squad.colGoals')}</span>
          <span className="w-5 text-right">{t('squad.colCards')}</span>
        </div>
      </div>
      <div
        className="
          rounded-lg overflow-hidden
          bg-white/70 dark:bg-[#1a1a1a]/50
          border border-slate-200 dark:border-slate-800
          backdrop-blur-sm
          divide-y divide-slate-200 dark:divide-slate-800
        "
      >
        {children}
      </div>
    </section>
  );
}
