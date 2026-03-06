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
            <tr className="border-b border-[rgba(224,37,32,0.2)]">
              <th className="text-left py-3 px-3 text-red-300 font-extrabold text-xs uppercase tracking-wide bg-gradient-to-br from-[rgba(224,37,32,0.2)] to-[rgba(185,28,28,0.15)]">{t('stats.opponent')}</th>
              <th className="py-3 px-3 text-red-300 font-extrabold text-xs uppercase tracking-wide bg-gradient-to-br from-[rgba(224,37,32,0.2)] to-[rgba(185,28,28,0.15)]">{t('stats.played')}</th>
              <th className="py-3 px-3 text-red-300 font-extrabold text-xs uppercase tracking-wide bg-gradient-to-br from-[rgba(224,37,32,0.2)] to-[rgba(185,28,28,0.15)]">{t('stats.w')}</th>
              <th className="py-3 px-3 text-red-300 font-extrabold text-xs uppercase tracking-wide bg-gradient-to-br from-[rgba(224,37,32,0.2)] to-[rgba(185,28,28,0.15)]">{t('stats.d')}</th>
              <th className="py-3 px-3 text-red-300 font-extrabold text-xs uppercase tracking-wide bg-gradient-to-br from-[rgba(224,37,32,0.2)] to-[rgba(185,28,28,0.15)]">{t('stats.l')}</th>
              <th className="py-3 px-3 text-red-300 font-extrabold text-xs uppercase tracking-wide bg-gradient-to-br from-[rgba(224,37,32,0.2)] to-[rgba(185,28,28,0.15)]">{t('stats.goalsCol')}</th>
            </tr>
          </thead>
          <tbody>
            {headToHead.slice(0, 10).map((h2h) => (
              <tr key={h2h.opponent} className="border-b border-[rgba(224,37,32,0.2)] hover:bg-[rgba(224,37,32,0.1)] transition-colors">
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
