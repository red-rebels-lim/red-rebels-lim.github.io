import { useTranslation } from 'react-i18next';

interface SplitStats {
  played: number;
  wins: number;
  draws?: number;
  losses: number;
}

interface PerformanceSplitProps {
  home: SplitStats;
  away: SplitStats;
  showDraws?: boolean;
}

export function PerformanceSplit({ home, away, showDraws = true }: PerformanceSplitProps) {
  const { t } = useTranslation();

  const rows = [
    { label: 'stats.home', icon: '🏠', data: home },
    { label: 'stats.away', icon: '✈️', data: away },
  ];

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t('stats.performanceSplit')}</h2>
      <div className="space-y-3">
        {rows.map(({ label, icon, data }) => (
          <div
            key={label}
            className="flex items-center gap-3 bg-white/[0.03] border border-[rgba(224,37,32,0.15)] rounded-lg p-3"
          >
            <span className="text-lg">{icon}</span>
            <div className="flex-1">
              <span className="font-bold text-foreground">{t(label)}</span>
              <span className="text-sm text-muted-foreground ml-2">{data.played} {t('stats.matches')}</span>
            </div>
            <div className="flex gap-3 text-sm font-bold">
              <span className="text-green-400">{data.wins}{t('stats.w')}</span>
              {showDraws && <span className="text-yellow-400">{data.draws}{t('stats.d')}</span>}
              <span className="text-red-400">{data.losses}{t('stats.l')}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
