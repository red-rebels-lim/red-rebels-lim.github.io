import { useTranslation } from 'react-i18next';
import type { RecordResult } from '@/types/events';

interface RecordsProps {
  biggestWin: RecordResult | null;
  heaviestDefeat: RecordResult | null;
}

export function Records({ biggestWin, heaviestDefeat }: RecordsProps) {
  const { t } = useTranslation();

  if (!biggestWin && !heaviestDefeat) return null;

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t('stats.records')}</h2>
      <div className="grid grid-cols-1 gap-6">
        {biggestWin && (
          <div className="bg-gradient-to-br from-[rgba(76,175,80,0.15)] to-[rgba(56,142,60,0.1)] border-2 border-[rgba(76,175,80,0.3)] rounded-xl p-5 text-center">
            <div className="text-xs font-bold text-green-300 uppercase tracking-wider mb-2">{t('stats.biggestWin')}</div>
            <div className="text-2xl font-black text-green-400 mb-1">{biggestWin.score}</div>
            <div className="text-sm font-bold text-muted-foreground">vs {biggestWin.opponent}</div>
          </div>
        )}
        {heaviestDefeat && (
          <div className="bg-gradient-to-br from-[rgba(244,67,54,0.15)] to-[rgba(211,47,47,0.1)] border-2 border-[rgba(244,67,54,0.3)] rounded-xl p-5 text-center">
            <div className="text-xs font-bold text-red-300 uppercase tracking-wider mb-2">{t('stats.heaviestDefeat')}</div>
            <div className="text-2xl font-black text-red-400 mb-1">{heaviestDefeat.score}</div>
            <div className="text-sm font-bold text-muted-foreground">vs {heaviestDefeat.opponent}</div>
          </div>
        )}
      </div>
    </section>
  );
}
