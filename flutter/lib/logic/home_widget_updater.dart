import 'package:home_widget/home_widget.dart';

import '../state/app_state.dart';
import '../theme.dart' show DisplayUpper;
import '../widgets/event_card.dart' show matchTitle, sportLabelKey;

/// Next-match home-screen widget payload (Phase 9, PRD N-2).
///
/// Dart owns everything localized — the Kotlin `NextMatchWidgetProvider`
/// just renders these strings and formats the countdown from
/// [kickoffMillisKey] (web `useCountdown` format: `⏱ 3d 4h`). Written on
/// launch, after every live-data sync and on language change; the provider
/// also re-renders itself every 30 minutes to tick the countdown.

const androidWidgetName = 'NextMatchWidgetProvider';

const hasMatchKey = 'hasMatch';
const labelKey = 'label';
const titleKey = 'title';
const subtitleKey = 'subtitle';
const kickoffMillisKey = 'kickoffMillis';
const eventKeyKey = 'eventKey';
const emptyTextKey = 'emptyText';

/// Bridges to the home_widget plugin — injectable so tests can capture the
/// payload without a platform channel behind them.
Future<void> Function(String id, Object? data) saveWidgetData =
    (id, data) async => HomeWidget.saveWidgetData(id, data);
Future<void> Function() requestWidgetUpdate =
    () async => HomeWidget.updateWidget(androidName: androidWidgetName);

/// Recomputes and pushes the widget payload. Never throws — the widget is
/// an extra surface and must not break the app.
Future<void> updateNextMatchWidget(AppState app) async {
  try {
    final next = app.events.nextUpcoming(DateTime.now());

    // Header + empty-state copy reuse existing web i18n keys verbatim.
    await saveWidgetData(labelKey, app.t('stats.nextMatch').upperNoTonos);
    await saveWidgetData(emptyTextKey, app.t('stats.noData'));

    if (next == null) {
      await saveWidgetData(hasMatchKey, false);
      await saveWidgetData(titleKey, '');
      await saveWidgetData(subtitleKey, '');
      await saveWidgetData(kickoffMillisKey, 0);
      await saveWidgetData(eventKeyKey, '');
    } else {
      final e = next.event;
      // Same pieces as the web UpcomingEventCard: sport label (+ Cup) and
      // `Mon DD • HH:MM`.
      var sportLabel = app.t(sportLabelKey(e.sport));
      if (e.isCup) sportLabel = '$sportLabel ${app.t('calendar.cup')}';
      final monthAbbrev = app.t('months.${next.monthName}').substring(0, 3);
      final time = e.time.contains(':') ? ' • ${e.time}' : '';

      await saveWidgetData(hasMatchKey, true);
      await saveWidgetData(titleKey, matchTitle(app, e));
      await saveWidgetData(
          subtitleKey, '${sportLabel.upperNoTonos} · $monthAbbrev ${e.day}$time');
      await saveWidgetData(kickoffMillisKey, next.date.millisecondsSinceEpoch);
      // Same key format the push deep links use (EventsRepository.findByEventKey).
      await saveWidgetData(
          eventKeyKey, '${next.monthName}-${e.day}-${e.sport.id}-${e.opponent}');
    }

    await requestWidgetUpdate();
  } catch (_) {
    // Plugin unavailable (tests, unsupported platform) — widget stays stale.
  }
}
