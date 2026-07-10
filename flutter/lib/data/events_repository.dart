import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

import '../models/events.dart';
import 'constants.dart';

/// Loads and indexes the bundled events.json (generated from the web app's
/// events.ts by tool/generate_events_json.mjs).
class EventsRepository {
  EventsRepository._(this.byMonth);

  /// Month name (september…august) → events for that month, in source order.
  final Map<String, List<SportEvent>> byMonth;

  static Future<EventsRepository> load() async {
    final raw = await rootBundle.loadString('assets/data/events.json');
    final decoded = json.decode(raw) as Map<String, dynamic>;
    final byMonth = <String, List<SportEvent>>{};
    for (final month in monthOrder) {
      final list = decoded[month] as List?;
      if (list == null) continue;
      byMonth[month] = list.map((e) => SportEvent.fromJson(e as Map<String, dynamic>)).toList();
    }
    return EventsRepository._(byMonth);
  }

  List<SportEvent> eventsFor(String monthName) => byMonth[monthName] ?? const [];

  List<DatedEvent>? _allEvents;

  /// All events of the season in chronological order with resolved dates.
  /// Cached: the data never changes after load and callers (e.g. the countdown
  /// banner) invoke this every second.
  List<DatedEvent> allEvents() => _allEvents ??= _buildAllEvents();

  List<DatedEvent> _buildAllEvents() {
    final result = <DatedEvent>[];
    for (final month in monthOrder) {
      final info = monthInfo(month);
      final events = [...eventsFor(month)]..sort((a, b) => a.day.compareTo(b.day));
      for (final e in events) {
        var date = DateTime(info.year, info.month, e.day);
        if (e.time.contains(':')) {
          final parts = e.time.split(':');
          final h = int.tryParse(parts[0]);
          final m = int.tryParse(parts[1]);
          if (h != null && m != null) {
            date = DateTime(info.year, info.month, e.day, h, m);
          }
        }
        result.add(DatedEvent(monthName: month, event: e, date: date));
      }
    }
    return result;
  }

  /// The next event that hasn't kicked off yet (falls back to status when no time).
  DatedEvent? nextUpcoming(DateTime now) {
    for (final de in allEvents()) {
      if (de.event.status == MatchStatus.upcoming && de.date.add(const Duration(hours: 2)).isAfter(now)) {
        return de;
      }
    }
    return null;
  }

  /// Month containing today if within the season, otherwise the first month
  /// with an upcoming event, otherwise september.
  String initialMonth(DateTime now) {
    for (final month in monthOrder) {
      final info = monthInfo(month);
      if (info.year == now.year && info.month == now.month) return month;
    }
    final next = nextUpcoming(now);
    return next?.monthName ?? monthOrder.first;
  }
}
