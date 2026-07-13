import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';

import '../logic/push_registration.dart';
import '../state/app_state.dart';
import '../theme.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final colors = AppColors.of(context);

    return Container(
      margin: const EdgeInsets.fromLTRB(8, 8, 8, 0),
      decoration: BoxDecoration(
        color: colors.surfacePanel,
        borderRadius: BorderRadius.circular(16),
      ),
      clipBehavior: Clip.antiAlias,
      child: ListView(
        padding: const EdgeInsets.symmetric(vertical: 8),
        children: [
          _SectionHeader(app.t('settings.notifications')),
          const _NotificationsSection(),
          const Divider(),
          _SectionHeader(app.t('settings.display')),
          ListTile(
            leading: const Icon(Icons.language),
            title: Text(app.t('settings.language')),
            trailing: SegmentedButton<String>(
              segments: [
                ButtonSegment(value: 'en', label: Text(app.t('settings.languageEnglish'))),
                ButtonSegment(value: 'el', label: Text(app.t('settings.languageGreek'))),
              ],
              selected: {app.language},
              onSelectionChanged: (s) => app.setLanguage(s.first),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.dark_mode_outlined),
            title: Text(app.t('settings.darkTheme')),
            trailing: SegmentedButton<ThemeMode>(
              segments: const [
                ButtonSegment(value: ThemeMode.system, icon: Icon(Icons.brightness_auto)),
                ButtonSegment(value: ThemeMode.light, icon: Icon(Icons.light_mode)),
                ButtonSegment(value: ThemeMode.dark, icon: Icon(Icons.dark_mode)),
              ],
              selected: {app.themeMode},
              onSelectionChanged: (s) => app.setThemeMode(s.first),
            ),
          ),
          const Divider(),
          _SectionHeader(app.t('settings.about')),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: Text(app.t('settings.appVersion')),
            trailing: FutureBuilder<PackageInfo>(
              future: PackageInfo.fromPlatform(),
              builder: (context, snapshot) => Text(snapshot.data?.version ?? ''),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              '❤️ ${app.t('settings.madeWith')}',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }
}

/// Web parity (SettingsPage.tsx NOTIFICATIONS section): a Channels group with
/// the push channel row, then — while registered — the shared preferences:
/// Reminder Times chips, Sports toggles and Alert Types toggles.
class _NotificationsSection extends StatelessWidget {
  const _NotificationsSection();

  /// Shows the shared error copy near the bottom of the screen.
  static void _showError(BuildContext context, AppState app) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(app.t('settings.pushError'))));
  }

  Future<void> _togglePush(BuildContext context, AppState app, bool on) async {
    if (on) {
      final ok = await app.enablePush();
      if (!ok && context.mounted) _showError(context, app);
    } else {
      await app.disablePush();
    }
  }

  Future<void> _update(BuildContext context, AppState app, NotifPrefs next) async {
    final ok = await app.updateNotifPrefs(next);
    if (!ok && context.mounted) _showError(context, app);
  }

  void _toggleReminderHour(BuildContext context, AppState app, int hour) {
    final current = app.notifPrefs.reminderHours;
    final next = current.contains(hour)
        ? current.where((h) => h != hour).toList()
        : ([...current, hour]..sort((a, b) => b - a));
    if (next.isEmpty) return; // must keep at least one (web parity)
    _update(context, app, app.notifPrefs.copyWith(reminderHours: next));
  }

  void _toggleSport(BuildContext context, AppState app, String sport) {
    final current = app.notifPrefs.enabledSports;
    final next = current.contains(sport)
        ? current.where((s) => s != sport).toList()
        : [...current, sport];
    if (next.isEmpty) return; // must keep at least one (web parity)
    _update(context, app, app.notifPrefs.copyWith(enabledSports: next));
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    final prefs = app.notifPrefs;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _SubLabel(app.t('settings.channels')),
        // ── Push channel row ──
        ListTile(
          leading: Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: accentRed.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.notifications_outlined, size: 18, color: accentRed),
          ),
          title: Text(app.t('settings.notifications')),
          subtitle: Text(
            app.t('settings.matchReminders'),
            style: TextStyle(fontSize: 12, color: colors.mutedForeground),
          ),
          trailing: app.pushBusy
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: accentRed),
                )
              : Switch(
                  value: app.pushRegistered,
                  onChanged: app.pushAvailable
                      ? (on) => _togglePush(context, app, on)
                      : null,
                ),
        ),
        // ── Shared preferences (visible while registered, web parity) ──
        if (app.pushRegistered) ...[
          _SubLabel(app.t('settings.reminderTimes')),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final hour in const [24, 12, 2, 1])
                  _ReminderChip(
                    label: '${hour}h',
                    active: prefs.reminderHours.contains(hour),
                    onTap: () => _toggleReminderHour(context, app, hour),
                  ),
              ],
            ),
          ),
          _SubLabel(app.t('settings.sports')),
          for (final (sport, labelKey) in const [
            ('football-men', 'sports.footballMen'),
            ('volleyball-men', 'sports.volleyballMen'),
            ('volleyball-women', 'sports.volleyballWomen'),
          ])
            _PrefSwitchRow(
              label: app.t(labelKey),
              value: prefs.enabledSports.contains(sport),
              onChanged: (_) => _toggleSport(context, app, sport),
            ),
          _SubLabel(app.t('settings.alertTypes')),
          _PrefSwitchRow(
            label: app.t('settings.newEvents'),
            value: prefs.notifyNewEvents,
            onChanged: (on) =>
                _update(context, app, prefs.copyWith(notifyNewEvents: on)),
          ),
          _PrefSwitchRow(
            label: app.t('settings.timeChanges'),
            value: prefs.notifyTimeChanges,
            onChanged: (on) =>
                _update(context, app, prefs.copyWith(notifyTimeChanges: on)),
          ),
          _PrefSwitchRow(
            label: app.t('settings.scoreUpdates'),
            value: prefs.notifyScoreUpdates,
            onChanged: (on) =>
                _update(context, app, prefs.copyWith(notifyScoreUpdates: on)),
          ),
        ],
      ],
    );
  }
}

/// Small uppercase group label inside a section (web `text-xs font-bold
/// uppercase tracking-wider`).
class _SubLabel extends StatelessWidget {
  const _SubLabel(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Text(
        title.toUpperCase(),
        style: condensed(size: 12, color: AppColors.of(context).mutedForeground, letterSpacing: 1.2),
      ),
    );
  }
}

/// Pill toggle for a reminder tier (web ReminderChip: active = brand red with
/// white text, inactive = muted).
class _ReminderChip extends StatelessWidget {
  const _ReminderChip({required this.label, required this.active, required this.onTap});

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Material(
      color: active ? brandRed : colors.muted,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: active ? Colors.white : colors.mutedForeground,
            ),
          ),
        ),
      ),
    );
  }
}

/// Compact label + trailing switch row for the shared notification prefs.
class _PrefSwitchRow extends StatelessWidget {
  const _PrefSwitchRow({required this.label, required this.value, required this.onChanged});

  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      visualDensity: const VisualDensity(vertical: -2),
      title: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
      trailing: Switch(value: value, onChanged: onChanged),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(
        title.toUpperCase(),
        style: condensed(size: 13, color: AppColors.of(context).mutedForeground, letterSpacing: 1.5),
      ),
    );
  }
}
