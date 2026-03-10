import { useTranslation } from 'react-i18next';
import type { TeamStatsWithPercentage } from '@/types/events';

interface SeasonSummaryProps {
  overall: TeamStatsWithPercentage;
}

export function SeasonSummary({ overall }: SeasonSummaryProps) {
  const { t } = useTranslation();

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t('stats.seasonSummary')}</h2>

      {/* Hero stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg bg-white/5 dark:bg-[#1a1a1a]/50 border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col">
          <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            {t('stats.points')}
          </span>
          <span className="text-3xl font-bold text-primary">
            {overall.points}
          </span>
        </div>
        <div className="rounded-lg bg-white/5 dark:bg-[#1a1a1a]/50 border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col">
          <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            {t('stats.goals')}
          </span>
          <span className="text-3xl font-bold text-primary">
            {overall.goalsFor}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'stats.matches', value: overall.played },
          { label: 'stats.wins', value: overall.wins, color: 'text-green-600 dark:text-green-400' },
          { label: 'stats.draws', value: overall.draws },
          { label: 'stats.losses', value: overall.losses, color: 'text-primary' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg bg-white/5 dark:bg-[#1a1a1a]/50 border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex items-center justify-between"
          >
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t(card.label)}
            </span>
            <span className={`text-lg font-bold ${card.color || ''}`}>
              {card.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
