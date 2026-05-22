import type { Sport } from './events';

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  key: string;
  sport: Sport;
  active: boolean;
  nameEl: string;
  nameEn: string;
  position: Position;
  subPosition?: 'Central' | 'Wing' | 'Defensive' | 'Attacking';
  shirtNumber?: number;
  dateOfBirth?: string;
  nationality?: string;
  joinedDate?: string;
  leftDate?: string;
  /**
   * Path to a portrait under /images/players/. Omit (or null) to fall back to the
   * silhouette icon. Photos are stored at 192px wide webp; the row/sheet apply
   * object-cover + object-top to crop in on the face.
   */
  photoUrl?: string;
  /**
   * Alternative name forms as they appear in events.ts (lineup, subs, scorers, bookings).
   * The football-stats resolver normalises each entry (whitespace, parenthetical annotations,
   * case) before matching, so list each spotted variant verbatim.
   */
  aliases?: string[];
}

export interface PlayerSeasonStats {
  key: string;
  apps: number;
  starts: number;
  subAppearances: number;
  goals: number;
  goalsOpenPlay: number;
  goalsPenalty: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  matchLog: PlayerMatchAppearance[];
}

export interface PlayerMatchAppearance {
  month: string;
  day: number;
  opponent: string;
  location: 'home' | 'away';
  score?: string;
  appearance: 'start' | 'sub' | 'none';
  goals: number;
  yellowCard: boolean;
  redCard: boolean;
}
