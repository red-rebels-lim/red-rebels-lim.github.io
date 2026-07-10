import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../pages/calendar_page.dart' show showCalendarFilterSheet;
import '../state/app_state.dart';
import '../theme.dart';

/// Fixed top header matching the web `MobileHeader`: red condensed brand
/// title on the left, circular icon buttons on the right (view switcher +
/// filters on the calendar tab, then share and theme toggle).
class MobileHeader extends StatelessWidget {
  const MobileHeader({super.key, required this.showCalendarActions});

  final bool showCalendarActions;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: colors.navBorder)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              '${app.t('common.appName', 'Red Rebels')} ${app.t('common.calendarLabel', 'Calendar')}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: condensed(size: 20, color: accentRed, letterSpacing: 0.5),
            ),
          ),
          if (showCalendarActions) ...[
            _HeaderButton(
              icon: app.listView ? Icons.grid_view_rounded : Icons.view_list_rounded,
              tooltip: app.listView ? app.t('calendar.viewGrid') : app.t('calendar.viewList'),
              onTap: () => app.setListView(!app.listView),
            ),
            const SizedBox(width: 8),
            _HeaderButton(
              icon: Icons.filter_list_rounded,
              tooltip: app.t('filters.title'),
              showBadge: app.filters.isActive,
              onTap: () => showCalendarFilterSheet(context),
            ),
            const SizedBox(width: 8),
          ],
          _HeaderButton(
            icon: Icons.share_outlined,
            tooltip: app.t('popover.shareMatch', 'Share'),
            onTap: () => SharePlus.instance.share(ShareParams(uri: Uri.parse('https://red-rebels.com'))),
          ),
          const SizedBox(width: 8),
          _HeaderButton(
            icon: dark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
            tooltip: app.t('settings.darkTheme'),
            onTap: () => app.setThemeMode(dark ? ThemeMode.light : ThemeMode.dark),
          ),
        ],
      ),
    );
  }
}

class _HeaderButton extends StatelessWidget {
  const _HeaderButton({
    required this.icon,
    required this.tooltip,
    required this.onTap,
    this.showBadge = false,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;
  final bool showBadge;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Tooltip(
      message: tooltip,
      child: Material(
        color: colors.navBackground,
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: SizedBox(
            width: 40,
            height: 40,
            child: Badge(
              isLabelVisible: showBadge,
              alignment: Alignment.topRight,
              offset: const Offset(-8, 8),
              child: Icon(icon, size: 20, color: colors.foreground),
            ),
          ),
        ),
      ),
    );
  }
}
