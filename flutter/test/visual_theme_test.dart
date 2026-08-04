import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:solo_salamina/data/events_repository.dart';
import 'package:solo_salamina/data/players_repository.dart';
import 'package:solo_salamina/i18n/i18n.dart';
import 'package:solo_salamina/main.dart';
import 'package:solo_salamina/state/app_state.dart';
import 'package:solo_salamina/theme.dart';

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

  Future<AppState> pumpApp(WidgetTester tester, {String? visualTheme, bool dark = false}) async {
    SharedPreferences.setMockInitialValues({
      AppState.visualThemeKey: ?visualTheme,
      if (dark) 'themeMode': 'dark',
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

      // Brutalism: zero radius, Space Grotesk HEADINGS, zinc-black
      // background, 2px chrome borders (THM-02), red-tinted active nav
      // block. Body stays Barlow — the web hardcodes it on <main>, so
      // `--font-body` never reaches page content.
      expect(AppColors.brutalismDark.background, const Color(0xFF09090B));
      expect(AppColors.brutalismDark.panelRadius, 0);
      expect(AppColors.brutalismDark.cardRadius, 0);
      expect(AppColors.brutalismDark.squareCorners, isTrue);
      expect(AppColors.brutalismDark.headingFontFamily, 'SpaceGrotesk');
      expect(AppColors.brutalismDark.bodyFontFamily, 'Barlow');
      expect(AppColors.brutalismDark.chromeBorderWidth, 2);
      expect(AppColors.brutalismDark.headerBorder, const Color(0xFF3F3F46));
      expect(AppColors.brutalismDark.navActiveBg, const Color(0x14E02520));
      expect(AppColors.brutalismLight.navBorder, brandRed);

      // Cinema: near-black background, larger radius, Inter headings,
      // plain header buttons, ambient blobs in dark (THM-03/04).
      expect(AppColors.cinemaDark.background, const Color(0xFF020203));
      expect(AppColors.cinemaDark.panelRadius, greaterThan(AppColors.dark.panelRadius));
      expect(AppColors.cinemaDark.headingFontFamily, 'Inter');
      expect(AppColors.cinemaDark.squareCorners, isFalse);
      expect(AppColors.cinemaDark.headerButtonBg, const Color(0x00000000));
      expect(AppColors.cinemaDark.ambientBlobs, isTrue);
      expect(AppColors.cinemaLight.ambientBlobs, isTrue); // gated on dark at build
      expect(AppColors.dark.ambientBlobs, isTrue);
      expect(AppColors.brutalismDark.ambientBlobs, isFalse);
      expect(AppColors.neonDark.ambientBlobs, isFalse);

      // Neon: cyan accent, shifted primary (dark only), zero radius, cyan
      // active nav with glow in dark (THM-05).
      expect(AppColors.neonDark.neonCyan, const Color(0xFF00FFFF));
      expect(AppColors.neonDark.primary, const Color(0xFFFF2D20));
      expect(AppColors.neonLight.neonCyan, const Color(0xFF0891B2));
      expect(AppColors.neonLight.primary, brandRed);
      expect(AppColors.neonDark.panelRadius, 0);
      expect(AppColors.neonDark.squareCorners, isTrue);
      expect(AppColors.neonDark.headingFontFamily, 'Orbitron');
      expect(AppColors.neonDark.bodyFontFamily, 'Barlow');
      expect(AppColors.neonDark.navActive, const Color(0xFF00FFFF));
      expect(AppColors.neonDark.navActiveGlow, isTrue);
      expect(AppColors.neonLight.navActive, const Color(0xFF0891B2));
      expect(AppColors.neonLight.navActiveGlow, isFalse);
      expect(AppColors.dark.navActive, accentRed);

      // Web panel is `bg-white/70 dark:bg-transparent` for EVERY theme
      // (CalendarPage line is theme-independent — THM-06).
      expect(AppColors.neonLight.surfacePanel, const Color(0xB3FFFFFF));
      expect(AppColors.neonDark.surfacePanel, const Color(0x00000000));
      expect(AppColors.brutalismDark.surfacePanel, const Color(0x00000000));

      // Non-neon themes expose no cyan accent.
      expect(AppColors.dark.neonCyan, isNull);
      expect(AppColors.brutalismDark.neonCyan, isNull);

      // `br()`: rounded-* squares out under brutalism/neon only.
      expect(AppColors.brutalismDark.br(999), BorderRadius.zero);
      expect(AppColors.neonDark.br(8), BorderRadius.zero);
      expect(AppColors.dark.br(8), BorderRadius.circular(8));
      expect(AppColors.cinemaDark.br(999), BorderRadius.circular(999));
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

    testWidgets('ambient blobs drift on default + cinema dark only (THM-04)', (tester) async {
      await pumpApp(tester, dark: true);
      expect(find.byKey(const Key('ambient-blobs')), findsOneWidget);
      await tester.pumpWidget(const SizedBox());

      await pumpApp(tester, visualTheme: 'cinema', dark: true);
      expect(find.byKey(const Key('ambient-blobs')), findsOneWidget);
      await tester.pumpWidget(const SizedBox());

      // Light mode and the other themes stay blob-free.
      await pumpApp(tester, visualTheme: 'cinema');
      expect(find.byKey(const Key('ambient-blobs')), findsNothing);
      await tester.pumpWidget(const SizedBox());

      await pumpApp(tester, visualTheme: 'neon', dark: true);
      expect(find.byKey(const Key('ambient-blobs')), findsNothing);
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('neon scanlines render in dark mode only (THM-07)', (tester) async {
      await pumpApp(tester, visualTheme: 'neon', dark: true);
      expect(find.byKey(const Key('neon-scanlines')), findsOneWidget);
      await tester.pumpWidget(const SizedBox());

      await pumpApp(tester, visualTheme: 'neon');
      expect(find.byKey(const Key('neon-scanlines')), findsNothing);
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
