import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:red_rebels_calendar/data/events_repository.dart';
import 'package:red_rebels_calendar/data/players_repository.dart';
import 'package:red_rebels_calendar/i18n/i18n.dart';
import 'package:red_rebels_calendar/logic/home_widget_updater.dart';
import 'package:red_rebels_calendar/state/app_state.dart';

import 'live_feed_fakes.dart';

/// Phase 9 — next-match home-screen widget payload.
void main() {
  late PlayersRepository players;
  late I18n i18n;
  late Directory tempDir;

  Future<File?> cacheFile() async => File('${tempDir.path}/events-cache.json');

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    players = await PlayersRepository.load();
    i18n = await I18n.load();
  });

  late Map<String, Object?> saved;
  late int updateCalls;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('widget-test');
    saved = {};
    updateCalls = 0;
    saveWidgetData = (id, data) async => saved[id] = data;
    requestWidgetUpdate = () async => updateCalls++;
  });

  tearDown(() async {
    await tempDir.delete(recursive: true);
  });

  Future<AppState> appWith({String? cachePayload, String language = 'en'}) async {
    if (cachePayload != null) {
      await (await cacheFile())!.writeAsString(cachePayload);
    }
    final events = await EventsRepository.load(cacheFile: cacheFile);
    SharedPreferences.setMockInitialValues({'language': language});
    final prefs = await SharedPreferences.getInstance();
    return AppState(events: events, players: players, i18n: i18n, prefs: prefs);
  }

  /// An upcoming August fixture — the only season month still in the future
  /// relative to the July 2026 test clock (September maps to 2025).
  String augustPayload({String competition = 'league', String time = '19:00'}) =>
      json.encode({
        'events': {
          'august': [
            {
              'day': 23,
              'sport': 'football-men',
              'location': 'home',
              'opponent': 'ΑΠΟΕΛ',
              'time': time,
              'status': 'upcoming',
              'competition': competition,
            },
          ],
        },
      });

  test('season over (bundled data): empty-state payload', () async {
    final app = await appWith();
    await updateNextMatchWidget(app);

    expect(saved[hasMatchKey], false);
    expect(saved[labelKey], 'NEXT MATCH');
    expect(saved[emptyTextKey], 'No data available');
    expect(saved[titleKey], '');
    expect(saved[eventKeyKey], '');
    expect(updateCalls, 1);
  });

  test('upcoming fixture: localized title, subtitle, kickoff and deep-link key', () async {
    final app = await appWith(cachePayload: augustPayload());
    await updateNextMatchWidget(app);

    expect(saved[hasMatchKey], true);
    expect(saved[titleKey], 'Nea Salamis vs APOEL');
    expect(saved[subtitleKey], "MEN'S FOOTBALL · Aug 23 • 19:00");
    expect(saved[kickoffMillisKey],
        DateTime(2026, 8, 23, 19, 0).millisecondsSinceEpoch);
    expect(saved[eventKeyKey], 'august-23-football-men-ΑΠΟΕΛ');
    expect(updateCalls, 1);
  });

  test('cup fixture appends the Cup label; TBD time drops the clock', () async {
    final app = await appWith(cachePayload: augustPayload(competition: 'cup', time: ''));
    await updateNextMatchWidget(app);

    expect(saved[subtitleKey], "MEN'S FOOTBALL CUP · Aug 23");
  });

  test('Greek payload uses the tonos-free uppercase labels', () async {
    final app = await appWith(cachePayload: augustPayload(), language: 'el');
    await updateNextMatchWidget(app);

    expect(saved[labelKey], 'ΕΠΟΜΕΝΟΣ ΑΓΩΝΑΣ');
    expect((saved[subtitleKey] as String), startsWith('ΑΝΔΡΙΚΟ ΠΟΔΟΣΦΑΙΡΟ ·'));
    expect(saved[titleKey], 'Νέα Σαλαμίνα vs ΑΠΟΕΛ');
  });

  test('bridge failures never throw', () async {
    saveWidgetData = (_, data) async => throw StateError('no platform channel');
    final app = await appWith();
    await updateNextMatchWidget(app); // must not throw
    expect(updateCalls, 0);
  });

  test('filteredEventsFor returns a fresh sortable list (months absent from the feed are const)', () async {
    // Single-month cache: every other month resolves to `const []` — the
    // in-place sorts in the calendar views used to throw
    // "Cannot modify an unmodifiable list" (found via the widget fixture).
    final app = await appWith(cachePayload: augustPayload());

    final empty = app.filteredEventsFor('september');
    expect(() => empty.sort((a, b) => a.day.compareTo(b.day)), returnsNormally);
    final august = app.filteredEventsFor('august');
    august.sort((a, b) => b.day.compareTo(a.day)); // must not mutate the repo
    expect(app.events.eventsFor('august').first.day, 23);
  });

  test('widgetRefresher fires on language change and after syncs', () async {
    final app = await appWith(cachePayload: augustPayload());
    var calls = 0;
    app.widgetRefresher = () => calls++;

    app.setLanguage('el');
    expect(calls, 1);
    app.setLanguage('el'); // no-op change → no refresh
    expect(calls, 1);

    final synced = AppState(
      events: await EventsRepository.load(cacheFile: cacheFile),
      players: players,
      i18n: i18n,
      prefs: await SharedPreferences.getInstance(),
      syncEnabled: true,
      httpClientFactory: okClient,
    );
    var syncedCalls = 0;
    synced.widgetRefresher = () => syncedCalls++;
    await synced.syncEvents();
    expect(syncedCalls, 1);
  });
}
