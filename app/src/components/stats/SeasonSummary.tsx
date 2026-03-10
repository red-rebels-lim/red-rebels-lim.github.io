import { useTranslation } from 'react-i18next';
import type { TeamStatsWithPercentage } from '@/types/events';

interface SeasonSummaryProps {
  overall: TeamStatsWithPercentage;
  cleanSheets: number;
  avgGoalsFor: number;
  avgGoalsAgainst: number;
}

export function SeasonSummary({ overall, cleanSheets, avgGoalsFor, avgGoalsAgainst }: SeasonSummaryProps) {
  const { t } = useTranslation();

  const cards = [
    { label: 'stats.matches', value: overall.played },
    { label: 'stats.wins', value: overall.wins, color: 'text-green-600 dark:text-green-400' },
    { label: 'stats.draws', value: overall.draws },
    { label: 'stats.losses', value: overall.losses, color: 'text-primary' },
    { label: 'stats.goals', value: `${overall.goalsFor}-${overall.goalsAgainst}` },
    { label: 'stats.points', value: overall.points, color: 'text-primary' },
    { label: 'stats.cleanSheets', value: cleanSheets },
    { label: 'stats.avgGoalsFor', value: avgGoalsFor.toFixed(1) },
    { label: 'stats.avgGoalsAgainst', value: avgGoalsAgainst.toFixed(1) },
  ];

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t('stats.seasonSummary')}</h2>

      <div className="grid grid-cols-3 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg bg-white/5 dark:bg-[#1a1a1a]/50 border border-slate-200 dark:border-slate-800 p-3 shadow-sm text-center"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
              {t(card.label)}
            </div>
            <div className={`text-xl font-bold ${card.color || ''}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
