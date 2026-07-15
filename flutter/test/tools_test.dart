import 'package:add_2_calendar/add_2_calendar.dart' as a2c;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:red_rebels_calendar/data/events_repository.dart';
import 'package:red_rebels_calendar/data/players_repository.dart';
import 'package:red_rebels_calendar/i18n/i18n.dart';
import 'package:red_rebels_calendar/main.dart';
import 'package:red_rebels_calendar/models/events.dart';
import 'package:red_rebels_calendar/pages/settings_page.dart';
import 'package:red_rebels_calendar/state/app_state.dart';
import 'package:red_rebels_calendar/theme.dart';
import 'package:red_rebels_calendar/widgets/event_details_sheet.dart';

void main() {
  late EventsRepository events;
  late PlayersRepository players;
  late I18n i18n;
  late SharedPreferences prefs;

  // Asset loading must happen outside testWidgets' fake-async zone (see
  // widget_test.dart).
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    events = await EventsRepository.load();
    players = await PlayersRepository.load();
    i18n = await I18n.load();
  });

  Future<void> freshPrefs([Map<String, Object> values = const {}]) async {
    SharedPreferences.setMockInitialValues(values);
    prefs = await SharedPreferences.getInstance();
  }

  setUp(() => freshPrefs());

  AppState appState() => AppState(events: events, players: players, i18n: i18n, prefs: prefs);

  // Synthetic fixtures (the bundled season data has no upcoming events left).
  const upcomingWithTime = SportEvent(
    day: 20,
    sport: Sport.footballMen,
    location: MatchLocation.home,
    opponent: 'ΑΟΑΝ ΑΓΙΑΣ ΝΑΠΑΣ',
    time: '19:00',
    status: MatchStatus.upcoming,
    competition: Competition.league,
    venue: 'Αγίου Αθανασίου',
  );
  const upcomingTbd = SportEvent(
    day: 21,
    sport: Sport.volleyballMen,
    location: MatchLocation.away,
    opponent: 'ΑΝΟΡΘΩΣΙΣ',
    time: '',
    status: MatchStatus.upcoming,
    competition: Competition.league,
  );
  const played = SportEvent(
    day: 4,
    sport: Sport.footballMen,
    location: MatchLocation.home,
    opponent: 'ΑΟΑΝ ΑΓΙΑΣ ΝΑΠΑΣ',
    time: '16:00',
    status: MatchStatus.played,
    score: '3-0',
    competition: Competition.league,
  );

  group('First-run intro', () {
    Future<AppState> boot(WidgetTester tester, {String? pendingEventKey}) async {
      final app = appState();
      if (pendingEventKey != null) app.pendingEventKey = pendingEventKey;
      await tester.pumpWidget(
        ChangeNotifierProvider.value(value: app, child: const RedRebelsApp()),
      );
      // First frame triggers the post-frame intro check; second pump runs the
      // dialog route animation (no pumpAndSettle — countdown timers).
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      return app;
    }

    testWidgets('appears on fresh prefs and Skip flags it as seen', (tester) async {
      final app = await boot(tester);

      expect(find.text('SWIPE TO NAVIGATE'), findsOneWidget); // page 1 title
      expect(find.text('Skip'), findsOneWidget);

      await tester.tap(find.text('Skip'));
      // Extra pumps: async markIntroSeen, then the dialog's pop animation.
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(seconds: 1));

      expect(find.text('SWIPE TO NAVIGATE'), findsNothing);
      expect(app.introSeen, isTrue);
      expect(prefs.getBool(AppState.introSeenKey), isTrue);

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('Next walks the three pages and Got it! finishes', (tester) async {
      final app = await boot(tester);

      await tester.tap(find.text('NEXT'));
      await tester.pump();
      expect(find.text('VIEW STATISTICS'), findsOneWidget); // page 2

      await tester.tap(find.text('NEXT'));
      await tester.pump();
      expect(find.text('ENABLE NOTIFICATIONS'), findsOneWidget); // page 3

      await tester.tap(find.text('GOT IT!'));
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(seconds: 1));

      expect(find.text('ENABLE NOTIFICATIONS'), findsNothing);
      expect(app.introSeen, isTrue);

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('never appears again once the flag is set', (tester) async {
      await freshPrefs({AppState.introSeenKey: true});
      await boot(tester);

      expect(find.text('SWIPE TO NAVIGATE'), findsNothing);
      expect(find.text('Skip'), findsNothing);

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('skipped this launch when a deep-link eventKey is pending', (tester) async {
      final app = await boot(
        tester,
        pendingEventKey: 'september-12-football-men-ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ',
      );

      expect(find.text('SWIPE TO NAVIGATE'), findsNothing);
      expect(find.text('MATCH RESULT'), findsOneWidget); // deep-link sheet won
      expect(app.introSeen, isFalse); // not flagged — may show next launch

      await tester.pumpWidget(const SizedBox());
    });
  });

  group('GitHub link', () {
    late List<Uri> launched;

    setUp(() {
      launched = [];
      openExternalUrl = (url) async {
        launched.add(url);
        return true;
      };
    });

    testWidgets('About row opens the repository', (tester) async {
      final app = appState();
      await tester.pumpWidget(ChangeNotifierProvider.value(
        value: app,
        child: MaterialApp(
          theme: buildTheme('default', Brightness.light),
          home: const Scaffold(body: SettingsPage()),
        ),
      ));

      // ensureVisible only guarantees partial visibility on the 600px test
      // surface — drag the whole list up so the About card is fully on-screen.
      await tester.drag(find.byType(ListView), const Offset(0, -600));
      await tester.pump();
      await tester.tap(find.byIcon(Icons.code));
      await tester.pumpAndSettle();

      expect(launched, [Uri.parse(githubRepoUrl)]);
    });
  });

  group('Add to calendar', () {
    late List<a2c.Event> added;

    setUp(() {
      added = [];
      addEventToDeviceCalendar = (event) async {
        added.add(event);
        return true;
      };
    });

    Widget sheetOpener(SportEvent event) => ChangeNotifierProvider(
          create: (_) => appState(),
          child: MaterialApp(
            theme: buildTheme('default', Brightness.light),
            home: Scaffold(
              body: Builder(
                builder: (context) => Center(
                  child: ElevatedButton(
                    onPressed: () => showEventDetailsSheet(context, event, 'april'),
                    child: const Text('open'),
                  ),
                ),
              ),
            ),
          ),
        );

    testWidgets('button hands the match to the device calendar', (tester) async {
      await tester.pumpWidget(sheetOpener(upcomingWithTime));
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();

      final button = find.text('📅 EXPORT CALENDAR');
      expect(button, findsOneWidget);

      await tester.ensureVisible(button);
      await tester.tap(button);
      await tester.pumpAndSettle();

      final event = added.single;
      expect(event.title, 'Nea Salamis vs Ayia Napa');
      expect(event.startDate, DateTime(2026, 4, 20, 19, 0));
      expect(event.endDate, DateTime(2026, 4, 20, 21, 0));
      expect(event.location, 'Agiou Athanasiou');
      expect(event.description, contains("Men's Football"));
    });

    testWidgets('absent for played events', (tester) async {
      await tester.pumpWidget(sheetOpener(played));
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();

      expect(find.text('MATCH RESULT'), findsOneWidget); // sheet is open
      expect(find.text('📅 EXPORT CALENDAR'), findsNothing);
    });

    testWidgets('absent for upcoming events without a confirmed time', (tester) async {
      await tester.pumpWidget(sheetOpener(upcomingTbd));
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();

      // Sheet is open (upcoming badge); web shows no TBD text — time appears
      // only as a chip, and only when a kickoff time is confirmed.
      expect(find.text('UPCOMING'), findsOneWidget);
      expect(find.text('⏰', findRichText: true), findsNothing);
      expect(find.text('📅 EXPORT CALENDAR'), findsNothing);
    });

    testWidgets('plugin failure shows the error snackbar', (tester) async {
      addEventToDeviceCalendar = (_) async => throw Exception('no calendar app');
      await tester.pumpWidget(sheetOpener(upcomingWithTime));
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();

      await tester.ensureVisible(find.text('📅 EXPORT CALENDAR'));
      await tester.tap(find.text('📅 EXPORT CALENDAR'));
      await tester.pumpAndSettle();

      expect(find.text('Something went wrong'), findsOneWidget);
    });
  });
}
