export type Sport = 'football-men' | 'volleyball-men' | 'volleyball-women' | 'meeting';
export type Location = 'home' | 'away';
export type MatchStatus = 'played' | 'upcoming';
export type Competition = 'league' | 'cup';

export interface Scorer {
  name: string;
  minute: string;
  team: 'home' | 'away';
  type?: 'pen' | 'og';
}

export interface Booking {
  name: string;
  minute: string;
  team: 'home' | 'away';
  card: 'yellow' | 'red';
}

export interface LineupPlayer {
  name: string;
  number?: number;
  position?: string;
}

export interface Substitution {
  playerOn: string;
  playerOff: string;
  minute: string;
  team: 'home' | 'away';
}

export interface VolleyballSet {
  home: number;
  away: number;
}

export interface VolleyballScorer {
  name: string;
  points: number;
  team: 'home' | 'away';
}

export interface SportEvent {
  day: number;
  sport?: Sport;
  location: Location;
  opponent: string;
  time: string;
  venue?: string;
  logo?: string;
  status?: MatchStatus;
  score?: string;
  competition?: Competition;
  penalties?: string;
  reportEN?: string;
  reportEL?: string;
  scorers?: Scorer[];
  bookings?: Booking[];
  duration?: string;
  matchday?: number;
  lineup?: { home: LineupPlayer[]; away: LineupPlayer[] };
  subs?: Substitution[];
  sets?: VolleyballSet[];
  vbScorers?: VolleyballScorer[];
}

export interface CalendarEvent {
  title: string;
  subtitle: string;
  /** Raw opponent name from events data (Greek, for lookups) */
  opponent: string;
  venue?: string;
  logo?: string;
  status?: MatchStatus;
  score?: string;
  location: Location;
  sport: Sport;
  day: number;
  isMeeting: boolean;
  competition?: Competition;
  penalties?: string;
  reportEN?: string;
  reportEL?: string;
  scorers?: Scorer[];
  bookings?: Booking[];
  duration?: string;
  matchday?: number;
  lineup?: { home: LineupPlayer[]; away: LineupPlayer[] };
  subs?: Substitution[];
  sets?: VolleyballSet[];
  vbScorers?: VolleyballScorer[];
}

export interface CalendarDay {
  number?: number;
  name?: string;
  events?: CalendarEvent[];
  empty?: boolean;
}

export interface MonthData {
  days: CalendarDay[];
}

export interface MonthInfo {
  monthIndex: number;
  year: number;
  daysInMonth: number;
  startDay: number;
}

export type MonthName =
  | 'september' | 'october' | 'november' | 'december'
  | 'january' | 'february' | 'march' | 'april'
  | 'may' | 'june' | 'july' | 'august';

export type EventsData = Partial<Record<MonthName, SportEvent[]>>;
export type CalendarData = Record<string, MonthData>;

export interface SportConfig {
  emoji: string;
  name: string;
}

export interface FilterState {
  sport: Sport | 'all';
  location: Location | 'all';
  status: MatchStatus | 'all';
  search: string;
}

export interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface TeamStatsWithPercentage extends TeamStats {
  winPercentage: number;
  points?: number;
}

export interface FormMatch {
  result: string;
  opponent: string;
  score: string;
  location: string;
  month: string;
  day: number;
}

export interface HeadToHead {
  opponent: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface GoalDistributionEntry {
  match: string;
  opponent: string;
  goalsFor: number;
  goalsAgainst: number;
}

export interface PointsProgressionEntry {
  match: number;
  points: number;
  opponent: string;
}

export interface StreakInfo {
  type: 'W' | 'D' | 'L' | 'unbeaten';
  count: number;
}

export interface RecordResult {
  opponent: string;
  score: string;
  margin: number;
}

export interface FormattedStats {
  overall: TeamStatsWithPercentage;
  home: TeamStatsWithPercentage;
  away: TeamStatsWithPercentage;
  recentForm: FormMatch[];
  headToHead: HeadToHead[];
  cleanSheets: number;
  avgGoalsFor: number;
  avgGoalsAgainst: number;
  goalDistribution: GoalDistributionEntry[];
  currentStreak: StreakInfo;
  longestWinStreak: number;
  longestUnbeatenStreak: number;
  biggestWin: RecordResult | null;
  heaviestDefeat: RecordResult | null;
  pointsProgression: PointsProgressionEntry[];
  error?: string;
}

// --- Volleyball Stats Types ---

export interface VolleyballTeamStats {
  played: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  setWinPercentage: number;
  winPercentage: number;
  pointsScored: number;
  pointsConceded: number;
}

export interface VolleyballSetBreakdown {
  threeZero: number;
  threeOne: number;
  threeTwo: number;
  zeroThree: number;
  oneThree: number;
  twoThree: number;
}

export interface VolleyballFormMatch {
  result: 'W' | 'L';
  opponent: string;
  score: string;
  location: 'home' | 'away';
  month: string;
  day: number;
}

export interface VolleyballHeadToHead {
  opponent: string;
  played: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
}

export interface VolleyballRecordResult {
  opponent: string;
  score: string;
  setScores: string;
}

export interface VolleyballTopScorer {
  name: string;
  totalPoints: number;
  matchesPlayed: number;
}

export interface VolleyballProgressionEntry {
  match: number;
  setsWon: number;
  opponent: string;
}

export interface VolleyballFormattedStats {
  overall: VolleyballTeamStats;
  home: VolleyballTeamStats;
  away: VolleyballTeamStats;
  setBreakdown: VolleyballSetBreakdown;
  recentForm: VolleyballFormMatch[];
  headToHead: VolleyballHeadToHead[];
  streaks: {
    currentStreak: StreakInfo;
    longestWinStreak: number;
  };
  records: {
    biggestWin: VolleyballRecordResult | null;
    heaviestDefeat: VolleyballRecordResult | null;
  };
  topScorers: VolleyballTopScorer[];
  seasonProgress: VolleyballProgressionEntry[];
}
