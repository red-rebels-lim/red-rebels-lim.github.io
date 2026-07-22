import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

import '../data/constants.dart';

/// Minimal JSON-based i18n mirroring the web app's en.json / el.json bundles.
class I18n {
  I18n._(this._bundles);

  final Map<String, Map<String, dynamic>> _bundles;

  static Future<I18n> load() async {
    final bundles = <String, Map<String, dynamic>>{};
    for (final lang in ['en', 'el']) {
      final raw = await rootBundle.loadString('assets/i18n/$lang.json');
      bundles[lang] = json.decode(raw) as Map<String, dynamic>;
    }
    return I18n._(bundles);
  }

  /// Dotted-key lookup, e.g. t('en', 'stats.recentForm').
  String t(String lang, String key, [String? fallback]) {
    dynamic node = _bundles[lang];
    for (final part in key.split('.')) {
      if (node is Map<String, dynamic>) {
        node = node[part];
      } else {
        node = null;
        break;
      }
    }
    if (node is String) return node;
    if (lang != 'en') return t('en', key, fallback);
    return fallback ?? key;
  }

  /// Translate a Greek team name from events data to the current language.
  String teamName(String lang, String greekName) {
    final key = greekToTeamKey[greekName];
    if (key == null) return greekName;
    return _fotmob(lang, 'teams', key);
  }

  /// Translate a Greek venue name from events data to the current language.
  String venueName(String lang, String greekVenue) {
    final key = greekToVenueKey[greekVenue];
    if (key == null) return greekVenue;
    return _fotmob(lang, 'venue', key);
  }

  /// Translate a meeting title from events data to the current language
  /// (web translateMeetingTitle parity). Falls back to the raw title.
  String meetingTitle(String lang, String raw) {
    final key = meetingTitleToKey[raw];
    if (key == null) return raw;
    return t(lang, 'meetings.$key', raw);
  }

  /// Direct lookup inside fotmob.<section>. Team keys can contain dots
  /// (e.g. 'Olympiada N. (W)'), so the dotted-path [t] would mis-split them.
  String _fotmob(String lang, String section, String key) {
    final fotmob = _bundles[lang]?['fotmob'];
    final table = fotmob is Map<String, dynamic> ? fotmob[section] : null;
    final value = table is Map<String, dynamic> ? table[key] : null;
    if (value is String) return value;
    if (lang != 'en') return _fotmob('en', section, key);
    return key;
  }

  /// Player names: strip parenthetical annotations like "(Πέναλτι)".
  String playerName(String raw) => raw.replaceAll(RegExp(r'\s*\(.*?\)\s*'), ' ').trim();

  /// Fill i18next-style `{{name}}` placeholders in a translated string
  /// (e.g. squad.modal.startsAndSubs → "{{starts}} start · {{subs}} sub").
  static String interpolate(String template, Map<String, Object?> vars) {
    var out = template;
    vars.forEach((k, v) => out = out.replaceAll('{{$k}}', '$v'));
    return out;
  }
}
