import type { VolleyballFormattedStats } from '@/types/events';
import { VolleyballSeasonSummary } from '@/components/stats/VolleyballSeasonSummary';
import { SetBreakdown } from '@/components/stats/SetBreakdown';
import { RecentForm } from '@/components/stats/RecentForm';
import { PerformanceSplit } from '@/components/stats/PerformanceSplit';
import { TopScorers } from '@/components/stats/TopScorers';

interface VolleyballStatsTabProps {
  stats: VolleyballFormattedStats;
  variant?: 'men' | 'women';
}

export function VolleyballStatsTab({ stats, variant = 'men' }: VolleyballStatsTabProps) {
  const recentForm = (
    <RecentForm
      recentForm={stats.recentForm}
      currentStreak={stats.streaks.currentStreak}
      longestWinStreak={stats.streaks.longestWinStreak}
      longestUnbeatenStreak={0}
      hasPlayed={stats.overall.played > 0}
    />
  );

  const seasonSummary = (
    <VolleyballSeasonSummary overall={stats.overall} variant={variant} />
  );

  const performanceSplit = (
    <PerformanceSplit home={stats.home} away={stats.away} showDraws={false} />
  );

  const topScorers = (
    <TopScorers
      scorers={stats.topScorers.map(s => ({ name: s.name, value: s.totalPoints }))}
      unit="points"
    />
  );

  if (variant === 'women') {
    // Women's mockup order: Recent Form → Season Summary → Performance Split → Top Scorers
    return (
      <>
        {recentForm}
        {seasonSummary}
        {performanceSplit}
        {topScorers}
      </>
    );
  }

  // Men's mockup order: Season Summary → Set Breakdown → Recent Form → Performance Split → Top Scorers
  return (
    <>
      {seasonSummary}
      <SetBreakdown
        setsWon={stats.overall.setsWon}
        setsLost={stats.overall.setsLost}
        breakdown={stats.setBreakdown}
      />
      {recentForm}
      {performanceSplit}
      {topScorers}
    </>
  );
}
