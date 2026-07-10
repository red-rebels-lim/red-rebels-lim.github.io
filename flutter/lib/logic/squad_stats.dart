/// Port of app/src/lib/football-stats.ts `aggregateSquadStats` (and the
/// alias normalisation from lib/translate.ts `normalisePlayerName`).
///
/// The football scraper's enrichment is inconsistent about whether
/// `lineup.home` is the Nea Salamina side or the actual host team — so the
/// aggregator does not trust the lineup side or the `team` field. It looks up
/// every name through the alias map and counts only those that resolve to a
/// known roster player.
library;

import '../data/constants.dart';
import '../models/events.dart';
import '../models/players.dart';

final _parenAnnotation = RegExp(r'\s*\(.*?\)\s*');
final _whitespace = RegExp(r'\s+');

/// Normalise a player name from events data for lookup: strip parenthetical
/// annotations (e.g. "(Πέναλτι)"), collapse whitespace, trim, uppercase.
/// Mirrors translate.ts `normalisePlayerName`.
String normalisePlayerName(String raw) => raw
    .replaceAll(_parenAnnotation, ' ')
    .replaceAll(_whitespace, ' ')
    .trim()
    .toUpperCase();

/// Normalised name (nameEl, nameEn, every alias) → canonical player key.
Map<String, String> buildAliasMap(List<Player> roster) {
  final map = <String, String>{};
  for (final p in roster) {
    map[normalisePlayerName(p.nameEl)] = p.key;
    map[normalisePlayerName(p.nameEn)] = p.key;
    for (final alias in p.aliases) {
      map[normalisePlayerName(alias)] = p.key;
    }
  }
  return map;
}

/// One entry in a player's per-match log (web `PlayerMatchAppearance`).
class PlayerMatchAppearance {
  const PlayerMatchAppearance({
    required this.month,
    required this.day,
    required this.opponent,
    required this.location,
    required this.score,
    required this.appearance,
    required this.goals,
    required this.yellowCard,
    required this.redCard,
  });

  final String month;
  final int day;
  final String opponent;
  final MatchLocation location;
  final String? score;

  /// 'start' | 'sub' | 'none'
  final String appearance;
  final int goals;
  final bool yellowCard;
  final bool redCard;
}

/// Season totals for one roster player (web `PlayerSeasonStats`).
class PlayerSeasonStats {
  PlayerSeasonStats(this.key);

  final String key;
  int apps = 0;
  int starts = 0;
  int subAppearances = 0;
  int goals = 0;
  int goalsOpenPlay = 0;
  int goalsPenalty = 0;
  int ownGoals = 0;
  int yellowCards = 0;
  int redCards = 0;
  final List<PlayerMatchAppearance> matchLog = [];
}

class _PerMatchTally {
  int goals = 0;
  int goalsOpenPlay = 0;
  int goalsPenalty = 0;
  int ownGoals = 0;
  bool yellow = false;
  bool red = false;
  String appearance = 'none';
}

/// Aggregate per-player season stats from played football events.
///
/// Pure: takes the roster and the month → events map (EventsRepository.byMonth)
/// so tests can feed synthetic data.
Map<String, PlayerSeasonStats> aggregateSquadStats({
  required List<Player> roster,
  required Map<String, List<SportEvent>> eventsByMonth,
}) {
  final aliasMap = buildAliasMap(roster);
  String? resolveKey(String rawName) => aliasMap[normalisePlayerName(rawName)];

  final stats = <String, PlayerSeasonStats>{
    for (final p in roster) p.key: PlayerSeasonStats(p.key),
  };

  for (final month in monthOrder) {
    for (final ev in eventsByMonth[month] ?? const <SportEvent>[]) {
      if (ev.sport != Sport.footballMen) continue;
      if (ev.status != MatchStatus.played) continue;

      final tallies = <String, _PerMatchTally>{};
      _PerMatchTally bump(String key) =>
          tallies.putIfAbsent(key, _PerMatchTally.new);

      _collectAppearances(ev, resolveKey, bump);

      tallies.forEach((key, t) {
        final s = stats.putIfAbsent(key, () => PlayerSeasonStats(key));

        // A player credited with a goal or card must have been on the pitch —
        // if the lineup/subs data didn't capture them, treat as a substitute
        // appearance so totals stay reconcilable with the match log.
        if (t.appearance == 'none' &&
            (t.goals > 0 || t.ownGoals > 0 || t.yellow || t.red)) {
          t.appearance = 'sub';
        }

        if (t.appearance == 'start') s.starts++;
        if (t.appearance == 'sub') s.subAppearances++;
        if (t.appearance != 'none') s.apps++;

        s.goals += t.goals;
        s.goalsOpenPlay += t.goalsOpenPlay;
        s.goalsPenalty += t.goalsPenalty;
        s.ownGoals += t.ownGoals;
        if (t.yellow) s.yellowCards++;
        if (t.red) s.redCards++;

        s.matchLog.add(
          PlayerMatchAppearance(
            month: month,
            day: ev.day,
            opponent: ev.opponent,
            location: ev.location,
            score: ev.score,
            appearance: t.appearance,
            goals: t.goals,
            yellowCard: t.yellow,
            redCard: t.red,
          ),
        );
      });
    }
  }

  return stats;
}

void _collectAppearances(
  SportEvent ev,
  String? Function(String) resolveKey,
  _PerMatchTally Function(String) bump,
) {
  // Both lineup sides — see library doc about untrusted lineup sides.
  for (final lineup in [ev.lineupHome, ev.lineupAway]) {
    for (final lp in lineup ?? const <LineupPlayer>[]) {
      final key = resolveKey(lp.name);
      if (key == null) continue;
      bump(key).appearance = 'start';
    }
  }

  for (final sub in ev.subs ?? const <Substitution>[]) {
    final key = resolveKey(sub.playerOn);
    if (key == null) continue;
    final tally = bump(key);
    if (tally.appearance == 'none') tally.appearance = 'sub';
  }

  for (final sc in ev.scorers ?? const <Scorer>[]) {
    final key = resolveKey(sc.name);
    if (key == null) continue;
    final tally = bump(key);
    if (sc.type == 'og') {
      tally.ownGoals++;
    } else if (sc.type == 'pen') {
      tally.goals++;
      tally.goalsPenalty++;
    } else {
      tally.goals++;
      tally.goalsOpenPlay++;
    }
  }

  for (final b in ev.bookings ?? const <Booking>[]) {
    final key = resolveKey(b.name);
    if (key == null) continue;
    final tally = bump(key);
    if (b.card == 'yellow') tally.yellow = true;
    if (b.card == 'red') tally.red = true;
  }
}
