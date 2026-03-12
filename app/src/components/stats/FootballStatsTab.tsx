import type { FormattedStats } from '@/types/events';
import type { FotMobParsed } from '@/pages/StatsPage';
import { LeagueTable } from '@/components/stats/LeagueTable';
import { LeagueRankings } from '@/components/stats/LeagueRankings';
import { TopScorers } from '@/components/stats/TopScorers';
import { SeasonSummary } from '@/components/stats/SeasonSummary';
import { PerformanceSplit } from '@/components/stats/PerformanceSplit';
import { RecentForm } from '@/components/stats/RecentForm';
import { HeadToHead } from '@/components/stats/HeadToHead';

function LoadingSkeleton() {
  return (
    <section className="stat-section min-h-[180px]" role="status">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-[rgba(224,37,32,0.15)] rounded w-1/3" />
        <div className="h-32 bg-[rgba(224,37,32,0.1)] rounded" />
      </div>
      <span className="sr-only">Loading statistics...</span>
    </section>
  );
}

interface FootballStatsTabProps {
  stats: FormattedStats;
  fotmob: FotMobParsed | null;
  loading: boolean;
}

export function FootballStatsTab({ stats, fotmob, loading }: FootballStatsTabProps) {
  return (
    <>
      {/* 1. Season Summary */}
      <SeasonSummary
        overall={stats.overall}
        cleanSheets={stats.cleanSheets}
        avgGoalsFor={stats.avgGoalsFor}
        avgGoalsAgainst={stats.avgGoalsAgainst}
      />

      {/* 2. Recent Form */}
      <RecentForm
        recentForm={stats.recentForm}
        currentStreak={stats.currentStreak}
        longestWinStreak={stats.longestWinStreak}
        longestUnbeatenStreak={stats.longestUnbeatenStreak}
        hasPlayed={stats.overall.played > 0}
      />

      {/* 3. League Table (FotMob) */}
      {loading ? <LoadingSkeleton /> : fotmob && fotmob.tables.length > 0 ? (
        <LeagueTable tables={fotmob.tables} />
      ) : null}

      {/* 5. Performance Split */}
      <PerformanceSplit home={stats.home} away={stats.away} />

      {/* 6. Top Scorers (FotMob) */}
      {loading ? <LoadingSkeleton /> : fotmob && fotmob.topScorers.length > 0 ? (
        <TopScorers scorers={fotmob.topScorers} />
      ) : null}

      {/* 7. League Rankings (FotMob) */}
      {loading ? <LoadingSkeleton /> : fotmob && fotmob.rankings.length > 0 ? (
        <LeagueRankings rankings={fotmob.rankings} />
      ) : null}

      {/* 8. Head to Head */}
      <HeadToHead headToHead={stats.headToHead} />
    </>
  );
}
