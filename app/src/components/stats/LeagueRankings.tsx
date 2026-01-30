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
    <section className="bg-[rgba(10,24,16,0.2)] backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-[rgba(224,37,32,0.3)] shadow-lg">
      <h2 className="text-red-300 text-xl font-extrabold uppercase tracking-wide mb-5">
        {t('stats.leagueRankings')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {rankings.map((ranking) => (
          <div
            key={ranking.label}
            className="bg-gradient-to-br from-[rgba(224,37,32,0.15)] to-[rgba(185,28,28,0.1)] border-2 border-[rgba(224,37,32,0.3)] rounded-xl p-4 text-center transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[rgba(224,37,32,0.5)]"
          >
            <div className="text-2xl font-black text-[#E02520] mb-1 drop-shadow-[0_2px_10px_rgba(224,37,32,0.5)]">
              {formatRank(ranking.rank)}
            </div>
            <div className="text-lg font-bold text-foreground mb-1">{ranking.value}</div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {tApi(t, 'statHeaders', ranking.label)}
            </div>
            <div className="text-xs text-muted-foreground/60 mt-1">
              {t('stats.outOf', { total: ranking.totalTeams })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
