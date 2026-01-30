import type { FormattedStats, TeamStats, HeadToHead, FormMatch, GoalDistributionEntry, PointsProgressionEntry, StreakInfo, RecordResult } from '@/types/events';
import { eventsData } from '@/data/events';

const MONTH_ORDER = [
  'september', 'october', 'november', 'december',
  'january', 'february', 'march', 'april',
  'may', 'june', 'july', 'august',
];

function parseScore(scoreStr: string, location: string): [number | null, number | null] {
  if (!scoreStr || !scoreStr.includes('-')) return [null, null];
  const parts = scoreStr.split('-').map((s) => parseInt(s.trim()));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return [null, null];
  return location === 'home' ? [parts[0], parts[1]] : [parts[1], parts[0]];
}

export function getMatchResult(
  score: string | undefined,
  location: string | undefined
): 'win' | 'draw' | 'loss' | null {
  if (!score || !location || !score.includes('-')) return null;
  const [gf, ga] = parseScore(score, location);
  if (gf === null || ga === null) return null;
  if (gf > ga) return 'win';
  if (gf < ga) return 'loss';
  return 'draw';
}

export function getFormColor(result: string): string {
  switch (result) {
    case 'W': return '#4CAF50';
    case 'D': return '#FFC107';
    case 'L': return '#F44336';
    default: return '#999';
  }
}

export function calculateStatistics(): FormattedStats {
  const overall: TeamStats = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 };
  const home: TeamStats = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 };
  const away: TeamStats = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 };
  const recentForm: FormMatch[] = [];
  const h2hMap: Record<string, HeadToHead> = {};

  // Collect all football-men played matches
  interface Match {
    month: string;
    day: number;
    opponent: string;
    location: string;
    score: string;
  }
  const matches: Match[] = [];

  for (const monthName of MONTH_ORDER) {
    const events = eventsData[monthName] || [];
    for (const ev of events) {
      if (ev.sport === 'football-men' && ev.status === 'played' && ev.score) {
        matches.push({
          month: monthName,
          day: ev.day,
          opponent: ev.opponent,
          location: ev.location,
          score: ev.score,
        });
      }
    }
  }

  // Already in chronological order since we iterate MONTH_ORDER

  let cleanSheets = 0;
  const goalDistribution: GoalDistributionEntry[] = [];
  const pointsProgression: PointsProgressionEntry[] = [];
  let cumulativePoints = 0;

  // Streak tracking
  let currentStreak: StreakInfo = { type: 'W', count: 0 };
  let longestWinStreak = 0;
  let longestUnbeatenStreak = 0;
  let currentWinStreak = 0;
  let currentUnbeatenStreak = 0;
  let currentLossStreak = 0;
  let currentDrawStreak = 0;

  // Records tracking
  let biggestWin: RecordResult | null = null;
  let heaviestDefeat: RecordResult | null = null;

  for (const match of matches) {
    const [gf, ga] = parseScore(match.score, match.location);
    if (gf === null || ga === null) continue;

    let result: string;
    if (gf > ga) { result = 'W'; overall.wins++; }
    else if (gf < ga) { result = 'L'; overall.losses++; }
    else { result = 'D'; overall.draws++; }

    overall.played++;
    overall.goalsFor += gf;
    overall.goalsAgainst += ga;

    // Clean sheets
    if (ga === 0) cleanSheets++;

    // Goal distribution
    const abbrev = match.opponent.length > 10 ? match.opponent.substring(0, 10) + '\u2026' : match.opponent;
    goalDistribution.push({ match: abbrev, goalsFor: gf, goalsAgainst: ga });

    // Points progression
    const matchPoints = result === 'W' ? 3 : result === 'D' ? 1 : 0;
    cumulativePoints += matchPoints;
    pointsProgression.push({ match: overall.played, points: cumulativePoints, opponent: match.opponent });

    // Streak tracking
    if (result === 'W') {
      currentWinStreak++;
      currentUnbeatenStreak++;
      if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
      if (currentUnbeatenStreak > longestUnbeatenStreak) longestUnbeatenStreak = currentUnbeatenStreak;
      currentStreak = { type: 'W', count: currentWinStreak };
    } else if (result === 'D') {
      currentWinStreak = 0;
      currentUnbeatenStreak++;
      if (currentUnbeatenStreak > longestUnbeatenStreak) longestUnbeatenStreak = currentUnbeatenStreak;
      currentStreak = { type: 'unbeaten', count: currentUnbeatenStreak };
    } else {
      currentWinStreak = 0;
      currentUnbeatenStreak = 0;
    }
    if (result === 'L') {
      currentLossStreak++;
      currentDrawStreak = 0;
      currentStreak = { type: 'L', count: currentLossStreak };
    } else if (result === 'D') {
      currentDrawStreak++;
      currentLossStreak = 0;
      if (currentWinStreak === 0) {
        currentStreak = { type: 'D', count: currentDrawStreak };
      }
    } else {
      currentLossStreak = 0;
      currentDrawStreak = 0;
    }

    // Records: biggest win / heaviest defeat
    const margin = gf - ga;
    if (margin > 0 && (!biggestWin || margin > biggestWin.margin)) {
      biggestWin = { opponent: match.opponent, score: match.score, margin };
    }
    if (margin < 0 && (!heaviestDefeat || margin < heaviestDefeat.margin)) {
      heaviestDefeat = { opponent: match.opponent, score: match.score, margin: Math.abs(margin) };
    }

    const loc = match.location === 'home' ? home : away;
    loc.played++;
    if (result === 'W') loc.wins++;
    else if (result === 'D') loc.draws++;
    else loc.losses++;
    loc.goalsFor += gf;
    loc.goalsAgainst += ga;

    recentForm.push({
      result,
      opponent: match.opponent,
      score: match.score,
      location: match.location,
      month: match.month,
      day: match.day,
    });

    if (!h2hMap[match.opponent]) {
      h2hMap[match.opponent] = { opponent: match.opponent, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
    }
    const h2h = h2hMap[match.opponent];
    h2h.played++;
    h2h.goalsFor += gf;
    h2h.goalsAgainst += ga;
    if (result === 'W') h2h.wins++;
    else if (result === 'D') h2h.draws++;
    else h2h.losses++;
  }

  overall.goalDifference = overall.goalsFor - overall.goalsAgainst;
  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;

  const winPct = (w: number, p: number) => (p === 0 ? 0 : Math.round((w / p) * 100));

  const headToHead = Object.values(h2hMap).sort((a, b) => b.played - a.played);

  const played = overall.played;
  const avgGoalsFor = played === 0 ? 0 : Math.round((overall.goalsFor / played) * 10) / 10;
  const avgGoalsAgainst = played === 0 ? 0 : Math.round((overall.goalsAgainst / played) * 10) / 10;

  return {
    overall: { ...overall, winPercentage: winPct(overall.wins, overall.played), points: overall.wins * 3 + overall.draws },
    home: { ...home, winPercentage: winPct(home.wins, home.played) },
    away: { ...away, winPercentage: winPct(away.wins, away.played) },
    recentForm: recentForm.slice(-5),
    headToHead,
    cleanSheets,
    avgGoalsFor,
    avgGoalsAgainst,
    goalDistribution,
    currentStreak,
    longestWinStreak,
    longestUnbeatenStreak,
    biggestWin,
    heaviestDefeat,
    pointsProgression,
  };
}
