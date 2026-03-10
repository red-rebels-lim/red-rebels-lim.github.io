import type { VolleyballFormattedStats } from '@/types/events';
import { VolleyballSeasonSummary } from '@/components/stats/VolleyballSeasonSummary';
import { SetBreakdown } from '@/components/stats/SetBreakdown';
import { RecentForm } from '@/components/stats/RecentForm';
import { PerformanceSplit } from '@/components/stats/PerformanceSplit';
import { TopScorers } from '@/components/stats/TopScorers';

interface VolleyballStatsTabProps {
  stats: VolleyballFormattedStats;
}

export function VolleyballStatsTab({ stats }: VolleyballStatsTabProps) {
  return (
    <>
      {/* 1. Season Summary (win rate + points) */}
      <VolleyballSeasonSummary overall={stats.overall} />

      {/* 2. Set Breakdown */}
      <SetBreakdown
        setsWon={stats.overall.setsWon}
        setsLost={stats.overall.setsLost}
        breakdown={stats.setBreakdown}
      />

      {/* 3. Recent Form */}
      <RecentForm
        recentForm={stats.recentForm}
        currentStreak={stats.streaks.currentStreak}
        longestWinStreak={stats.streaks.longestWinStreak}
        longestUnbeatenStreak={0}
        hasPlayed={stats.overall.played > 0}
      />

      {/* 4. Performance Split (no draws) */}
      <PerformanceSplit home={stats.home} away={stats.away} showDraws={false} />

      {/* 5. Top Scorers (points) */}
      <TopScorers
        scorers={stats.topScorers.map(s => ({ name: s.name, value: s.totalPoints }))}
        unit="points"
      />
    </>
  );
}
