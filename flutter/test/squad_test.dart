import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:red_rebels_calendar/data/events_repository.dart';
import 'package:red_rebels_calendar/data/players_repository.dart';
import 'package:red_rebels_calendar/i18n/i18n.dart';
import 'package:red_rebels_calendar/logic/squad_stats.dart';
import 'package:red_rebels_calendar/models/events.dart';
import 'package:red_rebels_calendar/pages/squad_page.dart';
import 'package:red_rebels_calendar/state/app_state.dart';
import 'package:red_rebels_calendar/theme.dart';

void main() {
  late EventsRepository events;
  late PlayersRepository players;
  late I18n i18n;
  late SharedPreferences prefs;

  // Asset loading must happen outside testWidgets' fake-async zone or the
  // rootBundle futures never complete and the test times out.
  late EventsRepository seededEvents;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
    events = await EventsRepository.load();
    players = await PlayersRepository.load();
    i18n = await I18n.load();
    prefs = await SharedPreferences.getInstance();

    // A feed with one played match, for the player-sheet stats grid test.
    // Built here because file IO deadlocks inside testWidgets' fake-async zone.
    final dir = await Directory.systemTemp.createTemp('squad-sheet-test');
    final file = File('${dir.path}/events-cache.json');
    await file.writeAsString(json.encode({
      'events': {
        'september': [
          {
            'day': 12,
            'sport': 'football-men',
            'location': 'home',
            'opponent': 'ΑΠΟΕΛ',
            'time': '19:00',
            'status': 'played',
            'score': '1-0',
            'lineup': {
              'home': [
                {'name': 'ALBERTO VARO LARA', 'number': 1},
              ],
              'away': <Object?>[],
            },
          },
        ],
      },
    }));
    seededEvents = await EventsRepository.load(cacheFile: () async => file);
  });

  Widget wrap(Widget child) => ChangeNotifierProvider(
    create: (_) =>
        AppState(events: events, players: players, i18n: i18n, prefs: prefs),
    child: MaterialApp(
      theme: buildTheme('default', Brightness.light),
      home: Scaffold(body: child),
    ),
  );

  group('squad stats parity with events.json', () {
    late Map<String, PlayerSeasonStats> stats;

    setUpAll(() {
      // Full roster, not just active: the reference numbers come from the
      // archived 2025/26 events fixture, and departed players (active: false)
      // must keep resolving their historical stats. The live bundle now holds
      // the new season (zero played matches), so the parity data is pinned to
      // test/fixtures/events_2526.json.
      final raw = json.decode(
        File('test/fixtures/events_2526.json').readAsStringSync(),
      ) as Map<String, dynamic>;
      final byMonth = <String, List<SportEvent>>{
        for (final e in raw.entries)
          e.key: (e.value as List)
              .map((j) => SportEvent.fromJson(j as Map<String, dynamic>))
              .toList(),
      };
      final roster = players.all
          .where((p) => p.sport == Sport.footballMen)
          .toList();
      stats = aggregateSquadStats(
        roster: roster,
        eventsByMonth: byMonth,
      );
    });

    // Reference numbers computed independently from
    // flutter/assets/data/events.json with a standalone Node script that
    // greps lineups/subs/scorers/bookings for each player's alias forms.
    test('keeper Alberto Varo Lara: 30 apps, all starts, no goals', () {
      final s = stats['alberto_varo_lara']!;
      expect(s.apps, 30);
      expect(s.starts, 30);
      expect(s.subAppearances, 0);
      expect(s.goals, 0);
      expect(s.yellowCards, 0);
      expect(s.redCards, 0);
      expect(s.matchLog.length, 30);
    });

    test('scorer Panagiotis Artymatas: 21 apps, 3 goals, 2 yellows', () {
      final s = stats['panagiotis_artymatas']!;
      expect(s.apps, 21);
      expect(s.starts, 21);
      expect(s.goals, 3);
      expect(s.goalsPenalty, 0);
      expect(s.ownGoals, 0);
      expect(s.yellowCards, 2);
      expect(s.redCards, 0);
    });

    test(
      'sub-heavy scorer Daniel Perez: 14 apps (5 starts + 9 subs), 6 goals (1 pen)',
      () {
        final s = stats['daniel_perez']!;
        expect(s.apps, 14);
        expect(s.starts, 5);
        expect(s.subAppearances, 9);
        expect(s.goals, 6);
        expect(s.goalsPenalty, 1);
        expect(s.yellowCards, 1);
      },
    );
  });

  testWidgets('Squad page renders position sections and player rows', (
    tester,
  ) async {
    await tester.pumpWidget(wrap(const SquadPage()));
    await tester.pump();

    // Section header with count and M/G/C captions.
    expect(find.textContaining('GOALKEEPERS'), findsOneWidget);
    expect(find.text('M'), findsWidgets);
    expect(find.text('G'), findsWidgets);
    expect(find.text('C'), findsWidgets);

    // First keeper row: shirt number + uppercase name.
    expect(find.text('#1'), findsOneWidget);
    expect(find.text('ALBERTO VARO LARA'), findsOneWidget);

    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('Tapping a player row opens the sheet with the stats grid', (
    tester,
  ) async {
    // The 26/27 bundle has no played matches yet, so the sheet's stats grid
    // is exercised with the seeded feed prepared in setUpAll (one played
    // match with Alberto Varo Lara in the starting lineup).
    await tester.pumpWidget(ChangeNotifierProvider(
      create: (_) =>
          AppState(events: seededEvents, players: players, i18n: i18n, prefs: prefs),
      child: MaterialApp(
        theme: buildTheme('default', Brightness.light),
        home: const Scaffold(body: SquadPage()),
      ),
    ));
    await tester.pump();

    await tester.tap(find.text('ALBERTO VARO LARA'));
    await tester.pumpAndSettle();

    // Header: '#1 NAME' condensed title + position badge.
    expect(find.textContaining('#1 ALBERTO VARO LARA'), findsOneWidget);
    // Stats grid tiles (uppercase labels) with the season totals.
    expect(find.text('PLAYED'), findsOneWidget);
    expect(find.text('GOALS'), findsOneWidget);
    expect(find.text('CARDS'), findsOneWidget);
    // One seeded start.
    expect(find.text('1 start · 0 sub'), findsOneWidget);
    expect(find.text('0/0'), findsOneWidget); // yellow/red cards
    // Match log section; only 1 entry, so no SHOW ALL expander.
    expect(find.text('MATCH LOG'), findsOneWidget);
    expect(find.text('SHOW ALL'), findsNothing);

    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('Player with no appearances shows the empty-sheet panel', (
    tester,
  ) async {
    // Giorgos Christodoulou has no lineup/sub/scorer entry in the bundle
    // (the July friendlies gave most of the squad an appearance already).
    await tester.pumpWidget(wrap(const SquadPage()));
    await tester.pump();

    await tester.scrollUntilVisible(
      find.text('GIORGOS CHRISTODOULOU'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text('GIORGOS CHRISTODOULOU'));
    await tester.pumpAndSettle();

    expect(find.textContaining('#6 GIORGOS CHRISTODOULOU'), findsOneWidget);
    expect(find.text('PLAYED'), findsNothing);

    await tester.pumpWidget(const SizedBox());
  });
}
