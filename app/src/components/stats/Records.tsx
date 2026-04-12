import { useTranslation } from 'react-i18next';
import type { RecordResult } from '@/types/events';
import { translateTeamName } from '@/lib/translate';

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
          <div className="bg-gradient-to-br from-green-500/15 to-green-700/10 border-2 border-green-500/30 rounded-xl p-5 text-center">
            <div className="text-xs font-bold text-green-300 uppercase tracking-wider mb-2">{t('stats.biggestWin')}</div>
            <div className="text-2xl font-black text-green-400 mb-1 font-condensed tabular-nums">{biggestWin.score}</div>
            <div className="text-sm font-bold text-muted-foreground">vs {translateTeamName(biggestWin.opponent, t)}</div>
          </div>
        )}
        {heaviestDefeat && (
          <div className="bg-gradient-to-br from-red-500/15 to-red-700/10 border-2 border-red-500/30 rounded-xl p-5 text-center">
            <div className="text-xs font-bold text-red-300 uppercase tracking-wider mb-2">{t('stats.heaviestDefeat')}</div>
            <div className="text-2xl font-black text-red-400 mb-1 font-condensed tabular-nums">{heaviestDefeat.score}</div>
            <div className="text-sm font-bold text-muted-foreground">vs {translateTeamName(heaviestDefeat.opponent, t)}</div>
          </div>
        )}
      </div>
    </section>
  );
}
