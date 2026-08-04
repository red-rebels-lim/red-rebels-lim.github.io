import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

import '../models/news.dart';

/// Loads club news from the solosalamina.com WordPress REST API.
///
/// Follows the EventsRepository contract, minus the bundled asset: news has no
/// meaningful ship-time snapshot, so a cold start without a cache file simply
/// yields an empty list (the page shows its loading/error states instead).
///
/// The feed is requested in the app language via the standard `lang` query
/// parameter (Polylang convention). Until the site installs a languages
/// plugin the parameter is ignored and both languages serve the Greek
/// originals — the moment translations go live, no app change is needed.
class NewsRepository {
  NewsRepository._(this._articles, this._cacheFileProvider);

  /// Latest 20 posts with embedded featured media + terms, in [language].
  /// v1 is a fixed single page; a "load more" would append `&page=2` results
  /// in memory only.
  static String remoteUrlFor(String language) =>
      'https://solosalamina.com/wp-json/wp/v2/posts?per_page=20&_embed=1&lang=$language';

  static const _fetchTimeout = Duration(seconds: 10);

  List<NewsArticle> _articles;
  List<NewsArticle> get articles => _articles;

  /// Resolves the cache file for a language; injectable for tests. May return
  /// null (e.g. on platforms/tests where path_provider is unavailable) —
  /// caching is then silently skipped.
  final Future<File?> Function(String language) _cacheFileProvider;

  static Future<File?> _defaultCacheFile(String language) async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      return File('${dir.path}/news-cache-$language.json');
    } catch (_) {
      return null; // Plugin unavailable (tests) — no cache.
    }
  }

  /// Loads the [language] cache when present and valid, else starts empty.
  static Future<NewsRepository> load({
    Future<File?> Function(String language)? cacheFile,
    String language = 'el',
  }) async {
    final provider = cacheFile ?? _defaultCacheFile;

    try {
      final file = await provider(language);
      if (file != null && await file.exists()) {
        final cached = _parsePayload(await file.readAsString());
        if (cached != null) return NewsRepository._(cached, provider);
      }
    } catch (_) {
      // Corrupt/unreadable cache — fall through to an empty repository.
    }

    return NewsRepository._(const [], provider);
  }

  /// Fetches the live feed in [language] and swaps the in-memory list on
  /// success.
  ///
  /// Returns true when new data was applied. Any failure (no network, bad
  /// status, malformed payload, timeout) returns false and leaves the current
  /// data untouched — it never throws.
  Future<bool> refresh({http.Client? client, String language = 'el'}) async {
    final c = client ?? http.Client();
    try {
      final response =
          await c.get(Uri.parse(remoteUrlFor(language))).timeout(_fetchTimeout);
      if (response.statusCode != 200) return false;

      final raw = utf8.decode(response.bodyBytes);
      final parsed = _parsePayload(raw);
      if (parsed == null) return false;

      _articles = parsed;
      await _persist(raw, language);
      return true;
    } catch (_) {
      return false;
    } finally {
      if (client == null) c.close();
    }
  }

  /// Best-effort write of the raw feed payload to the [language] cache file.
  Future<void> _persist(String raw, String language) async {
    try {
      final file = await _cacheFileProvider(language);
      await file?.writeAsString(raw, flush: true);
    } catch (_) {
      // Caching is an optimisation — never let it break a refresh.
    }
  }

  /// Parses the REST posts array, skipping malformed entries. Returns null
  /// when the payload isn't a list (error object, HTML error page, ...).
  static List<NewsArticle>? _parsePayload(String raw) {
    try {
      final decoded = json.decode(raw);
      if (decoded is! List) return null;
      return [
        for (final post in decoded)
          if (post is Map<String, dynamic>) ?NewsArticle.fromJson(post),
      ];
    } catch (_) {
      return null;
    }
  }
}
