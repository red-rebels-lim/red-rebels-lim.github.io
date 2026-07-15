import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:red_rebels_calendar/data/events_repository.dart';
import 'package:red_rebels_calendar/data/players_repository.dart';
import 'package:red_rebels_calendar/i18n/i18n.dart';
import 'package:red_rebels_calendar/pages/stats_page.dart';
import 'package:red_rebels_calendar/state/app_state.dart';
import 'package:red_rebels_calendar/theme.dart';

/// QA stats-batch parity coverage (register rows STA-01/02/03/06/08/09 —
/// see docs/native-apps/QA-COMPARISON.md).
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

  Future<void> pumpStats(WidgetTester tester) async {
    await tester.pumpWidget(ChangeNotifierProvider(
      create: (_) => AppState(events: events, players: players, i18n: i18n, prefs: prefs),
      child: MaterialApp(
        theme: buildTheme('default', Brightness.light),
        home: const Scaffold(body: StatsPage()),
      ),
    ));
    await tester.pump();
  }

  testWidgets('sport selector renders full pill labels, no TabBar (STA-01)', (tester) async {
    await pumpStats(tester);

    expect(find.byType(TabBar), findsNothing);
    expect(find.text("Men's Football"), findsOneWidget);
    expect(find.text("Men's Volleyball"), findsOneWidget);
    expect(find.text("Women's Volleyball"), findsOneWidget);
    // Web pills carry no emoji.
    expect(find.textContaining('⚽'), findsNothing);

    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('football tab: web sections in web order, no app-only extras (STA-02/08)', (tester) async {
    await pumpStats(tester);

    // Web sections (uppercase condensed titles).
    expect(find.text('SEASON SUMMARY'), findsOneWidget);
    expect(find.textContaining('RECENT FORM'), findsOneWidget);
    expect(find.text('PERFORMANCE SPLIT'), findsOneWidget);
    expect(find.text('Last 5 Matches'), findsOneWidget); // STA-09 subtitle

    // App-only sections removed (web renders none of these).
    expect(find.text('STREAKS'), findsNothing);
    expect(find.text('RECORDS'), findsNothing);
    expect(find.text('SEASON PROGRESS'), findsNothing);

    // Web summary shows no W% / goal-difference tiles (STA-03).
    expect(find.textContaining('83%'), findsNothing);
    expect(find.textContaining('+41'), findsNothing);

    // Order: summary before form before split.
    final summaryY = tester.getTopLeft(find.text('SEASON SUMMARY')).dy;
    final formY = tester.getTopLeft(find.textContaining('RECENT FORM')).dy;
    expect(summaryY, lessThan(formY));

    await tester.pumpWidget(const SizedBox());
  });

  testWidgets("men's volleyball: hero tiles + set bars; top scorers highlight #1 (STA-03/04/06)", (tester) async {
    await pumpStats(tester);
    await tester.tap(find.text("Men's Volleyball"));
    await tester.pumpAndSettle();

    // Hero pair: Win Rate + Points, value 30px in primary red.
    expect(find.text('Win Rate'), findsOneWidget);
    final winRateValue = tester.widget<Text>(find.textContaining('%').first);
    expect(winRateValue.style?.fontSize, 30);

    // Set breakdown: bars + the three win tiles, no loss tiles.
    await tester.scrollUntilVisible(find.text('SET BREAKDOWN'), 200);
    expect(find.text('Sets Won'), findsOneWidget);
    expect(find.byType(LinearProgressIndicator), findsNWidgets(2));
    expect(find.text('3-0'), findsOneWidget);
    expect(find.text('0-3'), findsNothing); // web shows win patterns only

    // Top scorers: rows with rank + no "/ matches" suffix.
    await tester.scrollUntilVisible(find.text('TOP SCORERS'), 400);
    expect(find.textContaining(' / '), findsNothing);

    // No Records / H2H on the web volleyball tab.
    expect(find.text('RECORDS'), findsNothing);
    expect(find.text('HEAD-TO-HEAD'), findsNothing);

    await tester.pumpWidget(const SizedBox());
  });

  testWidgets("women's volleyball: web order is Recent Form first, heroes are Points + Sets Won", (tester) async {
    await pumpStats(tester);
    await tester.tap(find.text("Women's Volleyball"));
    await tester.pumpAndSettle();

    expect(find.text('Win Rate'), findsNothing); // men's hero only
    expect(find.text('Sets Won'), findsOneWidget); // hero label (no set-breakdown section)
    expect(find.text('SET BREAKDOWN'), findsNothing);

    final formY = tester.getTopLeft(find.textContaining('RECENT FORM')).dy;
    final summaryY = tester.getTopLeft(find.text('SEASON SUMMARY')).dy;
    expect(formY, lessThan(summaryY));

    await tester.pumpWidget(const SizedBox());
  });
}
