import { useTranslation } from 'react-i18next';
import type { TeamStatsWithPercentage } from '@/types/events';

interface OverallStatsProps {
  overall: TeamStatsWithPercentage;
  cleanSheets: number;
  avgGoalsFor: number;
  avgGoalsAgainst: number;
}

export function OverallStats({ overall, cleanSheets, avgGoalsFor, avgGoalsAgainst }: OverallStatsProps) {
  const { t } = useTranslation();

  const statCards = [
    { label: 'stats.matches', value: overall.played },
    { label: 'stats.wins', value: overall.wins },
    { label: 'stats.draws', value: overall.draws },
    { label: 'stats.losses', value: overall.losses },
    { label: 'stats.goals', value: `${overall.goalsFor}-${overall.goalsAgainst}` },
    { label: 'stats.points', value: overall.points },
    { label: 'stats.cleanSheets', value: cleanSheets },
    { label: 'stats.avgGoalsFor', value: avgGoalsFor },
    { label: 'stats.avgGoalsAgainst', value: avgGoalsAgainst },
  ];

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t('stats.overallStats')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-gradient-to-br from-primary-bg-subtle to-primary-bg-subtle/60 border-2 border-primary-border rounded-xl p-4 text-center transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary-border-emphasis"
          >
            <div className="text-4xl font-black text-primary mb-2 drop-shadow-[0_2px_10px_var(--primary-glow)] tabular-nums font-condensed">
              {card.value}
            </div>
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              {t(card.label)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
