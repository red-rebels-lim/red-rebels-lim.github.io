import { useTranslation } from 'react-i18next';
import type { FormattedStats } from '@/types/events';
import { SeasonSummary } from '@/components/stats/SeasonSummary';
import { PerformanceSplit } from '@/components/stats/PerformanceSplit';
import { RecentForm } from '@/components/stats/RecentForm';
import { HeadToHead } from '@/components/stats/HeadToHead';

/**
 * Placeholder for the sections that used to render FotMob feed data
 * (League Standing, Top Scorers, League Rankings). The feed still served
 * last season after promotion, so these show the standard empty state until
 * they are regenerated from our own saved match results (planned;
 * stakeholder decision 2026-07-17).
 */
function EmptyStatSection({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return (
    <section className="stat-section">
      <h2 className="stat-section-title">{t(titleKey)}</h2>
      <p className="text-muted-foreground text-center">{t('stats.noData')}</p>
    </section>
  );
}

interface FootballStatsTabProps {
  stats: FormattedStats;
}

export function FootballStatsTab({ stats }: FootballStatsTabProps) {
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

      {/* 3. League Table — empty until generated from local results */}
      <EmptyStatSection titleKey="stats.leagueStanding" />

      {/* 5. Performance Split */}
      <PerformanceSplit home={stats.home} away={stats.away} />

      {/* 6. Top Scorers — empty until generated from local results */}
      <EmptyStatSection titleKey="stats.topScorers" />

      {/* 7. League Rankings — empty until generated from local results */}
      <EmptyStatSection titleKey="stats.leagueRankings" />

      {/* 8. Head to Head */}
      <HeadToHead headToHead={stats.headToHead} />
    </>
  );
}
