/// G-*/H-*/I-* — Settings, Greek pass, dark mode + visual themes
/// (TEST-PLAN §6.G/H/I).
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:solo_salamina/widgets/marquee.dart';

import 'qa_helpers.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('G-05 settings structure: sections, single push channel, tools, about', (tester) async {
    await bootApp(tester);
    await goToTab(tester, 'SETTINGS');

    expect(find.text('NOTIFICATIONS'), findsOneWidget);
    expect(find.byKey(const Key('push-channel-switch')), findsOneWidget);
    // Stakeholder rulings: native push only — no web-push/telegram/sync rows.
    expect(find.text('Web Push'), findsNothing);
    expect(find.text('Telegram Bot'), findsNothing);
    expect(find.text('Calendar Sync'), findsNothing);

    await tester.scrollUntilVisible(find.text('Export Calendar'), 300,
        scrollable: find.byType(Scrollable).first);
    expect(find.text('Print Calendar'), findsNothing, reason: 'print omitted by decision');
    await tester.scrollUntilVisible(find.text('View on GitHub'), 300,
        scrollable: find.byType(Scrollable).first);
    expect(find.textContaining('v1.'), findsOneWidget, reason: 'SET-09 v-prefixed version');
  });

  testWidgets('G-10 notification preview expands with sample notifications', (tester) async {
    await bootApp(tester);
    await goToTab(tester, 'SETTINGS');
    await tap(tester, find.byKey(const Key('notification-preview-toggle')));
    expect(find.textContaining('Kickoff in'), findsWidgets);
  });

  testWidgets('G-15/H-01 language switch is instant; uppercase Greek drops tonos', (tester) async {
    final app = await bootApp(tester);
    await goToTab(tester, 'SETTINGS');
    expect(find.text('English'), findsOneWidget);

    await tap(tester, find.text('English'));
    await pumpFrames(tester, 12);
    expect(app.language, 'el');
    // GRK-01/GRK-02 on what's in view after the switch.
    expect(find.textContaining('ΡΥΘΜΙΣΕΙΣ').hitTestable(), findsWidgets); // nav label
    expect(find.textContaining('Γλώσσα').hitTestable(), findsWidgets); // no mid-word wrap
    expect(find.textContaining('ΦΙΛΤΡΟ ΑΘΛΗΜΑΤΩΝ').hitTestable(), findsWidgets);
    // The notifications heading sits at the top — scroll back up (sliver
    // culling means off-screen headings are not even built).
    await tester.drag(find.byType(Scrollable).hitTestable().last, const Offset(0, 1200));
    await pumpFrames(tester, 4);
    expect(find.textContaining('ΕΙΔΟΠΟΙΗΣΕΙΣ').hitTestable(), findsWidgets);
    expect(find.textContaining('ΕΙΔΟΠΟΙΉΣΕΙΣ'), findsNothing,
        reason: 'uppercase Greek must strip tonos');
  });

  testWidgets('G-17 3-way dark control switches theme mode', (tester) async {
    final app = await bootApp(tester);
    await goToTab(tester, 'SETTINGS');
    expect(app.themeMode, ThemeMode.light);
    await tap(tester, find.byIcon(Icons.dark_mode).last);
    expect(app.themeMode, ThemeMode.dark);
    await tap(tester, find.byIcon(Icons.brightness_auto).last);
    expect(app.themeMode, ThemeMode.system);
  });

  testWidgets('G-18/I-02 visual theme picker applies brutalism (marquee ticker)', (tester) async {
    final app = await bootApp(tester);
    await goToTab(tester, 'SETTINGS');

    await tap(tester, find.byKey(const Key('visual-theme-select')));
    await tap(tester, find.text('Brutalism').last);
    await pumpFrames(tester, 8);
    expect(app.visualTheme, 'brutalism');
    expect(
      tester.getSize(find.byType(Marquee)).height,
      greaterThan(0),
      reason: 'brutalism renders the marquee ticker',
    );

    await tap(tester, find.byKey(const Key('visual-theme-select')));
    await tap(tester, find.text('Neon HUD').last);
    await pumpFrames(tester, 8);
    expect(app.visualTheme, 'neon');

    await tap(tester, find.byKey(const Key('visual-theme-select')));
    await tap(tester, find.text('Default').last);
    await pumpFrames(tester, 8);
    expect(app.visualTheme, 'default');
  });

  testWidgets('G-12 global sports filter hides football everywhere', (tester) async {
    await bootApp(tester);
    await goToTab(tester, 'SETTINGS');
    await tester.scrollUntilVisible(find.byKey(const Key('sport-filter-football')), 300,
        scrollable: find.byType(Scrollable).first);
    await tap(tester, find.byKey(const Key('sport-filter-football')));

    await goToTab(tester, 'CALENDAR');
    await goToMonth(tester, 'SEPTEMBER');
    await tap(tester, headerIcon(Icons.grid_view_rounded)); // -> list
    expect(find.textContaining('Doxa Katokopia'), findsNothing,
        reason: 'football filtered out of the calendar globally');

    // Restore.
    await goToTab(tester, 'SETTINGS');
    await tester.scrollUntilVisible(find.byKey(const Key('sport-filter-football')), 300,
        scrollable: find.byType(Scrollable).first);
    await tap(tester, find.byKey(const Key('sport-filter-football')));
  });

  testWidgets('H-03 Greek pass: calendar and stats render without crashes', (tester) async {
    await bootApp(tester, prefs: const {
      'intro_seen_v1': true,
      'language': 'el',
      'themeMode': 'dark',
    });
    expect(find.text('ΗΜΕΡΟΛΟΓΙΟ'), findsWidgets);
    await goToTab(tester, 'ΣΤΑΤΙΣΤΙΚΑ');
    expect(find.textContaining('ΣΕΖΟΝ'), findsWidgets); // season summary heading
    await goToTab(tester, 'ΡΟΣΤΕΡ');
    await goToTab(tester, 'ΡΥΘΜΙΣΕΙΣ');
  });
}
