/// Unit tests for lib/logic/volleyball_stats.dart, ported from the web suite
/// app/src/__tests__/lib/volleyball-stats.test.ts (set breakdown, top-scorer
/// aggregation, records, home/away splits) so the Dart port stays pinned to
/// the same expectations. Pure logic — no assets.
library;

import 'package:flutter_test/flutter_test.dart';

import 'package:red_rebels_calendar/logic/football_stats.dart' show parseScore;
import 'package:red_rebels_calendar/logic/volleyball_stats.dart';
import 'package:red_rebels_calendar/models/events.dart';

import 'stats_fakes.dart';

Map<String, Object?> scorer(String name, int points, String team) =>
    {'name': name, 'points': points, 'team': team};

void main() {
  group('set score parsing (shared parseScore)', () {
    test('returns (setsFor, setsAgainst) for home team', () {
      expect(parseScore('3-1', MatchLocation.home), (3, 1));
      expect(parseScore('3-0', MatchLocation.home), (3, 0));
      expect(parseScore('0-3', MatchLocation.home), (0, 3));
    });

    test('swaps for away team', () {
      expect(parseScore('3-1', MatchLocation.away), (1, 3));
      expect(parseScore('2-3', MatchLocation.away), (3, 2));
    });

    test('rejects malformed scores', () {
      expect(parseScore('', MatchLocation.home), isNull);
      expect(parseScore('invalid', MatchLocation.home), isNull);
      expect(parseScore('a-b', MatchLocation.home), isNull);
      expect(parseScore('-', MatchLocation.home), isNull);
    });
  });

  group('VolleyballTeamStats getters', () {
    test('winPercentage and setWinPercentage round correctly', () {
      final s = VolleyballTeamStats()
        ..played = 3
        ..wins = 2
        ..losses = 1
        ..setsWon = 6
        ..setsLost = 2;
      expect(s.winPercentage, 67);
      expect(s.setWinPercentage, 75);
    });

    test('zero played / zero sets → 0, no division error', () {
      final s = VolleyballTeamStats();
      expect(s.winPercentage, 0);
      expect(s.setWinPercentage, 0);
    });
  });

  group('calculateVolleyballStats', () {
    test('set breakdown counts all six buckets (web mock parity)', () async {
      // Mirrors the calculateSetBreakdown mock from volleyball-stats.test.ts:
      // home 3-0 W, home 3-1 W, away 2-3 → 3-2 W,
      // home 0-3 L, away 3-1 → 1-3 L, home 2-3 L.
      final repo = await repoWith({
        'october': [
          volleyball(day: 1, score: '3-0', location: 'home'),
          volleyball(day: 2, score: '3-1', location: 'home'),
          volleyball(day: 3, score: '2-3', location: 'away'),
          volleyball(day: 4, score: '0-3', location: 'home'),
          volleyball(day: 5, score: '3-1', location: 'away'),
          volleyball(day: 6, score: '2-3', location: 'home'),
        ],
      });
      final stats = calculateVolleyballStats(repo, Sport.volleyballMen);
      final sb = stats.setBreakdown;
      expect(sb.threeZero, 1);
      expect(sb.threeOne, 1);
      expect(sb.threeTwo, 1);
      expect(sb.zeroThree, 1);
      expect(sb.oneThree, 1);
      expect(sb.twoThree, 1);
      // Breakdown sums reconcile with wins/losses.
      expect(sb.threeZero + sb.threeOne + sb.threeTwo, stats.overall.wins);
      expect(sb.zeroThree + sb.oneThree + sb.twoThree, stats.overall.losses);
      expect(stats.overall.played, 6);
    });

    test('home/away split, sets and rally points accumulate from sets[]', () async {
      final repo = await repoWith({
        'october': [
          volleyball(
            day: 1,
            opponent: 'Α',
            location: 'home',
            score: '3-1',
            sets: [[25, 20], [25, 22], [23, 25], [25, 15]],
          ),
          volleyball(
            day: 8,
            opponent: 'Β',
            location: 'away',
            score: '1-3', // home-away order → we won 3-1 away
            sets: [[20, 25], [25, 23], [18, 25], [22, 25]],
          ),
        ],
      });
      final stats = calculateVolleyballStats(repo, Sport.volleyballMen);

      expect(stats.overall.played, 2);
      expect(stats.overall.wins, 2);
      expect(stats.overall.losses, 0);
      expect(stats.overall.setsWon, 6);
      expect(stats.overall.setsLost, 2);
      expect(stats.overall.pointsScored, 98 + 98);
      expect(stats.overall.pointsConceded, 82 + 85);

      // Home = match A only.
      expect(stats.home.played, 1);
      expect(stats.home.pointsScored, 98);
      expect(stats.home.pointsConceded, 82);
      // Away = match B only, with the set columns swapped to our perspective.
      expect(stats.away.played, 1);
      expect(stats.away.pointsScored, 98);
      expect(stats.away.pointsConceded, 85);
      // Split sums to overall.
      expect(stats.home.setsWon + stats.away.setsWon, stats.overall.setsWon);
      expect(stats.home.setsLost + stats.away.setsLost, stats.overall.setsLost);
    });

    test('filters by sport and skips non-played / scoreless events', () async {
      final repo = await repoWith({
        'october': [
          volleyball(day: 1, sport: 'volleyball-men', score: '3-0'),
          volleyball(day: 2, sport: 'volleyball-women', score: '3-1'),
          volleyball(day: 3, sport: 'volleyball-men', status: 'upcoming'),
          volleyball(day: 4, sport: 'volleyball-men', status: 'played'), // no score
          football(day: 5, score: '2-0'),
        ],
      });
      expect(calculateVolleyballStats(repo, Sport.volleyballMen).overall.played, 1);
      expect(calculateVolleyballStats(repo, Sport.volleyballWomen).overall.played, 1);
    });

    test('cup matches count toward volleyball stats (no league-only filter, unlike football)', () async {
      final repo = await repoWith({
        'october': [
          volleyball(day: 1, score: '3-0', competition: 'league'),
          volleyball(day: 8, score: '3-1', competition: 'cup'),
        ],
      });
      expect(calculateVolleyballStats(repo, Sport.volleyballMen).overall.played, 2);
    });

    test('recent form is the last 5 matches, most recent first', () async {
      final repo = await repoWith({
        'october': [
          for (var d = 1; d <= 6; d++)
            volleyball(day: d, opponent: 'ΟΜΑΔΑ $d', score: d.isEven ? '3-0' : '0-3'),
        ],
      });
      final stats = calculateVolleyballStats(repo, Sport.volleyballMen);
      expect(stats.recentForm.length, 5);
      expect(stats.recentForm.first.opponent, 'ΟΜΑΔΑ 6');
      expect(stats.recentForm.first.day, 6);
      expect(stats.recentForm.last.opponent, 'ΟΜΑΔΑ 2');
      expect(stats.recentForm.map((f) => f.result).toList(), ['W', 'L', 'W', 'L', 'W']);
      for (final f in stats.recentForm) {
        expect(['W', 'L'], contains(f.result)); // never D — no draws in volleyball
      }
    });

    test('head-to-head tracks sets and is sorted by played desc', () async {
      final repo = await repoWith({
        'october': [
          volleyball(day: 1, opponent: 'Α', score: '3-0'),
          volleyball(day: 8, opponent: 'Β', score: '1-3'),
          volleyball(day: 15, opponent: 'Α', location: 'away', score: '3-2'), // we lost 2-3
        ],
      });
      final stats = calculateVolleyballStats(repo, Sport.volleyballMen);
      expect(stats.headToHead.first.opponent, 'Α');
      expect(stats.headToHead.first.played, 2);
      expect(stats.headToHead.first.wins, 1);
      expect(stats.headToHead.first.losses, 1);
      expect(stats.headToHead.first.setsWon, 5); // 3 + 2
      expect(stats.headToHead.first.setsLost, 3); // 0 + 3
    });

    test('streaks: current W/L and longest win streak', () async {
      final repo = await repoWith({
        'october': [
          volleyball(day: 1, score: '3-0'),
          volleyball(day: 2, score: '3-1'),
          volleyball(day: 3, score: '0-3'),
        ],
      });
      final stats = calculateVolleyballStats(repo, Sport.volleyballMen);
      expect(stats.currentStreak.type, 'L');
      expect(stats.currentStreak.count, 1);
      expect(stats.longestWinStreak, 2);
    });

    test('empty season yields zeroed stats (current streak pinned as L/0)', () async {
      final repo = await repoWith({'october': []});
      final stats = calculateVolleyballStats(repo, Sport.volleyballMen);
      expect(stats.overall.played, 0);
      expect(stats.biggestWin, isNull);
      expect(stats.heaviestDefeat, isNull);
      expect(stats.topScorers, isEmpty);
      expect(stats.recentForm, isEmpty);
      expect(stats.currentStreak.type, 'L');
      expect(stats.currentStreak.count, 0);
    });

    group('set-margin records with rally tie-breaks', () {
      test('biggest win: equal set margin broken by higher rally diff', () async {
        final repo = await repoWith({
          'october': [
            volleyball(day: 1, opponent: 'Α', score: '3-0',
                sets: [[25, 15], [25, 15], [25, 15]]), // +30
            volleyball(day: 8, opponent: 'Β', score: '3-0',
                sets: [[25, 10], [25, 10], [25, 10]]), // +45 → takes over
            volleyball(day: 15, opponent: 'Γ', score: '3-0',
                sets: [[25, 20], [25, 20], [25, 20]]), // +15 → stays Β
          ],
        });
        final stats = calculateVolleyballStats(repo, Sport.volleyballMen);
        expect(stats.biggestWin!.opponent, 'Β');
        expect(stats.biggestWin!.score, '3-0');
        expect(stats.biggestWin!.setScores, '25-10, 25-10, 25-10');
      });

      test('set margin dominates rally diff for the biggest win', () async {
        final repo = await repoWith({
          'october': [
            volleyball(day: 1, opponent: 'Α', score: '3-1',
                sets: [[25, 10], [25, 10], [10, 25], [25, 10]]), // margin 2, huge rally
            volleyball(day: 8, opponent: 'Β', score: '3-0',
                sets: [[25, 23], [25, 23], [25, 23]]), // margin 3, small rally
          ],
        });
        final stats = calculateVolleyballStats(repo, Sport.volleyballMen);
        expect(stats.biggestWin!.opponent, 'Β');
      });

      test('heaviest defeat: equal margin broken by more negative rally diff', () async {
        final repo = await repoWith({
          'october': [
            volleyball(day: 1, opponent: 'Α', score: '0-3',
                sets: [[18, 25], [18, 25], [19, 25]]), // -20
            volleyball(day: 8, opponent: 'Β', score: '0-3',
                sets: [[15, 25], [15, 25], [15, 25]]), // -30 → takes over
            volleyball(day: 15, opponent: 'Γ', score: '0-3',
                sets: [[22, 25], [22, 25], [21, 25]]), // -10 → stays Β
          ],
        });
        final stats = calculateVolleyballStats(repo, Sport.volleyballMen);
        expect(stats.heaviestDefeat!.opponent, 'Β');
      });

      test('away records swap the set scores to our perspective', () async {
        final repo = await repoWith({
          'october': [
            volleyball(day: 1, opponent: 'Α', location: 'away', score: '0-3',
                sets: [[20, 25], [15, 25], [19, 25]]), // we won away
          ],
        });
        final stats = calculateVolleyballStats(repo, Sport.volleyballMen);
        expect(stats.biggestWin!.opponent, 'Α');
        expect(stats.biggestWin!.setScores, '25-20, 25-15, 25-19');
      });

      test('records without sets data carry an empty setScores string', () async {
        final repo = await repoWith({
          'october': [volleyball(day: 1, opponent: 'Α', score: '3-0')],
        });
        final stats = calculateVolleyballStats(repo, Sport.volleyballMen);
        expect(stats.biggestWin!.setScores, '');
      });
    });

    group('top scorers', () {
      test('aggregates only our own team across matches (web mock parity)', () async {
        final repo = await repoWith({
          'october': [
            volleyball(day: 1, location: 'home', score: '3-1', scorers: [
              scorer('Player A', 20, 'home'),
              scorer('Player B', 15, 'home'),
              scorer('Opponent X', 10, 'away'),
            ]),
            volleyball(day: 5, location: 'away', score: '1-3', scorers: [
              scorer('Player A', 18, 'away'),
              scorer('Player C', 12, 'away'),
              scorer('Opponent Y', 22, 'home'),
            ]),
          ],
        });
        final stats = calculateVolleyballStats(repo, Sport.volleyballMen);
        expect(stats.topScorers.map((s) => s.name).toList(), ['Player A', 'Player B', 'Player C']);
        final a = stats.topScorers.first;
        expect(a.totalPoints, 38); // 20 + 18
        expect(a.matchesPlayed, 2);
        expect(stats.topScorers.any((s) => s.name.startsWith('Opponent')), isFalse);
      });

      test('duplicate entries for a player in one match sum points but count one match', () async {
        final repo = await repoWith({
          'october': [
            volleyball(day: 1, location: 'home', score: '3-0', scorers: [
              scorer('Player A', 10, 'home'),
              scorer('Player A', 5, 'home'),
            ]),
          ],
        });
        final stats = calculateVolleyballStats(repo, Sport.volleyballMen);
        expect(stats.topScorers.single.totalPoints, 15);
        expect(stats.topScorers.single.matchesPlayed, 1);
      });

      test('caps the list at 10, sorted by points descending', () async {
        final repo = await repoWith({
          'october': [
            volleyball(day: 1, location: 'home', score: '3-0', scorers: [
              for (var i = 0; i < 12; i++) scorer('Player $i', 10 + i, 'home'),
            ]),
          ],
        });
        final stats = calculateVolleyballStats(repo, Sport.volleyballMen);
        expect(stats.topScorers.length, 10);
        for (var i = 1; i < stats.topScorers.length; i++) {
          expect(
            stats.topScorers[i - 1].totalPoints,
            greaterThanOrEqualTo(stats.topScorers[i].totalPoints),
          );
        }
        expect(stats.topScorers.first.name, 'Player 11');
      });

      test('no vbScorers data → empty list', () async {
        final repo = await repoWith({
          'october': [volleyball(day: 1, score: '3-0')],
        });
        expect(calculateVolleyballStats(repo, Sport.volleyballMen).topScorers, isEmpty);
      });
    });
  });
}
