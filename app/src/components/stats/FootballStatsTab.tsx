import type { FormattedStats } from '@/types/events';
import type { FotMobParsed } from '@/pages/StatsPage';
import { LeagueTable } from '@/components/stats/LeagueTable';
import { TopScorers } from '@/components/stats/TopScorers';
import { NextMatch } from '@/components/stats/NextMatch';
import { SeasonSummary } from '@/components/stats/SeasonSummary';
import { PerformanceSplit } from '@/components/stats/PerformanceSplit';
import { RecentForm } from '@/components/stats/RecentForm';
import { HeadToHead } from '@/components/stats/HeadToHead';

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

interface FootballStatsTabProps {
  stats: FormattedStats;
  fotmob: FotMobParsed | null;
  loading: boolean;
}

export function FootballStatsTab({ stats, fotmob, loading }: FootballStatsTabProps) {
  return (
    <>
      {/* 1. Next Match (FotMob) */}
      {loading ? <LoadingSkeleton /> : fotmob?.nextMatch ? <NextMatch match={fotmob.nextMatch} /> : null}

      {/* 2. Recent Form */}
      <RecentForm
        recentForm={stats.recentForm}
        currentStreak={stats.currentStreak}
        longestWinStreak={stats.longestWinStreak}
        longestUnbeatenStreak={stats.longestUnbeatenStreak}
        hasPlayed={stats.overall.played > 0}
      />

      {/* 3. Season Summary */}
      <SeasonSummary overall={stats.overall} />

      {/* 4. League Table (FotMob) */}
      {loading ? <LoadingSkeleton /> : fotmob && fotmob.tables.length > 0 ? (
        <LeagueTable tables={fotmob.tables} />
      ) : null}

      {/* 5. Performance Split */}
      <PerformanceSplit home={stats.home} away={stats.away} />

      {/* 6. Top Scorers (FotMob) */}
      {loading ? <LoadingSkeleton /> : fotmob && fotmob.topScorers.length > 0 ? (
        <TopScorers scorers={fotmob.topScorers} />
      ) : null}

      {/* 7. Head to Head */}
      <HeadToHead headToHead={stats.headToHead} />
    </>
  );
}
