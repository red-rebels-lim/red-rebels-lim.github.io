import { useTranslation } from 'react-i18next';
import { getFormColor } from '@/lib/stats';
import type { FormMatch, StreakInfo } from '@/types/events';

interface RecentFormProps {
  recentForm: FormMatch[];
  currentStreak: StreakInfo;
  longestWinStreak: number;
  longestUnbeatenStreak: number;
  hasPlayed: boolean;
}

export function RecentForm({ recentForm }: RecentFormProps) {
  const { t } = useTranslation();

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t('stats.recentForm')}</h2>
      <p className="text-sm text-muted-foreground text-center mb-3">{t('stats.last5Matches')}</p>
      <div className="flex justify-center gap-3 flex-wrap">
        {recentForm.length === 0 ? (
          <p className="text-muted-foreground">{t('stats.noData')}</p>
        ) : (
          recentForm.map((match, i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-white shadow-md cursor-pointer transition-all hover:-translate-y-1 hover:scale-110"
              style={{ background: getFormColor(match.result) }}
              title={`${match.opponent} (${match.score})`}
            >
              {match.result}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
