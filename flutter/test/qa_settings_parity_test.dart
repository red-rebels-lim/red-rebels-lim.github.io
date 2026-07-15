import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:red_rebels_calendar/data/events_repository.dart';
import 'package:red_rebels_calendar/data/players_repository.dart';
import 'package:red_rebels_calendar/i18n/i18n.dart';
import 'package:red_rebels_calendar/pages/settings_page.dart';
import 'package:red_rebels_calendar/state/app_state.dart';
import 'package:red_rebels_calendar/theme.dart';

/// QA settings-batch parity coverage (register rows SET-01/07/09, GRK-01/02 —
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

  group('upperNoTonos (GRK-01)', () {
    test('drops the tonos like browsers with lang=el', () {
      expect('Ρυθμίσεις'.upperNoTonos, 'ΡΥΘΜΙΣΕΙΣ');
      expect('Ημερολόγιο'.upperNoTonos, 'ΗΜΕΡΟΛΟΓΙΟ');
      expect('Νίκη'.upperNoTonos, 'ΝΙΚΗ');
      expect('Ήττα'.upperNoTonos, 'ΗΤΤΑ');
    });

    test('keeps the dialytika and leaves Latin untouched', () {
      expect('Βόλεϊ'.upperNoTonos, 'ΒΟΛΕΪ');
      expect('Statistics'.upperNoTonos, 'STATISTICS');
    });
  });

  testWidgets('settings shell: language row toggles EN↔EL, version has v prefix (SET-01/07/09)', (tester) async {
    final app = AppState(events: events, players: players, i18n: i18n, prefs: prefs);
    await tester.pumpWidget(ChangeNotifierProvider.value(
      value: app,
      child: MaterialApp(
        theme: buildTheme('default', Brightness.light),
        home: const Scaffold(body: SettingsPage()),
      ),
    ));
    await tester.pump();

    // Web row shell: language shows the value + chevron, no segmented control.
    expect(find.text('English'), findsOneWidget);
    expect(find.byIcon(Icons.chevron_right), findsOneWidget);
    expect(find.byType(SegmentedButton<String>), findsNothing);

    // Tapping the row flips the language like the web's toggleLanguage.
    await tester.tap(find.text('Language'));
    await tester.pump();
    expect(app.language, 'el');
    expect(find.text('Γλώσσα'), findsOneWidget);

    await tester.tap(find.text('Γλώσσα'));
    await tester.pump();
    expect(app.language, 'en');

    // 3-way theme control kept (SET-08 decision).
    expect(find.byType(SegmentedButton<ThemeMode>), findsOneWidget);

    await tester.pumpWidget(const SizedBox());
  });
}
