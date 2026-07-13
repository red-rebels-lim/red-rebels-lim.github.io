import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
import 'package:red_rebels_calendar/widgets/event_details_sheet.dart';

void main() {
  late EventsRepository events;
  late PlayersRepository players;
  late I18n i18n;
  late SharedPreferences prefs;

  // Asset loading must happen outside testWidgets' fake-async zone or the
  // rootBundle futures never complete and the test times out.
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
    events = await EventsRepository.load();
    players = await PlayersRepository.load();
    i18n = await I18n.load();
    prefs = await SharedPreferences.getInstance();
  });

  Widget wrap(Widget child) => ChangeNotifierProvider(
        create: (_) => AppState(events: events, players: players, i18n: i18n, prefs: prefs),
        child: MaterialApp(
          theme: buildTheme(Brightness.light),
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
          theme: buildTheme(Brightness.light),
          home: const Scaffold(body: CalendarPage()),
        ),
      ),
    );
    await tester.pump();
    expect(find.text('MATCH RESULT'), findsNothing);

    // Simulate a notification tap deep-linking to a real bundled event.
    app.pendingEventKey = 'september-12-football-men-ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ';
    await tester.pumpAndSettle();

    expect(find.text('MATCH RESULT'), findsOneWidget); // played-event sheet header
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
}
