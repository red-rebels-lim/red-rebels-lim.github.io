/// Unit tests for lib/logic/squad_stats.dart with synthetic events, ported
/// from the web suite app/src/__tests__/lib/football-stats.test.ts so the
/// Dart port stays pinned to the same expectations. Pure logic — no assets
/// (the asset-backed parity checks live in squad_test.dart).
library;

import 'package:flutter_test/flutter_test.dart';

import 'package:solo_salamina/logic/squad_stats.dart';
import 'package:solo_salamina/models/events.dart';
import 'package:solo_salamina/models/players.dart';

const roster = <Player>[
  Player(
    key: 'panagiotis_louka',
    sport: Sport.footballMen,
    active: true,
    nameEl: 'Παναγιώτης Λούκα',
    nameEn: 'Panagiotis Louka',
    position: Position.fwd,
    shirtNumber: 89,
    aliases: ['ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', 'P. Louka'],
  ),
  Player(
    key: 'daniel_perez',
    sport: Sport.footballMen,
    active: true,
    nameEl: 'Daniel Perez',
    nameEn: 'Daniel Perez',
    position: Position.fwd,
    shirtNumber: 9,
    aliases: ['ALEJANDRO PEREZ CORDOVA DANIEL', 'Daniel Pérez'],
  ),
  Player(
    key: 'alberto_varo_lara',
    sport: Sport.footballMen,
    active: true,
    nameEl: 'Alberto Varo Lara',
    nameEn: 'Alberto Varo Lara',
    position: Position.gk,
    shirtNumber: 1,
    aliases: ['ALBERTO VARO LARA'],
  ),
  Player(
    key: 'never_played',
    sport: Sport.footballMen,
    active: true,
    nameEl: 'Νέος Παίκτης',
    nameEn: 'New Player',
    position: Position.mid,
  ),
];

SportEvent makeEvent({
  int day = 1,
  Sport sport = Sport.footballMen,
  MatchLocation location = MatchLocation.home,
  String opponent = 'TEST OPPONENT',
  MatchStatus status = MatchStatus.played,
  String? score = '1-0',
  List<LineupPlayer>? lineupHome,
  List<LineupPlayer>? lineupAway,
  List<Substitution>? subs,
  List<Scorer>? scorers,
  List<Booking>? bookings,
}) =>
    SportEvent(
      day: day,
      sport: sport,
      location: location,
      opponent: opponent,
      time: '',
      status: status,
      score: score,
      lineupHome: lineupHome,
      lineupAway: lineupAway,
      subs: subs,
      scorers: scorers,
      bookings: bookings,
    );

Map<String, List<SportEvent>> wrap(List<SportEvent> events) => {'september': events};

Map<String, PlayerSeasonStats> aggregate(List<SportEvent> events) =>
    aggregateSquadStats(roster: roster, eventsByMonth: wrap(events));

void main() {
  group('normalisePlayerName', () {
    test('strips parenthetical annotations like (Πέναλτι)', () {
      expect(normalisePlayerName('ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ (Πέναλτι)'), 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ');
    });

    test('collapses whitespace, trims and uppercases', () {
      expect(normalisePlayerName('  p.   Louka  '), 'P. LOUKA');
      expect(normalisePlayerName('ΠΑΝΑΓΙΩΤΗΣ  ΛΟΥΚΑ'), 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ');
    });

    test('annotation in the middle leaves a single space', () {
      expect(normalisePlayerName('Α (Πέναλτι) Β'), 'Α Β');
    });
  });

  group('buildAliasMap', () {
    test('maps nameEl, nameEn and every alias to the canonical key', () {
      final map = buildAliasMap(roster);
      expect(map[normalisePlayerName('Παναγιώτης Λούκα')], 'panagiotis_louka');
      expect(map[normalisePlayerName('Panagiotis Louka')], 'panagiotis_louka');
      expect(map[normalisePlayerName('P. Louka')], 'panagiotis_louka');
      expect(map[normalisePlayerName('Daniel Pérez')], 'daniel_perez');
      expect(map[normalisePlayerName('UNKNOWN')], isNull);
    });
  });

  group('aggregateSquadStats', () {
    test('returns empty stats for every roster player when no events are played', () {
      final result = aggregate([]);
      expect(result.length, 4);
      for (final p in roster) {
        final s = result[p.key]!;
        expect(s.apps, 0);
        expect(s.goals, 0);
        expect(s.matchLog, isEmpty);
      }
    });

    test('counts a lineup appearance as a start (double-spaced Greek uppercase)', () {
      final result = aggregate([
        makeEvent(lineupHome: const [LineupPlayer(name: 'ΠΑΝΑΓΙΩΤΗΣ  ΛΟΥΚΑ')], lineupAway: const []),
      ]);
      final s = result['panagiotis_louka']!;
      expect(s.starts, 1);
      expect(s.subAppearances, 0);
      expect(s.apps, 1);
      expect(s.matchLog.length, 1);
      expect(s.matchLog.single.appearance, 'start');
    });

    test('counts a subs.playerOn entry as a sub appearance (Latin alias)', () {
      final result = aggregate([
        makeEvent(subs: const [
          Substitution(playerOn: 'P. Louka', playerOff: 'X', minute: '60', team: 'home'),
        ]),
      ]);
      final s = result['panagiotis_louka']!;
      expect(s.subAppearances, 1);
      expect(s.starts, 0);
      expect(s.apps, 1);
      expect(s.matchLog.single.appearance, 'sub');
    });

    test('start beats sub when the player appears in both', () {
      final result = aggregate([
        makeEvent(
          lineupHome: const [LineupPlayer(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ')],
          lineupAway: const [],
          subs: const [
            Substitution(playerOn: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', playerOff: 'X', minute: '60', team: 'home'),
          ],
        ),
      ]);
      final s = result['panagiotis_louka']!;
      expect(s.starts, 1);
      expect(s.subAppearances, 0);
      expect(s.apps, 1);
    });

    test('separates penalty goals, own goals and open-play goals; strips (Πέναλτι)', () {
      final result = aggregate([
        makeEvent(
          lineupHome: const [LineupPlayer(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ')],
          lineupAway: const [],
          scorers: const [
            Scorer(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '12', team: 'home'),
            Scorer(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ (Πέναλτι)', minute: '45', team: 'home', type: 'pen'),
            Scorer(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '60', team: 'home', type: 'og'),
          ],
        ),
      ]);
      final s = result['panagiotis_louka']!;
      expect(s.goals, 2); // own goal does NOT increment goals
      expect(s.goalsOpenPlay, 1);
      expect(s.goalsPenalty, 1);
      expect(s.ownGoals, 1);
    });

    test('own goal alone does not increment goals but still counts an appearance', () {
      final result = aggregate([
        makeEvent(scorers: const [
          Scorer(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '30', team: 'home', type: 'og'),
        ]),
      ]);
      final s = result['panagiotis_louka']!;
      expect(s.goals, 0);
      expect(s.ownGoals, 1);
      expect(s.apps, 1); // reconciled as a sub appearance
      expect(s.subAppearances, 1);
    });

    test('counts yellow and red cards independently per match', () {
      final result = aggregate([
        makeEvent(
          lineupHome: const [LineupPlayer(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ')],
          lineupAway: const [],
          bookings: const [
            Booking(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '20', team: 'home', card: 'yellow'),
            Booking(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '88', team: 'home', card: 'red'),
          ],
        ),
      ]);
      final s = result['panagiotis_louka']!;
      expect(s.yellowCards, 1);
      expect(s.redCards, 1);
      expect(s.matchLog.single.yellowCard, isTrue);
      expect(s.matchLog.single.redCard, isTrue);
    });

    test('does not double-count two yellows in the same match', () {
      final result = aggregate([
        makeEvent(
          lineupHome: const [LineupPlayer(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ')],
          lineupAway: const [],
          bookings: const [
            Booking(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '20', team: 'home', card: 'yellow'),
            Booking(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '40', team: 'home', card: 'yellow'),
          ],
        ),
      ]);
      expect(result['panagiotis_louka']!.yellowCards, 1);
    });

    test('resolves Latin alias forms to the canonical roster key', () {
      final result = aggregate([
        makeEvent(
          lineupHome: const [LineupPlayer(name: 'ALEJANDRO PEREZ CORDOVA DANIEL')],
          lineupAway: const [],
          scorers: const [Scorer(name: 'Daniel Pérez', minute: '12', team: 'home')],
        ),
      ]);
      final s = result['daniel_perez']!;
      expect(s.starts, 1);
      expect(s.goals, 1);
    });

    test('ignores names that do not resolve to any roster player', () {
      final result = aggregate([
        makeEvent(
          lineupHome: const [LineupPlayer(name: 'UNKNOWN OPPONENT')],
          lineupAway: const [],
          scorers: const [Scorer(name: 'UNKNOWN OPPONENT', minute: '12', team: 'home')],
        ),
      ]);
      for (final s in result.values) {
        expect(s.apps, 0);
        expect(s.goals, 0);
      }
    });

    test('attributes correctly when our player appears on lineupAway (untrusted sides)', () {
      // The scraper sometimes writes our team to lineup.away; the aggregator
      // must not trust the side and still resolve the player by name.
      final result = aggregate([
        makeEvent(
          location: MatchLocation.away,
          lineupHome: const [],
          lineupAway: const [LineupPlayer(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ')],
        ),
      ]);
      expect(result['panagiotis_louka']!.starts, 1);
    });

    test('skips events that are not played football matches', () {
      final result = aggregate([
        makeEvent(
          status: MatchStatus.upcoming,
          lineupHome: const [LineupPlayer(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ')],
          lineupAway: const [],
        ),
        makeEvent(
          sport: Sport.volleyballMen,
          lineupHome: const [LineupPlayer(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ')],
          lineupAway: const [],
        ),
      ]);
      expect(result['panagiotis_louka']!.apps, 0);
    });

    test('coerces a scorer-only appearance to "sub" so totals reconcile', () {
      // Partial-scrape edge case: scorer is recorded but lineup/subs are not.
      final result = aggregate([
        makeEvent(
          lineupHome: const [],
          lineupAway: const [],
          scorers: const [Scorer(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '12', team: 'home')],
        ),
      ]);
      final s = result['panagiotis_louka']!;
      expect(s.goals, 1);
      expect(s.apps, 1);
      expect(s.subAppearances, 1);
      expect(s.matchLog.single.appearance, 'sub');
    });

    test('booking-only appearance is also reconciled as a sub appearance', () {
      final result = aggregate([
        makeEvent(bookings: const [
          Booking(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', minute: '90', team: 'home', card: 'yellow'),
        ]),
      ]);
      final s = result['panagiotis_louka']!;
      expect(s.apps, 1);
      expect(s.subAppearances, 1);
      expect(s.yellowCards, 1);
    });

    test('logs every match where the player tallied any event', () {
      final result = aggregate([
        makeEvent(
          day: 1,
          opponent: 'A',
          lineupHome: const [LineupPlayer(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ')],
          lineupAway: const [],
        ),
        makeEvent(
          day: 8,
          opponent: 'B',
          subs: const [
            Substitution(playerOn: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', playerOff: 'x', minute: '70', team: 'home'),
          ],
        ),
      ]);
      final s = result['panagiotis_louka']!;
      expect(s.matchLog.map((m) => '${m.day}-${m.appearance}').toList(), ['1-start', '8-sub']);
      expect(s.matchLog.first.opponent, 'A');
      expect(s.matchLog.last.opponent, 'B');
    });

    test('events across months are aggregated in season order', () {
      final result = aggregateSquadStats(roster: roster, eventsByMonth: {
        'january': [
          makeEvent(
            day: 10,
            opponent: 'ΓΕΝΑΡΗΣ',
            lineupHome: const [LineupPlayer(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ')],
            lineupAway: const [],
          ),
        ],
        'september': [
          makeEvent(
            day: 5,
            opponent: 'ΣΕΠΤΕΜΒΡΗΣ',
            lineupHome: const [LineupPlayer(name: 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ')],
            lineupAway: const [],
          ),
        ],
      });
      final s = result['panagiotis_louka']!;
      expect(s.apps, 2);
      // monthOrder puts september before january regardless of map order.
      expect(s.matchLog.map((m) => m.month).toList(), ['september', 'january']);
    });
  });
}
