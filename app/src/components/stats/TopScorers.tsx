import { useTranslation } from 'react-i18next';
import type { TopScorer } from '@/lib/fotmob';
import { tApi } from '@/lib/fotmob';

interface TopScorersProps {
  scorers: TopScorer[];
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function TopScorers({ scorers }: TopScorersProps) {
  const { t } = useTranslation();

  if (scorers.length === 0) return null;

  return (
    <section className="bg-[rgba(10,24,16,0.2)] backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-[rgba(224,37,32,0.3)] shadow-lg">
      <h2 className="text-red-300 text-xl font-extrabold uppercase tracking-wide mb-5">
        {t('stats.topScorers')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {scorers.map((scorer, i) => (
          <div
            key={scorer.name}
            className={`bg-gradient-to-br from-[rgba(224,37,32,0.15)] to-[rgba(185,28,28,0.1)] border-2 border-[rgba(224,37,32,0.3)] rounded-xl p-5 text-center transition-all hover:-translate-y-1 hover:shadow-lg ${
              i === 0 ? 'sm:order-2 sm:scale-105' : i === 1 ? 'sm:order-1' : 'sm:order-3'
            }`}
          >
            <div className="text-3xl mb-2">{MEDALS[i]}</div>
            <div className="text-2xl font-black text-[#E02520] mb-1 drop-shadow-[0_2px_10px_rgba(224,37,32,0.5)]">
              {scorer.goals}
            </div>
            <div className="text-sm font-bold text-foreground">{tApi(t, 'players', scorer.name)}</div>
            <div className="text-xs text-muted-foreground uppercase mt-1">{t('stats.goalsLabel')}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
