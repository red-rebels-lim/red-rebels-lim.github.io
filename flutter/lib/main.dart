import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'data/events_repository.dart';
import 'i18n/i18n.dart';
import 'pages/calendar_page.dart';
import 'pages/settings_page.dart';
import 'pages/squad_page.dart';
import 'pages/stats_page.dart';
import 'state/app_state.dart';
import 'theme.dart';
import 'widgets/app_background.dart';
import 'widgets/bottom_nav.dart';
import 'widgets/mobile_header.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final events = await EventsRepository.load();
  final i18n = await I18n.load();
  final prefs = await SharedPreferences.getInstance();
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppState(events: events, i18n: i18n, prefs: prefs),
      child: const RedRebelsApp(),
    ),
  );
}

class RedRebelsApp extends StatelessWidget {
  const RedRebelsApp({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return MaterialApp(
      title: 'Red Rebels',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(Brightness.light),
      darkTheme: buildTheme(Brightness.dark),
      themeMode: app.themeMode,
      home: const HomeShell(),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        const AppBackground(),
        Scaffold(
          backgroundColor: Colors.transparent,
          body: SafeArea(
            bottom: false,
            child: Column(
              children: [
                MobileHeader(showCalendarActions: _index == 0),
                Expanded(
                  child: IndexedStack(
                    index: _index,
                    children: const [
                      CalendarPage(),
                      StatsPage(),
                      SquadPage(),
                      SettingsPage(),
                    ],
                  ),
                ),
              ],
            ),
          ),
          bottomNavigationBar: BottomNav(
            index: _index,
            onSelect: (i) => setState(() => _index = i),
          ),
        ),
      ],
    );
  }
}
