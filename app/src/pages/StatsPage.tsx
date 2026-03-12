import { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { cn } from '@/lib/utils';
import { calculateStatistics } from '@/lib/stats';
import { calculateVolleyballStatistics } from '@/lib/volleyball-stats';
import {
  fetchTeamData,
  parseLeagueTables,
  parseTopScorers,
  parseNextMatch,
  parseLeagueRankings,
} from '@/lib/fotmob';
import type {
  FotMobTeamData,
  LeagueTableData,
  TopScorer,
  NextMatchInfo,
  LeagueRanking,
} from '@/lib/fotmob';
import { FootballStatsTab } from '@/components/stats/FootballStatsTab';
import { VolleyballStatsTab } from '@/components/stats/VolleyballStatsTab';

export interface FotMobParsed {
  tables: LeagueTableData[];
  topScorers: TopScorer[];
  nextMatch: NextMatchInfo | null;
  rankings: LeagueRanking[];
}

function parseFotMobData(data: FotMobTeamData): FotMobParsed {
  return {
    tables: parseLeagueTables(data),
    topScorers: parseTopScorers(data),
    nextMatch: parseNextMatch(data),
    rankings: parseLeagueRankings(data),
  };
}

export default function StatsPage() {
  const { t } = useTranslation();
  const stats = useMemo(() => calculateStatistics(), []);
  const mensVolleyball = useMemo(() => calculateVolleyballStatistics('volleyball-men'), []);
  const womensVolleyball = useMemo(() => calculateVolleyballStatistics('volleyball-women'), []);

  const [activeTab, setActiveTab] = useState('football');
  const [fotmob, setFotmob] = useState<FotMobParsed | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const loadFotmob = useCallback(() => {
    setLoading(true);
    setFetchError(false);
    fetchTeamData()
      .then((data) => {
        if (data) {
          setFotmob(parseFotMobData(data));
        } else {
          setFetchError(true);
        }
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadFotmob(); }, [loadFotmob]);

  return (
    <div className="max-w-md mx-auto pb-24">
      <MobileHeader showBack />

      <h1 className="sr-only">{t('nav.stats')}</h1>

      <div className="bg-white/70 dark:bg-transparent backdrop-blur-sm dark:backdrop-blur-none rounded-2xl mx-2 p-3 mt-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{t('nav.stats')}</h2>

        {/* Error banner */}
        {fetchError && !loading && (
          <section role="alert" className="bg-[rgba(244,67,54,0.1)] rounded-2xl p-4 mb-2 border-2 border-[rgba(244,67,54,0.3)] flex items-center justify-between gap-4">
            <p className="text-sm text-red-600 dark:text-red-300">{t('errors.fetchFailed')}</p>
            <button
              onClick={loadFotmob}
              className="text-sm font-bold text-white bg-[#E02520] hover:bg-[#c41f1b] px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              {t('errors.retry')}
            </button>
          </section>
        )}

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
            <FootballStatsTab stats={stats} fotmob={fotmob} loading={loading} />
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
