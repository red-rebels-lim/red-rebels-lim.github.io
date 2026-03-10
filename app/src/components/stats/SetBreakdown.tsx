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
          <span className="text-sm font-black text-foreground w-8 text-right">{setsWon}</span>
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
          <span className="text-sm font-black text-foreground w-8 text-right">{setsLost}</span>
        </div>
      </div>

      {/* Win pattern counts */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'stats.threeZero', value: breakdown.threeZero },
          { label: 'stats.threeOne', value: breakdown.threeOne },
          { label: 'stats.threeTwo', value: breakdown.threeTwo },
        ].map((item) => (
          <div key={item.label} className="bg-white/[0.03] border border-[rgba(224,37,32,0.15)] rounded-lg p-3 text-center">
            <div className="text-lg font-black text-foreground">{t(item.label)}</div>
            <div className="text-xl font-black text-[#E02520]">{item.value}</div>
            <div className="text-xs text-muted-foreground">{t('stats.winsCount')}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
