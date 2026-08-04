import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:solo_salamina/data/events_repository.dart';
import 'package:solo_salamina/data/fotmob_client.dart';
import 'package:solo_salamina/data/players_repository.dart';
import 'package:solo_salamina/i18n/i18n.dart';
import 'package:solo_salamina/pages/stats_page.dart';
import 'package:solo_salamina/state/app_state.dart';
import 'package:solo_salamina/theme.dart';

/// FotMob blocks batch (QA-20 — register rows STA-07 + STA-06 football).
///
/// Fixture mirrors the real `/api/data/teams` nesting the web parsers walk.
final fixture = {
  'overview': {
    'table': [
      {
        'data': {
          'tables': [
            {
              'leagueName': 'Promotion Group',
              'table': {
                'all': [
                  {'id': 1, 'name': 'Ethnikos Achna', 'shortName': 'Ethnikos', 'played': 10, 'wins': 7, 'draws': 2, 'losses': 1, 'goalConDiff': 12, 'pts': 23, 'idx': 1, 'qualColor': '#2AD572'},
                  {'id': neaSalaminaFotMobId, 'name': 'Nea Salamis', 'shortName': 'Nea Salamis', 'played': 10, 'wins': 6, 'draws': 3, 'losses': 1, 'goalConDiff': 9, 'pts': 21, 'idx': 2, 'qualColor': '#2AD572'},
                  {'id': 3, 'name': 'PAEEK', 'shortName': 'PAEEK', 'played': 10, 'wins': 5, 'draws': 2, 'losses': 3, 'goalConDiff': 3, 'pts': 17, 'idx': 3},
                  {'id': 4, 'name': 'Othellos Athienou', 'shortName': 'Othellos', 'played': 10, 'wins': 2, 'draws': 2, 'losses': 6, 'goalConDiff': -8, 'pts': 8, 'idx': 4},
                ],
              },
              'legend': [
                {'color': '#2AD572', 'title': 'Promotion'},
              ],
            },
          ],
        },
      },
    ],
    'topPlayers': {
      'byGoals': {
        'players': [
          {'id': 11, 'name': 'Andreas Georgiou', 'rank': 1, 'teamId': neaSalaminaFotMobId, 'teamName': 'Nea Salamis', 'value': 9, 'stat': {'name': 'goals', 'value': 9}},
          {'id': 12, 'name': 'Marios Ioannou', 'rank': 2, 'teamId': neaSalaminaFotMobId, 'teamName': 'Nea Salamis', 'value': 6, 'stat': {'name': 'goals', 'value': 6}},
          {'id': 13, 'name': 'Kostas Costa', 'rank': 3, 'teamId': neaSalaminaFotMobId, 'teamName': 'Nea Salamis', 'value': 4, 'stat': {'name': 'goals', 'value': 4}},
          {'id': 14, 'name': 'Fourth Player', 'rank': 4, 'teamId': neaSalaminaFotMobId, 'teamName': 'Nea Salamis', 'value': 3, 'stat': {'name': 'goals', 'value': 3}},
        ],
      },
    },
  },
  'stats': {
    'teams': [
      {
        'header': 'Goals per match',
        'localizedTitleId': 'goals_per_match',
        'participant': {'name': 'Nea Salamis', 'teamId': neaSalaminaFotMobId, 'teamName': 'Nea Salamis', 'value': 1.9, 'rank': 2},
        'topThree': [{}, {}, {}],
      },
      {
        'header': 'Clean sheets',
        'localizedTitleId': 'clean_sheets',
        'participant': {'name': 'Other Team', 'teamId': 999, 'teamName': 'Other', 'value': 5, 'rank': 1},
        'topThree': [{}, {}, {}],
      },
    ],
  },
};

MockClient fixtureClient() =>
    MockClient((_) async => http.Response(json.encode(fixture), 200));

void main() {
  late EventsRepository events;
  late PlayersRepository players;
  late I18n i18n;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    events = await EventsRepository.load();
    players = await PlayersRepository.load();
    i18n = await I18n.load();
  });

  tearDown(() {
    fotMobClient = FotMobClient(); // drop any test double + its cache
  });

  group('parsers (web fotmob.ts parity)', () {
    test('parseLeagueTables walks the nested table shape', () {
      final tables = parseLeagueTables(fixture);
      expect(tables, hasLength(1));
      expect(tables.single.leagueName, 'Promotion Group');
      expect(tables.single.rows, hasLength(4));
      final us = tables.single.rows[1];
      expect(us.id, neaSalaminaFotMobId);
      expect(us.goalDifference, 9); // goalConDiff mapping
      expect(us.position, 2); // idx mapping
      expect(tables.single.legend.single.title, 'Promotion');
    });

    test('parseTopScorers caps at three and reads stat.value', () {
      final scorers = parseTopScorers(fixture);
      expect(scorers, hasLength(3));
      expect(scorers.first.name, 'Andreas Georgiou');
      expect(scorers.first.goals, 9);
    });

    test('parseLeagueRankings keeps only our team categories', () {
      final rankings = parseLeagueRankings(fixture);
      expect(rankings, hasLength(1));
      expect(rankings.single.label, 'Goals per match');
      expect(rankings.single.value, '1.9');
      expect(rankings.single.rank, 2);
      expect(rankings.single.totalTeams, 3);
    });

    test('empty/malformed payloads degrade to empty lists', () {
      expect(parseLeagueTables(const {}), isEmpty);
      expect(parseTopScorers(const {}), isEmpty);
      expect(parseLeagueRankings(const {}), isEmpty);
      expect(parseTeamData(const {'overview': 42}).tables, isEmpty);
    });
  });

  group('FotMobClient', () {
    test('parses a 200 payload and serves the cache within the TTL', () async {
      var calls = 0;
      final client = FotMobClient(httpClientFactory: () {
        calls++;
        return fixtureClient();
      });

      final first = await client.fetch();
      expect(first!.tables, hasLength(1));
      final second = await client.fetch();
      expect(identical(first, second), isTrue);
      expect(calls, 1); // cache hit — no second request
    });

    test('returns null on network error / non-200 (never throws)', () async {
      final offline = FotMobClient(
          httpClientFactory: () =>
              MockClient((_) async => throw const SocketException('offline')));
      expect(await offline.fetch(), isNull);

      final gone = FotMobClient(
          httpClientFactory: () => MockClient((_) async => http.Response('gone', 404)));
      expect(await gone.fetch(), isNull);
    });
  });

  group('stats page blocks', () {
    Future<AppState> pump(WidgetTester tester) async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final app = AppState(events: events, players: players, i18n: i18n, prefs: prefs);
      await tester.pumpWidget(ChangeNotifierProvider.value(
        value: app,
        child: MaterialApp(
          theme: buildTheme('default', Brightness.light),
          home: const Scaffold(body: StatsPage()),
        ),
      ));
      await tester.pump(); // initState fetch resolves
      await tester.pump();
      return app;
    }

    testWidgets('former feed blocks render the shared empty state', (tester) async {
      // Feed removed 2026-07-17 (kept serving last season after promotion);
      // these sections stay as titled empty states until they are generated
      // from our own saved results.
      await pump(tester);

      expect(find.text('LEAGUE STANDING'), findsOneWidget);
      expect(find.text('TOP SCORERS'), findsWidgets);
      expect(find.text('LEAGUE RANKINGS'), findsOneWidget);
      expect(find.text('No data available'), findsWidgets);
      // No feed UI: no expand control, no error banner, no skeletons.
      expect(find.text('VIEW FULL'), findsNothing);
      expect(find.text('Failed to load live data'), findsNothing);

      // Local sections intact.
      expect(find.text('SEASON SUMMARY'), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    });
  });

  group('ordinals', () {
    test('English suffixes and the Greek -ος form', () {
      String en(int n) => formatOrdinalRank(n, 'en');
      expect(en(1), '1st');
      expect(en(2), '2nd');
      expect(en(3), '3rd');
      expect(en(4), '4th');
      expect(en(11), '11th');
      expect(en(12), '12th');
      expect(en(13), '13th');
      expect(en(21), '21st');
      expect(en(22), '22nd');
      expect(formatOrdinalRank(2, 'el'), '2ος');
    });
  });
}
