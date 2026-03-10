import { useTranslation } from 'react-i18next';
import type { VolleyballTeamStats } from '@/types/events';

interface VolleyballSeasonSummaryProps {
  overall: VolleyballTeamStats;
  variant?: 'men' | 'women';
}

export function VolleyballSeasonSummary({ overall, variant = 'men' }: VolleyballSeasonSummaryProps) {
  const { t } = useTranslation();

  const heroStats = variant === 'women'
    ? [
        { label: 'stats.totalPoints', value: String(overall.pointsScored) },
        { label: 'stats.setsWon', value: String(overall.setsWon) },
      ]
    : [
        { label: 'stats.winRate', value: `${overall.winPercentage}%` },
        { label: 'stats.totalPoints', value: String(overall.pointsScored) },
      ];

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t('stats.seasonSummary')}</h2>

      {/* Hero stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {heroStats.map((hero) => (
          <div key={hero.label} className="rounded-lg bg-white/5 dark:bg-[#1a1a1a]/50 border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col">
            <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
              {t(hero.label)}
            </span>
            <span className="text-3xl font-bold text-primary">
              {hero.value}
            </span>
          </div>
        ))}
      </div>

      {/* Stats grid (no draws) */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'stats.matches', value: overall.played },
          { label: 'stats.wins', value: overall.wins, color: 'text-green-600 dark:text-green-400' },
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
