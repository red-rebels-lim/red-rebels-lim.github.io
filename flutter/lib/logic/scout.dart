import '../data/constants.dart';
import '../data/events_repository.dart';
import '../models/events.dart';
import 'football_stats.dart';

/// Opponent-scouting helpers ported from the web `lib/stats.ts`
/// (`getLastMeeting` / `getOpponentH2H`) — QA register row EVT-12.

class ScoutLastMeeting {
  const ScoutLastMeeting({
    required this.score,
    required this.result,
    required this.location,
    required this.month,
    required this.day,
  });

  final String score;
  final MatchResult result;
  final MatchLocation location;
  final String month;
  final int day;
}

/// Most recent played match against [opponent] in [sport], scanning months in
/// reverse chronological order (web `getLastMeeting`). Note: the web computes
/// the result WITHOUT penalties here (a shoot-out win still reads as a draw),
/// so this passes no penalties either.
ScoutLastMeeting? getLastMeeting(EventsRepository events, String opponent, Sport sport) {
  for (final month in monthOrder.reversed) {
    final list = events.eventsFor(month);
    for (var i = list.length - 1; i >= 0; i--) {
      final e = list[i];
      if (e.sport != sport || e.status != MatchStatus.played) continue;
      if (e.score == null || e.score!.isEmpty || e.opponent != opponent) continue;
      final result = matchResult(e.score, e.location);
      if (result == null) continue;
      return ScoutLastMeeting(
        score: e.score!,
        result: result,
        location: e.location,
        month: month,
        day: e.day,
      );
    }
  }
  return null;
}

/// Season head-to-head against [opponent] in [sport] (web `getOpponentH2H`).
/// Null when the teams haven't met yet.
HeadToHead? getOpponentH2H(EventsRepository events, String opponent, Sport sport) {
  HeadToHead? h2h;
  for (final month in monthOrder) {
    for (final e in events.eventsFor(month)) {
      if (e.sport != sport || e.status != MatchStatus.played) continue;
      if (e.opponent != opponent) continue;
      final parsed = parseScore(e.score, e.location);
      if (parsed == null) continue;
      final (gf, ga) = parsed;
      h2h ??= HeadToHead(opponent);
      h2h.played++;
      h2h.goalsFor += gf;
      h2h.goalsAgainst += ga;
      if (gf > ga) {
        h2h.wins++;
      } else if (gf < ga) {
        h2h.losses++;
      } else {
        h2h.draws++;
      }
    }
  }
  return h2h;
}
