import { useTranslation } from 'react-i18next';
import type { VolleyballSetBreakdown } from '@/types/events';

interface SetBreakdownProps {
  setsWon: number;
  setsLost: number;
  breakdown: VolleyballSetBreakdown;
}

export function SetBreakdown({ setsWon, setsLost, breakdown }: SetBreakdownProps) {
  const { t } = useTranslation();
  const total = setsWon + setsLost;
  const wonPct = total === 0 ? 0 : (setsWon / total) * 100;
  const lostPct = total === 0 ? 0 : (setsLost / total) * 100;

  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t('stats.setBreakdown')}</h2>

      {/* Horizontal bars */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-muted-foreground w-20 shrink-0">{t('stats.setsWon')}</span>
          <div className="flex-1 h-6 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E02520] rounded-full transition-all"
              style={{ width: `${wonPct}%` }}
              role="progressbar"
              aria-valuenow={setsWon}
              aria-valuemin={0}
              aria-valuemax={total}
            />
          </div>
          <span className="text-sm font-black text-foreground w-8 text-right tabular-nums">{setsWon}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-muted-foreground w-20 shrink-0">{t('stats.setsLost')}</span>
          <div className="flex-1 h-6 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full bg-muted-foreground/30 rounded-full transition-all"
              style={{ width: `${lostPct}%` }}
              role="progressbar"
              aria-valuenow={setsLost}
              aria-valuemin={0}
              aria-valuemax={total}
            />
          </div>
          <span className="text-sm font-black text-foreground w-8 text-right tabular-nums">{setsLost}</span>
        </div>
      </div>

      {/* Win pattern counts */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'stats.threeZero', value: breakdown.threeZero },
          { label: 'stats.threeOne', value: breakdown.threeOne },
          { label: 'stats.threeTwo', value: breakdown.threeTwo },
        ].map((item) => (
          <div key={item.label} className="rounded-lg bg-white/5 dark:bg-[#1a1a1a]/50 border border-slate-200 dark:border-slate-800 p-3 shadow-sm text-center">
            <div className="text-lg font-bold text-foreground">{t(item.label)}</div>
            <div className="text-xl font-bold text-primary">{item.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('stats.winsCount')}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
