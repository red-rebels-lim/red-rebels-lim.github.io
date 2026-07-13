import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:red_rebels_calendar/data/events_repository.dart';
import 'package:red_rebels_calendar/data/players_repository.dart';
import 'package:red_rebels_calendar/i18n/i18n.dart';
import 'package:red_rebels_calendar/main.dart';
import 'package:red_rebels_calendar/state/app_state.dart';
import 'package:red_rebels_calendar/theme.dart';

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

  Future<AppState> pumpApp(WidgetTester tester, {String? visualTheme}) async {
    SharedPreferences.setMockInitialValues({
      AppState.visualThemeKey: ?visualTheme,
      // Keep the first-run intro out of the way of these tests.
      AppState.introSeenKey: true,
    });
    prefs = await SharedPreferences.getInstance();
    final app = AppState(events: events, players: players, i18n: i18n, prefs: prefs);
    await tester.pumpWidget(
      ChangeNotifierProvider.value(value: app, child: const RedRebelsApp()),
    );
    await tester.pump();
    return app;
  }

  group('palettes', () {
    test('each theme carries its distinctive tokens (index.css parity)', () {
      // Default (unchanged from the pre-theme palettes).
      expect(AppColors.dark.background, const Color(0xFF0A1810));
      expect(AppColors.light.panelRadius, 16);
      expect(AppColors.light.headingFontFamily, 'BarlowCondensed');
      // Web dark draws no panel box behind the calendar
      // (`bg-white/70 dark:bg-transparent`); light keeps white@70%.
      expect(AppColors.dark.surfacePanel, const Color(0x00000000));
      expect(AppColors.light.surfacePanel, const Color(0xB3FFFFFF));
      // Calendar tiles (nav buttons, event cards) vary only per brightness.
      expect(AppColors.light.surfaceTile, const Color(0xFFF1F5F9));
      expect(AppColors.dark.surfaceTile, const Color(0xFF1E293B));
      expect(AppColors.brutalismDark.surfaceTile, const Color(0xFF1E293B));

      // Brutalism: zero radius, Space Grotesk, zinc-black background.
      expect(AppColors.brutalismDark.background, const Color(0xFF09090B));
      expect(AppColors.brutalismDark.panelRadius, 0);
      expect(AppColors.brutalismDark.cardRadius, 0);
      expect(AppColors.brutalismDark.bodyFontFamily, 'SpaceGrotesk');
      expect(AppColors.brutalismLight.navBorder, brandRed);

      // Cinema: near-black background, larger radius, no bundled font.
      expect(AppColors.cinemaDark.background, const Color(0xFF020203));
      expect(AppColors.cinemaDark.panelRadius, greaterThan(AppColors.dark.panelRadius));
      expect(AppColors.cinemaDark.headingFontFamily, isNull);

      // Neon: cyan accent, shifted primary (dark only), zero radius.
      expect(AppColors.neonDark.neonCyan, const Color(0xFF00FFFF));
      expect(AppColors.neonDark.primary, const Color(0xFFFF2D20));
      expect(AppColors.neonLight.neonCyan, const Color(0xFF0891B2));
      expect(AppColors.neonLight.primary, brandRed);
      expect(AppColors.neonDark.panelRadius, 0);
      expect(AppColors.neonDark.headingFontFamily, 'Orbitron');
      expect(AppColors.neonDark.bodyFontFamily, 'JetBrainsMono');

      // Non-neon themes expose no cyan accent.
      expect(AppColors.dark.neonCyan, isNull);
      expect(AppColors.brutalismDark.neonCyan, isNull);
    });

    test('buildTheme registers the palette as a ThemeExtension', () {
      final theme = buildTheme('neon', Brightness.dark);
      final colors = theme.extension<AppColors>()!;
      expect(colors.themeId, 'neon');
      expect(theme.colorScheme.primary, const Color(0xFFFF2D20));
      expect(
        (theme.cardTheme.shape as RoundedRectangleBorder).borderRadius,
        BorderRadius.zero,
      );

      // Unknown ids fall back to default (useVisualTheme validation parity).
      expect(buildTheme('bogus', Brightness.dark).extension<AppColors>()!.themeId, 'default');
    });
  });

  group('persistence', () {
    test('visual theme round-trips through SharedPreferences', () async {
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
      final app = AppState(events: events, players: players, i18n: i18n, prefs: prefs);
      expect(app.visualTheme, 'default');

      app.setVisualTheme('cinema');
      expect(prefs.getString(AppState.visualThemeKey), 'cinema');

      // A fresh AppState (app restart) restores the choice.
      final restarted = AppState(events: events, players: players, i18n: i18n, prefs: prefs);
      expect(restarted.visualTheme, 'cinema');

      // Invalid values are ignored, both stored and set.
      app.setVisualTheme('bogus');
      expect(app.visualTheme, 'cinema');
      SharedPreferences.setMockInitialValues({AppState.visualThemeKey: 'bogus'});
      prefs = await SharedPreferences.getInstance();
      final corrupt = AppState(events: events, players: players, i18n: i18n, prefs: prefs);
      expect(corrupt.visualTheme, 'default');
    });
  });

  group('structural widgets', () {
    testWidgets('Marquee ticker renders only on brutalism', (tester) async {
      await pumpApp(tester, visualTheme: 'brutalism');
      expect(find.byKey(const Key('marquee-ticker')), findsOneWidget);
      await tester.pumpWidget(const SizedBox());

      await pumpApp(tester);
      expect(find.byKey(const Key('marquee-ticker')), findsNothing);
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('HudFrame corners render only on neon', (tester) async {
      await pumpApp(tester, visualTheme: 'neon');
      for (final corner in ['topLeft', 'topRight', 'bottomLeft', 'bottomRight']) {
        expect(find.byKey(Key('hud-corner-$corner')), findsOneWidget);
      }
      await tester.pumpWidget(const SizedBox());

      await pumpApp(tester);
      expect(find.byKey(const Key('hud-corner-topLeft')), findsNothing);
      await tester.pumpWidget(const SizedBox());
    });
  });

  group('settings picker', () {
    testWidgets('selecting a theme rebuilds MaterialApp with its palette', (tester) async {
      final app = await pumpApp(tester);
      await tester.tap(find.text('SETTINGS'));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('visual-theme-select')), findsOneWidget);
      expect(find.text('Default'), findsOneWidget);

      await tester.tap(find.byKey(const Key('visual-theme-select')));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Neon HUD').last);
      await tester.pumpAndSettle();

      expect(app.visualTheme, 'neon');
      expect(prefs.getString(AppState.visualThemeKey), 'neon');

      // The active Theme now carries the neon palette...
      final context = tester.element(find.byKey(const Key('visual-theme-select')));
      final colors = AppColors.of(context);
      expect(colors.themeId, 'neon');
      expect(colors.neonCyan, isNotNull);
      // ...and the neon-only HUD frame appeared around the content.
      expect(find.byKey(const Key('hud-corner-topLeft')), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    });
  });
}
