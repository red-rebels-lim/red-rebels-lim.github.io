export type Sport = 'football-men' | 'volleyball-men' | 'volleyball-women' | 'meeting';
export type Location = 'home' | 'away';
export type MatchStatus = 'played' | 'upcoming';
export type Competition = 'league' | 'cup';

export interface SportEvent {
  day: number;
  sport: Sport;
  location: Location;
  opponent: string;
  time: string;
  venue?: string;
  logo?: string;
  status?: MatchStatus;
  score?: string;
  competition?: Competition;
  penalties?: string;
}

export interface CalendarEvent {
  title: string;
  subtitle: string;
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

export type EventsData = Record<string, SportEvent[]>;
export type CalendarData = Record<string, MonthData>;

export interface SportConfig {
  emoji: string;
  name: string;
}

export interface FilterState {
  sport: string;
  location: string;
  status: string;
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
