import { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/layout/Navbar';
import { calculateStatistics } from '@/lib/stats';
import {
  fetchTeamData,
  parseLeagueTables,
  parseTopScorers,
  parseLeagueRankings,
  parseVenueInfo,
  parseNextMatch,
} from '@/lib/fotmob';
import type {
  FotMobTeamData,
  LeagueTableData,
  TopScorer,
  LeagueRanking,
  VenueInfo as VenueInfoType,
  NextMatchInfo,
} from '@/lib/fotmob';
import { LeagueTable } from '@/components/stats/LeagueTable';
import { TopScorers } from '@/components/stats/TopScorers';
import { LeagueRankings } from '@/components/stats/LeagueRankings';
import { VenueInfo } from '@/components/stats/VenueInfo';
import { NextMatch } from '@/components/stats/NextMatch';
import { OverallStats } from '@/components/stats/OverallStats';
import { HomeVsAway } from '@/components/stats/HomeVsAway';
import { RecentForm } from '@/components/stats/RecentForm';
import { HeadToHead } from '@/components/stats/HeadToHead';
import { GoalDistribution } from '@/components/stats/GoalDistribution';
import { Records } from '@/components/stats/Records';
import { SeasonProgress } from '@/components/stats/SeasonProgress';

interface FotMobParsed {
  tables: LeagueTableData[];
  topScorers: TopScorer[];
  rankings: LeagueRanking[];
  venue: VenueInfoType | null;
  nextMatch: NextMatchInfo | null;
}

function parseFotMobData(data: FotMobTeamData): FotMobParsed {
  return {
    tables: parseLeagueTables(data),
    topScorers: parseTopScorers(data),
    rankings: parseLeagueRankings(data),
    venue: parseVenueInfo(data),
    nextMatch: parseNextMatch(data),
  };
}

function LoadingSkeleton() {
  return (
    <section className="stat-section min-h-[180px]">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-[rgba(224,37,32,0.15)] rounded w-1/3" />
        <div className="h-32 bg-[rgba(224,37,32,0.1)] rounded" />
      </div>
    </section>
  );
}

export default function StatsPage() {
  const { t } = useTranslation();
  const stats = useMemo(() => calculateStatistics(), []);

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

      {/* 1. Next Match (FotMob) */}
      {loading ? <LoadingSkeleton /> : fotmob?.nextMatch ? <NextMatch match={fotmob.nextMatch} /> : null}

      {/* 2. League Standing (FotMob) */}
      {loading ? <LoadingSkeleton /> : fotmob && fotmob.tables.length > 0 ? (
        <LeagueTable tables={fotmob.tables} />
      ) : null}

      {/* 3. Overall stats */}
      <OverallStats
        overall={stats.overall}
        cleanSheets={stats.cleanSheets}
        avgGoalsFor={stats.avgGoalsFor}
        avgGoalsAgainst={stats.avgGoalsAgainst}
      />

      {/* 4. League Rankings (FotMob) */}
      {loading ? <LoadingSkeleton /> : fotmob && fotmob.rankings.length > 0 ? (
        <LeagueRankings rankings={fotmob.rankings} />
      ) : null}

      {/* 5. Top Scorers (FotMob) */}
      {loading ? <LoadingSkeleton /> : fotmob && fotmob.topScorers.length > 0 ? (
        <TopScorers scorers={fotmob.topScorers} />
      ) : null}

      {/* 6. Home vs Away */}
      <HomeVsAway home={stats.home} away={stats.away} />

      {/* 7. Recent form + Streaks */}
      <RecentForm
        recentForm={stats.recentForm}
        currentStreak={stats.currentStreak}
        longestWinStreak={stats.longestWinStreak}
        longestUnbeatenStreak={stats.longestUnbeatenStreak}
        hasPlayed={stats.overall.played > 0}
      />

      {/* 8. Head to Head */}
      <HeadToHead headToHead={stats.headToHead} />

      {/* 9. Goal Distribution Chart */}
      <GoalDistribution goalDistribution={stats.goalDistribution} />

      {/* 10. Records */}
      <Records biggestWin={stats.biggestWin} heaviestDefeat={stats.heaviestDefeat} />

      {/* 11. Season Progress Chart */}
      <SeasonProgress pointsProgression={stats.pointsProgression} />

      {/* 12. Venue Info (FotMob) */}
      {fotmob?.venue && <VenueInfo venue={fotmob.venue} />}
    </div>
  );
}
