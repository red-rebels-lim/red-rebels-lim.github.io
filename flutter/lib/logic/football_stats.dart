/// Port of app/src/lib/stats.ts — league-only football statistics.
library;

import '../data/constants.dart';
import '../data/events_repository.dart';
import '../models/events.dart';

/// Goals (for, against) from our perspective, or null if unparsable.
(int, int)? parseScore(String? score, MatchLocation location) {
  if (score == null || !score.contains('-')) return null;
  final parts = score.split('-').map((s) => int.tryParse(s.trim())).toList();
  if (parts.length != 2 || parts[0] == null || parts[1] == null) return null;
  return location == MatchLocation.home ? (parts[0]!, parts[1]!) : (parts[1]!, parts[0]!);
}

enum MatchResult { win, draw, loss }

MatchResult? matchResult(String? score, MatchLocation location, [String? penalties]) {
  final parsed = parseScore(score, location);
  if (parsed == null) return null;
  final (gf, ga) = parsed;
  if (gf > ga) return MatchResult.win;
  if (gf < ga) return MatchResult.loss;
  if (penalties != null && penalties.contains('-')) {
    final pens = parseScore(penalties, location);
    if (pens != null) {
      if (pens.$1 > pens.$2) return MatchResult.win;
      if (pens.$1 < pens.$2) return MatchResult.loss;
    }
  }
  return MatchResult.draw;
}

class TeamStats {
  int played = 0, wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
  int get goalDifference => goalsFor - goalsAgainst;
  int get winPercentage => played == 0 ? 0 : (wins / played * 100).round();
  int get points => wins * 3 + draws;
}

class FormMatch {
  const FormMatch({required this.result, required this.opponent, required this.score, required this.location, required this.month, required this.day});
  final String result; // 'W' | 'D' | 'L'
  final String opponent;
  final String score;
  final MatchLocation location;
  final String month;
  final int day;
}

class HeadToHead {
  HeadToHead(this.opponent);
  final String opponent;
  int played = 0, wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
}

class StreakInfo {
  const StreakInfo(this.type, this.count);
  final String type; // 'W' | 'D' | 'L' | 'unbeaten'
  final int count;
}

class RecordResult {
  const RecordResult({required this.opponent, required this.score, required this.margin});
  final String opponent;
  final String score;
  final int margin;
}

class PointsProgressionEntry {
  const PointsProgressionEntry({required this.match, required this.points, required this.opponent});
  final int match;
  final int points;
  final String opponent;
}

class FootballStats {
  FootballStats({
    required this.overall,
    required this.home,
    required this.away,
    required this.recentForm,
    required this.headToHead,
    required this.cleanSheets,
    required this.avgGoalsFor,
    required this.avgGoalsAgainst,
    required this.currentStreak,
    required this.longestWinStreak,
    required this.longestUnbeatenStreak,
    required this.biggestWin,
    required this.heaviestDefeat,
    required this.pointsProgression,
  });

  final TeamStats overall;
  final TeamStats home;
  final TeamStats away;
  final List<FormMatch> recentForm;
  final List<HeadToHead> headToHead;
  final int cleanSheets;
  final double avgGoalsFor;
  final double avgGoalsAgainst;
  final StreakInfo currentStreak;
  final int longestWinStreak;
  final int longestUnbeatenStreak;
  final RecordResult? biggestWin;
  final RecordResult? heaviestDefeat;
  final List<PointsProgressionEntry> pointsProgression;
}

FootballStats calculateFootballStats(EventsRepository repo) {
  final overall = TeamStats();
  final home = TeamStats();
  final away = TeamStats();
  final recentForm = <FormMatch>[];
  final h2hMap = <String, HeadToHead>{};
  final pointsProgression = <PointsProgressionEntry>[];

  var cleanSheets = 0;
  var cumulativePoints = 0;
  var currentStreak = const StreakInfo('W', 0);
  var longestWinStreak = 0, longestUnbeatenStreak = 0;
  var winStreak = 0, unbeatenStreak = 0, lossStreak = 0, drawStreak = 0;
  RecordResult? biggestWin, heaviestDefeat;

  for (final month in monthOrder) {
    for (final ev in repo.eventsFor(month)) {
      // League matches only — cup games are excluded from the season stats.
      if (ev.sport != Sport.footballMen || !ev.isPlayed || ev.score == null || ev.isCup || ev.isFriendly) continue;
      final parsed = parseScore(ev.score, ev.location);
      if (parsed == null) continue;
      final (gf, ga) = parsed;

      final String result;
      if (gf > ga) {
        result = 'W';
        overall.wins++;
      } else if (gf < ga) {
        result = 'L';
        overall.losses++;
      } else {
        result = 'D';
        overall.draws++;
      }

      overall.played++;
      overall.goalsFor += gf;
      overall.goalsAgainst += ga;
      if (ga == 0) cleanSheets++;

      cumulativePoints += result == 'W' ? 3 : (result == 'D' ? 1 : 0);
      pointsProgression.add(PointsProgressionEntry(match: overall.played, points: cumulativePoints, opponent: ev.opponent));

      if (result == 'W') {
        winStreak++;
        unbeatenStreak++;
        lossStreak = 0;
        drawStreak = 0;
        if (winStreak > longestWinStreak) longestWinStreak = winStreak;
        if (unbeatenStreak > longestUnbeatenStreak) longestUnbeatenStreak = unbeatenStreak;
        currentStreak = StreakInfo('W', winStreak);
      } else if (result == 'D') {
        winStreak = 0;
        unbeatenStreak++;
        drawStreak++;
        lossStreak = 0;
        if (unbeatenStreak > longestUnbeatenStreak) longestUnbeatenStreak = unbeatenStreak;
        // A draw right after a win reads as an unbeaten run; consecutive
        // draws (or a draw after a loss) read as a draw streak.
        currentStreak = drawStreak == unbeatenStreak ? StreakInfo('D', drawStreak) : StreakInfo('unbeaten', unbeatenStreak);
      } else {
        winStreak = 0;
        unbeatenStreak = 0;
        lossStreak++;
        drawStreak = 0;
        currentStreak = StreakInfo('L', lossStreak);
      }

      final margin = gf - ga;
      if (margin > 0 && (biggestWin == null || margin > biggestWin.margin)) {
        biggestWin = RecordResult(opponent: ev.opponent, score: ev.score!, margin: margin);
      }
      if (margin < 0 && (heaviestDefeat == null || margin.abs() > heaviestDefeat.margin)) {
        heaviestDefeat = RecordResult(opponent: ev.opponent, score: ev.score!, margin: margin.abs());
      }

      final loc = ev.location == MatchLocation.home ? home : away;
      loc.played++;
      if (result == 'W') {
        loc.wins++;
      } else if (result == 'D') {
        loc.draws++;
      } else {
        loc.losses++;
      }
      loc.goalsFor += gf;
      loc.goalsAgainst += ga;

      recentForm.add(FormMatch(result: result, opponent: ev.opponent, score: ev.score!, location: ev.location, month: month, day: ev.day));

      final h2h = h2hMap.putIfAbsent(ev.opponent, () => HeadToHead(ev.opponent));
      h2h.played++;
      h2h.goalsFor += gf;
      h2h.goalsAgainst += ga;
      if (result == 'W') {
        h2h.wins++;
      } else if (result == 'D') {
        h2h.draws++;
      } else {
        h2h.losses++;
      }
    }
  }

  final played = overall.played;
  final headToHead = h2hMap.values.toList()..sort((a, b) => b.played.compareTo(a.played));

  return FootballStats(
    overall: overall,
    home: home,
    away: away,
    recentForm: recentForm.length <= 5 ? recentForm : recentForm.sublist(recentForm.length - 5),
    headToHead: headToHead,
    cleanSheets: cleanSheets,
    avgGoalsFor: played == 0 ? 0 : (overall.goalsFor / played * 10).round() / 10,
    avgGoalsAgainst: played == 0 ? 0 : (overall.goalsAgainst / played * 10).round() / 10,
    currentStreak: currentStreak,
    longestWinStreak: longestWinStreak,
    longestUnbeatenStreak: longestUnbeatenStreak,
    biggestWin: biggestWin,
    heaviestDefeat: heaviestDefeat,
    pointsProgression: pointsProgression,
  );
}
