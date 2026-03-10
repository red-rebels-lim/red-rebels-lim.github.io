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
          const isFirst = i === 0;

          return (
            <div
              key={scorer.name}
              className={`rounded-lg bg-white/5 dark:bg-[#1a1a1a]/50 ${isFirst ? 'border-primary' : 'border-slate-200 dark:border-slate-800'} border p-3 flex items-center justify-between backdrop-blur-sm`}
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-medium text-sm w-4">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                  <span className="text-slate-500 text-[18px]">👤</span>
                </div>
                <span className="font-medium">{displayName}</span>
              </div>
              <span className={`font-bold ${isFirst ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
