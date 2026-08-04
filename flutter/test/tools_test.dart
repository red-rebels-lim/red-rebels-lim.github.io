import 'package:add_2_calendar/add_2_calendar.dart' as a2c;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:solo_salamina/data/events_repository.dart';
import 'package:solo_salamina/data/players_repository.dart';
import 'package:solo_salamina/i18n/i18n.dart';
import 'package:solo_salamina/main.dart';
import 'package:solo_salamina/models/events.dart';
import 'package:solo_salamina/pages/settings_page.dart';
import 'package:solo_salamina/state/app_state.dart';
import 'package:solo_salamina/theme.dart';
import 'package:solo_salamina/widgets/event_details_sheet.dart';

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

  group('First-run tour (QA-26)', () {
    Future<AppState> boot(WidgetTester tester,
        {String? pendingEventKey, String? language}) async {
      if (language != null) {
        await freshPrefs({'language': language});
      }
      final app = appState();
      if (pendingEventKey != null) app.pendingEventKey = pendingEventKey;
      await tester.pumpWidget(
        ChangeNotifierProvider.value(value: app, child: const RedRebelsApp()),
      );
      // First frame triggers the post-frame tour check; second pump runs the
      // dialog route animation (no pumpAndSettle — countdown timers).
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      return app;
    }

    testWidgets('appears on fresh prefs and Skip flags it as seen', (tester) async {
      final app = await boot(tester);

      expect(find.text('1 / 7'), findsOneWidget);
      expect(find.text('Swipe to Navigate'), findsOneWidget); // web step 1
      expect(find.text('Skip'), findsOneWidget);
      expect(find.text('Back'), findsNothing); // hidden on the first step

      await tester.tap(find.text('Skip'));
      // Extra pumps: the dialog's pop animation, then async markIntroSeen.
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(seconds: 1));

      expect(find.text('Swipe to Navigate'), findsNothing);
      expect(app.introSeen, isTrue);
      expect(prefs.getBool(AppState.introSeenKey), isTrue);

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('Next walks all 7 web steps, Back returns, Got it! finishes', (tester) async {
      final app = await boot(tester);

      const titles = [
        'Swipe to Navigate',
        'Filter Events',
        'Switch Layout',
        'View Statistics',
        'Enable Notifications',
        'Change Visual Theme',
        'Export Calendar',
      ];
      for (var i = 0; i < titles.length; i++) {
        expect(find.text('${i + 1} / 7'), findsOneWidget);
        expect(find.text(titles[i]), findsOneWidget);
        if (i < titles.length - 1) {
          await tester.tap(find.text('Next'));
          await tester.pump();
        }
      }

      // Back steps backwards from the last step.
      await tester.tap(find.text('Back'));
      await tester.pump();
      expect(find.text('Change Visual Theme'), findsOneWidget);
      await tester.tap(find.text('Next'));
      await tester.pump();

      await tester.tap(find.text('Got it!'));
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(seconds: 1));

      expect(find.text('Export Calendar'), findsNothing);
      expect(app.introSeen, isTrue);

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('renders the Greek copy verbatim', (tester) async {
      await boot(tester, language: 'el');

      expect(find.text('1 / 7'), findsOneWidget);
      expect(find.text('Σύρετε για Πλοήγηση'), findsOneWidget);
      expect(find.text('Παράλειψη'), findsOneWidget);
      expect(find.text('Επόμενο'), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('never appears again once the flag is set', (tester) async {
      await freshPrefs({AppState.introSeenKey: true});
      await boot(tester);

      expect(find.text('Swipe to Navigate'), findsNothing);
      expect(find.text('Skip'), findsNothing);

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('skipped this launch when a deep-link eventKey is pending', (tester) async {
      final app = await boot(
        tester,
        pendingEventKey: 'march-5-football-men-ΚΑΡΜΙΩΤΙΣΣΑ ΠΟΛΕΜΙΔΙΩΝ',
      );

      expect(find.text('Swipe to Navigate'), findsNothing);
      // Deep-link sheet won — upcoming draw fixture, so the header is the
      // fixture title rather than MATCH RESULT.
      expect(find.textContaining('KARMIOTISSA'), findsWidgets);
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

  group('Info chips adapt to narrow screens', () {
    testWidgets('long venue chip ellipsizes instead of cramming edge-to-edge', (tester) async {
      // Nothing Phone 3a regression (2026-07-17): narrow width + large font
      // scale made the venue pill span the full screen. The chip must
      // ellipsize within the available width on any device.
      tester.view.physicalSize = const Size(640, 1400); // 320dp @ 2.0 DPR
      tester.view.devicePixelRatio = 2.0;
      tester.platformDispatcher.textScaleFactorTestValue = 1.3;
      addTearDown(tester.view.reset);
      addTearDown(tester.platformDispatcher.clearAllTestValues);

      const homeWithLongVenue = SportEvent(
        day: 15,
        sport: Sport.footballMen,
        location: MatchLocation.home,
        opponent: 'ΚΡΑΣΑΒΑ ΥΨΩΝΑ',
        time: '',
        status: MatchStatus.upcoming,
        competition: Competition.friendly,
        venue: 'Stadio Vitex Ammochostos Epistrofi',
      );

      await tester.pumpWidget(ChangeNotifierProvider(
        create: (_) => appState(),
        child: MaterialApp(
          theme: buildTheme('default', Brightness.light),
          home: Scaffold(
            body: Builder(
              builder: (context) => Center(
                child: ElevatedButton(
                  onPressed: () =>
                      showEventDetailsSheet(context, homeWithLongVenue, 'august'),
                  child: const Text('open'),
                ),
              ),
            ),
          ),
        ),
      ));
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();

      // No RenderFlex overflow was thrown, and the venue chip is on screen
      // ellipsized to the viewport width.
      expect(tester.takeException(), isNull);
      final venueText = tester.widget<Text>(find.textContaining('Stadio Vitex'));
      expect(venueText.overflow, TextOverflow.ellipsis);
      expect(venueText.maxLines, 1);
      final chipWidth =
          tester.getSize(find.textContaining('Stadio Vitex')).width;
      expect(chipWidth, lessThanOrEqualTo(320));

      await tester.pumpWidget(const SizedBox());
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
      expect(event.startDate, DateTime(2027, 4, 20, 19, 0));
      expect(event.endDate, DateTime(2027, 4, 20, 21, 0));
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
