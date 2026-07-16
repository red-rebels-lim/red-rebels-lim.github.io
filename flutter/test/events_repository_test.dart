import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:fake_async/fake_async.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:red_rebels_calendar/data/events_repository.dart';
import 'package:red_rebels_calendar/data/players_repository.dart';
import 'package:red_rebels_calendar/i18n/i18n.dart';
import 'package:red_rebels_calendar/models/events.dart';
import 'package:red_rebels_calendar/pages/calendar_page.dart';
import 'package:red_rebels_calendar/state/app_state.dart';
import 'package:red_rebels_calendar/theme.dart';

import 'live_feed_fakes.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  Future<File?> cacheFile() async => File('${tempDir.path}/events-cache.json');

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('events-cache-test');
  });

  tearDown(() async {
    await tempDir.delete(recursive: true);
  });

  group('EventsRepository.refresh', () {
    test('success swaps in-memory data and invalidates allEvents', () async {
      final repo = await EventsRepository.load(cacheFile: cacheFile);
      final before = repo.allEvents();
      expect(before.length, greaterThan(1)); // bundled season data

      final ok = await repo.refresh(client: okClient());

      expect(ok, isTrue);
      expect(repo.byMonth.keys, ['september']);
      expect(repo.eventsFor('september').single.opponent, 'ΑΠΟΕΛ');
      // Memoized index rebuilt from the new data, not served stale.
      final after = repo.allEvents();
      expect(after.length, 1);
      expect(after.single.event.opponent, 'ΑΠΟΕΛ');
      expect(after.single.date.hour, 19);
    });

    test('malformed JSON is rejected and current data kept', () async {
      final repo = await EventsRepository.load(cacheFile: cacheFile);
      final before = repo.allEvents().length;

      expect(await repo.refresh(client: okClient('{not json')), isFalse);
      expect(await repo.refresh(client: okClient('"just a string"')), isFalse);
      expect(await repo.refresh(client: okClient('{"foo": 1}')), isFalse); // no months
      expect(
        await repo.refresh(client: okClient(json.encode({'events': {'nonsense': []}}))),
        isFalse, // events map without a known month key
      );

      expect(repo.allEvents().length, before);
    });

    test('non-200 response returns false', () async {
      final repo = await EventsRepository.load(cacheFile: cacheFile);
      final client = MockClient((_) async => http.Response('gone', 404));
      expect(await repo.refresh(client: client), isFalse);
    });

    test('network error returns false and never throws', () async {
      final repo = await EventsRepository.load(cacheFile: cacheFile);
      final before = repo.allEvents().length;

      expect(await repo.refresh(client: failingClient()), isFalse);
      expect(repo.allEvents().length, before);
    });

    test('never-responding server hits the 10s timeout and returns false (QA FUN-01)', () async {
      // TCP-blackhole shape: the request connects but no byte ever arrives.
      final repo = await EventsRepository.load(cacheFile: cacheFile);
      final before = repo.allEvents().length;

      fakeAsync((async) {
        final hanging = MockClient((_) => Completer<http.Response>().future);
        bool? result;
        repo.refresh(client: hanging).then((v) => result = v);

        async.elapse(const Duration(seconds: 9));
        expect(result, isNull); // still inside the timeout window

        async.elapse(const Duration(seconds: 2)); // crosses the 10s cap
        expect(result, isFalse);
        expect(repo.allEvents().length, before);
      });
    });
  });

  group('EventsRepository cache', () {
    test('successful refresh persists the raw payload', () async {
      final repo = await EventsRepository.load(cacheFile: cacheFile);
      await repo.refresh(client: okClient());

      final file = (await cacheFile())!;
      expect(await file.exists(), isTrue);
      expect(await file.readAsString(), eventsPayload);
    });

    test('load prefers a valid cache file over the bundled asset', () async {
      await (await cacheFile())!.writeAsString(eventsPayload);

      final repo = await EventsRepository.load(cacheFile: cacheFile);

      expect(repo.byMonth.keys, ['september']);
      expect(repo.eventsFor('september').single.opponent, 'ΑΠΟΕΛ');
    });

    test('corrupt cache falls back to the bundled asset', () async {
      await (await cacheFile())!.writeAsString('{corrupt!');

      final repo = await EventsRepository.load(cacheFile: cacheFile);

      expect(repo.allEvents().length, greaterThan(1));
    });
  });

  group('EventsRepository.findByEventKey', () {
    test('resolves a football key with spaces in the opponent', () async {
      final repo = await EventsRepository.load(cacheFile: cacheFile);

      final de = repo.findByEventKey('september-12-football-men-ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ');

      expect(de, isNotNull);
      expect(de!.monthName, 'september');
      expect(de.event.day, 12);
      expect(de.event.sport, Sport.footballMen);
      expect(de.event.opponent, 'ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ');
    });

    test('resolves a volleyball-women key (sport ids contain dashes)', () async {
      final repo = await EventsRepository.load(cacheFile: cacheFile);

      final de = repo.findByEventKey('november-1-volleyball-women-ΑΕΚ ΛΑΡΝΑΚΑΣ (Γ)');

      expect(de, isNotNull);
      expect(de!.event.sport, Sport.volleyballWomen);
      expect(de.event.opponent, 'ΑΕΚ ΛΑΡΝΑΚΑΣ (Γ)');
    });

    test('resolves a volleyball-men key', () async {
      final repo = await EventsRepository.load(cacheFile: cacheFile);

      final de = repo.findByEventKey('october-17-volleyball-men-ΠΑΦΙΑΚΟΣ');

      expect(de, isNotNull);
      expect(de!.event.sport, Sport.volleyballMen);
    });

    test('resolves an opponent containing a dash (synthetic cache)', () async {
      await (await cacheFile())!.writeAsString(json.encode({
        'events': {
          'september': [
            {
              'day': 21,
              'sport': 'football-men',
              'location': 'home',
              'opponent': 'ΤΕΣΤ-ΟΜΑΔΑ',
              'time': '19:00',
              'status': 'upcoming',
            },
          ],
        },
      }));
      final repo = await EventsRepository.load(cacheFile: cacheFile);

      final de = repo.findByEventKey('september-21-football-men-ΤΕΣΤ-ΟΜΑΔΑ');

      expect(de, isNotNull);
      expect(de!.event.opponent, 'ΤΕΣΤ-ΟΜΑΔΑ');
    });

    test('returns null on any mismatch or malformed key', () async {
      final repo = await EventsRepository.load(cacheFile: cacheFile);

      // Unknown month
      expect(repo.findByEventKey('foo-12-football-men-ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ'), isNull);
      // Day mismatch
      expect(repo.findByEventKey('september-13-football-men-ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ'), isNull);
      // Non-numeric day
      expect(repo.findByEventKey('september-x-football-men-ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ'), isNull);
      // Unknown sport
      expect(repo.findByEventKey('september-12-handball-men-ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ'), isNull);
      // Unknown opponent
      expect(repo.findByEventKey('september-12-football-men-ΑΓΝΩΣΤΗ ΟΜΑΔΑ'), isNull);
      // Missing segments
      expect(repo.findByEventKey('september'), isNull);
      expect(repo.findByEventKey('september-12'), isNull);
      expect(repo.findByEventKey('september-12-football-men-'), isNull);
      expect(repo.findByEventKey(''), isNull);
    });
  });

  group('AppState.syncEvents', () {
    late PlayersRepository players;
    late I18n i18n;
    late SharedPreferences prefs;

    setUpAll(() async {
      SharedPreferences.setMockInitialValues({});
      players = await PlayersRepository.load();
      i18n = await I18n.load();
      prefs = await SharedPreferences.getInstance();
    });

    Future<AppState> makeApp(http.Client Function() clientFactory, {bool syncEnabled = true}) async {
      final events = await EventsRepository.load(cacheFile: cacheFile);
      return AppState(
        events: events,
        players: players,
        i18n: i18n,
        prefs: prefs,
        syncEnabled: syncEnabled,
        httpClientFactory: clientFactory,
      );
    }

    test('failure sets lastSyncFailed and keeps data', () async {
      final app = await makeApp(failingClient);
      final before = app.events.allEvents().length;

      await app.syncEvents();

      expect(app.lastSyncFailed, isTrue);
      expect(app.lastSyncAt, isNull);
      expect(app.events.allEvents().length, before);
    });

    test('success clears the failure flag and stamps lastSyncAt', () async {
      final app = await makeApp(okClient);

      await app.syncEvents();

      expect(app.lastSyncFailed, isFalse);
      expect(app.lastSyncAt, isNotNull);
      expect(app.events.eventsFor('september').single.opponent, 'ΑΠΟΕΛ');
      // The players feed swapped in too.
      expect(app.players.all.single.key, 'live_test_player');
    });

    test('does nothing when sync is disabled (test default)', () async {
      var requests = 0;
      final app = await makeApp(
        () => MockClient((_) async {
          requests++;
          return http.Response.bytes(utf8.encode(eventsPayload), 200);
        }),
        syncEnabled: false,
      );

      await app.syncEvents();

      expect(requests, 0);
      expect(app.lastSyncFailed, isFalse);
    });

    test('throttled resume sync skips attempts within 5 minutes', () async {
      var requests = 0;
      final app = await makeApp(
        () => MockClient((_) async {
          requests++;
          return http.Response.bytes(utf8.encode(eventsPayload), 200);
        }),
      );

      await app.syncEvents(); // launch — one request per feed
      await app.syncEvents(throttle: true); // resume right after — skipped
      expect(requests, 2);

      await app.syncEvents(); // unthrottled — goes through
      expect(requests, 4);
    });

    test('partial failure (players feed down) sets lastSyncFailed', () async {
      final app = await makeApp(playersFailingClient);

      await app.syncEvents();

      expect(app.lastSyncFailed, isTrue);
      // The events feed still landed — data is fresh even though the flag is up.
      expect(app.events.eventsFor('september').single.opponent, 'ΑΠΟΕΛ');
    });
  });

  group('Stale indicator', () {
    late AppState app;

    // Asset loading must happen outside testWidgets' fake-async zone or the
    // rootBundle futures never complete and the test times out.
    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      app = AppState(
        events: await EventsRepository.load(cacheFile: cacheFile),
        players: await PlayersRepository.load(),
        i18n: await I18n.load(),
        prefs: await SharedPreferences.getInstance(),
        syncEnabled: true,
        httpClientFactory: failingClient,
      );
      await app.syncEvents();
    });

    testWidgets('calendar shows the muted offline row after a failed sync', (tester) async {
      expect(app.lastSyncFailed, isTrue);

      await tester.pumpWidget(
        ChangeNotifierProvider.value(
          value: app,
          child: MaterialApp(
            theme: buildTheme('default', Brightness.light),
            home: const Scaffold(body: CalendarPage()),
          ),
        ),
      );
      await tester.pump();

      expect(find.byIcon(Icons.cloud_off), findsOneWidget);
      expect(find.text('Failed to load live data'), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    });
  });
}
