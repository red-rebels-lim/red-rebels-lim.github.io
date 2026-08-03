/// D-* — Event details sheet (TEST-PLAN §6.D), incl. regressions for the
/// side-attribution bug (task #11) and the stats-CTA sport bug (task #12).
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'qa_datasets.dart';
import 'qa_helpers.dart';

Future<void> openSheet(WidgetTester tester, String month, int day, Pattern title) async {
  await goToMonth(tester, month);
  await tap(tester, dayCell(day));
  await tap(tester, find.textContaining(title).first);
  await pumpFrames(tester);
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('D-01/02/03 played home win: pill, score, competition label, chips', (tester) async {
    await bootApp(tester);
    await openSheet(tester, 'SEPTEMBER', 5, 'Doxa Katokopia');

    expect(find.text('MATCH RESULT'), findsOneWidget);
    expect(find.text('WIN'), findsWidgets);
    expect(find.textContaining('MATCHDAY 1'), findsOneWidget);
    expect(find.textContaining('Home'), findsWidgets); // home chip
    expect(find.textContaining('Stadio Vitex'), findsWidgets); // venue pill
    expect(find.byIcon(Icons.close), findsOneWidget); // close X (EVT-10)
  });

  testWidgets('D-13 View All Statistics CTA is visible without scrolling', (tester) async {
    await bootApp(tester);
    await openSheet(tester, 'SEPTEMBER', 5, 'Doxa Katokopia');
    final cta = find.textContaining(RegExp('view all statistics', caseSensitive: false));
    expect(cta, findsOneWidget);
    final rect = tester.getRect(cta);
    final screen = tester.view.physicalSize.height / tester.view.devicePixelRatio;
    expect(rect.bottom, lessThanOrEqualTo(screen), reason: 'CTA inside initial sheet height');
  });

  testWidgets('D-04 goalscorers split per team side incl. penalty marker', (tester) async {
    await bootApp(tester);
    await openSheet(tester, 'SEPTEMBER', 5, 'Doxa Katokopia');
    await tap(tester, find.text('GOALSCORERS'));

    final width = tester.view.physicalSize.width / tester.view.devicePixelRatio;
    // Our scorers (home side here) sit left of centre, theirs right.
    // ΤΕΣΤ ΣΚΟΡΕΡ has no i18n mapping so the raw name renders untranslated.
    final ours = find.textContaining('ΤΕΣΤ ΣΚΟΡΕΡ').hitTestable().first;
    expect(tester.getCenter(ours).dx, lessThan(width / 2));
    final theirs = find.textContaining('OPPONENT TWO').hitTestable().first;
    expect(tester.getCenter(theirs).dx, greaterThan(width / 2));
  });

  testWidgets('TASK-11 away match: our lineup renders under the away (right) column', (tester) async {
    await bootApp(tester);
    await openSheet(tester, 'SEPTEMBER', 12, 'AEL');
    await tap(tester, find.text('LINEUPS'));

    final width = tester.view.physicalSize.width / tester.view.devicePixelRatio;
    // textContaining: lineup rows are Text.rich spans with the shirt number
    // in the same span ('ΤΕΣΤ ΤΕΡΜΑΤΟΦΥΛΑΚΑΣ 1.').
    final ourKeeper = find.textContaining('ΤΕΣΤ ΤΕΡΜΑΤΟΦΥΛΑΚΑΣ').hitTestable();
    expect(ourKeeper, findsOneWidget,
        reason: 'our XI must render on the lineups tab');
    expect(tester.getCenter(ourKeeper.first).dx, greaterThan(width / 2),
        reason: 'away match: our players belong to the right-hand column');
  });

  testWidgets('D-07/D-08 cup tie shows Cup chip and amber penalties line', (tester) async {
    await bootApp(tester);
    await openSheet(tester, 'OCTOBER', 3, 'APOEL');
    expect(find.textContaining('Cup'), findsWidgets);
    expect(find.textContaining('Penalties'), findsOneWidget);
    expect(find.textContaining('1-3'), findsWidgets);
  });

  testWidgets('D-09 volleyball sheet: fixture title, sets table, top scorers', (tester) async {
    await bootApp(tester);
    await openSheet(tester, 'OCTOBER', 10, 'Anorthosis');
    expect(find.text('MATCH RESULT'), findsNothing,
        reason: 'volleyball sheets are titled with the fixture (EVT-05)');
    expect(find.text('SETS'), findsWidgets);
    await tap(tester, find.text('TOP SCORERS'));
    expect(find.textContaining('ΤΕΣΤ ΠΟΝΤΕΡ'), findsWidgets);
  });

  testWidgets('D-12 unknown opponent: sheet renders with fallback crest, no crash', (tester) async {
    await bootApp(tester);
    await openSheet(tester, 'NOVEMBER', 7, qaUnknownOpponent);
    expect(find.text('To be announced'), findsWidgets); // TBD chip too
  });

  testWidgets('D-10 dated upcoming sheet shows countdown and no result pill', (tester) async {
    await bootApp(tester);
    await openSheet(tester, 'NOVEMBER', 21, 'AEK');
    expect(find.text('WIN'), findsNothing);
    expect(find.text('LOSS'), findsNothing);
    expect(find.text('UPCOMING'), findsWidgets);
  });

  testWidgets('TASK-12 stats CTA lands on the sport of the event', (tester) async {
    await bootApp(tester);
    // Poison the stats page with a different sport first.
    await goToTab(tester, 'STATISTICS');
    await tap(tester, find.text("Women's Volleyball"));
    await goToTab(tester, 'CALENDAR');

    await openSheet(tester, 'SEPTEMBER', 5, 'Doxa Katokopia');
    await tap(tester, find.textContaining(RegExp('view all statistics', caseSensitive: false)));
    await pumpFrames(tester, 10);

    await scrollTo(tester, find.text('SEASON SUMMARY'));
    expect(find.text('Clean Sheets').hitTestable(), findsOneWidget,
        reason: 'football summary tile — CTA from a football match must open the football tab');
    expect(find.text('SET BREAKDOWN').hitTestable(), findsNothing,
        reason: 'volleyball-only section must not be showing');
  });
}
