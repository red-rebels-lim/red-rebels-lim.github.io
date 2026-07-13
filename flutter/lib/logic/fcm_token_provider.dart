import 'package:firebase_messaging/firebase_messaging.dart';

import 'push_registration.dart';

/// [PushTokenProvider] backed by Firebase Cloud Messaging.
///
/// Every call is guarded: when Firebase failed to initialize (emulator
/// without Play Services, stripped-down builds, ...) the provider degrades to
/// null/false/empty instead of crashing — push simply stays unavailable.
class FcmTokenProvider implements PushTokenProvider {
  @override
  Future<bool> requestPermission() async {
    try {
      final settings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      return settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<String?> getToken() async {
    try {
      return await FirebaseMessaging.instance.getToken();
    } catch (_) {
      return null;
    }
  }

  @override
  Stream<String> get onTokenRefresh {
    try {
      // handleError keeps a mid-stream FCM failure from surfacing as an
      // unhandled exception in the app-level listener.
      return FirebaseMessaging.instance.onTokenRefresh.handleError((_) {});
    } catch (_) {
      return const Stream<String>.empty();
    }
  }
}
