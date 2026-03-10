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
        <div className="bg-gradient-to-br from-[rgba(224,37,32,0.15)] to-[rgba(185,28,28,0.1)] border border-[rgba(224,37,32,0.2)] rounded-xl p-4 text-center">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
            {t('stats.points')}
          </div>
          <div className="text-4xl font-black text-[#E02520] drop-shadow-[0_2px_10px_rgba(224,37,32,0.5)]">
            {overall.points}
          </div>
        </div>
        <div className="bg-gradient-to-br from-[rgba(224,37,32,0.15)] to-[rgba(185,28,28,0.1)] border border-[rgba(224,37,32,0.2)] rounded-xl p-4 text-center">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
            {t('stats.goals')}
          </div>
          <div className="text-4xl font-black text-[#E02520] drop-shadow-[0_2px_10px_rgba(224,37,32,0.5)]">
            {overall.goalsFor}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'stats.matches', value: overall.played },
          { label: 'stats.wins', value: overall.wins },
          { label: 'stats.draws', value: overall.draws },
          { label: 'stats.losses', value: overall.losses },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white/[0.03] border border-[rgba(224,37,32,0.15)] rounded-lg p-3 text-center"
          >
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
              {t(card.label)}
            </div>
            <div className="text-2xl font-black text-foreground">
              {card.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
