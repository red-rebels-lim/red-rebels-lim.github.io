import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'data/events_repository.dart';
import 'data/parse_client.dart';
import 'data/players_repository.dart';
import 'firebase_options.dart';
import 'i18n/i18n.dart';
import 'logic/fcm_token_provider.dart';
import 'logic/push_registration.dart';
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

  // The app must boot without Firebase (emulator without Play Services,
  // stripped builds) — push just stays unavailable via FcmTokenProvider's
  // internal guards.
  var firebaseReady = false;
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    firebaseReady = true;
  } catch (_) {
    // Boot on: FcmTokenProvider degrades to null/false on every call.
  }

  final events = await EventsRepository.load();
  final players = await PlayersRepository.load();
  final i18n = await I18n.load();
  final prefs = await SharedPreferences.getInstance();
  final tokenProvider = FcmTokenProvider();
  final push = PushRegistration(
    // Disabled (silent no-op) when the build has no Back4App credentials.
    parse: ParseClient(),
    prefs: prefs,
    tokenProvider: tokenProvider,
  );
  runApp(
    ChangeNotifierProvider(
      create: (_) {
        final app = AppState(
          events: events,
          players: players,
          i18n: i18n,
          prefs: prefs,
          syncEnabled: true,
          push: push,
        );
        _wirePushHandlers(app, push, tokenProvider, firebaseReady: firebaseReady);
        return app;
      },
      child: const RedRebelsApp(),
    ),
  );
}

/// Keeps the Back4App row in step with FCM token rotation and routes
/// notification taps to the calendar tab. Never throws.
void _wirePushHandlers(
  AppState app,
  PushRegistration push,
  FcmTokenProvider tokenProvider, {
  required bool firebaseReady,
}) {
  // Safe even without Firebase — the provider hands back an empty stream.
  tokenProvider.onTokenRefresh.listen((token) {
    if (push.registered) push.register(token);
  });

  if (!firebaseReady) return;
  try {
    // Tapping a notification lands the user on the calendar tab; when the
    // payload carries an eventKey the calendar opens that match's details.
    void handleTap(RemoteMessage message) {
      final key = message.data['eventKey'];
      if (key is String && key.isNotEmpty) app.pendingEventKey = key;
      app.goToTab(0);
    }

    FirebaseMessaging.onMessageOpenedApp.listen(handleTap);
    FirebaseMessaging.instance.getInitialMessage().then((message) {
      if (message != null) handleTap(message);
    }).catchError((_) {});
  } catch (_) {
    // Messaging unavailable — notification taps just open the app normally.
  }
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

class _HomeShellState extends State<HomeShell> with WidgetsBindingObserver {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Let other widgets (e.g. the event details sheet) switch tabs.
    final app = context.read<AppState>();
    app.tabNavigator = (i) {
      if (mounted) setState(() => _index = i);
    };
    // Refresh fixtures from the live feed once the first frame is up
    // (fire-and-forget; failures just flip the stale indicator).
    WidgetsBinding.instance.addPostFrameCallback((_) => app.syncEvents());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Refresh on foreground, at most once per AppState.minSyncInterval.
      context.read<AppState>().syncEvents(throttle: true);
    }
  }

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
