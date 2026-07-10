import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';

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
