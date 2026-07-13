import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:red_rebels_calendar/data/events_repository.dart';
import 'package:red_rebels_calendar/data/parse_client.dart';
import 'package:red_rebels_calendar/data/players_repository.dart';
import 'package:red_rebels_calendar/i18n/i18n.dart';
import 'package:red_rebels_calendar/logic/push_registration.dart';
import 'package:red_rebels_calendar/pages/settings_page.dart';
import 'package:red_rebels_calendar/state/app_state.dart';
import 'package:red_rebels_calendar/theme.dart';

/// Scripted [PushTokenProvider] — no Firebase anywhere in the test suite.
class FakeTokenProvider implements PushTokenProvider {
  FakeTokenProvider({this.permissionGranted = true, this.token = 'fake-token'});

  bool permissionGranted;
  String? token;
  int permissionRequests = 0;
  final StreamController<String> refresh = StreamController<String>.broadcast();

  @override
  Future<bool> requestPermission() async {
    permissionRequests++;
    return permissionGranted;
  }

  @override
  Future<String?> getToken() async => token;

  @override
  Stream<String> get onTokenRefresh => refresh.stream;
}

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

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    prefs = await SharedPreferences.getInstance();
  });

  /// Parse backend that mints sub-1/pref-1 ids and records every request.
  MockClient backend(List<http.Request> log, {bool failUpdates = false}) {
    return MockClient((request) async {
      log.add(request);
      switch (request.method) {
        case 'POST':
          final id = request.url.path.endsWith('/PushSubscription') ? 'sub-1' : 'pref-1';
          return http.Response(json.encode({'objectId': id}), 201);
        case 'PUT':
          if (failUpdates) return http.Response('{"code":101}', 404);
          return http.Response('{"updatedAt":"2026-07-13T00:00:00.000Z"}', 200);
        default: // DELETE
          return http.Response('{}', 200);
      }
    });
  }

  PushRegistration registration(http.Client mock, {PushTokenProvider? tokenProvider}) =>
      PushRegistration(
        parse: ParseClient(
          appId: 'test-app-id',
          jsKey: 'test-js-key',
          httpClientFactory: () => mock,
        ),
        prefs: prefs,
        tokenProvider: tokenProvider,
      );

  AppState appState({PushRegistration? push}) =>
      AppState(events: events, players: players, i18n: i18n, prefs: prefs, push: push);

  group('AppState push plumbing', () {
    test('enablePush asks permission, registers the token and persists prefs', () async {
      final log = <http.Request>[];
      final tokens = FakeTokenProvider(token: 'device-token-1');
      final app = appState(push: registration(backend(log), tokenProvider: tokens));

      expect(app.pushAvailable, isTrue);
      expect(app.pushRegistered, isFalse);

      expect(await app.enablePush(), isTrue);

      expect(tokens.permissionRequests, 1);
      expect(app.pushRegistered, isTrue);
      expect(json.decode(log.first.body), {'platform': 'fcm', 'token': 'device-token-1'});
      // The defaults snapshot is persisted so the UI can render it on restart.
      expect(
        json.decode(prefs.getString(AppState.notifPrefsKey)!),
        const NotifPrefs().toJson(),
      );
    });

    test('enablePush returns false when permission is denied — no HTTP traffic', () async {
      final log = <http.Request>[];
      final tokens = FakeTokenProvider(permissionGranted: false);
      final app = appState(push: registration(backend(log), tokenProvider: tokens));

      expect(await app.enablePush(), isFalse);
      expect(app.pushRegistered, isFalse);
      expect(log, isEmpty);
      expect(prefs.getString(AppState.notifPrefsKey), isNull);
    });

    test('enablePush returns false when no token is available', () async {
      final log = <http.Request>[];
      final tokens = FakeTokenProvider(token: null);
      final app = appState(push: registration(backend(log), tokenProvider: tokens));

      expect(await app.enablePush(), isFalse);
      expect(log, isEmpty);
    });

    test('pushAvailable is false without credentials or without a token provider', () {
      // No Back4App credentials (default ParseClient reads empty defines).
      final noCreds = appState(
        push: PushRegistration(
          parse: ParseClient(httpClientFactory: () => backend([])),
          prefs: prefs,
          tokenProvider: FakeTokenProvider(),
        ),
      );
      expect(noCreds.pushAvailable, isFalse);

      // Credentials but no platform token source.
      final noTokens = appState(push: registration(backend([])));
      expect(noTokens.pushAvailable, isFalse);

      // No push layer at all (widget-test default).
      expect(appState().pushAvailable, isFalse);
    });

    test('updateNotifPrefs writes through, persists locally and reports true', () async {
      final log = <http.Request>[];
      final app = appState(push: registration(backend(log), tokenProvider: FakeTokenProvider()));
      await app.enablePush();
      log.clear();

      final next = app.notifPrefs.copyWith(reminderHours: [24, 12, 2]);
      expect(await app.updateNotifPrefs(next), isTrue);

      final request = log.single;
      expect(request.method, 'PUT');
      expect(request.url.path, '/classes/NotifPreference/pref-1');
      expect(json.decode(request.body), next.toJson());
      expect(json.decode(prefs.getString(AppState.notifPrefsKey)!), next.toJson());
      expect(app.notifPrefs.reminderHours, [24, 12, 2]);
    });

    test('updateNotifPrefs reverts the optimistic value when the server rejects it', () async {
      final log = <http.Request>[];
      final tokens = FakeTokenProvider();
      // Registration succeeds (POSTs), later preference PUTs fail.
      final app = appState(push: registration(backend(log, failUpdates: true), tokenProvider: tokens));
      await app.enablePush();

      final before = app.notifPrefs.toJson();
      expect(await app.updateNotifPrefs(app.notifPrefs.copyWith(notifyScoreUpdates: false)), isFalse);

      expect(app.notifPrefs.toJson(), before);
      expect(json.decode(prefs.getString(AppState.notifPrefsKey)!), before);
    });

    test('disablePush unregisters and clears the local snapshot', () async {
      final log = <http.Request>[];
      final app = appState(push: registration(backend(log), tokenProvider: FakeTokenProvider()));
      await app.enablePush();

      await app.disablePush();

      expect(app.pushRegistered, isFalse);
      expect(prefs.getString(AppState.notifPrefsKey), isNull);
      expect(app.notifPrefs.toJson(), const NotifPrefs().toJson());
    });

    test('restores the persisted NotifPrefs snapshot on construction', () async {
      const stored = NotifPrefs(reminderHours: [12], enabledSports: ['football-men']);
      await prefs.setString(AppState.notifPrefsKey, json.encode(stored.toJson()));

      expect(appState().notifPrefs.toJson(), stored.toJson());
    });

    test('falls back to defaults when the persisted snapshot is corrupt', () async {
      await prefs.setString(AppState.notifPrefsKey, 'not json');

      expect(appState().notifPrefs.toJson(), const NotifPrefs().toJson());
    });
  });

  group('Settings notifications section', () {
    Widget wrap(AppState app) => ChangeNotifierProvider.value(
          value: app,
          child: MaterialApp(
            theme: buildTheme(Brightness.light),
            home: const Scaffold(body: SettingsPage()),
          ),
        );

    testWidgets('toggle on registers and reveals the shared preferences', (tester) async {
      final log = <http.Request>[];
      final app = appState(push: registration(backend(log), tokenProvider: FakeTokenProvider()));
      await tester.pumpWidget(wrap(app));

      // One enabled channel switch, no shared preferences yet.
      final channelSwitch = tester.widget<Switch>(find.byType(Switch));
      expect(channelSwitch.onChanged, isNotNull);
      expect(find.text('24h'), findsNothing);

      await tester.tap(find.byType(Switch));
      await tester.pumpAndSettle();

      expect(app.pushRegistered, isTrue);
      // Reminder chips, sports and alert-type rows are now visible.
      for (final chip in ['24h', '12h', '2h', '1h']) {
        expect(find.text(chip), findsOneWidget);
      }
      expect(find.text("Men's Football"), findsOneWidget);
      expect(find.text("Men's Volleyball"), findsOneWidget);
      expect(find.text("Women's Volleyball"), findsOneWidget);
      expect(find.text('New events added'), findsOneWidget);
      expect(find.text('Time/venue changes'), findsOneWidget);
      expect(find.text('Score updates'), findsOneWidget);
      expect(find.byType(Switch), findsNWidgets(7));
    });

    testWidgets('tapping a reminder chip PUTs the updated hours JSON', (tester) async {
      final log = <http.Request>[];
      final app = appState(push: registration(backend(log), tokenProvider: FakeTokenProvider()));
      await app.enablePush();
      log.clear();
      await tester.pumpWidget(wrap(app));

      await tester.tap(find.text('12h'));
      await tester.pumpAndSettle();

      final request = log.single;
      expect(request.method, 'PUT');
      expect(request.url.path, '/classes/NotifPreference/pref-1');
      expect(json.decode(request.body), {
        ...const NotifPrefs().toJson(),
        'reminderHours': [24, 12, 2], // sorted descending, web parity
      });
    });

    testWidgets('the last active reminder hour cannot be removed', (tester) async {
      final log = <http.Request>[];
      final app = appState(push: registration(backend(log), tokenProvider: FakeTokenProvider()));
      await app.enablePush();
      await app.updateNotifPrefs(app.notifPrefs.copyWith(reminderHours: [2]));
      log.clear();
      await tester.pumpWidget(wrap(app));

      await tester.tap(find.text('2h'));
      await tester.pumpAndSettle();

      expect(log, isEmpty); // no-op: at least one tier must stay active
      expect(app.notifPrefs.reminderHours, [2]);
    });

    testWidgets('failed preference update reverts and shows the error snackbar', (tester) async {
      final log = <http.Request>[];
      final app = appState(push: registration(backend(log), tokenProvider: FakeTokenProvider()));
      await app.enablePush();
      // All later PUTs fail.
      final failing = appState(
        push: registration(backend(log, failUpdates: true), tokenProvider: FakeTokenProvider()),
      );
      await tester.pumpWidget(wrap(failing));

      await tester.tap(find.text('12h'));
      await tester.pumpAndSettle();

      expect(failing.notifPrefs.reminderHours, [24, 2]); // reverted to defaults
      expect(find.text('Failed to update notifications. Please try again.'), findsOneWidget);
    });

    testWidgets('channel switch is disabled when push is unavailable', (tester) async {
      // Default ParseClient carries no credentials → push.available == false.
      final app = appState(
        push: PushRegistration(
          parse: ParseClient(httpClientFactory: () => backend([])),
          prefs: prefs,
          tokenProvider: FakeTokenProvider(),
        ),
      );
      await tester.pumpWidget(wrap(app));

      expect(tester.widget<Switch>(find.byType(Switch)).onChanged, isNull);
      expect(find.text('24h'), findsNothing);
    });

    testWidgets('denied permission keeps the switch off and shows the error', (tester) async {
      final log = <http.Request>[];
      final app = appState(
        push: registration(backend(log), tokenProvider: FakeTokenProvider(permissionGranted: false)),
      );
      await tester.pumpWidget(wrap(app));

      await tester.tap(find.byType(Switch));
      await tester.pumpAndSettle();

      expect(app.pushRegistered, isFalse);
      expect(tester.widget<Switch>(find.byType(Switch)).value, isFalse);
      expect(find.text('Failed to update notifications. Please try again.'), findsOneWidget);
    });
  });
}
