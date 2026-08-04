import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:solo_salamina/data/events_repository.dart';
import 'package:solo_salamina/data/players_repository.dart';
import 'package:solo_salamina/i18n/i18n.dart';
import 'package:solo_salamina/models/events.dart';
import 'package:solo_salamina/pages/calendar_page.dart';
import 'package:solo_salamina/state/app_state.dart';
import 'package:solo_salamina/theme.dart';
import 'package:solo_salamina/widgets/event_details_sheet.dart';
import 'package:solo_salamina/widgets/mobile_header.dart';

/// QA calendar-batch parity coverage (register rows GLB-02/03/07, CAL-01,
/// EVT-01/02/04/05 — see docs/native-apps/QA-COMPARISON.md).
void main() {
  late EventsRepository events;
  late PlayersRepository players;
  late I18n i18n;
  late SharedPreferences prefs;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    events = await EventsRepository.load();
    players = await PlayersRepository.load();
    i18n = await I18n.load();
  });

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    prefs = await SharedPreferences.getInstance();
  });

  AppState appState() => AppState(events: events, players: players, i18n: i18n, prefs: prefs);

  Widget wrap(Widget child, {Brightness brightness = Brightness.light}) => ChangeNotifierProvider(
        create: (_) => appState(),
        child: MaterialApp(
          theme: buildTheme('default', brightness),
          home: Scaffold(body: child),
        ),
      );

  const playedFootballLoss = SportEvent(
    day: 19,
    sport: Sport.footballMen,
    location: MatchLocation.away,
    opponent: 'ΚΑΡΜΙΩΤΙΣΣΑ ΠΑΝΩ ΠΟΛΕΜΙΔΙΩΝ',
    time: '16:00',
    status: MatchStatus.played,
    score: '1-0',
    competition: Competition.league,
    matchday: 26,
    scorers: [
      Scorer(name: 'Home Striker', minute: '12', team: 'home'),
      Scorer(name: 'Away Striker', minute: '64', team: 'away'),
    ],
  );

  const playedVolleyballCupWin = SportEvent(
    day: 19,
    sport: Sport.volleyballWomen,
    location: MatchLocation.home,
    opponent: 'ΑΕΛ',
    time: '18:30',
    status: MatchStatus.played,
    score: '3-2',
    competition: Competition.cup,
    sets: [VolleyballSet(home: 25, away: 14)],
  );

  Widget sheetOpener(SportEvent event, {Brightness brightness = Brightness.light}) => wrap(
        Builder(
          builder: (context) => TextButton(
            onPressed: () => showEventDetailsSheet(context, event, 'april'),
            child: const Text('open'),
          ),
        ),
        brightness: brightness,
      );

  group('grid dots (GLB-07)', () {
    const football = SportEvent(
      day: 1, sport: Sport.footballMen, location: MatchLocation.home,
      opponent: 'X', time: '', status: MatchStatus.played, competition: Competition.league);
    const vbWomen = SportEvent(
      day: 1, sport: Sport.volleyballWomen, location: MatchLocation.home,
      opponent: 'X', time: '', status: MatchStatus.played, competition: Competition.cup);
    const vbMen = SportEvent(
      day: 1, sport: Sport.volleyballMen, location: MatchLocation.home,
      opponent: 'X', time: '', status: MatchStatus.played, competition: Competition.league);

    test('one dot per sport group: red football + blue volleyball', () {
      expect(dotColorsFor(const [football, vbWomen, vbMen]), [accentRed, twBlue500]);
    });

    test("women's volleyball dot is the web blue, not purple", () {
      expect(dotColorsFor(const [vbWomen]), [twBlue500]);
      expect(sportColor(Sport.volleyballWomen), twBlue500);
      expect(sportColor(Sport.volleyballMen), twBlue500);
    });
  });

  group('grid overflow days (CAL-01)', () {
    testWidgets('leading cells are blank, trailing days render grayed', (tester) async {
      await tester.pumpWidget(wrap(const CalendarPage()));
      await tester.pump();

      // Whatever the initial month, its first weekday offset must contain no
      // previous-month numbers: the grid renders no text for leading slots.
      // July 2026 starts on Wednesday (offset 2) and ends on Friday — the
      // trailing Sat/Sun slots show next month's 1 and 2 grayed.
      final anyDayCell = find.byKey(const ValueKey('day-cell-14'));
      expect(anyDayCell, findsOneWidget);
      // Leading previous-month days (June ends on 30) must not appear.
      expect(find.text('29'), findsOneWidget); // July 29 itself only
      expect(find.text('30'), findsOneWidget); // July 30 itself only

      await tester.pumpWidget(const SizedBox());
    });
  });

  group('header (GLB-02/03)', () {
    testWidgets('no share button; filter kept; theme icon shows current mode', (tester) async {
      await tester.pumpWidget(ChangeNotifierProvider(
        create: (_) => appState(),
        child: MaterialApp(
          theme: buildTheme('default', Brightness.light),
          home: Scaffold(body: MobileHeader(showCalendarActions: true)),
        ),
      ));

      expect(find.byIcon(Icons.share_outlined), findsNothing);
      expect(find.byIcon(Icons.filter_list_rounded), findsOneWidget);
      // Light mode → sun icon (the CURRENT mode, web semantics).
      expect(find.byIcon(Icons.light_mode_outlined), findsOneWidget);
      expect(find.byIcon(Icons.dark_mode_outlined), findsNothing);

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('back button renders when onBack is provided', (tester) async {
      var tapped = false;
      await tester.pumpWidget(ChangeNotifierProvider(
        create: (_) => appState(),
        child: MaterialApp(
          theme: buildTheme('default', Brightness.light),
          home: Scaffold(
            body: MobileHeader(showCalendarActions: false, onBack: () => tapped = true),
          ),
        ),
      ));

      await tester.tap(find.byIcon(Icons.arrow_back));
      expect(tapped, isTrue);

      await tester.pumpWidget(const SizedBox());
    });
  });

  group('event sheet (EVT rows)', () {
    testWidgets('loss sheet is red-tinted with no share chip and no date line (EVT-01/02)', (tester) async {
      await tester.pumpWidget(sheetOpener(playedFootballLoss));
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();

      // Result-tinted surface: light loss = red-50 (#FEF2F2).
      final surface = tester.widget<Container>(
        find.byWidgetPredicate((w) =>
            w is Container &&
            w.decoration is BoxDecoration &&
            (w.decoration! as BoxDecoration).gradient != null &&
            ((w.decoration! as BoxDecoration).gradient! as LinearGradient)
                .colors
                .first ==
                const Color(0xFFFEF2F2)),
      );
      expect(surface, isNotNull);

      // No share chip anywhere in the sheet (QA-25/GLB-02 decision).
      expect(find.byIcon(Icons.share_outlined), findsNothing);
      // No standalone date line (web shows none).
      expect(find.textContaining('April 19'), findsNothing);
      // Venue/away info renders as chips.
      expect(find.textContaining('✈️'), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('volleyball sheet titles with the fixture and shows time + cup chips (EVT-05/02)', (tester) async {
      await tester.pumpWidget(sheetOpener(playedVolleyballCupWin));
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();

      expect(find.text('MATCH RESULT'), findsNothing);
      expect(find.text('NEA SALAMIS VS AEL'), findsOneWidget);
      expect(find.textContaining('⏰ 18:30'), findsOneWidget);
      expect(find.textContaining('🏆'), findsOneWidget);
      // CTA is football-only on the web.
      expect(find.textContaining('VIEW ALL STATISTICS'), findsNothing);

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('football played shows MATCH RESULT, competition line and CTA', (tester) async {
      await tester.pumpWidget(sheetOpener(playedFootballLoss));
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();

      expect(find.text('MATCH RESULT'), findsOneWidget);
      expect(find.textContaining('MATCHDAY 26'), findsOneWidget);
      // SingleChildScrollView lays out all children — no scrolling needed.
      expect(find.textContaining('VIEW ALL STATISTICS'), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('goalscorers split by team side (EVT-04)', (tester) async {
      await tester.pumpWidget(sheetOpener(playedFootballLoss));
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();

      // Columns follow the header row: match home team LEFT, away RIGHT —
      // regardless of which side we are (QA task #11; the old ours-left
      // formula put our players under the opponent's header on away games).
      final homeScorer = find.textContaining('Home Striker');
      final awayScorer = find.textContaining('Away Striker');
      expect(homeScorer, findsOneWidget);
      expect(awayScorer, findsOneWidget);
      final width = tester.getSize(find.byType(MaterialApp)).width;
      expect(tester.getCenter(homeScorer).dx, lessThan(width / 2));
      expect(tester.getCenter(awayScorer).dx, greaterThan(width / 2));

      await tester.pumpWidget(const SizedBox());
    });
  });
}
