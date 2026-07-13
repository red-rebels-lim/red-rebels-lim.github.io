import 'package:shared_preferences/shared_preferences.dart';

import '../data/parse_client.dart';

/// Source of the device push token and notification permission.
///
/// firebase_messaging will implement this in a follow-up once the Firebase
/// console configs exist — nothing in this layer depends on Firebase.
abstract class PushTokenProvider {
  /// The current device token, or null when unavailable (no permission,
  /// no Play Services, ...).
  Future<String?> getToken();

  /// Emits whenever the platform rotates the device token.
  Stream<String> get onTokenRefresh;

  /// Asks the OS for notification permission. True when granted.
  Future<bool> requestPermission();
}

/// Notification preferences for one device.
///
/// Field names and defaults mirror the web app's NotifPreference rows exactly
/// (app/src/lib/preferences.ts DEFAULTS) so the existing reminders cron
/// honors app users the same way it honors web subscribers (FR-NOTIF-2).
class NotifPrefs {
  const NotifPrefs({
    this.notifyNewEvents = true,
    this.notifyTimeChanges = true,
    this.notifyScoreUpdates = true,
    this.reminderHours = const [24, 2],
    this.enabledSports = const ['football-men', 'volleyball-men', 'volleyball-women'],
    this.disabled = false,
  });

  factory NotifPrefs.fromJson(Map<String, dynamic> json) {
    const defaults = NotifPrefs();
    return NotifPrefs(
      notifyNewEvents: json['notifyNewEvents'] as bool? ?? defaults.notifyNewEvents,
      notifyTimeChanges: json['notifyTimeChanges'] as bool? ?? defaults.notifyTimeChanges,
      notifyScoreUpdates: json['notifyScoreUpdates'] as bool? ?? defaults.notifyScoreUpdates,
      reminderHours:
          (json['reminderHours'] as List?)?.cast<int>() ?? defaults.reminderHours,
      enabledSports:
          (json['enabledSports'] as List?)?.cast<String>() ?? defaults.enabledSports,
      disabled: json['disabled'] as bool? ?? defaults.disabled,
    );
  }

  final bool notifyNewEvents;
  final bool notifyTimeChanges;
  final bool notifyScoreUpdates;
  final List<int> reminderHours;
  final List<String> enabledSports;
  final bool disabled;

  Map<String, dynamic> toJson() => {
        'notifyNewEvents': notifyNewEvents,
        'notifyTimeChanges': notifyTimeChanges,
        'notifyScoreUpdates': notifyScoreUpdates,
        'reminderHours': reminderHours,
        'enabledSports': enabledSports,
        'disabled': disabled,
      };

  NotifPrefs copyWith({
    bool? notifyNewEvents,
    bool? notifyTimeChanges,
    bool? notifyScoreUpdates,
    List<int>? reminderHours,
    List<String>? enabledSports,
    bool? disabled,
  }) =>
      NotifPrefs(
        notifyNewEvents: notifyNewEvents ?? this.notifyNewEvents,
        notifyTimeChanges: notifyTimeChanges ?? this.notifyTimeChanges,
        notifyScoreUpdates: notifyScoreUpdates ?? this.notifyScoreUpdates,
        reminderHours: reminderHours ?? this.reminderHours,
        enabledSports: enabledSports ?? this.enabledSports,
        disabled: disabled ?? this.disabled,
      );
}

/// Orchestrates the Back4App rows behind push notifications.
///
/// Web parity (app/src/lib/push.ts): one `PushSubscription` row per device —
/// the app's rows carry `{platform: 'fcm', token}` instead of the web's
/// endpoint/p256dh/auth — plus one `NotifPreference` row pointing at it. The
/// objectIds are persisted locally (`push_subscription_id`, same key the web
/// uses in localStorage) so registration survives restarts.
///
/// Every method is a silent no-op when [available] is false (build without
/// Back4App credentials) and never throws.
class PushRegistration {
  PushRegistration({required this.parse, required this._prefs, this.tokenProvider});

  /// Local storage key for the PushSubscription objectId (web parity).
  static const subscriptionIdKey = 'push_subscription_id';

  /// Local storage key for the NotifPreference objectId.
  static const preferenceIdKey = 'notif_preference_id';

  static const _subscriptionClass = 'PushSubscription';
  static const _preferenceClass = 'NotifPreference';

  final ParseClient parse;
  final SharedPreferences _prefs;

  /// Device-token source (FCM in production, fakes in tests). Null when the
  /// platform layer was never wired — enabling push is then impossible.
  final PushTokenProvider? tokenProvider;

  /// False when the build carries no Back4App credentials — the push layer
  /// is disabled and register/unregister/updatePreferences all no-op.
  bool get available => parse.available;

  /// objectId of this device's PushSubscription row, when registered.
  String? get subscriptionId => _prefs.getString(subscriptionIdKey);

  /// objectId of this device's NotifPreference row, when created.
  String? get preferenceId => _prefs.getString(preferenceIdKey);

  /// True when this device has a registered subscription.
  bool get registered => subscriptionId != null;

  static Map<String, dynamic> _pointer(String subscriptionId) => {
        '__type': 'Pointer',
        'className': _subscriptionClass,
        'objectId': subscriptionId,
      };

  /// Registers [token]: updates the existing PushSubscription row when one is
  /// known (token rotation), otherwise creates a fresh PushSubscription +
  /// default NotifPreference pair, persisting both objectIds.
  ///
  /// Returns true when the device ends up registered with a preference row.
  Future<bool> register(String token) async {
    if (!available) return false;
    final fields = {'platform': 'fcm', 'token': token};

    final existing = subscriptionId;
    if (existing != null) {
      if (await parse.updateObject(_subscriptionClass, existing, fields)) {
        return _ensurePreference(existing);
      }
      // Row is gone (e.g. the cron pruned a dead token) — start over.
      await _prefs.remove(subscriptionIdKey);
      await _prefs.remove(preferenceIdKey);
    }

    final subId = await parse.createObject(_subscriptionClass, fields);
    if (subId == null) return false;
    await _prefs.setString(subscriptionIdKey, subId);
    return _ensurePreference(subId);
  }

  /// Creates the default NotifPreference row when this device has none yet
  /// (mirrors the web's createDefaultPreferences).
  Future<bool> _ensurePreference(String subscriptionId) async {
    if (preferenceId != null) return true;
    final prefId = await parse.createObject(_preferenceClass, {
      'subscription': _pointer(subscriptionId),
      ...const NotifPrefs().toJson(),
    });
    if (prefId == null) return false;
    await _prefs.setString(preferenceIdKey, prefId);
    return true;
  }

  /// Deletes both rows (best-effort, like the web — the reminders cron prunes
  /// dead subscriptions anyway) and always clears the stored ids so the UI
  /// reflects the unsubscribed state.
  Future<void> unregister() async {
    if (!available) return;
    final prefId = preferenceId;
    if (prefId != null) await parse.deleteObject(_preferenceClass, prefId);
    final subId = subscriptionId;
    if (subId != null) await parse.deleteObject(_subscriptionClass, subId);
    await _prefs.remove(subscriptionIdKey);
    await _prefs.remove(preferenceIdKey);
  }

  /// Writes [prefs] to this device's NotifPreference row. Returns true when
  /// the update was accepted; false when disabled, not registered, or the
  /// request failed.
  Future<bool> updatePreferences(NotifPrefs prefs) async {
    if (!available) return false;
    final prefId = preferenceId;
    if (prefId == null) return false;
    return parse.updateObject(_preferenceClass, prefId, prefs.toJson());
  }
}
