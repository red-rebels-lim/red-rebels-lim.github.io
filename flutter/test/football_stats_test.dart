/// Unit tests for lib/logic/football_stats.dart, ported from the web suites
/// app/src/__tests__/lib/stats.test.ts (parseScore/matchResult cases) so the
/// Dart port stays pinned to the same expectations. Pure logic — no assets.
library;

import 'package:flutter_test/flutter_test.dart';

import 'package:red_rebels_calendar/logic/football_stats.dart';
import 'package:red_rebels_calendar/models/events.dart';

import 'stats_fakes.dart';

void main() {
  group('parseScore', () {
    test('normalises home scores to (for, against)', () {
      expect(parseScore('3-1', MatchLocation.home), (3, 1));
      expect(parseScore('0-2', MatchLocation.home), (0, 2));
    });

    test('swaps for away matches (score is home-away order)', () {
      expect(parseScore('1-3', MatchLocation.away), (3, 1));
      expect(parseScore('3-1', MatchLocation.away), (1, 3));
    });

    test('returns null for null score', () {
      expect(parseScore(null, MatchLocation.home), isNull);
    });

    test('returns null for score without dash', () {
      expect(parseScore('invalid', MatchLocation.home), isNull);
    });

    test('returns null for non-numeric score', () {
      expect(parseScore('a-b', MatchLocation.home), isNull);
    });

    test('returns null for empty string', () {
      expect(parseScore('', MatchLocation.home), isNull);
    });

    test('returns null for score with only a dash', () {
      expect(parseScore('-', MatchLocation.home), isNull);
    });

    test('tolerates whitespace around the numbers', () {
      expect(parseScore('2 - 1', MatchLocation.home), (2, 1));
    });
  });

  group('matchResult', () {
    test('win for home team with higher home score', () {
      expect(matchResult('3-1', MatchLocation.home), MatchResult.win);
    });

    test('loss for home team with lower home score', () {
      expect(matchResult('0-2', MatchLocation.home), MatchResult.loss);
    });

    test('draw for equal scores', () {
      expect(matchResult('1-1', MatchLocation.home), MatchResult.draw);
      expect(matchResult('2-2', MatchLocation.away), MatchResult.draw);
    });

    test('win for away team with higher away score', () {
      expect(matchResult('1-3', MatchLocation.away), MatchResult.win);
    });

    test('loss for away team with lower away score', () {
      expect(matchResult('3-1', MatchLocation.away), MatchResult.loss);
    });

    test('null for unparsable scores', () {
      expect(matchResult(null, MatchLocation.home), isNull);
      expect(matchResult('invalid', MatchLocation.home), isNull);
      expect(matchResult('a-b', MatchLocation.home), isNull);
      expect(matchResult('', MatchLocation.home), isNull);
      expect(matchResult('-', MatchLocation.home), isNull);
    });

    test('draw + penalties won (home) → win', () {
      expect(matchResult('1-1', MatchLocation.home, '5-3'), MatchResult.win);
    });

    test('draw + penalties lost (home) → loss', () {
      expect(matchResult('1-1', MatchLocation.home, '3-5'), MatchResult.loss);
    });

    test('draw + penalties won (away, penalties also home-away order) → win', () {
      expect(matchResult('2-2', MatchLocation.away, '2-4'), MatchResult.win);
    });

    test('draw when penalties are also level (edge case)', () {
      expect(matchResult('0-0', MatchLocation.home, '3-3'), MatchResult.draw);
    });

    test('draw when no penalties on a draw', () {
      expect(matchResult('0-0', MatchLocation.home), MatchResult.draw);
    });

    test('penalties are ignored when the score is not a draw', () {
      expect(matchResult('2-1', MatchLocation.home, '0-5'), MatchResult.win);
    });

    test('malformed penalties string leaves the draw standing', () {
      expect(matchResult('1-1', MatchLocation.home, 'x-y'), MatchResult.draw);
      expect(matchResult('1-1', MatchLocation.home, 'nope'), MatchResult.draw);
    });
  });

  group('TeamStats getters', () {
    test('goalDifference, winPercentage and points', () {
      final s = TeamStats()
        ..played = 3
        ..wins = 2
        ..draws = 1
        ..goalsFor = 7
        ..goalsAgainst = 4;
      expect(s.goalDifference, 3);
      expect(s.winPercentage, 67); // round(2/3*100)
      expect(s.points, 7);
    });

    test('zero played → zero percentages, no division error', () {
      final s = TeamStats();
      expect(s.winPercentage, 0);
      expect(s.points, 0);
      expect(s.goalDifference, 0);
    });
  });

  group('calculateFootballStats', () {
    // Season: W(h 3-0) D(a 1-1) L(h 0-2) | W(a 1-3) D(h 2-2) W(h 2-1)
    Future<FootballStats> synthSeason() async {
      final repo = await repoWith({
        'september': [
          football(day: 5, opponent: 'Α', location: 'home', score: '3-0'),
          football(day: 12, opponent: 'Β', location: 'away', score: '1-1'),
          football(day: 19, opponent: 'Γ', location: 'home', score: '0-2'),
        ],
        'october': [
          football(day: 3, opponent: 'Α', location: 'away', score: '1-3'),
          football(day: 10, opponent: 'Δ', location: 'home', score: '2-2'),
          football(day: 17, opponent: 'Β', location: 'home', score: '2-1'),
        ],
      });
      return calculateFootballStats(repo);
    }

    test('overall tallies wins/draws/losses/goals and points', () async {
      final stats = await synthSeason();
      expect(stats.overall.played, 6);
      expect(stats.overall.wins, 3);
      expect(stats.overall.draws, 2);
      expect(stats.overall.losses, 1);
      expect(stats.overall.goalsFor, 11);
      expect(stats.overall.goalsAgainst, 7);
      expect(stats.overall.goalDifference, 4);
      expect(stats.overall.points, 11);
      expect(stats.overall.winPercentage, 50);
    });

    test('home + away split sums to overall', () async {
      final stats = await synthSeason();
      expect(stats.home.played, 4);
      expect(stats.home.wins, 2);
      expect(stats.home.draws, 1);
      expect(stats.home.losses, 1);
      expect(stats.home.goalsFor, 7);
      expect(stats.home.goalsAgainst, 5);
      expect(stats.away.played, 2);
      expect(stats.away.wins, 1);
      expect(stats.away.draws, 1);
      expect(stats.away.losses, 0);
      expect(stats.away.goalsFor, 4);
      expect(stats.away.goalsAgainst, 2);
      expect(stats.home.played + stats.away.played, stats.overall.played);
    });

    test('clean sheets count matches with zero goals against', () async {
      final stats = await synthSeason();
      expect(stats.cleanSheets, 1); // only the 3-0
    });

    test('average goals are rounded to one decimal', () async {
      final stats = await synthSeason();
      expect(stats.avgGoalsFor, 1.8); // 11/6 = 1.833…
      expect(stats.avgGoalsAgainst, 1.2); // 7/6 = 1.167…
    });

    test('points progression is cumulative and one entry per match', () async {
      final stats = await synthSeason();
      expect(stats.pointsProgression.length, stats.overall.played);
      expect(stats.pointsProgression.map((e) => e.points).toList(), [3, 4, 4, 7, 8, 11]);
      expect(stats.pointsProgression.first.match, 1);
      expect(stats.pointsProgression.last.match, 6);
      expect(stats.pointsProgression.first.opponent, 'Α');
    });

    test('recent form keeps the last 5 in chronological order', () async {
      final stats = await synthSeason();
      expect(stats.recentForm.length, 5);
      expect(stats.recentForm.map((f) => f.result).toList(), ['D', 'L', 'W', 'D', 'W']);
      expect(stats.recentForm.first.opponent, 'Β');
      expect(stats.recentForm.last.opponent, 'Β');
      expect(stats.recentForm.last.month, 'october');
      expect(stats.recentForm.last.day, 17);
    });

    test('head-to-head aggregates per opponent, sorted by played desc', () async {
      final stats = await synthSeason();
      expect(stats.headToHead.length, 4);
      for (var i = 1; i < stats.headToHead.length; i++) {
        expect(
          stats.headToHead[i - 1].played,
          greaterThanOrEqualTo(stats.headToHead[i].played),
        );
      }
      final alpha = stats.headToHead.firstWhere((h) => h.opponent == 'Α');
      expect(alpha.played, 2);
      expect(alpha.wins, 2);
      expect(alpha.goalsFor, 6);
      expect(alpha.goalsAgainst, 1);
      final beta = stats.headToHead.firstWhere((h) => h.opponent == 'Β');
      expect(beta.played, 2);
      expect(beta.wins, 1);
      expect(beta.draws, 1);
    });

    test('streak fields over the synthetic season', () async {
      final stats = await synthSeason();
      expect(stats.currentStreak.type, 'W');
      expect(stats.currentStreak.count, 1);
      expect(stats.longestWinStreak, 1);
      expect(stats.longestUnbeatenStreak, 3); // W-D-W at the end
    });

    test('cup matches are excluded from the league stats', () async {
      final repo = await repoWith({
        'september': [
          football(day: 5, opponent: 'Α', score: '2-0'),
          football(day: 12, opponent: 'Β', score: '4-0', competition: 'cup'),
        ],
      });
      final stats = calculateFootballStats(repo);
      expect(stats.overall.played, 1);
      expect(stats.overall.goalsFor, 2);
      expect(stats.biggestWin!.opponent, 'Α');
    });

    test('skips non-football, upcoming, scoreless and unparsable events', () async {
      final repo = await repoWith({
        'september': [
          football(day: 1, score: '1-0'),
          football(day: 2, sport: 'volleyball-men', score: '3-0'),
          football(day: 3, status: 'upcoming'),
          football(day: 4, status: 'played'), // no score
          football(day: 5, score: 'x-y'), // unparsable
        ],
      });
      final stats = calculateFootballStats(repo);
      expect(stats.overall.played, 1);
    });

    test('empty season yields zeroed stats and null records', () async {
      final repo = await repoWith({'september': []});
      final stats = calculateFootballStats(repo);
      expect(stats.overall.played, 0);
      expect(stats.avgGoalsFor, 0);
      expect(stats.avgGoalsAgainst, 0);
      expect(stats.biggestWin, isNull);
      expect(stats.heaviestDefeat, isNull);
      expect(stats.pointsProgression, isEmpty);
      expect(stats.recentForm, isEmpty);
      expect(stats.headToHead, isEmpty);
      expect(stats.cleanSheets, 0);
      // Initial value — never updated when nothing was played.
      expect(stats.currentStreak.type, 'W');
      expect(stats.currentStreak.count, 0);
    });

    group('streak semantics', () {
      test(
        'W then D reads as an unbeaten run '
        '(INTENTIONAL divergence: the web port reports type "D" here — '
        'the Dart port prefers "unbeaten" per the code comment in football_stats.dart)',
        () async {
          final repo = await repoWith({
            'september': [
              football(day: 1, score: '1-0'),
              football(day: 8, score: '1-1'),
            ],
          });
          final stats = calculateFootballStats(repo);
          expect(stats.currentStreak.type, 'unbeaten');
          expect(stats.currentStreak.count, 2);
        },
      );

      test('draws from the start of the run read as a draw streak', () async {
        final repo = await repoWith({
          'september': [
            football(day: 1, score: '1-1'),
            football(day: 8, score: '2-2'),
          ],
        });
        final stats = calculateFootballStats(repo);
        expect(stats.currentStreak.type, 'D');
        expect(stats.currentStreak.count, 2);
      });

      test('a draw right after a loss reads as a draw streak', () async {
        final repo = await repoWith({
          'september': [
            football(day: 1, score: '0-1'),
            football(day: 8, score: '1-1'),
          ],
        });
        final stats = calculateFootballStats(repo);
        expect(stats.currentStreak.type, 'D');
        expect(stats.currentStreak.count, 1);
      });

      test('losses form a loss streak and reset the unbeaten run', () async {
        final repo = await repoWith({
          'september': [
            football(day: 1, score: '1-0'),
            football(day: 8, score: '0-1'),
            football(day: 15, score: '0-2'),
          ],
        });
        final stats = calculateFootballStats(repo);
        expect(stats.currentStreak.type, 'L');
        expect(stats.currentStreak.count, 2);
        expect(stats.longestWinStreak, 1);
        expect(stats.longestUnbeatenStreak, 1);
      });

      test('longest streaks survive being broken later', () async {
        final repo = await repoWith({
          'september': [
            football(day: 1, score: '1-0'),
            football(day: 2, score: '2-0'),
            football(day: 3, score: '3-0'),
            football(day: 4, score: '1-1'),
            football(day: 5, score: '0-1'),
            football(day: 6, score: '1-0'),
          ],
        });
        final stats = calculateFootballStats(repo);
        expect(stats.longestWinStreak, 3);
        expect(stats.longestUnbeatenStreak, 4); // W W W D
        expect(stats.currentStreak.type, 'W');
        expect(stats.currentStreak.count, 1);
      });
    });

    group('records', () {
      test('biggest win / heaviest defeat pick the largest margin', () async {
        final repo = await repoWith({
          'september': [
            football(day: 1, opponent: 'Α', score: '2-0'),
            football(day: 8, opponent: 'Β', score: '5-0'),
            football(day: 15, opponent: 'Γ', score: '0-1'),
            football(day: 22, opponent: 'Δ', location: 'away', score: '4-0'),
          ],
        });
        final stats = calculateFootballStats(repo);
        expect(stats.biggestWin!.opponent, 'Β');
        expect(stats.biggestWin!.margin, 5);
        expect(stats.biggestWin!.score, '5-0');
        expect(stats.heaviestDefeat!.opponent, 'Δ'); // away 4-0 = 0-4 for us
        expect(stats.heaviestDefeat!.margin, 4);
      });

      test('equal margins keep the earlier record (strict greater-than)', () async {
        final repo = await repoWith({
          'september': [
            football(day: 1, opponent: 'ΠΡΩΤΟΣ', score: '2-0'),
            football(day: 8, opponent: 'ΔΕΥΤΕΡΟΣ', score: '3-1'),
            football(day: 15, opponent: 'ΤΡΙΤΟΣ', score: '0-2'),
            football(day: 22, opponent: 'ΤΕΤΑΡΤΟΣ', score: '1-3'),
          ],
        });
        final stats = calculateFootballStats(repo);
        expect(stats.biggestWin!.opponent, 'ΠΡΩΤΟΣ');
        expect(stats.heaviestDefeat!.opponent, 'ΤΡΙΤΟΣ');
      });
    });
  });
}
