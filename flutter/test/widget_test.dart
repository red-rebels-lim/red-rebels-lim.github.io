import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:red_rebels_calendar/data/events_repository.dart';
import 'package:red_rebels_calendar/i18n/i18n.dart';
import 'package:red_rebels_calendar/main.dart';
import 'package:red_rebels_calendar/state/app_state.dart';

void main() {
  late EventsRepository events;
  late I18n i18n;
  late SharedPreferences prefs;

  // Asset loading must happen outside testWidgets' fake-async zone or the
  // rootBundle futures never complete and the test times out.
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
    events = await EventsRepository.load();
    i18n = await I18n.load();
    prefs = await SharedPreferences.getInstance();
  });

  testWidgets('App boots and shows the three navigation tabs', (tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AppState(events: events, i18n: i18n, prefs: prefs),
        child: const RedRebelsApp(),
      ),
    );
    await tester.pump();

    expect(find.text('Calendar'), findsWidgets);
    expect(find.text('Statistics'), findsWidgets);
    expect(find.text('Settings'), findsWidgets);

    // Unmount so the countdown banner's periodic timer is disposed before
    // the pending-timer check runs.
    await tester.pumpWidget(const SizedBox());
  });

  test('events data parses and stats have matches', () {
    expect(events.allEvents(), isNotEmpty);
    expect(events.byMonth.keys, contains('september'));
  });
}
