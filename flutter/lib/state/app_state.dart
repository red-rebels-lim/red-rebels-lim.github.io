import 'dart:convert';
import 'dart:ui' show PlatformDispatcher;

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../data/events_repository.dart';
import '../data/news_repository.dart';
import '../data/players_repository.dart';
import '../i18n/i18n.dart';
import '../logic/push_registration.dart';
import '../models/events.dart';
import '../theme.dart' show visualThemes;

/// App-wide state: language, theme, calendar view mode and filters.
class AppState extends ChangeNotifier {
  AppState({
    required this.events,
    required this.players,
    required this.i18n,
    required SharedPreferences prefs,
    this.news,
    this.syncEnabled = false,
    this.httpClientFactory,
    this.push,
  }) : _prefs = prefs {
    // Default to the device locale (Greek device → Greek), like the web app.
    _language = prefs.getString('language') ??
        (PlatformDispatcher.instance.locale.languageCode == 'el' ? 'el' : 'en');
    _themeMode = switch (prefs.getString('themeMode')) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
    final storedVisualTheme = prefs.getString(visualThemeKey);
    _visualTheme =
        visualThemes.contains(storedVisualTheme) ? storedVisualTheme! : 'default';
    final storedView = prefs.getString('calendarView');
    if (calendarViews.contains(storedView)) {
      _calendarView = storedView!;
    } else {
      // Migrate the old boolean 'listView' preference.
      _calendarView = (prefs.getBool('listView') ?? false) ? 'list' : 'grid';
    }
    _notifPrefs = _loadNotifPrefs(prefs);
    _sportFilters = _loadSportFilters(prefs);
  }

  /// Local storage key for the NotifPrefs JSON snapshot (renders the saved
  /// notification preferences on restart without a network round-trip).
  static const notifPrefsKey = 'notif_prefs';

  /// Settings-level sport filter, web parity: `localStorage['sport_filters']`
  /// = `{"football":bool,"volleyball":bool}` (QA SET-05). Applied to the
  /// calendar surfaces only — the web's stats/squad pages ignore it.
  static const sportFiltersKey = 'sport_filters';

  static ({bool football, bool volleyball}) _loadSportFilters(SharedPreferences prefs) {
    try {
      final raw = prefs.getString(sportFiltersKey);
      if (raw != null) {
        final decoded = json.decode(raw);
        if (decoded is Map &&
            decoded['football'] is bool &&
            decoded['volleyball'] is bool) {
          return (football: decoded['football'] as bool, volleyball: decoded['volleyball'] as bool);
        }
      }
    } catch (_) {
      // Corrupt value — fall through to defaults, like the web.
    }
    return (football: true, volleyball: true);
  }

  static NotifPrefs _loadNotifPrefs(SharedPreferences prefs) {
    final raw = prefs.getString(notifPrefsKey);
    if (raw != null) {
      try {
        return NotifPrefs.fromJson(json.decode(raw) as Map<String, dynamic>);
      } catch (_) {
        // Corrupt snapshot — fall through to defaults.
      }
    }
    return const NotifPrefs();
  }

  /// Local storage flag: first-run intro already shown (versioned so a
  /// future redesign of the intro can re-trigger it).
  static const introSeenKey = 'intro_seen_v1';

  /// Calendar view modes, in header-switcher cycle order.
  static const calendarViews = ['grid', 'list', 'cards'];

  /// Local storage key for the visual theme (web `visual_theme` parity).
  static const visualThemeKey = 'visual_theme';

  /// Minimum spacing between live-data sync attempts (app resume etc.).
  static const minSyncInterval = Duration(minutes: 5);

  final EventsRepository events;
  final PlayersRepository players;

  /// Optional so the many tests constructing AppState without news keep
  /// working; when absent, [syncEvents] simply skips the news feed.
  final NewsRepository? news;
  final I18n i18n;
  final SharedPreferences _prefs;

  /// Live-data refresh is opt-in (enabled by main.dart) so widget tests never
  /// hit the network by default.
  final bool syncEnabled;

  /// Injectable HTTP client factory for tests; null → the repository creates
  /// (and closes) its own client per refresh.
  final http.Client Function()? httpClientFactory;

  /// Push-registration layer (Back4App rows behind notifications). Null in
  /// tests; when the build carries no Back4App credentials it is present but
  /// disabled ([PushRegistration.available] is false) and every call no-ops —
  /// mirrors the web, where empty env vars disable push locally.
  final PushRegistration? push;

  DateTime? _lastSyncAttempt;
  DateTime? _lastSyncAt;
  bool _lastSyncFailed = false;
  bool _syncing = false;

  /// When the last successful live-data sync completed, if any.
  DateTime? get lastSyncAt => _lastSyncAt;

  /// True when the most recent sync attempt failed — the calendar shows a
  /// subtle stale-data indicator while this holds (FR-OFFLINE-2).
  bool get lastSyncFailed => _lastSyncFailed;

  /// True while [syncEvents] is in flight (drives first-load spinners).
  bool get syncing => _syncing;

  late String _language;
  late ThemeMode _themeMode;
  late String _visualTheme;
  late String _calendarView;
  FilterState _filters = const FilterState();

  /// Registered by HomeShell so any widget can switch bottom-nav tabs.
  void Function(int index)? tabNavigator;

  /// Registered by HomeShell (Phase 9): re-pushes the home-screen widget
  /// payload. Fired after language changes and live-data syncs so the
  /// widget's localized strings and fixture stay current.
  void Function()? widgetRefresher;

  String get language => _language;
  ThemeMode get themeMode => _themeMode;

  /// 'default' | 'brutalism' | 'cinema' | 'neon'.
  String get visualTheme => _visualTheme;

  /// 'grid' | 'list' | 'cards'.
  String get calendarView => _calendarView;
  FilterState get filters => _filters;

  void goToTab(int i) => tabNavigator?.call(i);

  String? _pendingEventKey;

  /// Deep-link target set by the push notification-tap handlers and consumed
  /// once by the calendar page (via [consumePendingEventKey]).
  String? get pendingEventKey => _pendingEventKey;

  set pendingEventKey(String? key) {
    _pendingEventKey = key;
    notifyListeners();
  }

  /// Clears and returns [pendingEventKey]. No notify — the consumer is
  /// already mid-build when it takes the key.
  String? consumePendingEventKey() {
    final key = _pendingEventKey;
    _pendingEventKey = null;
    return key;
  }

  String? _pendingStatsTab;

  /// Stats tab requested by the event sheet's "View All Statistics" CTA, so
  /// a football sheet always lands on the football tab even when the stats
  /// page (kept alive in the IndexedStack) last showed another sport
  /// (QA task #12). Consumed once by the stats page.
  ///
  /// Must notify: the IndexedStack's children are const, so switching tabs
  /// alone never rebuilds the stats page — only an AppState notification
  /// reaches its context.watch (same reason pendingEventKey notifies).
  set pendingStatsTab(String? tab) {
    _pendingStatsTab = tab;
    notifyListeners();
  }

  /// Clears and returns the pending stats tab. No notify — the consumer is
  /// already mid-build when it takes the value.
  String? consumePendingStatsTab() {
    final tab = _pendingStatsTab;
    _pendingStatsTab = null;
    return tab;
  }

  // ── Push notifications ────────────────────────────────────────────────

  late NotifPrefs _notifPrefs;
  bool _pushBusy = false;

  /// Current notification preferences (local snapshot; the server row is the
  /// source of truth and every change is written through to it).
  NotifPrefs get notifPrefs => _notifPrefs;

  /// True while an enable/disable request is in flight.
  bool get pushBusy => _pushBusy;

  /// True when this build can register for push: Back4App credentials are
  /// present AND a platform token provider was wired in.
  bool get pushAvailable => (push?.available ?? false) && push?.tokenProvider != null;

  /// True when this device holds a registered push subscription.
  bool get pushRegistered => push?.registered ?? false;

  /// Permission → token → Back4App registration. Returns true when the
  /// device ends up registered; false on denial or any failure (never throws).
  Future<bool> enablePush() async {
    final push = this.push;
    final tokens = push?.tokenProvider;
    if (push == null || tokens == null || !push.available || _pushBusy) return false;
    _pushBusy = true;
    notifyListeners();
    try {
      if (!await tokens.requestPermission()) return false;
      final token = await tokens.getToken();
      if (token == null) return false;
      if (!await push.register(token)) return false;
      // A fresh registration starts from the server-side defaults.
      _notifPrefs = const NotifPrefs();
      await _prefs.setString(notifPrefsKey, json.encode(_notifPrefs.toJson()));
      return true;
    } finally {
      _pushBusy = false;
      notifyListeners();
    }
  }

  /// Deletes the registration (best-effort) and clears the local snapshot.
  Future<void> disablePush() async {
    final push = this.push;
    if (push == null || _pushBusy) return;
    _pushBusy = true;
    notifyListeners();
    try {
      await push.unregister();
      await _prefs.remove(notifPrefsKey);
      _notifPrefs = const NotifPrefs();
    } finally {
      _pushBusy = false;
      notifyListeners();
    }
  }

  /// Optimistically applies [next], writes it through to the NotifPreference
  /// row and persists it locally. On failure the previous value is restored
  /// and false is returned (the caller surfaces the error).
  Future<bool> updateNotifPrefs(NotifPrefs next) async {
    final push = this.push;
    if (push == null) return false;
    final previous = _notifPrefs;
    _notifPrefs = next;
    notifyListeners();
    final ok = await push.updatePreferences(next);
    if (ok) {
      await _prefs.setString(notifPrefsKey, json.encode(next.toJson()));
    } else {
      _notifPrefs = previous;
      notifyListeners();
    }
    return ok;
  }

  /// Refreshes the fixtures and the squad roster from the live feeds.
  ///
  /// [throttle] skips the attempt when one happened within [minSyncInterval]
  /// (used on app resume; the launch sync passes false). Failures keep the
  /// current data and only flip [lastSyncFailed] — it is true when either
  /// feed fails. Never throws.
  Future<void> syncEvents({bool throttle = false}) async {
    if (!syncEnabled || _syncing) return;
    final now = DateTime.now();
    if (throttle && _lastSyncAttempt != null && now.difference(_lastSyncAttempt!) < minSyncInterval) {
      return;
    }
    _syncing = true;
    _lastSyncAttempt = now;
    notifyListeners(); // Surfaces first-load spinners while the fetch runs.
    try {
      final results = await Future.wait([
        events.refresh(client: httpClientFactory?.call()),
        players.refresh(client: httpClientFactory?.call()),
        if (news case final news?) news.refresh(client: httpClientFactory?.call()),
      ]);
      final ok = results.every((r) => r);
      _lastSyncFailed = !ok;
      if (ok) _lastSyncAt = DateTime.now();
    } finally {
      _syncing = false;
    }
    notifyListeners();
    widgetRefresher?.call();
  }

  /// True once the first-run intro has been dismissed (skip or finish).
  bool get introSeen => _prefs.getBool(introSeenKey) ?? false;

  Future<void> markIntroSeen() => _prefs.setBool(introSeenKey, true);

  /// Shorthand translation with the current language.
  String t(String key, [String? fallback]) => i18n.t(_language, key, fallback);
  String teamName(String greekName) => i18n.teamName(_language, greekName);
  String venueName(String greekVenue) => i18n.venueName(_language, greekVenue);
  String meetingTitle(String raw) => i18n.meetingTitle(_language, raw);

  void setLanguage(String lang) {
    if (lang == _language) return;
    _language = lang;
    _prefs.setString('language', lang);
    notifyListeners();
    widgetRefresher?.call();
  }

  void setThemeMode(ThemeMode mode) {
    if (mode == _themeMode) return;
    _themeMode = mode;
    _prefs.setString('themeMode', switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      ThemeMode.system => 'system',
    });
    notifyListeners();
  }

  void setVisualTheme(String theme) {
    if (theme == _visualTheme || !visualThemes.contains(theme)) return;
    _visualTheme = theme;
    _prefs.setString(visualThemeKey, theme);
    notifyListeners();
  }

  void setCalendarView(String view) {
    if (view == _calendarView || !calendarViews.contains(view)) return;
    _calendarView = view;
    _prefs.setString('calendarView', view);
    notifyListeners();
  }

  void setFilters(FilterState filters) {
    _filters = filters;
    notifyListeners();
  }

  void clearFilters() => setFilters(const FilterState());

  String? _newsCategory;

  /// Selected news category (WordPress category name, Greek as-is) or null
  /// for all. Session-only, like the calendar [filters].
  String? get newsCategory => _newsCategory;

  void setNewsCategory(String? category) {
    _newsCategory = category;
    notifyListeners();
  }

  late ({bool football, bool volleyball}) _sportFilters;

  /// Settings-level sport toggles (SPORTS FILTER section).
  ({bool football, bool volleyball}) get sportFilters => _sportFilters;

  /// Flips one sport toggle. Web rule: both may never be off — a toggle that
  /// would disable the last sport is silently ignored.
  void toggleSportFilter(String sport) {
    final next = (
      football: sport == 'football' ? !_sportFilters.football : _sportFilters.football,
      volleyball: sport == 'volleyball' ? !_sportFilters.volleyball : _sportFilters.volleyball,
    );
    if (!next.football && !next.volleyball) return;
    _sportFilters = next;
    _prefs.setString(sportFiltersKey,
        json.encode({'football': next.football, 'volleyball': next.volleyball}));
    notifyListeners();
  }

  bool _passesSportFilter(SportEvent e) => switch (e.sport) {
        Sport.footballMen => _sportFilters.football,
        Sport.volleyballMen || Sport.volleyballWomen => _sportFilters.volleyball,
        Sport.meeting => true,
      };

  /// Events for a month after the settings-level sport filter and the active
  /// filter-panel filters (web `buildCalendarData` order).
  ///
  /// Always a FRESH growable list: callers sort it in place, and the
  /// repository's month list must never be mutated (it can also be a
  /// `const []` for months absent from the feed, which would throw).
  List<SportEvent> filteredEventsFor(String monthName) {
    var list = events.eventsFor(monthName);
    if (!_sportFilters.football || !_sportFilters.volleyball) {
      list = list.where(_passesSportFilter).toList();
    }
    if (!_filters.isActive) return List.of(list);
    return list.where((e) => _filters.matches(e, teamName(e.opponent))).toList();
  }
}
