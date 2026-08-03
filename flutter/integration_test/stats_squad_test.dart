/// E-*/F-* — Stats page and Squad page (TEST-PLAN §6.E/§6.F).
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'qa_helpers.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('E-01/E-02/E-03 football tab: pills, section order, summary tiles', (tester) async {
    await bootApp(tester);
    await goToTab(tester, 'STATISTICS');

    for (final pill in ["Men's Football", "Men's Volleyball", "Women's Volleyball"]) {
      expect(find.text(pill), findsOneWidget, reason: 'sport pill "$pill" untruncated');
    }
    expect(find.text('SEASON SUMMARY'), findsOneWidget);
    for (final tile in ['Matches', 'Wins', 'Draws', 'Losses', 'Points', 'Clean Sheets']) {
      expect(find.text(tile), findsWidgets, reason: 'summary tile $tile');
    }
    // Web parity: the app must NOT add W% / Difference tiles (STA-03/08).
    expect(find.text('W%'), findsNothing);
    expect(find.text('Difference'), findsNothing);
    expect(find.text('Records'), findsNothing, reason: 'STA-08: web renders no Records section');
  });

  testWidgets('E-05/E-06/E-07 form, split and head-to-head sections render data', (tester) async {
    await bootApp(tester);
    await goToTab(tester, 'STATISTICS');
    expect(find.text('Last 5 Matches').hitTestable(), findsOneWidget, reason: 'STA-09 subtitle');
    await scrollTo(tester, find.text('PERFORMANCE SPLIT'));
    await scrollTo(tester, find.text('HEAD-TO-HEAD (TOP 10)'));
    // Translation-agnostic: the opponent renders as ΑΕΛ or AEL depending on
    // the i18n mapping's coverage.
    expect(find.textContaining(RegExp('ΑΕΛ|AEL')).hitTestable(), findsWidgets,
        reason: 'league opponent in H2H');
  });

  testWidgets('E-04/E-08/E-09 volleyball tab: hero tiles, set breakdown, top scorers', (tester) async {
    await bootApp(tester);
    await goToTab(tester, 'STATISTICS');
    await tap(tester, find.text("Men's Volleyball"));

    expect(find.text('Win Rate'), findsOneWidget);
    expect(find.text('SET BREAKDOWN'), findsOneWidget);
    expect(find.text('Sets Won'), findsOneWidget);
    for (final scoreline in ['3-0', '3-1', '3-2']) {
      expect(find.text(scoreline), findsWidgets, reason: 'win scoreline tile $scoreline');
    }
    await scrollTo(tester, find.text('TOP SCORERS'));
    expect(find.textContaining('ΤΕΣΤ ΠΟΝΤΕΡ').hitTestable(), findsWidgets);
  });

  testWidgets('F-01 squad roster grouped by position with M/G/C columns', (tester) async {
    await bootApp(tester);
    await goToTab(tester, 'SQUAD');
    expect(find.textContaining('GOALKEEPERS'), findsOneWidget);
    expect(find.textContaining('DEFENDERS'), findsOneWidget);
    expect(find.text('M'), findsWidgets);
    expect(find.text('G'), findsWidgets);
    expect(find.text('C'), findsWidgets);
  });

  testWidgets('F-03 player sheets: empty panel for no-appearance player, tiles + log for a scorer', (tester) async {
    await bootApp(tester);
    await goToTab(tester, 'SQUAD');

    // With the synthetic dataset the #1 keeper has no appearances — the
    // sheet must show the empty panel (and still carry the close X).
    await tap(tester, find.ancestor(of: find.text('#1'), matching: find.byType(InkWell)));
    await pumpFrames(tester, 10);
    expect(find.text('No appearances yet this season').hitTestable(), findsOneWidget);
    expect(find.byIcon(Icons.close).hitTestable(), findsOneWidget, reason: 'SQD-03 close X');
    await tap(tester, find.byIcon(Icons.close));

    // Panagiotis Louka scores twice in the fixture (one penalty) — his
    // sheet has the stat tiles and the match log.
    await scrollTo(tester, find.textContaining('LOUKA'));
    await tap(tester, find.textContaining('LOUKA'));
    await pumpFrames(tester, 10);
    expect(find.text('PLAYED').hitTestable(), findsOneWidget);
    expect(find.text('GOALS').hitTestable(), findsOneWidget);
    expect(find.text('CARDS').hitTestable(), findsOneWidget);
    expect(find.text('MATCH LOG').hitTestable(), findsOneWidget);
  });
}
