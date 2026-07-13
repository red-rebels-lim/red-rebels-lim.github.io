import 'dart:convert';

import 'package:http/http.dart' as http;

/// Minimal Parse REST client for Back4App — no Parse SDK (TRD decision).
///
/// Public client credentials arrive via compile-time defines:
///
///   flutter build ... --dart-define=BACK4APP_APP_ID=... \
///                     --dart-define=BACK4APP_JS_KEY=...
///
/// When either is empty, [available] is false and every operation is a silent
/// no-op — mirrors the web app, where empty VITE_BACK4APP_* env vars disable
/// push locally (app/src/lib/parse.ts).
class ParseClient {
  ParseClient({
    this.appId = const String.fromEnvironment('BACK4APP_APP_ID'),
    this.jsKey = const String.fromEnvironment('BACK4APP_JS_KEY'),
    this.httpClientFactory,
  });

  /// Same server as the web app (app/src/lib/parse.ts).
  static const serverUrl = 'https://parseapi.back4app.com';

  static const _timeout = Duration(seconds: 10);

  final String appId;
  final String jsKey;

  /// Injectable HTTP client factory for tests; null → a client is created
  /// (and closed) per call.
  final http.Client Function()? httpClientFactory;

  /// False when the build carries no Back4App credentials — the whole push
  /// layer is disabled and all operations no-op.
  bool get available => appId.isNotEmpty && jsKey.isNotEmpty;

  Map<String, String> get _headers => {
        'X-Parse-Application-Id': appId,
        'X-Parse-Javascript-Key': jsKey,
        'Content-Type': 'application/json',
      };

  Uri _uri(String className, [String? objectId]) => Uri.parse(
      '$serverUrl/classes/$className${objectId == null ? '' : '/$objectId'}');

  /// POST /classes/[className]. Returns the new objectId, or null on any
  /// failure (no credentials, network error, non-2xx, bad payload).
  /// Never throws.
  Future<String?> createObject(String className, Map<String, dynamic> fields) async {
    if (!available) return null;
    final c = httpClientFactory?.call() ?? http.Client();
    try {
      final response = await c
          .post(_uri(className), headers: _headers, body: json.encode(fields))
          .timeout(_timeout);
      if (response.statusCode < 200 || response.statusCode >= 300) return null;
      final decoded = json.decode(utf8.decode(response.bodyBytes));
      return decoded is Map<String, dynamic> ? decoded['objectId'] as String? : null;
    } catch (_) {
      return null;
    } finally {
      if (httpClientFactory == null) c.close();
    }
  }

  /// PUT /classes/[className]/[objectId]. Returns true when the update was
  /// accepted. Never throws.
  Future<bool> updateObject(
      String className, String objectId, Map<String, dynamic> fields) async {
    if (!available) return false;
    final c = httpClientFactory?.call() ?? http.Client();
    try {
      final response = await c
          .put(_uri(className, objectId), headers: _headers, body: json.encode(fields))
          .timeout(_timeout);
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    } finally {
      if (httpClientFactory == null) c.close();
    }
  }

  /// DELETE /classes/[className]/[objectId]. Returns true when the row was
  /// deleted. Never throws.
  Future<bool> deleteObject(String className, String objectId) async {
    if (!available) return false;
    final c = httpClientFactory?.call() ?? http.Client();
    try {
      final response =
          await c.delete(_uri(className, objectId), headers: _headers).timeout(_timeout);
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    } finally {
      if (httpClientFactory == null) c.close();
    }
  }
}
