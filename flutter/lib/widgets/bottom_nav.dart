import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';
import '../theme.dart';

/// Bottom navigation matching the web `BottomNav`: four tabs with 10px
/// uppercase condensed labels, red active state, translucent bar in dark mode.
class BottomNav extends StatelessWidget {
  const BottomNav({super.key, required this.index, required this.onSelect});

  final int index;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);

    final items = [
      (Icons.calendar_month_outlined, Icons.calendar_month, app.t('nav.calendar')),
      (Icons.bar_chart_outlined, Icons.bar_chart, app.t('nav.stats')),
      (Icons.people_alt_outlined, Icons.people_alt, app.t('nav.squad', 'Squad')),
      (Icons.settings_outlined, Icons.settings, app.t('nav.settings')),
    ];

    return Container(
      decoration: BoxDecoration(
        color: colors.navBackground,
        border: Border(top: BorderSide(color: colors.navBorder)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 10, 24, 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              for (var i = 0; i < items.length; i++)
                _NavItem(
                  icon: i == index ? items[i].$2 : items[i].$1,
                  label: items[i].$3,
                  active: i == index,
                  inactiveColor: colors.navInactive,
                  onTap: () => onSelect(i),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.active,
    required this.inactiveColor,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool active;
  final Color inactiveColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? accentRed : inactiveColor;
    return Semantics(
      selected: active,
      button: true,
      label: label,
      child: InkResponse(
        onTap: onTap,
        radius: 32,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 22, color: color),
              const SizedBox(height: 3),
              Text(
                label.upperNoTonos,
                style: condensed(size: 10, color: color, letterSpacing: 1.2),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
