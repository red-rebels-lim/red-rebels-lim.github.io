import type {
  VolleyballFormattedStats,
  VolleyballTeamStats,
  VolleyballFormMatch,
  VolleyballHeadToHead,
  VolleyballSetBreakdown,
  VolleyballTopScorer,
  VolleyballProgressionEntry,
  VolleyballRecordResult,
  StreakInfo,
  CalendarEvent,
} from '@/types/events';
import { eventsData } from '@/data/events';
import { MONTH_ORDER } from '@/data/month-config';

type VolleyballSport = 'volleyball-men' | 'volleyball-women';

export function parseVolleyballScore(score: string, location: string): [number, number] | null {
  if (!score || !score.includes('-')) return null;
  const parts = score.split('-').map(s => parseInt(s.trim()));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return location === 'home' ? [parts[0], parts[1]] : [parts[1], parts[0]];
}

export function getVolleyballResult(setsFor: number, setsAgainst: number): 'W' | 'L' {
  return setsFor > setsAgainst ? 'W' : 'L';
}

export function calculateSetBreakdown(
  matches: CalendarEvent[],
  location?: string
): VolleyballSetBreakdown {
  const breakdown: VolleyballSetBreakdown = {
    threeZero: 0, threeOne: 0, threeTwo: 0,
    zeroThree: 0, oneThree: 0, twoThree: 0,
  };

  for (const match of matches) {
    if (location && match.location !== location) continue;
    if (!match.score) continue;

    const parsed = parseVolleyballScore(match.score, match.location);
    if (!parsed) continue;
    const [setsFor, setsAgainst] = parsed;

    const key = `${setsFor}-${setsAgainst}`;
    switch (key) {
      case '3-0': breakdown.threeZero++; break;
      case '3-1': breakdown.threeOne++; break;
      case '3-2': breakdown.threeTwo++; break;
      case '0-3': breakdown.zeroThree++; break;
      case '1-3': breakdown.oneThree++; break;
      case '2-3': breakdown.twoThree++; break;
    }
  }

  return breakdown;
}

export function aggregateTopScorers(matches: CalendarEvent[]): VolleyballTopScorer[] {
  const scorerMap: Record<string, { totalPoints: number; matchesPlayed: number }> = {};

  for (const match of matches) {
    if (!match.vbScorers) continue;

    // "Our" team: home when location is home, away when location is away
    const ourTeam = match.location;
    const matchScorers = new Set<string>();

    for (const scorer of match.vbScorers) {
      if (scorer.team !== ourTeam) continue;

      if (!scorerMap[scorer.name]) {
        scorerMap[scorer.name] = { totalPoints: 0, matchesPlayed: 0 };
      }
      scorerMap[scorer.name].totalPoints += scorer.points;
      matchScorers.add(scorer.name);
    }

    // Increment matchesPlayed for each unique player in this match
    for (const name of matchScorers) {
      scorerMap[name].matchesPlayed++;
    }
  }

  return Object.entries(scorerMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 10);
}

function createEmptyTeamStats(): VolleyballTeamStats {
  return {
    played: 0, wins: 0, losses: 0,
    setsWon: 0, setsLost: 0,
    setWinPercentage: 0, winPercentage: 0,
    pointsScored: 0, pointsConceded: 0,
  };
}

function formatSetScores(sets: { home: number; away: number }[], location: string): string {
  return sets.map(s =>
    location === 'home' ? `${s.home}-${s.away}` : `${s.away}-${s.home}`
  ).join(', ');
}

export function calculateVolleyballStatistics(sport: VolleyballSport): VolleyballFormattedStats {
  const overall = createEmptyTeamStats();
  const home = createEmptyTeamStats();
  const away = createEmptyTeamStats();

  interface Match {
    month: string;
    day: number;
    opponent: string;
    location: 'home' | 'away';
    score: string;
    sets?: { home: number; away: number }[];
    vbScorers?: { name: string; points: number; team: 'home' | 'away' }[];
  }

  const matches: Match[] = [];

  for (const monthName of MONTH_ORDER) {
    const events = eventsData[monthName] || [];
    for (const ev of events) {
      if (ev.sport === sport && ev.status === 'played' && ev.score) {
        matches.push({
          month: monthName,
          day: ev.day,
          opponent: ev.opponent,
          location: ev.location,
          score: ev.score,
          sets: ev.sets,
          vbScorers: ev.vbScorers,
        });
      }
    }
  }

  const allForm: VolleyballFormMatch[] = [];
  const h2hMap: Record<string, VolleyballHeadToHead> = {};
  const seasonProgress: VolleyballProgressionEntry[] = [];
  let cumulativeSetsWon = 0;

  // Streak tracking
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let longestWinStreak = 0;

  // Records tracking
  let biggestWin: (VolleyballRecordResult & { margin: number; rallyDiff: number }) | null = null;
  let heaviestDefeat: (VolleyballRecordResult & { margin: number; rallyDiff: number }) | null = null;

  // CalendarEvent array for set breakdown and top scorers
  const calendarEvents: CalendarEvent[] = [];

  for (const match of matches) {
    const parsed = parseVolleyballScore(match.score, match.location);
    if (!parsed) continue;
    const [setsFor, setsAgainst] = parsed;

    const result = getVolleyballResult(setsFor, setsAgainst);

    // Rally points from sets
    let rallyFor = 0;
    let rallyAgainst = 0;
    if (match.sets) {
      for (const set of match.sets) {
        if (match.location === 'home') {
          rallyFor += set.home;
          rallyAgainst += set.away;
        } else {
          rallyFor += set.away;
          rallyAgainst += set.home;
        }
      }
    }

    // Overall stats
    overall.played++;
    if (result === 'W') overall.wins++;
    else overall.losses++;
    overall.setsWon += setsFor;
    overall.setsLost += setsAgainst;
    overall.pointsScored += rallyFor;
    overall.pointsConceded += rallyAgainst;

    // Home/away stats
    const loc = match.location === 'home' ? home : away;
    loc.played++;
    if (result === 'W') loc.wins++;
    else loc.losses++;
    loc.setsWon += setsFor;
    loc.setsLost += setsAgainst;
    loc.pointsScored += rallyFor;
    loc.pointsConceded += rallyAgainst;

    // Form
    allForm.push({
      result,
      opponent: match.opponent,
      score: match.score,
      location: match.location,
      month: match.month,
      day: match.day,
    });

    // Head-to-head
    if (!h2hMap[match.opponent]) {
      h2hMap[match.opponent] = {
        opponent: match.opponent, played: 0, wins: 0, losses: 0,
        setsWon: 0, setsLost: 0,
      };
    }
    const h2h = h2hMap[match.opponent];
    h2h.played++;
    if (result === 'W') h2h.wins++;
    else h2h.losses++;
    h2h.setsWon += setsFor;
    h2h.setsLost += setsAgainst;

    // Streaks
    if (result === 'W') {
      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
    } else {
      currentLossStreak++;
      currentWinStreak = 0;
    }

    // Records
    const setMargin = setsFor - setsAgainst;
    const rallyDiff = rallyFor - rallyAgainst;
    const setScores = match.sets ? formatSetScores(match.sets, match.location) : '';

    if (setMargin > 0) {
      if (!biggestWin || setMargin > biggestWin.margin ||
          (setMargin === biggestWin.margin && rallyDiff > biggestWin.rallyDiff)) {
        biggestWin = { opponent: match.opponent, score: match.score, setScores, margin: setMargin, rallyDiff };
      }
    }
    if (setMargin < 0) {
      const absMargin = Math.abs(setMargin);
      if (!heaviestDefeat || absMargin > heaviestDefeat.margin ||
          (absMargin === heaviestDefeat.margin && rallyDiff < -heaviestDefeat.rallyDiff)) {
        heaviestDefeat = { opponent: match.opponent, score: match.score, setScores, margin: absMargin, rallyDiff: Math.abs(rallyDiff) };
      }
    }

    // Season progress
    cumulativeSetsWon += setsFor;
    seasonProgress.push({ match: overall.played, setsWon: cumulativeSetsWon, opponent: match.opponent });

    // Build CalendarEvent for set breakdown / top scorers
    calendarEvents.push({
      title: '', subtitle: '', opponent: match.opponent,
      sport, day: match.day, isMeeting: false,
      location: match.location,
      score: match.score,
      sets: match.sets,
      vbScorers: match.vbScorers,
    });
  }

  // Percentages
  const pct = (n: number, d: number) => d === 0 ? 0 : Math.round((n / d) * 100);
  overall.winPercentage = pct(overall.wins, overall.played);
  overall.setWinPercentage = pct(overall.setsWon, overall.setsWon + overall.setsLost);
  home.winPercentage = pct(home.wins, home.played);
  home.setWinPercentage = pct(home.setsWon, home.setsWon + home.setsLost);
  away.winPercentage = pct(away.wins, away.played);
  away.setWinPercentage = pct(away.setsWon, away.setsWon + away.setsLost);

  // Current streak
  const currentStreak: StreakInfo = currentWinStreak > 0
    ? { type: 'W', count: currentWinStreak }
    : { type: 'L', count: currentLossStreak };

  // Clean up records (remove internal margin/rallyDiff)
  const cleanRecord = (r: (VolleyballRecordResult & { margin: number; rallyDiff: number }) | null): VolleyballRecordResult | null => {
    if (!r) return null;
    return { opponent: r.opponent, score: r.score, setScores: r.setScores };
  };

  return {
    overall,
    home,
    away,
    setBreakdown: calculateSetBreakdown(calendarEvents),
    recentForm: allForm.slice(-5).reverse(),
    headToHead: Object.values(h2hMap).sort((a, b) => b.played - a.played),
    streaks: { currentStreak, longestWinStreak },
    records: { biggestWin: cleanRecord(biggestWin), heaviestDefeat: cleanRecord(heaviestDefeat) },
    topScorers: aggregateTopScorers(calendarEvents),
    seasonProgress,
  };
}

export function getNextVolleyballMatch(sport: VolleyballSport): {
  opponent: string;
  date: Date;
  location: 'home' | 'away';
  venue?: string;
} | null {
  for (const monthName of MONTH_ORDER) {
    const events = eventsData[monthName] || [];
    for (const ev of events) {
      if (ev.sport === sport && ev.status === 'upcoming') {
        // Get month info for date construction
        const monthMap: Record<string, number> = {
          september: 8, october: 9, november: 10, december: 11,
          january: 0, february: 1, march: 2, april: 3,
          may: 4, june: 5, july: 6, august: 7,
        };
        const monthIndex = monthMap[monthName];
        // Season: sep-dec = start year, jan-aug = end year
        const year = monthIndex >= 8 ? new Date().getFullYear() : new Date().getFullYear() + 1;

        return {
          opponent: ev.opponent,
          date: new Date(year, monthIndex, ev.day),
          location: ev.location,
          venue: ev.venue,
        };
      }
    }
  }
  return null;
}
