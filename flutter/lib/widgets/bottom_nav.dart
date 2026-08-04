import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';
import '../theme.dart';

/// Bottom navigation, ported from the web `BottomNav` (plus the News tab):
/// 10px uppercase condensed labels, red active state, translucent bar in
/// dark mode.
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
      (Icons.newspaper_outlined, Icons.newspaper, app.t('nav.news', 'News')),
      (Icons.people_alt_outlined, Icons.people_alt, app.t('nav.squad', 'Squad')),
      (Icons.settings_outlined, Icons.settings, app.t('nav.settings')),
    ];

    return Container(
      decoration: BoxDecoration(
        color: colors.navBackground,
        // Brutalism: 2px solid primary top border (THM-02).
        border: Border(
          top: BorderSide(color: colors.navBorder, width: colors.chromeBorderWidth),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 10, 8, 10),
          child: Row(
            children: [
              // Equal fifths with each item centered in its slot — labels of
              // different widths keep the icon centers evenly distributed.
              // heightFactor pins the bar to the item's intrinsic height: a
              // bare Center would expand into the Scaffold's loose bounded
              // constraints and swallow the whole screen.
              for (var i = 0; i < items.length; i++)
                Expanded(
                  child: Align(
                    heightFactor: 1.0,
                    child: _NavItem(
                      icon: i == index ? items[i].$2 : items[i].$1,
                      label: items[i].$3,
                      active: i == index,
                      colors: colors,
                      onTap: () => onSelect(i),
                    ),
                  ),
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
    required this.colors,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool active;
  final AppColors colors;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    // Neon: active tab goes cyan with a glow (THM-05); brutalism gives it a
    // red-tinted square block (`nav a.active`, THM-01).
    final color = active ? colors.navActive : colors.navInactive;
    return Semantics(
      selected: active,
      button: true,
      label: label,
      child: InkResponse(
        onTap: onTap,
        radius: 32,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          color: active ? colors.navActiveBg : null,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 22,
                color: color,
                shadows: active && colors.navActiveGlow
                    ? [Shadow(color: color.withValues(alpha: 0.8), blurRadius: 10)]
                    : null,
              ),
              const SizedBox(height: 3),
              // Long labels (STATISTICS, ΗΜΕΡΟΛΟΓΙΟ) shrink to fit their
              // fifth of the bar instead of wrapping.
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  label.upperNoTonos,
                  maxLines: 1,
                  softWrap: false,
                  style: condensed(size: 10, color: color, letterSpacing: 1.2),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
