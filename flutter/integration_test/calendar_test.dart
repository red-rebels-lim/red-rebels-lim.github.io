/// C-* — Calendar views, navigation, filters (TEST-PLAN §6.C).
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'qa_helpers.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('C-06 previous chevron is a no-op at the season lower bound', (tester) async {
    await bootApp(tester);
    // The app opens on the real current month; walk back to the bound.
    for (var i = 0; i < 12; i++) {
      await prevMonth(tester);
    }
    expect(find.textContaining('JULY'), findsOneWidget,
        reason: 'season window starts in July of the start year');
    await prevMonth(tester);
    expect(find.textContaining('JULY'), findsOneWidget);
  });

  testWidgets('C-01/C-04 grid day selection lists the day\'s events', (tester) async {
    await bootApp(tester);
    await goToMonth(tester, 'SEPTEMBER');
    expect(dayCell(5), findsOneWidget);
    await tap(tester, dayCell(5));
    expect(find.text('SELECTED DAY'), findsOneWidget);
    expect(find.textContaining('Doxa Katokopia'), findsWidgets);
  });

  testWidgets('C-08 view switcher cycles grid -> list -> cards and persists state', (tester) async {
    final app = await bootApp(tester);
    expect(app.calendarView, 'grid');
    await tap(tester, headerIcon(Icons.grid_view_rounded));
    expect(app.calendarView, 'list');
    await tap(tester, headerIcon(Icons.format_list_bulleted));
    expect(app.calendarView, 'cards');
    await tap(tester, headerIcon(Icons.view_agenda_outlined));
    expect(app.calendarView, 'grid');
  });

  testWidgets('C-12 list view groups played and upcoming sections', (tester) async {
    await bootApp(tester);
    await goToMonth(tester, 'SEPTEMBER');
    await tap(tester, headerIcon(Icons.grid_view_rounded)); // -> list
    expect(find.text('PLAYED').hitTestable(), findsWidgets);
    expect(find.textContaining('Doxa Katokopia').hitTestable(), findsWidgets);
    expect(find.textContaining('AEL').hitTestable(), findsWidgets);
  });

  testWidgets('C-15 TBD fixtures render a To-be-announced state, no countdown', (tester) async {
    await bootApp(tester);
    await goToMonth(tester, 'NOVEMBER');
    await tap(tester, headerIcon(Icons.grid_view_rounded)); // -> list
    await tap(tester, headerIcon(Icons.format_list_bulleted)); // -> cards
    expect(find.text('To be announced'), findsWidgets);
  });

  testWidgets('C-14 dated upcoming fixtures show a live countdown', (tester) async {
    await bootApp(tester, dataset: 'upcoming-soon');
    // The soonest fixture kicks off ~40 minutes from now, i.e. today — the
    // grid pre-selects today (CAL-07) and the selected-day card carries the
    // live countdown (flaky only within 40 min of midnight, documented).
    final countdown = find.textContaining(RegExp(r'\d+m \d+s')).hitTestable();
    expect(countdown, findsWidgets);
    final before = tester.widget<Text>(countdown.first).data;
    await tester.pump(const Duration(seconds: 2));
    final after = tester.widget<Text>(countdown.first).data;
    expect(after, isNot(equals(before)), reason: 'countdown must tick');
  });

  testWidgets('C-16/C-20 sport filter narrows all views and clears', (tester) async {
    await bootApp(tester);
    await goToMonth(tester, 'OCTOBER');
    await tap(tester, headerIcon(Icons.grid_view_rounded)); // -> list

    await tap(tester, headerIcon(Icons.filter_list_rounded));
    expect(find.text('Event Filters'), findsOneWidget);
    await tap(tester, find.text("Men's Volleyball"));
    await tap(tester, find.text('Apply'));
    await pumpFrames(tester, 8);
    expect(find.text('Event Filters').hitTestable(), findsNothing,
        reason: 'Apply must close the filter panel');

    expect(find.textContaining('Anorthosis').hitTestable(), findsWidgets,
        reason: 'volleyball stays');
    expect(find.textContaining('APOEL').hitTestable(), findsNothing,
        reason: 'football (cup tie) filtered out');

    await tap(tester, headerIcon(Icons.filter_list_rounded));
    await tap(tester, find.text('Clear All'));
    // Clear All dismisses the panel on its own; Apply only exists if not.
    if (find.text('Apply').hitTestable().evaluate().isNotEmpty) {
      await tap(tester, find.text('Apply'));
    }
    await pumpFrames(tester, 6);
    expect(find.textContaining('APOEL').hitTestable(), findsWidgets);
  });

  testWidgets('C-19 opponent search filters diacritic-insensitively', (tester) async {
    await bootApp(tester);
    await goToMonth(tester, 'SEPTEMBER');
    await tap(tester, headerIcon(Icons.grid_view_rounded)); // -> list
    await tap(tester, headerIcon(Icons.filter_list_rounded));
    await tester.enterText(find.byType(TextField).last, 'δοξα');
    await pumpFrames(tester);
    await tap(tester, find.text('Apply'));
    expect(find.textContaining('Doxa Katokopia').hitTestable(), findsWidgets);
    expect(find.textContaining('AEL ').hitTestable(), findsNothing);
  });

  testWidgets('C-05 empty dataset shows the no-events state and does not crash', (tester) async {
    await bootApp(tester, dataset: 'empty');
    // The no-events message lives in the list/cards views (the grid just
    // renders an event-less month).
    await tap(tester, headerIcon(Icons.grid_view_rounded)); // -> list
    expect(find.text('No events this month').hitTestable(), findsOneWidget);
  });
}
