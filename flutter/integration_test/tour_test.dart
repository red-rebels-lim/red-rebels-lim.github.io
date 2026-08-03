/// B-* — First-run onboarding tour (TEST-PLAN §6.B).
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'qa_helpers.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('B-01/B-02 tour shows 7 steps and finishing persists dismissal', (tester) async {
    final app = await bootApp(tester, prefs: const {'language': 'en', 'themeMode': 'light'});
    await pumpFrames(tester, 10);

    expect(find.text('1 / 7'), findsOneWidget, reason: 'tour must open on fresh install');
    expect(find.text('Swipe to Navigate'), findsOneWidget);
    expect(find.text('Skip'), findsOneWidget);

    for (var step = 2; step <= 7; step++) {
      await tap(tester, find.text(step == 2 ? 'Next' : 'Next'));
      expect(find.text('$step / 7'), findsOneWidget, reason: 'step $step visible');
    }
    expect(find.text('Export Calendar'), findsWidgets); // step 7 title
    expect(find.text('Got it!'), findsOneWidget);
    await tap(tester, find.text('Got it!'));

    expect(find.text('7 / 7'), findsNothing);
    expect(app.introSeen, isTrue, reason: 'finish must persist intro_seen_v1');
  });

  testWidgets('B-05 skipping the tour persists dismissal', (tester) async {
    final app = await bootApp(tester, prefs: const {'language': 'en', 'themeMode': 'light'});
    await pumpFrames(tester, 10);

    expect(find.text('1 / 7'), findsOneWidget);
    await tap(tester, find.text('Skip'));
    expect(find.text('1 / 7'), findsNothing);
    expect(app.introSeen, isTrue);
  });

  testWidgets('B-03 tour renders in Greek when the app language is Greek', (tester) async {
    await bootApp(tester, prefs: const {'language': 'el', 'themeMode': 'light'});
    await pumpFrames(tester, 10);

    expect(find.text('1 / 7'), findsOneWidget);
    expect(find.text('Σύρετε για Πλοήγηση'), findsOneWidget);
    expect(find.text('Παράλειψη'), findsOneWidget);
    await tap(tester, find.text('Παράλειψη'));
  });

  testWidgets('B-04 tour does not reappear once dismissed', (tester) async {
    await bootApp(tester); // baseline prefs already carry intro_seen_v1
    await pumpFrames(tester, 10);
    expect(find.text('1 / 7'), findsNothing);
    expect(find.byType(BottomNavigationBar), findsNothing); // sanity: custom nav, no tour
  });
}
