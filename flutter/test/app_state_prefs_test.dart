/// AppState preference restore/migration coverage: calendarView migration
/// from the legacy `listView` bool, themeMode/language restore, and the
/// NotifPrefs corrupt-JSON fallback. (visualTheme invalid-value fallback is
/// covered in visual_theme_test.dart.)
///
/// The device-locale language default is intentionally not tested — it reads
/// PlatformDispatcher.instance.locale, which is not injectable.
library;

import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:solo_salamina/data/events_repository.dart';
import 'package:solo_salamina/data/players_repository.dart';
import 'package:solo_salamina/i18n/i18n.dart';
import 'package:solo_salamina/logic/push_registration.dart';
import 'package:solo_salamina/state/app_state.dart';

void main() {
  late EventsRepository events;
  late PlayersRepository players;
  late I18n i18n;

  // Asset loading must happen outside testWidgets' fake-async zone (see
  // widget_test.dart) — and only once for the whole file.
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    events = await EventsRepository.load();
    players = await PlayersRepository.load();
    i18n = await I18n.load();
  });

  Future<AppState> stateWith(Map<String, Object> initialPrefs) async {
    SharedPreferences.setMockInitialValues(initialPrefs);
    final prefs = await SharedPreferences.getInstance();
    return AppState(events: events, players: players, i18n: i18n, prefs: prefs);
  }

  group('calendarView migration from the legacy listView bool', () {
    test('listView=true migrates to list', () async {
      final app = await stateWith({'listView': true});
      expect(app.calendarView, 'list');
    });

    test('listView=false migrates to grid', () async {
      final app = await stateWith({'listView': false});
      expect(app.calendarView, 'grid');
    });

    test('no stored preference defaults to grid', () async {
      final app = await stateWith({});
      expect(app.calendarView, 'grid');
    });

    test('a stored calendarView wins over the legacy bool', () async {
      final app = await stateWith({'calendarView': 'cards', 'listView': true});
      expect(app.calendarView, 'cards');
    });

    test('an invalid stored calendarView falls back to the legacy bool', () async {
      final app = await stateWith({'calendarView': 'bogus', 'listView': true});
      expect(app.calendarView, 'list');
    });

    test('setCalendarView persists valid values and ignores invalid ones', () async {
      final app = await stateWith({});
      app.setCalendarView('cards');
      expect(app.calendarView, 'cards');
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('calendarView'), 'cards');

      app.setCalendarView('bogus');
      expect(app.calendarView, 'cards');
      expect(prefs.getString('calendarView'), 'cards');
    });
  });

  group('themeMode restore', () {
    test('light and dark restore from prefs', () async {
      expect((await stateWith({'themeMode': 'light'})).themeMode, ThemeMode.light);
      expect((await stateWith({'themeMode': 'dark'})).themeMode, ThemeMode.dark);
    });

    test('unknown or missing values fall back to system', () async {
      expect((await stateWith({'themeMode': 'bogus'})).themeMode, ThemeMode.system);
      expect((await stateWith({})).themeMode, ThemeMode.system);
    });
  });

  group('language restore', () {
    test('a stored language wins over the device locale', () async {
      expect((await stateWith({'language': 'el'})).language, 'el');
      expect((await stateWith({'language': 'en'})).language, 'en');
    });

    test('setLanguage persists', () async {
      final app = await stateWith({'language': 'en'});
      app.setLanguage('el');
      expect(app.language, 'el');
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('language'), 'el');
    });
  });

  group('NotifPrefs restore', () {
    test('valid snapshot is restored', () async {
      final stored = const NotifPrefs(
        notifyNewEvents: false,
        reminderHours: [2],
        enabledSports: ['football-men'],
      );
      final app = await stateWith({
        AppState.notifPrefsKey: json.encode(stored.toJson()),
      });
      expect(app.notifPrefs.notifyNewEvents, isFalse);
      expect(app.notifPrefs.reminderHours, [2]);
      expect(app.notifPrefs.enabledSports, ['football-men']);
      // Untouched fields keep their stored (default) values.
      expect(app.notifPrefs.notifyTimeChanges, isTrue);
    });

    test('corrupt JSON falls back to the defaults instead of throwing', () async {
      final app = await stateWith({AppState.notifPrefsKey: '{not json'});
      final defaults = const NotifPrefs();
      expect(app.notifPrefs.notifyNewEvents, defaults.notifyNewEvents);
      expect(app.notifPrefs.reminderHours, defaults.reminderHours);
      expect(app.notifPrefs.enabledSports, defaults.enabledSports);
      expect(app.notifPrefs.disabled, defaults.disabled);
    });

    test('non-object JSON falls back to the defaults', () async {
      final app = await stateWith({AppState.notifPrefsKey: '"a string"'});
      expect(app.notifPrefs.reminderHours, const NotifPrefs().reminderHours);
    });

    test('partial snapshot merges with the defaults', () async {
      final app = await stateWith({
        AppState.notifPrefsKey: '{"notifyScoreUpdates": false}',
      });
      expect(app.notifPrefs.notifyScoreUpdates, isFalse);
      expect(app.notifPrefs.notifyNewEvents, isTrue); // default
      expect(app.notifPrefs.reminderHours, const [24, 2]); // default
    });
  });
}
