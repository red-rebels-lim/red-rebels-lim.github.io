import 'package:home_widget/home_widget.dart';

import '../data/constants.dart';
import '../models/events.dart';
import '../state/app_state.dart';
import '../theme.dart' show DisplayUpper;

/// Next-match home-screen widget payload (Phase 9, PRD N-2 — visual design:
/// Claude Design concept "1c ULTRA DIAGONAL", approved 2026-07-16).
///
/// Dart owns everything localized — the Kotlin `NextMatchWidgetProvider`
/// renders these strings onto the diagonal-panel card and only computes the
/// countdown (web `useCountdown` cadence: `⏱ 38d 4h` / `⏱ 4h 12m` /
/// `⏱ 12m`, with per-language unit letters). Written on launch, after every
/// live-data sync and on language change; the provider re-renders itself
/// every 30 minutes to tick the countdown.
///
/// The "TO KICKOFF" caption and the Greek countdown units are part of the
/// approved design mocks (they exist on no web surface, so they live here
/// rather than in the byte-copied i18n JSONs).

const androidWidgetName = 'NextMatchWidgetProvider';

const hasMatchKey = 'hasMatch';
const labelKey = 'label';
const homeTeamKey = 'homeTeam';
const awayTeamKey = 'awayTeam';
const homeLogoKey = 'homeLogo';
const awayLogoKey = 'awayLogo';
const sportTextKey = 'sportLabel';
const dateLabelKey = 'dateLabel';
const venueKey = 'venue';
const isCupKey = 'isCup';
const cupLabelKey = 'cupLabel';
const isVolleyballKey = 'isVolleyball';
const kickoffMillisKey = 'kickoffMillis';
const eventKeyKey = 'eventKey';
const emptyTextKey = 'emptyText';
const captionKey = 'caption';
const countdownUnitsKey = 'countdownUnits';

/// Bridges to the home_widget plugin — injectable so tests can capture the
/// payload without a platform channel behind them.
Future<void> Function(String id, Object? data) saveWidgetData =
    (id, data) async => HomeWidget.saveWidgetData(id, data);
Future<void> Function() requestWidgetUpdate =
    () async => HomeWidget.updateWidget(androidName: androidWidgetName);

String _sportKey(Sport sport) => switch (sport) {
      Sport.footballMen => 'sports.footballMen',
      Sport.volleyballMen => 'sports.volleyballMen',
      Sport.volleyballWomen => 'sports.volleyballWomen',
      Sport.meeting => 'sports.meeting',
    };

/// Recomputes and pushes the widget payload. Never throws — the widget is
/// an extra surface and must not break the app.
Future<void> updateNextMatchWidget(AppState app) async {
  try {
    final greek = app.language == 'el';
    final next = app.events.nextUpcoming(DateTime.now());

    // Header + empty-state copy reuse existing web i18n keys verbatim; the
    // design renders everything uppercase (tonos-free in Greek).
    await saveWidgetData(labelKey, app.t('stats.nextMatch').upperNoTonos);
    await saveWidgetData(emptyTextKey, app.t('stats.noData').upperNoTonos);
    // Design-approved copy with no web counterpart (see header comment).
    await saveWidgetData(captionKey, greek ? 'ΕΝΑΡΞΗ ΣΕ' : 'TO KICKOFF');
    await saveWidgetData(countdownUnitsKey, greek ? 'ηωλ' : 'dhm');

    if (next == null) {
      await saveWidgetData(hasMatchKey, false);
      await saveWidgetData(homeTeamKey, '');
      await saveWidgetData(awayTeamKey, '');
      await saveWidgetData(homeLogoKey, '');
      await saveWidgetData(awayLogoKey, '');
      await saveWidgetData(sportTextKey, '');
      await saveWidgetData(dateLabelKey, '');
      await saveWidgetData(venueKey, '');
      await saveWidgetData(isCupKey, false);
      await saveWidgetData(cupLabelKey, '');
      await saveWidgetData(isVolleyballKey, false);
      await saveWidgetData(kickoffMillisKey, 0);
      await saveWidgetData(eventKeyKey, '');
    } else {
      final e = next.event;
      final isHome = e.location == MatchLocation.home;
      final own = app.teamName(teamName).upperNoTonos;
      final opponent = app.teamName(e.opponent).upperNoTonos;
      final monthAbbrev = app.t('months.${next.monthName}').substring(0, 3);
      final time = e.time.contains(':') ? ' • ${e.time}' : '';

      // Crest asset paths for the compact layout (Kotlin loads them from
      // the flutter_assets pack; empty string → text fallback).
      final ownLogo =
          e.sport == Sport.volleyballMen || e.sport == Sport.volleyballWomen
              ? 'assets/images/team_logos/ΝΕΑ_ΣΑΛΑΜΙΝΑ_ΒΟΛΛΕΥ.webp'
              : 'assets/images/team_logos/ΝΕΑ_ΣΑΛΑΜΙΝΑ.webp';
      final opponentLogo = e.logo == null ? '' : 'assets/${e.logo}';

      await saveWidgetData(hasMatchKey, true);
      await saveWidgetData(homeTeamKey, isHome ? own : opponent);
      await saveWidgetData(awayTeamKey, isHome ? opponent : own);
      await saveWidgetData(homeLogoKey, isHome ? ownLogo : opponentLogo);
      await saveWidgetData(awayLogoKey, isHome ? opponentLogo : ownLogo);
      await saveWidgetData(sportTextKey, app.t(_sportKey(e.sport)).upperNoTonos);
      await saveWidgetData(dateLabelKey, '$monthAbbrev ${e.day}$time'.upperNoTonos);
      final venue = e.venue;
      await saveWidgetData(
          venueKey, venue == null ? '' : app.venueName(venue).upperNoTonos);
      await saveWidgetData(isCupKey, e.isCup);
      await saveWidgetData(cupLabelKey, app.t('calendar.cup').upperNoTonos);
      await saveWidgetData(
          isVolleyballKey,
          e.sport == Sport.volleyballMen || e.sport == Sport.volleyballWomen);
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
