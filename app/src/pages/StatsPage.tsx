import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { cn } from '@/lib/utils';
import { calculateStatistics } from '@/lib/stats';
import { calculateVolleyballStatistics } from '@/lib/volleyball-stats';
import { FootballStatsTab } from '@/components/stats/FootballStatsTab';
import { VolleyballStatsTab } from '@/components/stats/VolleyballStatsTab';

// The FotMob feed (League Standing / Top Scorers / League Rankings) was
// dropped 2026-07-17: after promotion it kept serving last season. Those
// sections show an empty state until they are generated from our own saved
// match results (planned).
export default function StatsPage() {
  const { t } = useTranslation();
  const stats = useMemo(() => calculateStatistics(), []);
  const mensVolleyball = useMemo(() => calculateVolleyballStatistics('volleyball-men'), []);
  const womensVolleyball = useMemo(() => calculateVolleyballStatistics('volleyball-women'), []);

  const [activeTab, setActiveTab] = useState('football');

  return (
    <div className="w-full mx-auto pb-24">
      <MobileHeader showBack />

      <h1 className="sr-only">{t('nav.stats')}</h1>

      <div className="bg-white/70 dark:bg-transparent backdrop-blur-sm dark:backdrop-blur-none rounded-2xl mx-2 p-3 mt-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{t('nav.stats')}</h2>

        <div role="tablist" className="flex flex-wrap gap-2 py-2">
          {[
            { value: 'football', label: t('stats.mensFootball') },
            { value: 'volleyball-men', label: t('stats.mensVolleyball') },
            { value: 'volleyball-women', label: t('stats.womensVolleyball') },
          ].map((tab) => (
            <button
              key={tab.value}
              id={`tab-${tab.value}`}
              role="tab"
              aria-selected={activeTab === tab.value}
              aria-controls="stats-tabpanel"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold tracking-wide cursor-pointer transition-all',
                activeTab === tab.value
                  ? 'bg-primary text-white'
                  : 'bg-slate-200 dark:bg-[#1a1a1a] text-slate-600 dark:text-slate-400',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div id="stats-tabpanel" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          {activeTab === 'football' && (
            <FootballStatsTab stats={stats} />
          )}
          {activeTab === 'volleyball-men' && (
            <VolleyballStatsTab stats={mensVolleyball} variant="men" />
          )}
          {activeTab === 'volleyball-women' && (
            <VolleyballStatsTab stats={womensVolleyball} variant="women" />
          )}
        </div>
      </div>
    </div>
  );
}
