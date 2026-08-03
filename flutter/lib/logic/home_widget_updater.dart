import 'dart:convert';

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
// JSON array of the next few upcoming fixtures. The provider selects the first
// one still within its post-kickoff grace at render time, so its 30-min
// re-render advances to the next match without the app running. The flat keys
// above mirror the first entry and remain a fallback for older payloads.
const matchesJsonKey = 'matchesJson';

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
    // Draw fixtures without a confirmed date carry no kickoff to count down
    // to — the widget shows the next *confirmed* fixture instead. Meetings
    // (trainings, presentations) count too: they carry no match status, so
    // they are picked straight from the season list (user request 2026-07-30).
    final now = DateTime.now();
    final upcoming = app.events
        .allEvents()
        .where((de) =>
            (de.event.status == MatchStatus.upcoming || de.event.isMeeting) &&
            !de.event.dateTbd &&
            de.date.add(const Duration(hours: 2)).isAfter(now))
        .take(6)
        .toList();
    final entries = [for (final de in upcoming) _matchEntry(app, de)];

    // Header + empty-state copy reuse existing web i18n keys verbatim; the
    // design renders everything uppercase (tonos-free in Greek).
    await saveWidgetData(labelKey, app.t('stats.nextMatch').upperNoTonos);
    await saveWidgetData(emptyTextKey, app.t('stats.noData').upperNoTonos);
    await saveWidgetData(cupLabelKey, app.t('calendar.cup').upperNoTonos);
    // Design-approved copy with no web counterpart (see header comment).
    await saveWidgetData(captionKey, greek ? 'ΕΝΑΡΞΗ ΣΕ' : 'TO KICKOFF');
    await saveWidgetData(countdownUnitsKey, greek ? 'ηωλ' : 'dhm');

    // The provider picks the first not-yet-finished entry from this list, so it
    // advances match-to-match on its own 30-min re-render.
    await saveWidgetData(matchesJsonKey, jsonEncode(entries));

    // Flat keys mirror the first upcoming fixture — a fallback the provider
    // uses only if the JSON list is missing/unreadable.
    final first = entries.isEmpty ? null : entries.first;
    await saveWidgetData(hasMatchKey, first != null);
    await saveWidgetData(homeTeamKey, first?[homeTeamKey] ?? '');
    await saveWidgetData(awayTeamKey, first?[awayTeamKey] ?? '');
    await saveWidgetData(homeLogoKey, first?[homeLogoKey] ?? '');
    await saveWidgetData(awayLogoKey, first?[awayLogoKey] ?? '');
    await saveWidgetData(sportTextKey, first?[sportTextKey] ?? '');
    await saveWidgetData(dateLabelKey, first?[dateLabelKey] ?? '');
    await saveWidgetData(venueKey, first?[venueKey] ?? '');
    await saveWidgetData(isCupKey, first?[isCupKey] ?? false);
    await saveWidgetData(isVolleyballKey, first?[isVolleyballKey] ?? false);
    await saveWidgetData(kickoffMillisKey, first?[kickoffMillisKey] ?? 0);
    await saveWidgetData(eventKeyKey, first?[eventKeyKey] ?? '');

    await requestWidgetUpdate();
  } catch (_) {
    // Plugin unavailable (tests, unsupported platform) — widget stays stale.
  }
}

/// One fixture's fully-localized payload, keyed exactly as the flat prefs so a
/// single map serves both the JSON list and the fallback keys. Crest paths feed
/// the compact layout (Kotlin loads them from the flutter_assets pack; an empty
/// string means "text fallback").
Map<String, Object?> _matchEntry(AppState app, DatedEvent de) {
  final e = de.event;
  final isHome = e.location == MatchLocation.home;
  final isVolleyball =
      e.sport == Sport.volleyballMen || e.sport == Sport.volleyballWomen;
  final own = app.teamName(teamName).upperNoTonos;
  final opponent = app.teamName(e.opponent).upperNoTonos;
  final monthAbbrev = app.t('months.${de.monthName}').substring(0, 3);
  final time = e.time.contains(':') ? ' • ${e.time}' : '';
  final ownLogo = isVolleyball
      ? 'assets/images/team_logos/ΝΕΑ_ΣΑΛΑΜΙΝΑ_ΒΟΛΛΕΥ.webp'
      : 'assets/images/team_logos/ΝΕΑ_ΣΑΛΑΜΙΝΑ.webp';
  final opponentLogo = e.logo == null ? '' : 'assets/${e.logo}';
  final venue = e.venue;
  // Meetings have no opponent: the title rides the home line, the away line
  // stays empty and the provider hides its "VS …" row and away crest.
  final isMeeting = e.isMeeting;
  return {
    homeTeamKey: isMeeting ? app.meetingTitle(e.opponent).upperNoTonos : (isHome ? own : opponent),
    awayTeamKey: isMeeting ? '' : (isHome ? opponent : own),
    homeLogoKey: isMeeting ? ownLogo : (isHome ? ownLogo : opponentLogo),
    awayLogoKey: isMeeting ? '' : (isHome ? opponentLogo : ownLogo),
    sportTextKey: app.t(_sportKey(e.sport)).upperNoTonos,
    dateLabelKey: '$monthAbbrev ${e.day}$time'.upperNoTonos,
    venueKey: venue == null ? '' : app.venueName(venue).upperNoTonos,
    isCupKey: e.isCup,
    isVolleyballKey: isVolleyball,
    kickoffMillisKey: de.date.millisecondsSinceEpoch,
    // Same key format the push deep links use (EventsRepository.findByEventKey).
    eventKeyKey: '${de.monthName}-${e.day}-${e.sport.id}-${e.opponent}',
  };
}
