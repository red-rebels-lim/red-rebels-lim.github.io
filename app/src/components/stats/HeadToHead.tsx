import { useTranslation } from 'react-i18next';
import type { HeadToHead as HeadToHeadType } from '@/types/events';

interface HeadToHeadProps {
  headToHead: HeadToHeadType[];
}

export function HeadToHead({ headToHead }: HeadToHeadProps) {
  const { t } = useTranslation();

  return (
    <section className="stat-section overflow-x-auto">
      <h2 className="stat-section-title">{t('stats.headToHead')}</h2>
      {headToHead.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">{t('stats.noData')}</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="text-left py-3 px-3 text-xs uppercase text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800/50">{t('stats.opponent')}</th>
              <th className="py-3 px-3 text-xs uppercase text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800/50">{t('stats.played')}</th>
              <th className="py-3 px-3 text-xs uppercase text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800/50">{t('stats.w')}</th>
              <th className="py-3 px-3 text-xs uppercase text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800/50">{t('stats.d')}</th>
              <th className="py-3 px-3 text-xs uppercase text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800/50">{t('stats.l')}</th>
              <th className="py-3 px-3 text-xs uppercase text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800/50">{t('stats.goalsCol')}</th>
            </tr>
          </thead>
          <tbody>
            {headToHead.slice(0, 10).map((h2h) => (
              <tr key={h2h.opponent} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-3 font-bold text-foreground">{h2h.opponent}</td>
                <td className="py-3 px-3 text-center text-muted-foreground">{h2h.played}</td>
                <td className="py-3 px-3 text-center font-bold text-green-400">{h2h.wins}</td>
                <td className="py-3 px-3 text-center font-bold text-yellow-400">{h2h.draws}</td>
                <td className="py-3 px-3 text-center font-bold text-red-400">{h2h.losses}</td>
                <td className="py-3 px-3 text-center text-muted-foreground">{h2h.goalsFor}-{h2h.goalsAgainst}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
