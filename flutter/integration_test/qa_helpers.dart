/// Shared harness for the QA integration suite (TEST-PLAN §6c).
library;

import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:solo_salamina/data/events_repository.dart';
import 'package:solo_salamina/data/players_repository.dart';
import 'package:solo_salamina/i18n/i18n.dart';
import 'package:solo_salamina/main.dart';
import 'package:solo_salamina/state/app_state.dart';

import 'qa_datasets.dart';

/// Default prefs: tour dismissed, English, default theme, grid view — the
/// EN/light baseline every scenario starts from unless it says otherwise.
const Map<String, Object> qaBaselinePrefs = {
  'intro_seen_v1': true,
  'language': 'en',
  'themeMode': 'light',
};

/// Boots the full app ([SoloSalaminaApp] incl. HomeShell/tour wiring) against a
/// synthetic dataset. Sync is disabled (AppState default) so the live feed
/// can never clobber the fixture mid-test.
Future<AppState> bootApp(
  WidgetTester tester, {
  String dataset = 'full-season',
  Map<String, Object> prefs = qaBaselinePrefs,
}) async {
  SharedPreferences.setMockInitialValues(prefs);
  final dir = await getTemporaryDirectory();
  final file = File('${dir.path}/qa-events-${DateTime.now().microsecondsSinceEpoch}.json');
  await file.writeAsString(json.encode(qaDataset(dataset)), flush: true);

  final events = await EventsRepository.load(cacheFile: () async => file);
  final players = await PlayersRepository.load();
  final i18n = await I18n.load();
  final sharedPrefs = await SharedPreferences.getInstance();

  final app = AppState(
    events: events,
    players: players,
    i18n: i18n,
    prefs: sharedPrefs,
  );
  await tester.pumpWidget(
    ChangeNotifierProvider.value(value: app, child: const SoloSalaminaApp()),
  );
  await pumpFrames(tester);
  return app;
}

/// The countdown widgets run periodic timers, so `pumpAndSettle` can hang
/// (same trap as the web's vi.runAllTimers, see flutter/test conventions).
/// Pump a fixed number of frames instead.
Future<void> pumpFrames(WidgetTester tester, [int frames = 6]) async {
  for (var i = 0; i < frames; i++) {
    await tester.pump(const Duration(milliseconds: 120));
  }
}

/// Taps [finder] and pumps.
///
/// HomeShell keeps every tab mounted in an IndexedStack, so bare finders can
/// resolve to OFFSTAGE widgets on inactive tabs. `.hitTestable()` restricts
/// matches to what the user can actually touch.
Future<void> tap(WidgetTester tester, Finder finder) async {
  final target = finder.hitTestable().first;
  await tester.ensureVisible(target);
  await tester.pump(const Duration(milliseconds: 80));
  await tester.tap(target, warnIfMissed: false);
  await pumpFrames(tester);
}

/// Scrolls the ACTIVE tab until [finder] is visible (IndexedStack-safe: picks
/// the last hit-testable scrollable, which belongs to the current page).
Future<void> scrollTo(WidgetTester tester, Finder finder) async {
  await tester.scrollUntilVisible(
    finder,
    250,
    scrollable: find.byType(Scrollable).hitTestable().last,
  );
  await pumpFrames(tester, 2);
}

/// Bottom-nav tab by uppercase label (EN baseline): CALENDAR, STATISTICS,
/// SQUAD, SETTINGS.
Future<void> goToTab(WidgetTester tester, String upperLabel) =>
    tap(tester, find.text(upperLabel).last);

/// Header icon buttons.
Finder headerIcon(IconData icon) => find.byIcon(icon);

/// Month navigation chevrons on the calendar grid.
Future<void> nextMonth(WidgetTester tester) => tap(tester, find.byIcon(Icons.chevron_right).first);
Future<void> prevMonth(WidgetTester tester) => tap(tester, find.byIcon(Icons.chevron_left).first);

/// Navigates the grid from the current month to [monthUpper] (e.g.
/// 'SEPTEMBER'), forward only, bounded to a season's worth of taps.
Future<void> goToMonth(WidgetTester tester, String monthUpper) async {
  for (var i = 0; i < 12; i++) {
    if (find.textContaining(monthUpper).evaluate().isNotEmpty) return;
    await nextMonth(tester);
  }
  fail('month $monthUpper never appeared');
}

/// A calendar grid day cell (`ValueKey('day-cell-<day>')`).
Finder dayCell(int day) => find.byKey(ValueKey('day-cell-$day'));
