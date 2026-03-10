import { useTranslation } from 'react-i18next';
import { tApi } from '@/lib/fotmob';

interface ScorerItem {
  name: string;
  goals?: number;
  value?: number;
}

interface TopScorersProps {
  scorers: ScorerItem[];
  unit?: 'goals' | 'points';
}

export function TopScorers({ scorers, unit = 'goals' }: TopScorersProps) {
  const { t } = useTranslation();

  if (scorers.length === 0) return null;

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t('stats.topScorers')}</h2>
      <div className="space-y-2">
        {scorers.map((scorer, i) => {
          const displayValue = scorer.value ?? scorer.goals ?? 0;
          const displayName = unit === 'goals' ? tApi(t, 'players', scorer.name) : scorer.name;

          return (
            <div
              key={scorer.name}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[rgba(224,37,32,0.15)] border border-[rgba(224,37,32,0.3)] flex items-center justify-center text-sm font-bold text-[#E02520] shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-foreground truncate">{displayName}</div>
              </div>
              <div className="text-xl font-black text-[#E02520] shrink-0">
                {displayValue}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
