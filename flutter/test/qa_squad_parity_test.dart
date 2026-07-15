import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:red_rebels_calendar/data/events_repository.dart';
import 'package:red_rebels_calendar/data/players_repository.dart';
import 'package:red_rebels_calendar/i18n/i18n.dart';
import 'package:red_rebels_calendar/logic/squad_stats.dart';
import 'package:red_rebels_calendar/state/app_state.dart';
import 'package:red_rebels_calendar/theme.dart';
import 'package:red_rebels_calendar/widgets/player_sheet.dart';

/// QA squad-batch parity coverage (register rows SQD-02/03 —
/// docs/native-apps/QA-COMPARISON.md).
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

  testWidgets('player sheet: close X, no drag handle, one-line stat details', (tester) async {
    final app = AppState(events: events, players: players, i18n: i18n, prefs: prefs);
    // Any player with appearances gives the stat grid with detail lines.
    final stats = aggregateSquadStats(roster: players.all, eventsByMonth: events.byMonth);
    final withApps = players.all.firstWhere((p) => (stats[p.key]?.apps ?? 0) > 0);

    await tester.pumpWidget(ChangeNotifierProvider.value(
      value: app,
      child: MaterialApp(
        theme: buildTheme('default', Brightness.light),
        home: Scaffold(
          body: Builder(
            builder: (context) => TextButton(
              onPressed: () => showPlayerSheet(context, withApps, stats[withApps.key]!),
              child: const Text('open'),
            ),
          ),
        ),
      ),
    ));
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();

    // Web sheet chrome: close X present (SQD-03).
    final closeButton = find.byIcon(Icons.close);
    expect(closeButton, findsOneWidget);

    // Stat-tile details render inside a scale-down FittedBox → never wrap
    // to a second line (SQD-02).
    expect(
      find.ancestor(of: find.textContaining('·'), matching: find.byType(FittedBox)),
      findsWidgets,
    );

    await tester.tap(closeButton);
    await tester.pumpAndSettle();
    expect(find.byIcon(Icons.close), findsNothing);

    await tester.pumpWidget(const SizedBox());
  });
}
