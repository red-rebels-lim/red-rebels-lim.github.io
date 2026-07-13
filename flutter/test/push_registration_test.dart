import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:red_rebels_calendar/data/parse_client.dart';
import 'package:red_rebels_calendar/logic/push_registration.dart';

/// The web app's NotifPreference defaults (app/src/lib/preferences.ts) —
/// FR-NOTIF-2: the app must write the exact same schema.
const webDefaults = {
  'notifyNewEvents': true,
  'notifyTimeChanges': true,
  'notifyScoreUpdates': true,
  'reminderHours': [24, 2],
  'enabledSports': ['football-men', 'volleyball-men', 'volleyball-women'],
  'disabled': false,
};

void main() {
  late SharedPreferences prefs;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    prefs = await SharedPreferences.getInstance();
  });

  /// A scripted Parse backend: records every request, mints objectIds on
  /// POST (sub-1, sub-2, ... / pref-1, pref-2, ...), accepts PUT/DELETE.
  /// [failUpdates] / [failDeletes] make those verbs return 404/400.
  MockClient backend(
    List<http.Request> log, {
    bool failUpdates = false,
    bool failDeletes = false,
  }) {
    var subs = 0, notifPrefs = 0;
    return MockClient((request) async {
      log.add(request);
      switch (request.method) {
        case 'POST':
          final id = request.url.path.endsWith('/PushSubscription')
              ? 'sub-${++subs}'
              : 'pref-${++notifPrefs}';
          return http.Response(json.encode({'objectId': id}), 201);
        case 'PUT':
          if (failUpdates) return http.Response('{"code":101}', 404);
          return http.Response('{"updatedAt":"2026-07-13T00:00:00.000Z"}', 200);
        default: // DELETE
          if (failDeletes) return http.Response('{"code":119}', 400);
          return http.Response('{}', 200);
      }
    });
  }

  PushRegistration registration(http.Client mock) => PushRegistration(
        parse: ParseClient(
          appId: 'test-app-id',
          jsKey: 'test-js-key',
          httpClientFactory: () => mock,
        ),
        prefs: prefs,
      );

  group('PushRegistration.register', () {
    test('first registration creates both rows and persists their ids', () async {
      final log = <http.Request>[];
      final reg = registration(backend(log));

      expect(await reg.register('device-token-1'), isTrue);

      expect(log, hasLength(2));
      expect(log[0].method, 'POST');
      expect(log[0].url.path, '/classes/PushSubscription');
      expect(json.decode(log[0].body), {'platform': 'fcm', 'token': 'device-token-1'});

      expect(log[1].method, 'POST');
      expect(log[1].url.path, '/classes/NotifPreference');
      expect(json.decode(log[1].body), {
        'subscription': {
          '__type': 'Pointer',
          'className': 'PushSubscription',
          'objectId': 'sub-1',
        },
        ...webDefaults,
      });

      expect(prefs.getString('push_subscription_id'), 'sub-1');
      expect(prefs.getString('notif_preference_id'), 'pref-1');
      expect(reg.registered, isTrue);
    });

    test('token rotation updates the existing row, keeps ids, adds no rows', () async {
      final log = <http.Request>[];
      final reg = registration(backend(log));
      await reg.register('device-token-1');
      log.clear();

      expect(await reg.register('device-token-2'), isTrue);

      final request = log.single;
      expect(request.method, 'PUT');
      expect(request.url.path, '/classes/PushSubscription/sub-1');
      expect(json.decode(request.body), {'platform': 'fcm', 'token': 'device-token-2'});
      expect(prefs.getString('push_subscription_id'), 'sub-1');
      expect(prefs.getString('notif_preference_id'), 'pref-1');
    });

    test('re-registers from scratch when the stored row is gone server-side', () async {
      final log = <http.Request>[];
      // Simulate the cron having pruned the rows: the stored ids point at
      // nothing, so the PUT 404s and a fresh pair must be created.
      await prefs.setString('push_subscription_id', 'stale-sub');
      await prefs.setString('notif_preference_id', 'stale-pref');
      final reg = registration(backend(log, failUpdates: true));

      expect(await reg.register('device-token-3'), isTrue);

      expect(log.map((r) => '${r.method} ${r.url.path}').toList(), [
        'PUT /classes/PushSubscription/stale-sub',
        'POST /classes/PushSubscription',
        'POST /classes/NotifPreference',
      ]);
      expect(prefs.getString('push_subscription_id'), 'sub-1');
      expect(prefs.getString('notif_preference_id'), 'pref-1');
    });

    test('subscription created but preference creation fails → false, retry completes it', () async {
      var posts = 0;
      final reg = registration(MockClient((request) async {
        if (request.method != 'POST') return http.Response('{}', 200);
        posts++;
        if (request.url.path.endsWith('/NotifPreference') && posts == 2) {
          return http.Response('{"error":"down"}', 500); // first pref POST fails
        }
        final id = request.url.path.endsWith('/PushSubscription') ? 'sub-1' : 'pref-1';
        return http.Response(json.encode({'objectId': id}), 201);
      }));

      expect(await reg.register('device-token-1'), isFalse);
      expect(prefs.getString('push_subscription_id'), 'sub-1');
      expect(prefs.getString('notif_preference_id'), isNull);

      // Next register() heals: updates the sub, creates the missing prefs.
      expect(await reg.register('device-token-1'), isTrue);
      expect(prefs.getString('notif_preference_id'), 'pref-1');
    });
  });

  group('PushRegistration.unregister', () {
    test('deletes both rows and clears the stored ids', () async {
      final log = <http.Request>[];
      final reg = registration(backend(log));
      await reg.register('device-token-1');
      log.clear();

      await reg.unregister();

      expect(log.map((r) => '${r.method} ${r.url.path}').toList(), [
        'DELETE /classes/NotifPreference/pref-1',
        'DELETE /classes/PushSubscription/sub-1',
      ]);
      expect(prefs.getString('push_subscription_id'), isNull);
      expect(prefs.getString('notif_preference_id'), isNull);
      expect(reg.registered, isFalse);
    });

    test('clears stored ids even when the deletes fail (best-effort, web parity)', () async {
      final log = <http.Request>[];
      final reg = registration(backend(log, failDeletes: true));
      await reg.register('device-token-1');

      await reg.unregister();

      expect(prefs.getString('push_subscription_id'), isNull);
      expect(prefs.getString('notif_preference_id'), isNull);
    });
  });

  group('PushRegistration.updatePreferences', () {
    test('PUTs the full prefs payload to the stored NotifPreference row', () async {
      final log = <http.Request>[];
      final reg = registration(backend(log));
      await reg.register('device-token-1');
      log.clear();

      final ok = await reg.updatePreferences(
        const NotifPrefs().copyWith(reminderHours: [2], notifyScoreUpdates: false),
      );

      expect(ok, isTrue);
      final request = log.single;
      expect(request.method, 'PUT');
      expect(request.url.path, '/classes/NotifPreference/pref-1');
      expect(json.decode(request.body), {
        ...webDefaults,
        'reminderHours': [2],
        'notifyScoreUpdates': false,
      });
    });

    test('returns false when the device is not registered', () async {
      final log = <http.Request>[];
      final reg = registration(backend(log));

      expect(await reg.updatePreferences(const NotifPrefs()), isFalse);
      expect(log, isEmpty);
    });
  });

  group('PushRegistration without credentials', () {
    test('every operation is a silent no-op with zero HTTP traffic', () async {
      final log = <http.Request>[];
      final reg = PushRegistration(
        // Default ParseClient() reads empty --dart-define values in tests.
        parse: ParseClient(httpClientFactory: () => backend(log)),
        prefs: prefs,
      );

      expect(reg.available, isFalse);
      expect(await reg.register('device-token-1'), isFalse);
      await reg.unregister();
      expect(await reg.updatePreferences(const NotifPrefs()), isFalse);

      expect(log, isEmpty);
      expect(prefs.getString('push_subscription_id'), isNull);
      expect(prefs.getString('notif_preference_id'), isNull);
    });
  });

  group('NotifPrefs', () {
    test('defaults match the web DEFAULTS exactly', () {
      expect(const NotifPrefs().toJson(), webDefaults);
    });

    test('fromJson(toJson) round-trips and missing fields fall back to defaults', () {
      const custom = NotifPrefs(
        notifyNewEvents: false,
        notifyTimeChanges: false,
        notifyScoreUpdates: false,
        reminderHours: [48],
        enabledSports: ['football-men'],
        disabled: true,
      );
      expect(NotifPrefs.fromJson(custom.toJson()).toJson(), custom.toJson());
      expect(NotifPrefs.fromJson(const {}).toJson(), webDefaults);
    });
  });
}
