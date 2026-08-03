import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:red_rebels_calendar/data/constants.dart';
import 'package:red_rebels_calendar/data/events_repository.dart';
import 'package:red_rebels_calendar/data/players_repository.dart';
import 'package:red_rebels_calendar/i18n/i18n.dart';
import 'package:red_rebels_calendar/main.dart';
import 'package:red_rebels_calendar/models/events.dart';
import 'package:red_rebels_calendar/pages/calendar_page.dart';
import 'package:red_rebels_calendar/state/app_state.dart';
import 'package:red_rebels_calendar/theme.dart';
import 'package:red_rebels_calendar/widgets/calendar_cards_view.dart';
import 'package:red_rebels_calendar/widgets/calendar_list_view.dart';
import 'package:red_rebels_calendar/widgets/event_card.dart';
import 'package:red_rebels_calendar/widgets/event_details_sheet.dart';

void main() {
  late EventsRepository events;
  late PlayersRepository players;
  late I18n i18n;
  late SharedPreferences prefs;
  late EventsRepository gridEvents;
  late String gridMonth;

  // Asset loading must happen outside testWidgets' fake-async zone or the
  // rootBundle futures never complete and the test times out.
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
    events = await EventsRepository.load();
    players = await PlayersRepository.load();
    i18n = await I18n.load();
    prefs = await SharedPreferences.getInstance();

    // Seeded feed for the grid tests: a day-21 fixture in two months far
    // apart, so whichever ISN'T the current month drives the assertions.
    // Using the live bundle made these tests calendar-dependent — on the
    // current month the grid pre-selects today (CAL-07), and a matchday
    // today would legitimately render the selected-day list.
    const day21Fixture = {
      'day': 21,
      'sport': 'football-men',
      'location': 'home',
      'opponent': 'ΑΠΟΕΛ',
      'time': '19:00',
      'status': 'played',
      'score': '1-0',
      'competition': 'league',
    };
    final dir = await Directory.systemTemp.createTemp('grid-test');
    final file = File('${dir.path}/events-cache.json');
    await file.writeAsString(json.encode({
      'november': [day21Fixture],
      'april': [day21Fixture],
    }));
    gridEvents = await EventsRepository.load(cacheFile: () async => file);
    gridMonth =
        gridEvents.initialMonth(DateTime.now()) == 'november' ? 'april' : 'november';
  });

  Widget wrap(Widget child) => ChangeNotifierProvider(
        create: (_) => AppState(events: events, players: players, i18n: i18n, prefs: prefs),
        child: MaterialApp(
          theme: buildTheme('default', Brightness.light),
          home: Scaffold(body: child),
        ),
      );

  // Synthetic fixtures: the bundled season data has no upcoming events left,
  // so the views are exercised with hand-built ones.
  const playedFootball = SportEvent(
    day: 4,
    sport: Sport.footballMen,
    location: MatchLocation.home,
    opponent: 'ΑΟΑΝ ΑΓΙΑΣ ΝΑΠΑΣ',
    time: '16:00',
    status: MatchStatus.played,
    score: '3-0',
    competition: Competition.league,
    matchday: 24,
    scorers: [Scorer(name: 'Test Scorer', minute: '23', team: 'home')],
    bookings: [Booking(name: 'Test Booking', minute: '55', team: 'home', card: 'yellow')],
  );
  const upcomingVolleyball = SportEvent(
    day: 20,
    sport: Sport.volleyballWomen,
    location: MatchLocation.away,
    opponent: 'ΑΕΛ (Γ)',
    time: '18:30',
    status: MatchStatus.upcoming,
    competition: Competition.cup,
  );

  testWidgets('App boots and shows the four navigation tabs', (tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AppState(events: events, players: players, i18n: i18n, prefs: prefs),
        child: const RedRebelsApp(),
      ),
    );
    await tester.pump();

    // Bottom-nav labels render uppercase (web design parity).
    expect(find.text('CALENDAR'), findsWidgets);
    expect(find.text('STATISTICS'), findsWidgets);
    expect(find.text('SQUAD'), findsWidgets);
    expect(find.text('SETTINGS'), findsWidgets);

    // Unmount so any countdown periodic timers are disposed before the
    // pending-timer check runs.
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('List view renders PLAYED and UPCOMING sections', (tester) async {
    await tester.pumpWidget(wrap(const CalendarListView(
      monthName: 'april',
      events: [playedFootball, upcomingVolleyball],
    )));
    await tester.pump();

    expect(find.text('PLAYED'), findsOneWidget);
    expect(find.text('UPCOMING'), findsOneWidget);
    expect(find.text('3-0'), findsOneWidget); // played score badge
    expect(find.text('WIN'), findsOneWidget); // result label
    expect(find.text('18:30'), findsOneWidget); // upcoming kickoff time

    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('Cards view renders a match score', (tester) async {
    await tester.pumpWidget(wrap(const CalendarCardsView(
      monthName: 'april',
      events: [playedFootball],
    )));
    await tester.pump();

    expect(find.text('3 - 0'), findsOneWidget);
    expect(find.text('WIN'), findsOneWidget);

    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('Pending eventKey opens the details sheet for that match', (tester) async {
    final app = AppState(events: events, players: players, i18n: i18n, prefs: prefs);
    await tester.pumpWidget(
      ChangeNotifierProvider.value(
        value: app,
        child: MaterialApp(
          theme: buildTheme('default', Brightness.light),
          home: const Scaffold(body: CalendarPage()),
        ),
      ),
    );
    await tester.pump();
    expect(find.text('MATCH RESULT'), findsNothing);

    // Simulate a notification tap deep-linking to a real bundled event
    // (a draw fixture — upcoming all season, so the sheet header is the
    // fixture title rather than MATCH RESULT).
    app.pendingEventKey = 'march-5-football-men-ΚΑΡΜΙΩΤΙΣΣΑ ΠΟΛΕΜΙΔΙΩΝ';
    await tester.pumpAndSettle();

    expect(find.textContaining('KARMIOTISSA'), findsWidgets); // sheet title
    expect(app.pendingEventKey, isNull); // consumed once

    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('Details sheet shows tabs for a played football event', (tester) async {
    await tester.pumpWidget(wrap(Builder(
      builder: (context) => Center(
        child: ElevatedButton(
          onPressed: () => showEventDetailsSheet(context, playedFootball, 'april'),
          child: const Text('open'),
        ),
      ),
    )));
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();

    expect(find.text('MATCH RESULT'), findsOneWidget);
    expect(find.text('GOALSCORERS'), findsOneWidget);
    expect(find.text('BOOKINGS'), findsOneWidget);
    expect(find.text('3 - 0 ⚽'), findsOneWidget);
    expect(find.textContaining('Test Scorer'), findsOneWidget);

    await tester.pumpWidget(const SizedBox());
  });

  test('events data parses and stats have matches', () {
    expect(events.allEvents(), isNotEmpty);
    expect(events.byMonth.keys, contains('september'));
  });

  /// Pumps the CalendarPage in grid view and navigates back to July
  /// (the 26/27 bundle opens with the July friendlies, e.g. day 21).
  // Pumps the grid on the seeded month (guaranteed not the current month, so
  // today-preselection can never interfere with the assertions below).
  Future<void> pumpGridAtSeededMonth(WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) =>
            AppState(events: gridEvents, players: players, i18n: i18n, prefs: prefs),
        child: MaterialApp(
          theme: buildTheme('default', Brightness.light),
          home: const Scaffold(body: CalendarPage()),
        ),
      ),
    );
    await tester.pump();

    final from = monthOrder.indexOf(gridEvents.initialMonth(DateTime.now()));
    final to = monthOrder.indexOf(gridMonth);
    final tooltip =
        i18n.t('en', to >= from ? 'monthNav.next' : 'monthNav.previous');
    for (var i = 0; i < (to - from).abs(); i++) {
      await tester.tap(find.byTooltip(tooltip));
      await tester.pumpAndSettle();
    }
  }

  testWidgets('Grid view shows no event list until a day is selected', (tester) async {
    await pumpGridAtSeededMonth(tester);

    // Web parity: nothing below the grid before a selection — no full-month
    // list, no SELECTED DAY chip, no grid-mode empty state.
    expect(find.byType(EventCard), findsNothing);
    expect(find.text('SELECTED DAY'), findsNothing);
    expect(find.text(i18n.t('en', 'calendar.noEvents')), findsNothing);

    // Selecting an event day reveals the chip and its cards.
    await tester.tap(find.byKey(const ValueKey('day-cell-21')));
    await tester.pumpAndSettle();
    expect(find.text('SELECTED DAY'), findsOneWidget);
    expect(find.byType(EventCard), findsWidgets);

    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('Day cells with events carry no fill decoration', (tester) async {
    await pumpGridAtSeededMonth(tester);

    // Day 21 carries a seeded fixture; web renders event days exactly like
    // plain days (dots aside) — no background fill, no border.
    final cell = tester.widget<Container>(
      find
          .descendant(of: find.byKey(const ValueKey('day-cell-21')), matching: find.byType(Container))
          .first,
    );
    final decoration = cell.decoration! as BoxDecoration;
    expect(decoration.color, isNull);
    expect(decoration.border, isNull);

    await tester.pumpWidget(const SizedBox());
  });

  test('matchTitle translates the own team and joins with vs', () async {
    SharedPreferences.setMockInitialValues({'language': 'en'});
    final enPrefs = await SharedPreferences.getInstance();
    final app = AppState(events: events, players: players, i18n: i18n, prefs: enPrefs);

    expect(matchTitle(app, playedFootball), 'Nea Salamis vs Ayia Napa');
    expect(matchTitle(app, upcomingVolleyball), 'AEL (W) vs Nea Salamis'); // away: opponent first

    app.setLanguage('el');
    expect(matchTitle(app, playedFootball), 'Νέα Σαλαμίνα vs Αγία Νάπα');
    expect(matchTitle(app, upcomingVolleyball), 'ΑΕΛ (Γ) vs Νέα Σαλαμίνα');
  });
}
