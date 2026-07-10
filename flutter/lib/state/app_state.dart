import 'dart:ui' show PlatformDispatcher;

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/events_repository.dart';
import '../data/players_repository.dart';
import '../i18n/i18n.dart';
import '../models/events.dart';

/// App-wide state: language, theme, calendar view mode and filters.
class AppState extends ChangeNotifier {
  AppState({
    required this.events,
    required this.players,
    required this.i18n,
    required SharedPreferences prefs,
  }) : _prefs = prefs {
    // Default to the device locale (Greek device → Greek), like the web app.
    _language = prefs.getString('language') ??
        (PlatformDispatcher.instance.locale.languageCode == 'el' ? 'el' : 'en');
    _themeMode = switch (prefs.getString('themeMode')) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
    final storedView = prefs.getString('calendarView');
    if (calendarViews.contains(storedView)) {
      _calendarView = storedView!;
    } else {
      // Migrate the old boolean 'listView' preference.
      _calendarView = (prefs.getBool('listView') ?? false) ? 'list' : 'grid';
    }
  }

  /// Calendar view modes, in header-switcher cycle order.
  static const calendarViews = ['grid', 'list', 'cards'];

  final EventsRepository events;
  final PlayersRepository players;
  final I18n i18n;
  final SharedPreferences _prefs;

  late String _language;
  late ThemeMode _themeMode;
  late String _calendarView;
  FilterState _filters = const FilterState();

  /// Registered by HomeShell so any widget can switch bottom-nav tabs.
  void Function(int index)? tabNavigator;

  String get language => _language;
  ThemeMode get themeMode => _themeMode;

  /// 'grid' | 'list' | 'cards'.
  String get calendarView => _calendarView;
  FilterState get filters => _filters;

  void goToTab(int i) => tabNavigator?.call(i);

  /// Shorthand translation with the current language.
  String t(String key, [String? fallback]) => i18n.t(_language, key, fallback);
  String teamName(String greekName) => i18n.teamName(_language, greekName);
  String venueName(String greekVenue) => i18n.venueName(_language, greekVenue);

  void setLanguage(String lang) {
    if (lang == _language) return;
    _language = lang;
    _prefs.setString('language', lang);
    notifyListeners();
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

  /// Events for a month after applying the active filters.
  List<SportEvent> filteredEventsFor(String monthName) {
    final list = events.eventsFor(monthName);
    if (!_filters.isActive) return list;
    return list.where((e) => _filters.matches(e, teamName(e.opponent))).toList();
  }
}
