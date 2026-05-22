import type { SportEvent } from '@/types/events';
import type { Player, PlayerSeasonStats, PlayerMatchAppearance } from '@/types/players';
import { players as rosterPlayers } from '@/data/players';
import { eventsData } from '@/data/events';
import { MONTH_ORDER } from '@/data/month-config';
import { normalisePlayerName } from './translate';

/**
 * Build a normalised name → canonical key map from the roster. Includes nameEl, nameEn,
 * and every alias declared on each Player record.
 *
 * The football scraper's enrichment is inconsistent about whether `lineup.home` is the
 * Nea Salamina side or the actual host team — so the aggregator below does not trust
 * the lineup side or the `team` field. It looks up every name through this map and
 * counts only those that resolve to a known roster player. Opposing-team names that
 * happen to share spelling with a roster entry are possible but vanishingly rare.
 */
function buildAliasMap(roster: Player[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of roster) {
    map.set(normalisePlayerName(p.nameEl), p.key);
    map.set(normalisePlayerName(p.nameEn), p.key);
    for (const alias of p.aliases ?? []) {
      map.set(normalisePlayerName(alias), p.key);
    }
  }
  return map;
}

interface PerMatchTally {
  goals: number;
  goalsOpenPlay: number;
  goalsPenalty: number;
  ownGoals: number;
  yellow: boolean;
  red: boolean;
  appearance: 'start' | 'sub' | 'none';
}

function emptyTally(): PerMatchTally {
  return {
    goals: 0,
    goalsOpenPlay: 0,
    goalsPenalty: 0,
    ownGoals: 0,
    yellow: false,
    red: false,
    appearance: 'none',
  };
}

function emptyStats(key: string): PlayerSeasonStats {
  return {
    key,
    apps: 0,
    starts: 0,
    subAppearances: 0,
    goals: 0,
    goalsOpenPlay: 0,
    goalsPenalty: 0,
    ownGoals: 0,
    yellowCards: 0,
    redCards: 0,
    matchLog: [],
  };
}

interface AggregateOptions {
  events?: typeof eventsData;
  roster?: Player[];
}

export function aggregateSquadStats(
  options: AggregateOptions = {},
): Map<string, PlayerSeasonStats> {
  const events = options.events ?? eventsData;
  const roster = options.roster ?? rosterPlayers;
  const aliasMap = buildAliasMap(roster);

  const resolveKey = (rawName: string): string | undefined => aliasMap.get(normalisePlayerName(rawName));

  const stats = new Map<string, PlayerSeasonStats>();
  for (const p of roster) stats.set(p.key, emptyStats(p.key));

  for (const month of MONTH_ORDER) {
    const monthEvents = events[month] ?? [];
    for (const ev of monthEvents) {
      if (ev.sport !== 'football-men') continue;
      if (ev.status !== 'played') continue;

      const tallies = new Map<string, PerMatchTally>();
      const bump = (key: string): PerMatchTally => {
        let t = tallies.get(key);
        if (!t) {
          t = emptyTally();
          tallies.set(key, t);
        }
        return t;
      };

      collectAppearances(ev, resolveKey, bump);

      for (const [key, t] of tallies) {
        const s = stats.get(key) ?? emptyStats(key);
        if (!stats.has(key)) stats.set(key, s);

        // A player credited with a goal or card must have been on the pitch — if the
        // lineup/subs data didn't capture them, treat as a substitute appearance so
        // totals stay reconcilable with the match log.
        if (t.appearance === 'none' && (t.goals > 0 || t.ownGoals > 0 || t.yellow || t.red)) {
          t.appearance = 'sub';
        }

        if (t.appearance === 'start') s.starts++;
        else if (t.appearance === 'sub') s.subAppearances++;
        if (t.appearance !== 'none') s.apps++;

        s.goals += t.goals;
        s.goalsOpenPlay += t.goalsOpenPlay;
        s.goalsPenalty += t.goalsPenalty;
        s.ownGoals += t.ownGoals;
        if (t.yellow) s.yellowCards++;
        if (t.red) s.redCards++;

        const log: PlayerMatchAppearance = {
          month,
          day: ev.day,
          opponent: ev.opponent,
          location: ev.location,
          score: ev.score,
          appearance: t.appearance,
          goals: t.goals,
          yellowCard: t.yellow,
          redCard: t.red,
        };
        s.matchLog.push(log);
      }
    }
  }

  return stats;
}

function collectAppearances(
  ev: SportEvent,
  resolveKey: (name: string) => string | undefined,
  bump: (key: string) => PerMatchTally,
): void {
  if (ev.lineup) {
    for (const side of ['home', 'away'] as const) {
      const lineup = ev.lineup[side];
      if (!lineup) continue;
      for (const lp of lineup) {
        const key = resolveKey(lp.name);
        if (!key) continue;
        bump(key).appearance = 'start';
      }
    }
  }

  if (ev.subs) {
    for (const s of ev.subs) {
      const key = resolveKey(s.playerOn);
      if (!key) continue;
      const tally = bump(key);
      if (tally.appearance === 'none') tally.appearance = 'sub';
    }
  }

  if (ev.scorers) {
    for (const sc of ev.scorers) {
      const key = resolveKey(sc.name);
      if (!key) continue;
      const tally = bump(key);
      if (sc.type === 'og') {
        tally.ownGoals++;
      } else if (sc.type === 'pen') {
        tally.goals++;
        tally.goalsPenalty++;
      } else {
        tally.goals++;
        tally.goalsOpenPlay++;
      }
    }
  }

  if (ev.bookings) {
    for (const b of ev.bookings) {
      const key = resolveKey(b.name);
      if (!key) continue;
      const tally = bump(key);
      if (b.card === 'yellow') tally.yellow = true;
      if (b.card === 'red') tally.red = true;
    }
  }
}

export function getPlayerStats(
  key: string,
  precomputed?: Map<string, PlayerSeasonStats>,
): PlayerSeasonStats {
  const map = precomputed ?? aggregateSquadStats();
  return map.get(key) ?? emptyStats(key);
}
