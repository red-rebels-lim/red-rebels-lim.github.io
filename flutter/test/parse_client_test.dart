import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:red_rebels_calendar/data/parse_client.dart';

void main() {
  /// Records every request and replies with [status] / [body].
  MockClient recording(List<http.Request> log,
          {int status = 200, String body = '{}'}) =>
      MockClient((request) async {
        log.add(request);
        return http.Response(body, status);
      });

  ParseClient client(http.Client mock) => ParseClient(
        appId: 'test-app-id',
        jsKey: 'test-js-key',
        httpClientFactory: () => mock,
      );

  group('ParseClient.createObject', () {
    test('POSTs to /classes/<name> with Parse headers and JSON body', () async {
      final log = <http.Request>[];
      final c = client(recording(log,
          status: 201,
          body: json.encode({'objectId': 'abc123', 'createdAt': '2026-07-13T00:00:00.000Z'})));

      final id = await c.createObject('PushSubscription', {
        'platform': 'fcm',
        'token': 'device-token-1',
      });

      expect(id, 'abc123');
      final request = log.single;
      expect(request.method, 'POST');
      expect(request.url.toString(),
          'https://parseapi.back4app.com/classes/PushSubscription');
      expect(request.headers['X-Parse-Application-Id'], 'test-app-id');
      expect(request.headers['X-Parse-Javascript-Key'], 'test-js-key');
      expect(request.headers['Content-Type'], startsWith('application/json'));
      expect(json.decode(request.body), {
        'platform': 'fcm',
        'token': 'device-token-1',
      });
    });

    test('returns null on non-2xx, bad payload, or network error', () async {
      final log = <http.Request>[];
      expect(
        await client(recording(log, status: 400, body: '{"error":"nope"}'))
            .createObject('PushSubscription', {}),
        isNull,
      );
      expect(
        await client(recording(log, status: 201, body: 'not json'))
            .createObject('PushSubscription', {}),
        isNull,
      );
      final offline = MockClient((_) async => throw const SocketException('offline'));
      expect(await client(offline).createObject('PushSubscription', {}), isNull);
    });
  });

  group('ParseClient.updateObject', () {
    test('PUTs to /classes/<name>/<id> with the fields', () async {
      final log = <http.Request>[];
      final c = client(recording(log, body: json.encode({'updatedAt': '2026-07-13T00:00:00.000Z'})));

      final ok = await c.updateObject('NotifPreference', 'pref9', {'disabled': true});

      expect(ok, isTrue);
      final request = log.single;
      expect(request.method, 'PUT');
      expect(request.url.toString(),
          'https://parseapi.back4app.com/classes/NotifPreference/pref9');
      expect(request.headers['X-Parse-Application-Id'], 'test-app-id');
      expect(request.headers['X-Parse-Javascript-Key'], 'test-js-key');
      expect(json.decode(request.body), {'disabled': true});
    });

    test('returns false on non-2xx or network error', () async {
      expect(
        await client(recording([], status: 404, body: '{"code":101}'))
            .updateObject('NotifPreference', 'gone', {}),
        isFalse,
      );
      final offline = MockClient((_) async => throw const SocketException('offline'));
      expect(await client(offline).updateObject('NotifPreference', 'x', {}), isFalse);
    });
  });

  group('ParseClient.deleteObject', () {
    test('DELETEs /classes/<name>/<id>', () async {
      final log = <http.Request>[];
      final c = client(recording(log));

      final ok = await c.deleteObject('PushSubscription', 'sub7');

      expect(ok, isTrue);
      final request = log.single;
      expect(request.method, 'DELETE');
      expect(request.url.toString(),
          'https://parseapi.back4app.com/classes/PushSubscription/sub7');
      expect(request.headers['X-Parse-Application-Id'], 'test-app-id');
      expect(request.headers['X-Parse-Javascript-Key'], 'test-js-key');
    });

    test('returns false on non-2xx or network error', () async {
      expect(
        await client(recording([], status: 404, body: '{"code":101}'))
            .deleteObject('PushSubscription', 'gone'),
        isFalse,
      );
      final offline = MockClient((_) async => throw const SocketException('offline'));
      expect(await client(offline).deleteObject('PushSubscription', 'x'), isFalse);
    });
  });

  group('ParseClient without credentials', () {
    test('reports unavailable and no-ops without any HTTP traffic', () async {
      final log = <http.Request>[];
      // Default construction reads --dart-define values, which are empty in
      // tests — exactly the shipped no-credentials configuration.
      final c = ParseClient(httpClientFactory: () => recording(log));

      expect(c.available, isFalse);
      expect(await c.createObject('PushSubscription', {'token': 't'}), isNull);
      expect(await c.updateObject('PushSubscription', 'id', {'token': 't'}), isFalse);
      expect(await c.deleteObject('PushSubscription', 'id'), isFalse);
      expect(log, isEmpty);
    });
  });
}
