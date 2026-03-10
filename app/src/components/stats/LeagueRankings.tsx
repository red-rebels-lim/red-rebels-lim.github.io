import { useTranslation } from 'react-i18next';
import type { LeagueRanking } from '@/lib/fotmob';
import { tApi } from '@/lib/fotmob';

interface LeagueRankingsProps {
  rankings: LeagueRanking[];
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function LeagueRankings({ rankings }: LeagueRankingsProps) {
  const { t, i18n } = useTranslation();

  if (rankings.length === 0) return null;

  const formatRank = (rank: number) => {
    if (i18n.language === 'el') return `${rank}ος`;
    return getOrdinalSuffix(rank);
  };

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t('stats.leagueRankings')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {rankings.map((ranking) => (
          <div
            key={ranking.label}
            className="rounded-lg bg-white/5 dark:bg-[#1a1a1a]/50 border border-slate-200 dark:border-slate-800 p-4 shadow-sm text-center"
          >
            <div className="text-2xl font-bold text-primary mb-1">
              {formatRank(ranking.rank)}
            </div>
            <div className="text-lg font-bold mb-1">{ranking.value}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {tApi(t, 'statHeaders', ranking.label)}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {t('stats.outOf', { total: ranking.totalTeams })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
