/// Port of app/src/lib/volleyball-stats.ts.
library;

import '../data/constants.dart';
import '../data/events_repository.dart';
import '../models/events.dart';
import 'football_stats.dart' show StreakInfo, parseScore;

class VolleyballTeamStats {
  int played = 0, wins = 0, losses = 0;
  int setsWon = 0, setsLost = 0;
  int pointsScored = 0, pointsConceded = 0;
  int get winPercentage => played == 0 ? 0 : (wins / played * 100).round();
  int get setWinPercentage {
    final total = setsWon + setsLost;
    return total == 0 ? 0 : (setsWon / total * 100).round();
  }
}

class VolleyballSetBreakdown {
  int threeZero = 0, threeOne = 0, threeTwo = 0;
  int zeroThree = 0, oneThree = 0, twoThree = 0;
}

class VolleyballFormMatch {
  const VolleyballFormMatch({required this.result, required this.opponent, required this.score, required this.location, required this.month, required this.day});
  final String result; // 'W' | 'L'
  final String opponent;
  final String score;
  final MatchLocation location;
  final String month;
  final int day;
}

class VolleyballHeadToHead {
  VolleyballHeadToHead(this.opponent);
  final String opponent;
  int played = 0, wins = 0, losses = 0, setsWon = 0, setsLost = 0;
}

class VolleyballRecordResult {
  const VolleyballRecordResult({required this.opponent, required this.score, required this.setScores});
  final String opponent;
  final String score;
  final String setScores;
}

class VolleyballTopScorer {
  const VolleyballTopScorer({required this.name, required this.totalPoints, required this.matchesPlayed});
  final String name;
  final int totalPoints;
  final int matchesPlayed;
}

class VolleyballStats {
  VolleyballStats({
    required this.overall,
    required this.home,
    required this.away,
    required this.setBreakdown,
    required this.recentForm,
    required this.headToHead,
    required this.currentStreak,
    required this.longestWinStreak,
    required this.biggestWin,
    required this.heaviestDefeat,
    required this.topScorers,
  });

  final VolleyballTeamStats overall;
  final VolleyballTeamStats home;
  final VolleyballTeamStats away;
  final VolleyballSetBreakdown setBreakdown;
  final List<VolleyballFormMatch> recentForm;
  final List<VolleyballHeadToHead> headToHead;
  final StreakInfo currentStreak;
  final int longestWinStreak;
  final VolleyballRecordResult? biggestWin;
  final VolleyballRecordResult? heaviestDefeat;
  final List<VolleyballTopScorer> topScorers;
}

String _formatSetScores(List<VolleyballSet> sets, MatchLocation location) =>
    sets.map((s) => location == MatchLocation.home ? '${s.home}-${s.away}' : '${s.away}-${s.home}').join(', ');

VolleyballStats calculateVolleyballStats(EventsRepository repo, Sport sport) {
  assert(sport == Sport.volleyballMen || sport == Sport.volleyballWomen);

  final overall = VolleyballTeamStats();
  final home = VolleyballTeamStats();
  final away = VolleyballTeamStats();
  final breakdown = VolleyballSetBreakdown();
  final allForm = <VolleyballFormMatch>[];
  final h2hMap = <String, VolleyballHeadToHead>{};
  final scorerTotals = <String, int>{};
  final scorerMatches = <String, int>{};

  var winStreak = 0, lossStreak = 0, longestWinStreak = 0;
  VolleyballRecordResult? biggestWin, heaviestDefeat;
  var biggestWinMargin = 0, biggestWinRally = 0;
  var heaviestDefeatMargin = 0, heaviestDefeatRally = 0;

  for (final month in monthOrder) {
    for (final ev in repo.eventsFor(month)) {
      if (ev.sport != sport || !ev.isPlayed || ev.score == null) continue;
      final parsed = parseScore(ev.score, ev.location);
      if (parsed == null) continue;
      final (setsFor, setsAgainst) = parsed;
      final result = setsFor > setsAgainst ? 'W' : 'L';

      var rallyFor = 0, rallyAgainst = 0;
      for (final set in ev.sets ?? const <VolleyballSet>[]) {
        if (ev.location == MatchLocation.home) {
          rallyFor += set.home;
          rallyAgainst += set.away;
        } else {
          rallyFor += set.away;
          rallyAgainst += set.home;
        }
      }

      for (final stats in [overall, ev.location == MatchLocation.home ? home : away]) {
        stats.played++;
        if (result == 'W') {
          stats.wins++;
        } else {
          stats.losses++;
        }
        stats.setsWon += setsFor;
        stats.setsLost += setsAgainst;
        stats.pointsScored += rallyFor;
        stats.pointsConceded += rallyAgainst;
      }

      switch ('$setsFor-$setsAgainst') {
        case '3-0': breakdown.threeZero++;
        case '3-1': breakdown.threeOne++;
        case '3-2': breakdown.threeTwo++;
        case '0-3': breakdown.zeroThree++;
        case '1-3': breakdown.oneThree++;
        case '2-3': breakdown.twoThree++;
      }

      allForm.add(VolleyballFormMatch(result: result, opponent: ev.opponent, score: ev.score!, location: ev.location, month: month, day: ev.day));

      final h2h = h2hMap.putIfAbsent(ev.opponent, () => VolleyballHeadToHead(ev.opponent));
      h2h.played++;
      if (result == 'W') {
        h2h.wins++;
      } else {
        h2h.losses++;
      }
      h2h.setsWon += setsFor;
      h2h.setsLost += setsAgainst;

      if (result == 'W') {
        winStreak++;
        lossStreak = 0;
        if (winStreak > longestWinStreak) longestWinStreak = winStreak;
      } else {
        lossStreak++;
        winStreak = 0;
      }

      final setMargin = setsFor - setsAgainst;
      final rallyDiff = rallyFor - rallyAgainst;
      final setScores = ev.sets != null ? _formatSetScores(ev.sets!, ev.location) : '';
      if (setMargin > 0 &&
          (biggestWin == null || setMargin > biggestWinMargin || (setMargin == biggestWinMargin && rallyDiff > biggestWinRally))) {
        biggestWin = VolleyballRecordResult(opponent: ev.opponent, score: ev.score!, setScores: setScores);
        biggestWinMargin = setMargin;
        biggestWinRally = rallyDiff;
      }
      if (setMargin < 0 &&
          (heaviestDefeat == null ||
              setMargin.abs() > heaviestDefeatMargin ||
              (setMargin.abs() == heaviestDefeatMargin && rallyDiff < -heaviestDefeatRally))) {
        heaviestDefeat = VolleyballRecordResult(opponent: ev.opponent, score: ev.score!, setScores: setScores);
        heaviestDefeatMargin = setMargin.abs();
        heaviestDefeatRally = rallyDiff.abs();
      }

      // Top scorers: only our own team's players.
      final ourTeam = ev.location == MatchLocation.home ? 'home' : 'away';
      final seenThisMatch = <String>{};
      for (final scorer in ev.vbScorers ?? const <VolleyballScorer>[]) {
        if (scorer.team != ourTeam) continue;
        scorerTotals[scorer.name] = (scorerTotals[scorer.name] ?? 0) + scorer.points;
        seenThisMatch.add(scorer.name);
      }
      for (final name in seenThisMatch) {
        scorerMatches[name] = (scorerMatches[name] ?? 0) + 1;
      }
    }
  }

  final topScorers = scorerTotals.entries
      .map((e) => VolleyballTopScorer(name: e.key, totalPoints: e.value, matchesPlayed: scorerMatches[e.key] ?? 0))
      .toList()
    ..sort((a, b) => b.totalPoints.compareTo(a.totalPoints));

  return VolleyballStats(
    overall: overall,
    home: home,
    away: away,
    setBreakdown: breakdown,
    recentForm: (allForm.length <= 5 ? allForm : allForm.sublist(allForm.length - 5)).reversed.toList(),
    headToHead: h2hMap.values.toList()..sort((a, b) => b.played.compareTo(a.played)),
    currentStreak: winStreak > 0 ? StreakInfo('W', winStreak) : StreakInfo('L', lossStreak),
    longestWinStreak: longestWinStreak,
    biggestWin: biggestWin,
    heaviestDefeat: heaviestDefeat,
    topScorers: topScorers.length > 10 ? topScorers.sublist(0, 10) : topScorers,
  );
}
