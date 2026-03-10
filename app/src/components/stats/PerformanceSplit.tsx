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
      <div className="grid grid-cols-2 gap-3">
        {rows.map(({ label, data }) => (
          <div
            key={label}
            className="rounded-lg bg-white/5 dark:bg-[#1a1a1a]/50 border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <span className="text-[20px]">{label === 'stats.home' ? '🏠' : '✈️'}</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t(label)}</p>
              <p className="text-lg font-bold">{data.played} <span className="text-xs font-normal text-slate-500">{t('stats.matches')}</span></p>
              <div className="flex gap-2 text-xs font-bold mt-1">
                <span className="text-green-600 dark:text-green-400">{data.wins}{t('stats.w')}</span>
                {showDraws && <span className="text-yellow-500 dark:text-yellow-400">{data.draws}{t('stats.d')}</span>}
                <span className="text-primary">{data.losses}{t('stats.l')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
