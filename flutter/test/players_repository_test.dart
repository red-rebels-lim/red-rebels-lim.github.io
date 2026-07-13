/// Direct PlayersRepository coverage: refresh payload validation edges and
/// the cache/bundled-asset fallback chain. The AppState-level sync behavior
/// is covered in events_repository_test.dart — this file pins the repository
/// itself (mirroring the EventsRepository suite there).
library;

import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:red_rebels_calendar/data/players_repository.dart';
import 'package:red_rebels_calendar/models/players.dart';

import 'live_feed_fakes.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  Future<File?> cacheFile() async => File('${tempDir.path}/players-cache.json');

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('players-cache-test');
  });

  tearDown(() async {
    await tempDir.delete(recursive: true);
  });

  group('PlayersRepository.refresh', () {
    test('success swaps the in-memory roster', () async {
      final repo = await PlayersRepository.load(cacheFile: cacheFile);
      expect(repo.all.length, greaterThan(1)); // bundled roster

      final ok = await repo.refresh(client: okClient());

      expect(ok, isTrue);
      expect(repo.all.single.key, 'live_test_player');
      expect(repo.all.single.shirtNumber, 99);
      expect(repo.all.single.position, Position.gk);
    });

    test('accepts a bare list payload (bundled-asset shape)', () async {
      final repo = await PlayersRepository.load(cacheFile: cacheFile);
      final bare = json.encode([
        {
          'key': 'bare_player',
          'sport': 'football-men',
          'active': true,
          'nameEl': 'Γυμνός Παίκτης',
          'nameEn': 'Bare Player',
          'position': 'DEF',
        },
      ]);

      expect(await repo.refresh(client: okClient(bare)), isTrue);
      expect(repo.all.single.key, 'bare_player');
    });

    test('malformed payloads are rejected and the roster kept', () async {
      final repo = await PlayersRepository.load(cacheFile: cacheFile);
      final before = repo.all.length;

      expect(await repo.refresh(client: okClient('{not json')), isFalse);
      expect(await repo.refresh(client: okClient('"just a string"')), isFalse);
      expect(await repo.refresh(client: okClient('{"foo": 1}')), isFalse); // no players list
      expect(await repo.refresh(client: okClient('[]')), isFalse); // empty list
      expect(await repo.refresh(client: okClient('{"players": []}')), isFalse);
      // Entry missing its key.
      expect(
        await repo.refresh(
          client: okClient(json.encode({
            'players': [
              {'position': 'GK', 'nameEl': 'x', 'nameEn': 'x'},
            ],
          })),
        ),
        isFalse,
      );
      // Entry missing its position.
      expect(
        await repo.refresh(
          client: okClient(json.encode({
            'players': [
              {'key': 'x', 'nameEl': 'x', 'nameEn': 'x'},
            ],
          })),
        ),
        isFalse,
      );
      // Non-map entry.
      expect(await repo.refresh(client: okClient('{"players": ["nope"]}')), isFalse);

      expect(repo.all.length, before);
    });

    test('one invalid entry rejects the whole payload (no partial swap)', () async {
      final repo = await PlayersRepository.load(cacheFile: cacheFile);
      final before = repo.all.length;
      final mixed = json.encode({
        'players': [
          {
            'key': 'good_player',
            'sport': 'football-men',
            'active': true,
            'nameEl': 'Καλός',
            'nameEn': 'Good',
            'position': 'FWD',
          },
          {'key': 'bad_player'}, // missing position
        ],
      });

      expect(await repo.refresh(client: okClient(mixed)), isFalse);
      expect(repo.all.length, before);
    });

    test('non-200 response returns false', () async {
      final repo = await PlayersRepository.load(cacheFile: cacheFile);
      final client = MockClient((_) async => http.Response('gone', 404));
      expect(await repo.refresh(client: client), isFalse);
    });

    test('network error returns false and never throws', () async {
      final repo = await PlayersRepository.load(cacheFile: cacheFile);
      final before = repo.all.length;

      expect(await repo.refresh(client: failingClient()), isFalse);
      expect(repo.all.length, before);
    });
  });

  group('PlayersRepository cache', () {
    test('successful refresh persists the raw payload', () async {
      final repo = await PlayersRepository.load(cacheFile: cacheFile);
      await repo.refresh(client: okClient());

      final file = (await cacheFile())!;
      expect(await file.exists(), isTrue);
      expect(await file.readAsString(), playersPayload);
    });

    test('failed refresh does not write the cache file', () async {
      final repo = await PlayersRepository.load(cacheFile: cacheFile);
      await repo.refresh(client: okClient('{not json'));

      expect(await (await cacheFile())!.exists(), isFalse);
    });

    test('load prefers a valid cache file over the bundled asset', () async {
      await (await cacheFile())!.writeAsString(playersPayload);

      final repo = await PlayersRepository.load(cacheFile: cacheFile);

      expect(repo.all.single.key, 'live_test_player');
    });

    test('corrupt cache falls back to the bundled asset', () async {
      await (await cacheFile())!.writeAsString('{corrupt!');

      final repo = await PlayersRepository.load(cacheFile: cacheFile);

      expect(repo.all.length, greaterThan(1));
    });

    test('cache with an invalid roster falls back to the bundled asset', () async {
      await (await cacheFile())!.writeAsString('{"players": []}');

      final repo = await PlayersRepository.load(cacheFile: cacheFile);

      expect(repo.all.length, greaterThan(1));
    });

    test('null cache provider skips caching without breaking load/refresh', () async {
      final repo = await PlayersRepository.load(cacheFile: () async => null);
      expect(repo.all.length, greaterThan(1)); // bundled asset

      expect(await repo.refresh(client: okClient()), isTrue);
      expect(repo.all.single.key, 'live_test_player');
    });
  });
}
