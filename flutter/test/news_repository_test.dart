import 'dart:async';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:solo_salamina/data/news_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final fixtureRaw = File('test/fixtures/wp_posts.json').readAsStringSync();

  late Directory tempDir;
  Future<File?> cacheFile(String language) async =>
      File('${tempDir.path}/news-cache-$language.json');

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('news-cache-test');
  });

  tearDown(() async {
    await tempDir.delete(recursive: true);
  });

  MockClient okClient([String? body]) => MockClient(
      (_) async => http.Response(body ?? fixtureRaw, 200,
          headers: {'content-type': 'application/json; charset=utf-8'}));

  group('NewsRepository.load', () {
    test('starts empty without a cache file', () async {
      final repo = await NewsRepository.load(cacheFile: cacheFile);
      expect(repo.articles, isEmpty);
    });

    test('reads a previously persisted cache', () async {
      final first = await NewsRepository.load(cacheFile: cacheFile);
      expect(await first.refresh(client: okClient()), isTrue);

      final second = await NewsRepository.load(cacheFile: cacheFile);
      expect(second.articles.length, 3);
      expect(second.articles.first.title, contains('Ομόνοια'));
    });

    test('corrupt cache falls back to empty', () async {
      final file = (await cacheFile('el'))!;
      await file.writeAsString('{broken');
      final repo = await NewsRepository.load(cacheFile: cacheFile);
      expect(repo.articles, isEmpty);
    });
  });

  group('NewsRepository.refresh', () {
    test('success swaps articles and preserves Greek text (utf8)', () async {
      final repo = await NewsRepository.load(cacheFile: cacheFile);

      expect(await repo.refresh(client: okClient()), isTrue);
      expect(repo.articles.length, 3); // malformed 4th entry skipped
      expect(repo.articles.first.title, contains('Μαυρουδή'));
      expect(repo.articles.first.categories, contains('Ποδόσφαιρο'));
    });

    test('non-200 returns false and keeps current data', () async {
      final repo = await NewsRepository.load(cacheFile: cacheFile);
      expect(await repo.refresh(client: okClient()), isTrue);

      final failing =
          MockClient((_) async => http.Response('Server Error', 500));
      expect(await repo.refresh(client: failing), isFalse);
      expect(repo.articles.length, 3);
    });

    test('malformed / non-list payloads return false', () async {
      final repo = await NewsRepository.load(cacheFile: cacheFile);
      expect(await repo.refresh(client: okClient('{not json')), isFalse);
      expect(await repo.refresh(client: okClient('{"code":"rest_error"}')),
          isFalse);
      expect(repo.articles, isEmpty);
    });

    test('network exception returns false without throwing', () async {
      final repo = await NewsRepository.load(cacheFile: cacheFile);
      final throwing =
          MockClient((_) async => throw const SocketException('offline'));
      expect(await repo.refresh(client: throwing), isFalse);
    });

    test('timeout returns false without throwing', () async {
      final repo = await NewsRepository.load(cacheFile: cacheFile);
      final never = MockClient((_) async {
        final completer = Completer<http.Response>();
        return completer.future; // hangs past the 10s timeout
      });
      // Real 10s wait is too slow for unit tests — just assert the timeout
      // path returns false via a client that throws TimeoutException.
      final timingOut = MockClient(
          (_) async => throw TimeoutException('slow', const Duration(seconds: 10)));
      expect(await repo.refresh(client: timingOut), isFalse);
      never.close();
    });
  });

  group('language', () {
    MockClient capturing(List<String> urls) => MockClient((req) async {
          urls.add(req.url.toString());
          return http.Response(fixtureRaw, 200,
              headers: {'content-type': 'application/json; charset=utf-8'});
        });

    test('requests the feed in the given language, caches per language',
        () async {
      final repo = await NewsRepository.load(cacheFile: cacheFile);
      final urls = <String>[];

      expect(await repo.refresh(client: capturing(urls), language: 'en'),
          isTrue);
      expect(urls.single, contains('lang=en'));
      expect(File('${tempDir.path}/news-cache-en.json').existsSync(), isTrue);
      expect(File('${tempDir.path}/news-cache-el.json').existsSync(), isFalse);

      expect(await repo.refresh(client: capturing(urls), language: 'el'),
          isTrue);
      expect(urls.last, contains('lang=el'));
      expect(File('${tempDir.path}/news-cache-el.json').existsSync(), isTrue);
    });

    test('load reads the language-specific cache', () async {
      final repo = await NewsRepository.load(cacheFile: cacheFile);
      await repo.refresh(client: okClient(), language: 'en');

      final en =
          await NewsRepository.load(cacheFile: cacheFile, language: 'en');
      expect(en.articles.length, 3);
      // No Greek cache was written — Greek boot starts empty.
      final el =
          await NewsRepository.load(cacheFile: cacheFile, language: 'el');
      expect(el.articles, isEmpty);
    });
  });
}
