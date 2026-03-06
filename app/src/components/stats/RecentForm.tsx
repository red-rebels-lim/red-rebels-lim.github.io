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

export function RecentForm({ recentForm, currentStreak, longestWinStreak, longestUnbeatenStreak, hasPlayed }: RecentFormProps) {
  const { t } = useTranslation();

  const streakLabel = (s: StreakInfo) => {
    switch (s.type) {
      case 'W': return `${s.count} ${t('stats.wins').toLowerCase()}`;
      case 'D': return `${s.count} ${t('stats.draws').toLowerCase()}`;
      case 'L': return `${s.count} ${t('stats.losses').toLowerCase()}`;
      case 'unbeaten': return `${s.count} ${t('stats.longestUnbeatenStreak').toLowerCase()}`;
    }
  };

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t('stats.recentForm')}</h2>
      <div className="flex justify-center gap-3 flex-wrap mb-4">
        {recentForm.length === 0 ? (
          <p className="text-muted-foreground">{t('stats.noData')}</p>
        ) : (
          recentForm.map((match, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white shadow-md cursor-pointer transition-all hover:-translate-y-1 hover:scale-110"
              style={{ background: getFormColor(match.result) }}
              title={`${match.opponent} (${match.score})`}
            >
              {match.result}
            </div>
          ))
        )}
      </div>
      <div className="flex justify-center gap-6 flex-wrap text-sm mb-4">
        {[
          { label: 'W', color: '#4CAF50', text: t('stats.wins') },
          { label: 'D', color: '#FFC107', text: t('stats.draws') },
          { label: 'L', color: '#F44336', text: t('stats.losses') },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-muted-foreground font-semibold">
            <div className="w-7 h-7 rounded flex items-center justify-center text-sm font-black text-white" style={{ background: item.color }}>
              {item.label}
            </div>
            {item.text}
          </div>
        ))}
      </div>

      {hasPlayed && (
        <div className="border-t border-[rgba(224,37,32,0.2)] pt-4 mt-2">
          <h3 className="text-red-300 text-sm font-extrabold uppercase tracking-wide text-center mb-3">
            {t('stats.streaks')}
          </h3>
          <div className="flex justify-center gap-6 flex-wrap text-sm text-muted-foreground">
            <div className="text-center">
              <div className="text-lg font-black text-foreground">{streakLabel(currentStreak)}</div>
              <div className="text-xs font-bold uppercase">{t('stats.currentStreak')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-green-400">{longestWinStreak}</div>
              <div className="text-xs font-bold uppercase">{t('stats.longestWinStreak')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-blue-400">{longestUnbeatenStreak}</div>
              <div className="text-xs font-bold uppercase">{t('stats.longestUnbeatenStreak')}</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
