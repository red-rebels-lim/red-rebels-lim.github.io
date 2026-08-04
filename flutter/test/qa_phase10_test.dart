import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:solo_salamina/data/events_repository.dart';
import 'package:solo_salamina/data/players_repository.dart';
import 'package:solo_salamina/i18n/i18n.dart';
import 'package:solo_salamina/logic/football_stats.dart';
import 'package:solo_salamina/logic/scout.dart';
import 'package:solo_salamina/models/events.dart';
import 'package:solo_salamina/pages/settings_page.dart';
import 'package:solo_salamina/state/app_state.dart';
import 'package:solo_salamina/theme.dart';
import 'package:solo_salamina/widgets/event_details_sheet.dart';

/// Phase-10 gaps batch (QA-21): opponent scout (EVT-12), sports filter
/// (SET-05), notification preview (SET-04), calendar export (SET-06).
void main() {
  late EventsRepository events;
  late PlayersRepository players;
  late I18n i18n;
  late SharedPreferences prefs;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    // QA parity premises (played matches, volleyball scorers, player apps)
    // are pinned to the archived 25/26 season fixture — the live 26/27 bundle
    // starts with no played matches.
    events = await EventsRepository.load(
      cacheFile: () async => File('test/fixtures/events_2526.json'),
    );
    players = await PlayersRepository.load();
    i18n = await I18n.load();
  });

  Future<AppState> freshApp([Map<String, Object> values = const {}]) async {
    SharedPreferences.setMockInitialValues(values);
    prefs = await SharedPreferences.getInstance();
    return AppState(events: events, players: players, i18n: i18n, prefs: prefs);
  }

  group('scout logic (EVT-12)', () {
    test('h2h + last meeting derived from played matches only', () async {
      final app = await freshApp();
      // Pick any played football opponent from the bundled season data.
      final played = app.events
          .allEvents()
          .where((de) =>
              de.event.sport == Sport.footballMen &&
              de.event.status == MatchStatus.played &&
              (de.event.score?.contains('-') ?? false))
          .toList();
      expect(played, isNotEmpty);
      final opponent = played.first.event.opponent;

      final h2h = getOpponentH2H(app.events, opponent, Sport.footballMen)!;
      expect(h2h.played, greaterThan(0));
      expect(h2h.wins + h2h.draws + h2h.losses, h2h.played);

      final last = getLastMeeting(app.events, opponent, Sport.footballMen)!;
      expect(last.score, contains('-'));
      // The last meeting must be the LATEST played fixture vs that opponent.
      final expected = played.lastWhere((de) => de.event.opponent == opponent);
      expect(last.month, expected.monthName);
      expect(last.day, expected.event.day);
    });

    test('unknown opponent yields nulls (first-meeting state)', () async {
      final app = await freshApp();
      expect(getOpponentH2H(app.events, 'ΑΓΝΩΣΤΗ ΟΜΑΔΑ', Sport.footballMen), isNull);
      expect(getLastMeeting(app.events, 'ΑΓΝΩΣΤΗ ΟΜΑΔΑ', Sport.footballMen), isNull);
    });

    testWidgets('upcoming sheet renders the scout card', (tester) async {
      final app = await freshApp();
      const upcoming = SportEvent(
        day: 20,
        sport: Sport.footballMen,
        location: MatchLocation.home,
        opponent: 'ΑΓΝΩΣΤΗ ΟΜΑΔΑ',
        time: '19:00',
        status: MatchStatus.upcoming,
        competition: Competition.league,
      );
      await tester.pumpWidget(ChangeNotifierProvider.value(
        value: app,
        child: MaterialApp(
          theme: buildTheme('default', Brightness.light),
          home: Scaffold(
            body: Builder(
              builder: (context) => Center(
                child: ElevatedButton(
                  onPressed: () => showEventDetailsSheet(context, upcoming, 'april'),
                  child: const Text('open'),
                ),
              ),
            ),
          ),
        ),
      ));
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();

      // Never-met opponent → the web's first-meeting empty state.
      expect(find.text('OPPONENT INFO'), findsOneWidget);
      expect(find.text('First meeting this season'), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    });
  });

  group('sports filter (SET-05)', () {
    test('toggles persist as the web sport_filters JSON and filter the calendar', () async {
      final app = await freshApp();
      expect(app.sportFilters, (football: true, volleyball: true));

      app.toggleSportFilter('volleyball');
      expect(app.sportFilters.volleyball, isFalse);
      expect(prefs.getString(AppState.sportFiltersKey), '{"football":true,"volleyball":false}');

      // Volleyball events disappear from every month; football stays.
      for (final month in app.events.byMonth.keys) {
        final list = app.filteredEventsFor(month);
        expect(
          list.any((e) => e.sport == Sport.volleyballMen || e.sport == Sport.volleyballWomen),
          isFalse,
          reason: 'volleyball leaked into $month',
        );
      }
      final totalFootball = [
        for (final m in app.events.byMonth.keys) ...app.filteredEventsFor(m)
      ].where((e) => e.sport == Sport.footballMen).length;
      expect(totalFootball, greaterThan(0));

      // Web rule: the last enabled sport cannot be turned off.
      app.toggleSportFilter('football');
      expect(app.sportFilters.football, isTrue);

      // Restart restores the stored value.
      final restarted = AppState(events: events, players: players, i18n: i18n, prefs: prefs);
      expect(restarted.sportFilters, (football: true, volleyball: false));
    });

    test('corrupt stored value falls back to defaults', () async {
      final app = await freshApp({AppState.sportFiltersKey: '{broken'});
      expect(app.sportFilters, (football: true, volleyball: true));
    });
  });

  group('settings page (SET-04/05/06)', () {
    Future<void> pumpSettings(WidgetTester tester, AppState app) async {
      await tester.pumpWidget(ChangeNotifierProvider.value(
        value: app,
        child: MaterialApp(
          theme: buildTheme('default', Brightness.light),
          home: const Scaffold(body: SettingsPage()),
        ),
      ));
      await tester.pump();
    }

    testWidgets('sports filter rows toggle through AppState', (tester) async {
      final app = await freshApp();
      await pumpSettings(tester, app);

      // Fixed drag: scrollUntilVisible only guarantees partial visibility
      // on the 600px test surface (same pitfall as tools_test).
      await tester.drag(find.byType(ListView), const Offset(0, -600));
      await tester.pump();
      await tester.tap(find.byKey(const Key('sport-filter-volleyball')));
      await tester.pump();
      expect(app.sportFilters.volleyball, isFalse);

      // Turning off the remaining sport is rejected (web rule).
      await tester.tap(find.byKey(const Key('sport-filter-football')));
      await tester.pump();
      expect(app.sportFilters.football, isTrue);

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('export calendar opens the language-matched ICS feed', (tester) async {
      final launched = <Uri>[];
      openExternalUrl = (url) async {
        launched.add(url);
        return true;
      };
      final app = await freshApp();
      await pumpSettings(tester, app);

      await tester.drag(find.byType(ListView), const Offset(0, -900));
      await tester.pump();
      await tester.tap(find.text('Export Calendar'));
      expect(launched, [Uri.parse('https://red-rebels.com/calendar.ics')]);

      app.setLanguage('el');
      await tester.pump();
      await tester.tap(find.text('Εξαγωγή Ημερολογίου'));
      expect(launched.last, Uri.parse('https://red-rebels.com/calendar-el.ics'));

      await tester.pumpWidget(const SizedBox());
    });

    testWidgets('notification preview expands with prefs-driven rows', (tester) async {
      final app = await freshApp();
      await pumpSettings(tester, app);

      final toggle = find.byKey(const Key('notification-preview-toggle'));

      // Collapsed: no sample rows.
      expect(find.textContaining('Kickoff in'), findsNothing);

      await tester.tap(toggle);
      await tester.pumpAndSettle();

      // Defaults: reminderHours [24, 2] → "24h"; score + new-event rows on.
      expect(find.text('Nea Salamis vs PAEEK — Kickoff in 24h'), findsOneWidget);
      expect(find.text('Nea Salamis 2-0 Doxa Katokopia — Match ended!'), findsOneWidget);
      expect(find.text('New match added: Nea Salamis vs Ayia Napa, Apr 19'), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
    });
  });

  group('scout result semantics', () {
    test('matchResult without penalties matches the web getLastMeeting', () {
      // Web getLastMeeting passes no penalties — a shoot-out win reads draw.
      expect(matchResult('1-1', MatchLocation.home), MatchResult.draw);
    });
  });
}
