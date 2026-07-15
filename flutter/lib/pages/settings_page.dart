import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../logic/push_registration.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/web_toggle.dart';

/// Public repository, linked from the About section (SET-11).
const githubRepoUrl = 'https://github.com/red-rebels-lim/red-rebels-lim.github.io';

/// Bridge to url_launcher — injectable so widget tests can assert launches
/// without a real plugin behind them.
@visibleForTesting
Future<bool> Function(Uri url) openExternalUrl =
    (url) => launchUrl(url, mode: LaunchMode.externalApplication);

/// Picker option labels (web `themeLabels` — settings.theme* i18n keys).
String _themeLabel(AppState app, String theme) => switch (theme) {
      'brutalism' => app.t('settings.themeBrutalism', 'Brutalism'),
      'cinema' => app.t('settings.themeCinema', 'Cinema'),
      'neon' => app.t('settings.themeNeon', 'Neon HUD'),
      _ => app.t('settings.themeDefault', 'Default'),
    };

/// Settings page rebuilt on the web `SettingsPage.tsx` shell (QA SET-01):
/// chip-styled section labels + white cards with 40px icon tiles, sitting
/// directly on the page background (no frosted panel). Deliberate deviations
/// per the 2026-07-14 stakeholder decisions: a single native-push channel
/// (SET-02), no Telegram/Calendar-Sync channels (SET-03), the 3-way theme
/// control stays (SET-08); Sports Filter / Tools / Notification Preview
/// arrive with the functional-gaps batch (QA-21).
class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final dark = Theme.of(context).brightness == Brightness.dark;

    return ListView(
      padding: const EdgeInsets.only(bottom: 40),
      children: [
        _Section(
          title: app.t('settings.notifications'),
          child: const _NotificationsCard(),
        ),
        _Section(
          title: app.t('settings.visualTheme'),
          child: _RowTile(
            iconTile: _IconTile(
              icon: Icons.palette_outlined,
              background: accentRed.withValues(alpha: 0.1),
              color: accentRed,
            ),
            label: app.t('settings.visualTheme'),
            isLast: true,
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: BoxDecoration(
                color: dark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF1F5F9),
                border: Border.all(color: AppColors.of(context).primaryBorderSubtle),
                borderRadius: BorderRadius.circular(8),
              ),
              child: DropdownButton<String>(
                key: const Key('visual-theme-select'),
                value: app.visualTheme,
                underline: const SizedBox.shrink(),
                borderRadius: BorderRadius.circular(8),
                items: [
                  for (final theme in visualThemes)
                    DropdownMenuItem(value: theme, child: Text(_themeLabel(app, theme), style: const TextStyle(fontSize: 14))),
                ],
                onChanged: (theme) {
                  if (theme != null) app.setVisualTheme(theme);
                },
              ),
            ),
          ),
        ),
        _Section(
          title: app.t('settings.display'),
          child: Column(
            children: [
              // Web toggleLanguage: the row itself flips EN ↔ EL (SET-07).
              _RowTile(
                iconTile: const _IconTile(icon: Icons.language),
                label: app.t('settings.language'),
                value: app.language == 'el'
                    ? app.t('settings.languageGreek')
                    : app.t('settings.languageEnglish'),
                hasChevron: true,
                onTap: () => app.setLanguage(app.language == 'en' ? 'el' : 'en'),
              ),
              // 3-way control kept by stakeholder decision (SET-08). It is
              // too wide to share a row with the Greek label ("Σκοτεινό
              // Θέμα"), so it sits under the label instead (QA GRK-02: no
              // mid-word truncation).
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const _IconTile(icon: Icons.dark_mode_outlined),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Text(
                            app.t('settings.darkTheme'),
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                              color: AppColors.of(context).foreground,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerRight,
                      child: SegmentedButton<ThemeMode>(
                        showSelectedIcon: false,
                        style: SegmentedButton.styleFrom(
                          visualDensity: const VisualDensity(horizontal: -3, vertical: -3),
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        segments: const [
                          ButtonSegment(value: ThemeMode.system, icon: Icon(Icons.brightness_auto, size: 16)),
                          ButtonSegment(value: ThemeMode.light, icon: Icon(Icons.light_mode, size: 16)),
                          ButtonSegment(value: ThemeMode.dark, icon: Icon(Icons.dark_mode, size: 16)),
                        ],
                        selected: {app.themeMode},
                        onSelectionChanged: (s) => app.setThemeMode(s.first),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        _Section(
          title: app.t('settings.about'),
          child: Column(
            children: [
              _RowTile(
                iconTile: const _IconTile(icon: Icons.info_outline),
                label: app.t('settings.appVersion'),
                trailing: FutureBuilder<PackageInfo>(
                  future: PackageInfo.fromPlatform(),
                  builder: (context, snapshot) => Text(
                    // Web shows `v${__APP_VERSION__}` (SET-09).
                    snapshot.hasData ? 'v${snapshot.data!.version}' : '',
                    style: TextStyle(fontSize: 14, color: dark ? twSlate400 : twSlate500),
                  ),
                ),
              ),
              _RowTile(
                iconTile: const _IconTile(icon: Icons.code),
                label: app.t('settings.viewOnGithub'),
                labelColor: accentRed,
                isLast: true,
                trailing: const Icon(Icons.open_in_new, size: 20, color: twSlate400),
                onTap: () async {
                  try {
                    await openExternalUrl(Uri.parse(githubRepoUrl));
                  } catch (_) {
                    // Best-effort: no browser available is not worth an error UI.
                  }
                },
              ),
            ],
          ),
        ),
        // Web footer: plain xs slate-500 line.
        Padding(
          padding: const EdgeInsets.only(top: 32, bottom: 40),
          child: Text(
            app.t('settings.madeWith'),
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12, color: twSlate500),
          ),
        ),
      ],
    );
  }
}

/// Web `SettingsSection`: chip-styled title + white/#1e293b rounded card.
class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: dark ? Colors.transparent : const Color(0xB3FFFFFF),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                title.upperNoTonos,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.7,
                  color: dark ? twSlate400 : twSlate700,
                ),
              ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: dark ? twSlate800 : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: dark ? Colors.transparent : twSlate200),
              boxShadow: dark
                  ? null
                  : const [BoxShadow(color: Color(0x14000000), blurRadius: 2, offset: Offset(0, 1))],
            ),
            clipBehavior: Clip.antiAlias,
            child: child,
          ),
        ],
      ),
    );
  }
}

/// Web `SettingsRow`: 56px min-height row with a 40px icon tile, optional
/// value/chevron/trailing and a hairline divider below (unless last).
class _RowTile extends StatelessWidget {
  const _RowTile({
    required this.iconTile,
    required this.label,
    this.labelColor,
    this.value,
    this.hasChevron = false,
    this.trailing,
    this.onTap,
    this.isLast = false,
  });

  final Widget iconTile;
  final String label;
  final Color? labelColor;
  final String? value;
  final bool hasChevron;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final colors = AppColors.of(context);
    final row = Container(
      constraints: const BoxConstraints(minHeight: 56),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: isLast
          ? null
          : BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: dark ? twSlate700.withValues(alpha: 0.5) : const Color(0xFFF1F5F9),
                ),
              ),
            ),
      child: Row(
        children: [
          iconTile,
          const SizedBox(width: 16),
          Expanded(
            // Word-boundary wrap only — never mid-word (QA GRK-02).
            child: Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                height: 1.2,
                color: labelColor ?? colors.foreground,
              ),
            ),
          ),
          if (value != null) ...[
            const SizedBox(width: 8),
            Text(value!, style: TextStyle(fontSize: 14, color: dark ? twSlate400 : twSlate500)),
          ],
          if (hasChevron) ...[
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, size: 20, color: twSlate400),
          ],
          if (trailing != null) ...[
            const SizedBox(width: 8),
            trailing!,
          ],
        ],
      ),
    );
    if (onTap == null) return row;
    return Material(
      type: MaterialType.transparency,
      child: InkWell(onTap: onTap, child: row),
    );
  }
}

/// Web icon tile: 40px rounded-lg, slate fill unless a custom tint is given.
class _IconTile extends StatelessWidget {
  const _IconTile({required this.icon, this.background, this.color, this.size = 40});

  final IconData icon;
  final Color? background;
  final Color? color;
  final double size;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: background ?? (dark ? twSlate800.withValues(alpha: 0.8) : const Color(0xFFF1F5F9)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, size: size / 2, color: color ?? (dark ? twSlate400 : twSlate500)),
    );
  }
}

/// NOTIFICATIONS card (web SettingsPage.tsx): a Channels group with the push
/// row, then — while registered — Reminder Times chips, Sports and Alert
/// Types toggles. Native push is the only channel (QA-25/SET-02 decision).
class _NotificationsCard extends StatelessWidget {
  const _NotificationsCard();

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
    final dark = Theme.of(context).brightness == Brightness.dark;
    final prefs = app.notifPrefs;
    final divider = Border(
      top: BorderSide(color: dark ? twSlate700.withValues(alpha: 0.5) : const Color(0xFFF1F5F9)),
    );

    Widget subLabel(String text) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Text(
            text.upperNoTonos,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: dark ? twSlate400 : twSlate500,
            ),
          ),
        );

    Widget prefRow(String label, bool value, ValueChanged<bool> onChanged) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              ),
              WebToggle(checked: value, onChanged: () => onChanged(!value)),
            ],
          ),
        );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // ── Channels ──
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              subLabel(app.t('settings.channels')),
              Row(
                children: [
                  const _IconTile(
                    icon: Icons.notifications_outlined,
                    background: Color(0x1ADC2828),
                    color: accentRed,
                    size: 32,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          app.t('settings.notifications'),
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                        ),
                        Text(
                          app.t('settings.matchReminders'),
                          style: TextStyle(fontSize: 10, color: dark ? twSlate500 : twSlate400),
                        ),
                      ],
                    ),
                  ),
                  if (app.pushBusy)
                    const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: accentRed),
                    )
                  else
                    WebToggle(
                      key: const Key('push-channel-switch'),
                      checked: app.pushRegistered,
                      onChanged: app.pushAvailable
                          ? () => _togglePush(context, app, !app.pushRegistered)
                          : null,
                    ),
                ],
              ),
            ],
          ),
        ),
        // ── Shared preferences (visible while registered, web parity) ──
        if (app.pushRegistered) ...[
          Container(
            decoration: BoxDecoration(border: divider),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                subLabel(app.t('settings.reminderTimes')),
                Wrap(
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
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(border: divider),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                subLabel(app.t('settings.sports')),
                for (final (sport, labelKey) in const [
                  ('football-men', 'sports.footballMen'),
                  ('volleyball-men', 'sports.volleyballMen'),
                  ('volleyball-women', 'sports.volleyballWomen'),
                ])
                  prefRow(
                    app.t(labelKey),
                    prefs.enabledSports.contains(sport),
                    (_) => _toggleSport(context, app, sport),
                  ),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(border: divider),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                subLabel(app.t('settings.alertTypes')),
                prefRow(
                  app.t('settings.newEvents'),
                  prefs.notifyNewEvents,
                  (on) => _update(context, app, prefs.copyWith(notifyNewEvents: on)),
                ),
                prefRow(
                  app.t('settings.timeChanges'),
                  prefs.notifyTimeChanges,
                  (on) => _update(context, app, prefs.copyWith(notifyTimeChanges: on)),
                ),
                prefRow(
                  app.t('settings.scoreUpdates'),
                  prefs.notifyScoreUpdates,
                  (on) => _update(context, app, prefs.copyWith(notifyScoreUpdates: on)),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

/// Pill toggle for a reminder tier (web ReminderChip: active = brand red with
/// white text, inactive = slate).
class _ReminderChip extends StatelessWidget {
  const _ReminderChip({required this.label, required this.active, required this.onTap});

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: active ? brandRed : (dark ? twSlate700 : twSlate200),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: active ? Colors.white : (dark ? twSlate300 : twSlate600),
            ),
          ),
        ),
      ),
    );
  }
}
