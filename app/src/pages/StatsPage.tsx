import { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/layout/Navbar';
import { cn } from '@/lib/utils';
import { calculateStatistics } from '@/lib/stats';
import { calculateVolleyballStatistics } from '@/lib/volleyball-stats';
import {
  fetchTeamData,
  parseLeagueTables,
  parseTopScorers,
  parseNextMatch,
} from '@/lib/fotmob';
import type {
  FotMobTeamData,
  LeagueTableData,
  TopScorer,
  NextMatchInfo,
} from '@/lib/fotmob';
import { FootballStatsTab } from '@/components/stats/FootballStatsTab';
import { VolleyballStatsTab } from '@/components/stats/VolleyballStatsTab';

interface FotMobParsed {
  tables: LeagueTableData[];
  topScorers: TopScorer[];
  nextMatch: NextMatchInfo | null;
}

function parseFotMobData(data: FotMobTeamData): FotMobParsed {
  return {
    tables: parseLeagueTables(data),
    topScorers: parseTopScorers(data),
    nextMatch: parseNextMatch(data),
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
    <div className="max-w-[1800px] w-[95%] mx-auto">
      <Navbar />

      <h1 className="sr-only">{t('nav.stats')}</h1>

      {/* Error banner */}
      {fetchError && !loading && (
        <section className="bg-[rgba(244,67,54,0.1)] backdrop-blur-sm rounded-2xl p-4 mb-6 border-2 border-[rgba(244,67,54,0.3)] flex items-center justify-between gap-4">
          <p className="text-sm text-red-300">{t('errors.fetchFailed')}</p>
          <button
            onClick={loadFotmob}
            className="text-sm font-bold text-white bg-[#E02520] hover:bg-[#c41f1b] px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            {t('errors.retry')}
          </button>
        </section>
      )}

      <div role="tablist" className="flex overflow-x-auto border-b border-white/10 dark:border-white/10 light:border-slate-200 no-scrollbar">
        {[
          { value: 'football', label: t('stats.mensFootball') },
          { value: 'volleyball-men', label: t('stats.mensVolleyball') },
          { value: 'volleyball-women', label: t('stats.womensVolleyball') },
        ].map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'whitespace-nowrap px-2.5 py-3 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border-b-2',
              activeTab === tab.value
                ? 'text-white border-[#E02520]'
                : 'border-transparent text-white/60',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'football' && (
        <FootballStatsTab stats={stats} fotmob={fotmob} loading={loading} />
      )}
      {activeTab === 'volleyball-men' && (
        <VolleyballStatsTab stats={mensVolleyball} />
      )}
      {activeTab === 'volleyball-women' && (
        <VolleyballStatsTab stats={womensVolleyball} />
      )}
    </div>
  );
}
