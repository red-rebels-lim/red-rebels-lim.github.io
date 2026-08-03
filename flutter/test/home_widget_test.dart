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
              'venue': 'Αμμόχωστος',
            },
          ],
        },
      });

  test('no upcoming fixtures (empty feed): empty-state payload', () async {
    // The bundled asset now carries upcoming friendlies, so the empty state
    // needs a cached feed with no events (one empty month keeps the payload
    // valid — a bare {} is rejected and would fall back to the bundle).
    final app = await appWith(cachePayload: json.encode({'events': {'august': <Object?>[]}}));
    await updateNextMatchWidget(app);

    expect(saved[hasMatchKey], false);
    expect(saved[labelKey], 'NEXT MATCH');
    expect(saved[emptyTextKey], 'NO DATA AVAILABLE'); // design renders uppercase
    expect(saved[captionKey], 'TO KICKOFF');
    expect(saved[countdownUnitsKey], 'dhm');
    expect(saved[homeTeamKey], '');
    expect(saved[eventKeyKey], '');
    expect(updateCalls, 1);
  });

  test('upcoming fixture: localized title, subtitle, kickoff and deep-link key', () async {
    final app = await appWith(cachePayload: augustPayload());
    await updateNextMatchWidget(app);

    expect(saved[hasMatchKey], true);
    expect(saved[homeTeamKey], 'NEA SALAMIS');
    expect(saved[awayTeamKey], 'APOEL');
    expect(saved[sportTextKey], "MEN'S FOOTBALL");
    expect(saved[dateLabelKey], 'AUG 23 • 19:00');
    expect(saved[venueKey], isNotEmpty);
    expect(saved[homeLogoKey], 'assets/images/team_logos/ΝΕΑ_ΣΑΛΑΜΙΝΑ.webp');
    expect(saved[awayLogoKey], ''); // synthetic fixture carries no logo
    expect(saved[isCupKey], false);
    expect(saved[isVolleyballKey], false);
    expect(saved[kickoffMillisKey],
        DateTime(2026, 8, 23, 19, 0).millisecondsSinceEpoch);
    expect(saved[eventKeyKey], 'august-23-football-men-ΑΠΟΕΛ');
    expect(updateCalls, 1);
  });

  test('matchesJson lists upcoming fixtures in order so the widget self-advances', () async {
    // Two upcoming August fixtures: the provider stores both and advances from
    // the first to the second on its own once the first passes its grace.
    final payload = json.encode({
      'events': {
        'august': [
          {
            'day': 23,
            'sport': 'football-men',
            'location': 'home',
            'opponent': 'ΑΠΟΕΛ',
            'time': '19:00',
            'status': 'upcoming',
            'competition': 'league',
          },
          {
            'day': 30,
            'sport': 'football-men',
            'location': 'away',
            'opponent': 'ΟΜΟΝΟΙΑ',
            'time': '18:00',
            'status': 'upcoming',
            'competition': 'league',
          },
        ],
      },
    });
    final app = await appWith(cachePayload: payload);
    await updateNextMatchWidget(app);

    final list = json.decode(saved[matchesJsonKey] as String) as List;
    expect(list.length, 2);
    expect(list[0][eventKeyKey], 'august-23-football-men-ΑΠΟΕΛ');
    expect(list[1][eventKeyKey], 'august-30-football-men-ΟΜΟΝΟΙΑ');
    expect(list[0][kickoffMillisKey],
        DateTime(2026, 8, 23, 19, 0).millisecondsSinceEpoch);
    expect(list[1][kickoffMillisKey],
        DateTime(2026, 8, 30, 18, 0).millisecondsSinceEpoch);
    // Flat keys still mirror the first upcoming fixture (provider fallback).
    expect(saved[hasMatchKey], true);
    expect(saved[eventKeyKey], 'august-23-football-men-ΑΠΟΕΛ');
  });

  test('meeting events ride the widget: title on the home line, no away side', () async {
    final app = await appWith(cachePayload: json.encode({
      'events': {
        'august': [
          {
            'day': 10,
            'sport': 'meeting',
            'location': 'home',
            'opponent': 'First Official Training 2026/27',
            'time': '19:00',
          },
        ],
      },
    }));
    await updateNextMatchWidget(app);

    expect(saved[hasMatchKey], true);
    expect(saved[homeTeamKey], 'FIRST OFFICIAL TRAINING 2026/27');
    expect(saved[awayTeamKey], '', reason: 'meetings have no opponent line');
    expect(saved[awayLogoKey], '');
    expect(saved[homeLogoKey], 'assets/images/team_logos/ΝΕΑ_ΣΑΛΑΜΙΝΑ.webp');
    expect(saved[sportTextKey], 'EVENTS');
    expect(saved[kickoffMillisKey],
        DateTime(2026, 8, 10, 19, 0).millisecondsSinceEpoch);
    expect(updateCalls, 1);
  });

  test('cup fixture sets the chip flag; TBD time drops the clock', () async {
    final app = await appWith(cachePayload: augustPayload(competition: 'cup', time: ''));
    await updateNextMatchWidget(app);

    expect(saved[isCupKey], true);
    expect(saved[cupLabelKey], 'CUP');
    expect(saved[dateLabelKey], 'AUG 23');
  });

  test('Greek payload uses the tonos-free uppercase labels', () async {
    final app = await appWith(cachePayload: augustPayload(), language: 'el');
    await updateNextMatchWidget(app);

    expect(saved[labelKey], 'ΕΠΟΜΕΝΟΣ ΑΓΩΝΑΣ');
    expect(saved[sportTextKey], 'ΑΝΔΡΙΚΟ ΠΟΔΟΣΦΑΙΡΟ');
    expect(saved[homeTeamKey], 'ΝΕΑ ΣΑΛΑΜΙΝΑ');
    expect(saved[awayTeamKey], 'ΑΠΟΕΛ');
    expect(saved[captionKey], 'ΕΝΑΡΞΗ ΣΕ');
    expect(saved[countdownUnitsKey], 'ηωλ');
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
