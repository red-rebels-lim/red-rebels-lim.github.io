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
          <div key={hero.label} className="bg-gradient-to-br from-[rgba(224,37,32,0.15)] to-[rgba(185,28,28,0.1)] border border-[rgba(224,37,32,0.2)] rounded-xl p-4 text-center">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
              {t(hero.label)}
            </div>
            <div className="text-4xl font-black text-[#E02520] drop-shadow-[0_2px_10px_rgba(224,37,32,0.5)]">
              {hero.value}
            </div>
          </div>
        ))}
      </div>

      {/* Stats grid (no draws) */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'stats.matches', value: overall.played },
          { label: 'stats.wins', value: overall.wins },
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
