import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:home_widget/home_widget.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'data/events_repository.dart';
import 'data/parse_client.dart';
import 'data/players_repository.dart';
import 'firebase_options.dart';
import 'i18n/i18n.dart';
import 'logic/fcm_token_provider.dart';
import 'logic/home_widget_updater.dart';
import 'logic/push_registration.dart';
import 'pages/calendar_page.dart';
import 'pages/settings_page.dart';
import 'pages/squad_page.dart';
import 'pages/stats_page.dart';
import 'state/app_state.dart';
import 'theme.dart';
import 'widgets/app_background.dart';
import 'widgets/bottom_nav.dart';
import 'widgets/hud_frame.dart';
import 'widgets/onboarding_tour.dart';
import 'widgets/marquee.dart';
import 'widgets/mobile_header.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // The app must boot without Firebase (emulator without Play Services,
  // stripped builds) — push just stays unavailable via FcmTokenProvider's
  // internal guards. The timeout caps the ONLY unbounded await on the
  // startup path (QA FUN-01): a wedged Play Services must never hold the
  // first frame hostage — everything else pre-frame is local IO, and the
  // events/players sync is post-frame with its own 10s timeout.
  var firebaseReady = false;
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)
        .timeout(const Duration(seconds: 5));
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
        _wireWidgetClicks(app);
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

/// Routes home-screen-widget taps like notification taps: the calendar tab
/// opens and, when the widget carried an eventKey, that match's sheet.
/// Never throws (Phase 9 — the widget must not break app startup).
void _wireWidgetClicks(AppState app) {
  void handle(Uri? uri) {
    if (uri == null) return;
    final key = uri.queryParameters['eventKey'];
    if (key != null && key.isNotEmpty) app.pendingEventKey = key;
    app.goToTab(0);
  }

  try {
    HomeWidget.initiallyLaunchedFromHomeWidget().then(handle).catchError((_) {});
    HomeWidget.widgetClicked.listen(handle, onError: (_) {});
  } catch (_) {
    // Plugin unavailable — widget taps just open the app normally.
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
      theme: buildTheme(app.visualTheme, Brightness.light),
      darkTheme: buildTheme(app.visualTheme, Brightness.dark),
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
    // A notification deep link suppresses the tour for this launch — the
    // calendar is about to open that match's sheet. Captured here because
    // CalendarPage consumes the key during the first build.
    final deepLinkPending = app.pendingEventKey != null;
    // Refresh fixtures from the live feed once the first frame is up
    // (fire-and-forget; failures just flip the stale indicator).
    // Phase 9: keep the home-screen widget in step with the app's data.
    app.widgetRefresher = () => updateNextMatchWidget(app);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      updateNextMatchWidget(app); // cached snapshot first; sync refreshes it
      app.syncEvents();
      // First-run welcome tour — once ever (the flag is set on skip/finish).
      if (mounted && !app.introSeen && !deepLinkPending) {
        showOnboardingTour(context);
      }
    });
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
    // Web parity (QA GLB-01): the PWA keeps a red status bar with light icons
    // in every mode/theme — its `theme-color` meta is a hardcoded #E02520.
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
      child: Stack(
      fit: StackFit.expand,
      children: [
        const AppBackground(),
        Scaffold(
          backgroundColor: Colors.transparent,
          body: Column(
              children: [
                Container(height: MediaQuery.paddingOf(context).top, color: brandRed),
                MobileHeader(
                  showCalendarActions: _index == 0,
                  onBack: _index == 0 ? null : () => setState(() => _index = 0),
                ),
                // Brutalism-only ticker (renders nothing on other themes).
                const Marquee(),
                Expanded(
                  // Neon-only corner brackets (pass-through on other themes).
                  child: HudFrame(
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
                ),
              ],
          ),
          bottomNavigationBar: BottomNav(
            index: _index,
            onSelect: (i) => setState(() => _index = i),
          ),
        ),
      ],
      ),
    );
  }
}
