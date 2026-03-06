import { useTranslation } from 'react-i18next';
import type { TeamStats } from '@/types/events';

interface HomeVsAwayProps {
  home: TeamStats;
  away: TeamStats;
}

export function HomeVsAway({ home, away }: HomeVsAwayProps) {
  const { t } = useTranslation();

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t('stats.homeVsAway')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'stats.home', data: home },
          { label: 'stats.away', data: away },
        ].map(({ label, data }) => (
          <div key={label} className="bg-white/[0.03] rounded-xl p-4 border border-[rgba(224,37,32,0.15)]">
            <h3 className="text-red-300 text-lg font-extrabold uppercase tracking-wide text-center mb-4">
              {t(label)}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: 'stats.wins', v: data.wins, color: 'text-green-400' },
                { l: 'stats.draws', v: data.draws, color: 'text-yellow-400' },
                { l: 'stats.losses', v: data.losses, color: 'text-red-400' },
              ].map((s) => (
                <div key={s.l} className="text-center">
                  <div className={`text-2xl font-black ${s.color}`}>{s.v}</div>
                  <div className="text-xs font-bold text-muted-foreground uppercase">{t(s.l)}</div>
                </div>
              ))}
            </div>
            <div className="text-center mt-3 text-sm text-muted-foreground">
              {t('stats.goals')}: {data.goalsFor}-{data.goalsAgainst} ({data.goalDifference > 0 ? '+' : ''}{data.goalDifference})
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
