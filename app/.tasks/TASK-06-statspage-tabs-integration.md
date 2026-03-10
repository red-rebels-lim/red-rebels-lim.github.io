# TASK-06: StatsPage Sport Selector Tabs & Integration

**Status:** todo
**Depends on:** TASK-03, TASK-04, TASK-05
**Estimated scope:** Medium

## Objective

Refactor `StatsPage.tsx` to add a 3-tab sport selector at the top and render the appropriate stat sections for each sport. This is the integration task that brings everything together.

## Design Reference

All three mockups show pill-style tabs at the top:
- `MEN'S FOOTBALL` (active: red background, white text)
- `MEN'S VOLLEYBALL` (inactive: dark border, muted text)
- `WOMEN'S` (inactive, truncated on mobile - full text "WOMEN'S VOLLEYBALL")

## Implementation

### File: `src/pages/StatsPage.tsx`

#### Current structure (simplified):
```tsx
function StatsPage() {
  const stats = useMemo(() => calculateStatistics(), []);
  const [fotmob, setFotmob] = useState(null);
  // ... fetch FotMob data

  return (
    <div>
      <NextMatch />
      <LeagueTable />
      <OverallStats />
      <LeagueRankings />
      <TopScorers />
      <HomeVsAway />
      <RecentForm />
      <HeadToHead />
      <GoalDistribution />
      <Records />
      <SeasonProgress />
      <VenueInfo />
    </div>
  );
}
```

#### New structure:
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { calculateVolleyballStatistics, getNextVolleyballMatch } from '@/lib/volleyball-stats';

function StatsPage() {
  const [activeTab, setActiveTab] = useState('football-men');

  // Football data (existing)
  const footballStats = useMemo(() => calculateStatistics(), []);
  const [fotmob, setFotmob] = useState(null);

  // Volleyball data (new)
  const vbMenStats = useMemo(() => calculateVolleyballStatistics('volleyball-men'), []);
  const vbWomenStats = useMemo(() => calculateVolleyballStatistics('volleyball-women'), []);
  const vbMenNextMatch = useMemo(() => getNextVolleyballMatch('volleyball-men'), []);
  const vbWomenNextMatch = useMemo(() => getNextVolleyballMatch('volleyball-women'), []);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="football-men">{t('stats.mensFootball')}</TabsTrigger>
        <TabsTrigger value="volleyball-men">{t('stats.mensVolleyball')}</TabsTrigger>
        <TabsTrigger value="volleyball-women">{t('stats.womensVolleyball')}</TabsTrigger>
      </TabsList>

      <TabsContent value="football-men">
        <FootballStatsTab stats={footballStats} fotmob={fotmob} />
      </TabsContent>

      <TabsContent value="volleyball-men">
        <VolleyballStatsTab stats={vbMenStats} nextMatch={vbMenNextMatch} />
      </TabsContent>

      <TabsContent value="volleyball-women">
        <VolleyballStatsTab stats={vbWomenStats} nextMatch={vbWomenNextMatch} />
      </TabsContent>
    </Tabs>
  );
}
```

### Tab styling

The `TabsList` and `TabsTrigger` in `components/ui/tabs.tsx` already have the right base styling (see current implementation). But the mockup uses **pill-style tabs**, not underline tabs. Two options:

**Option A:** Override via className on TabsList/TabsTrigger:
```tsx
<TabsList className="flex gap-2 border-none bg-transparent px-4 py-2">
  <TabsTrigger
    value="football-men"
    className="rounded-full px-4 py-2 text-xs font-bold uppercase
               border border-white/20 data-[state=active]:bg-[#E02520]
               data-[state=active]:border-[#E02520] data-[state=active]:text-white"
  >
```

**Option B:** Create a variant in tabs.tsx for pill style. Prefer Option A to avoid modifying shared UI components.

### Extract tab content into sub-components

To keep StatsPage clean, extract:

#### `src/components/stats/FootballStatsTab.tsx`
```tsx
interface FootballStatsTabProps {
  stats: FormattedStats;
  fotmob: FotMobParsed | null;
  loading: boolean;
  fetchError: string | null;
  onRetry: () => void;
}

function FootballStatsTab({ stats, fotmob, loading, fetchError, onRetry }: FootballStatsTabProps) {
  return (
    <>
      {fotmob?.nextMatch && <NextMatch match={fotmob.nextMatch} />}
      <RecentForm recentForm={stats.recentForm} />
      <SeasonSummary overall={stats.overall} />
      {fotmob?.tables && <LeagueTable tables={fotmob.tables} compact />}
      <PerformanceSplit home={stats.home} away={stats.away} showDraws />
      <TopScorers scorers={fotmob?.scorers ?? []} unit="goals" />
    </>
  );
}
```

#### `src/components/stats/VolleyballStatsTab.tsx`
```tsx
interface VolleyballStatsTabProps {
  stats: VolleyballFormattedStats;
  nextMatch: VolleyballNextMatchInfo | null;
}

function VolleyballStatsTab({ stats, nextMatch }: VolleyballStatsTabProps) {
  return (
    <>
      {nextMatch && <NextMatch match={nextMatch} />}
      <RecentForm recentForm={stats.recentForm} />
      <VolleyballSeasonSummary overall={stats.overall} />
      <SetBreakdown
        setsWon={stats.overall.setsWon}
        setsLost={stats.overall.setsLost}
        breakdown={stats.setBreakdown}
      />
      <PerformanceSplit home={stats.home} away={stats.away} showDraws={false} />
      <TopScorers scorers={stats.topScorers} unit="points" />
    </>
  );
}
```

### FotMob data fetching optimization

Currently FotMob is fetched on page load. Since it's only needed for football:
- **Option A (simple):** Keep current behavior - fetch on mount, only used in football tab
- **Option B (optimized):** Only fetch when football tab is active (lazy fetch)
- Recommend **Option A** for simplicity - the data is cached for 5 min anyway

### URL routing for tabs

Consider preserving tab state in URL hash for shareability:
- `/stats` → defaults to football
- `/stats#volleyball-men` → opens volleyball men tab
- `/stats#volleyball-women` → opens volleyball women tab

This can be done by reading `window.location.hash` on mount and syncing `activeTab`.

### Swipe navigation between tabs

Reuse the `SwipeTabs` pattern from `EventPopover.tsx` to allow swiping between sport tabs on mobile. This was already implemented in the previous session.

## Acceptance Criteria

- [ ] 3 sport tabs displayed at top of stats page
- [ ] Football tab shows redesigned layout (TASK-04)
- [ ] Men's Volleyball tab shows volleyball stats with set breakdown
- [ ] Women's Volleyball tab shows volleyball stats
- [ ] Tab state persists when switching (no unnecessary re-renders)
- [ ] Swipe works between tabs on mobile
- [ ] FotMob loading/error states still work for football tab
- [ ] Empty state handled when no data for a sport
- [ ] i18n translations used for all labels
- [ ] Dark and light theme both work
- [ ] Build passes
- [ ] Existing unit tests still pass
