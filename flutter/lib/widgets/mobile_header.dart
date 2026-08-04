import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../pages/calendar_page.dart' show showCalendarFilterSheet;
import '../state/app_state.dart';
import '../theme.dart';

/// Fixed top header matching the web `MobileHeader`: red condensed brand
/// title on the left (behind a circular back button on non-calendar pages),
/// circular icon buttons on the right — view switcher + filters on the
/// calendar tab, then the theme toggle.
///
/// Deliberate deviations from the web (QA register GLB-02, decided
/// 2026-07-14): no share button anywhere, and the filter button stays even
/// though the web has no touch trigger for its FilterPanel.
class MobileHeader extends StatelessWidget {
  const MobileHeader({super.key, required this.showCalendarActions, this.onBack});

  final bool showCalendarActions;

  /// Web `showBack` — set on every non-calendar page; navigates home.
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;
    // Web: view/share buttons `text-slate-600 dark:text-slate-300`.
    final iconColor = dark ? twSlate300 : twSlate600;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: colors.headerBorder, width: colors.chromeBorderWidth),
        ),
      ),
      child: Row(
        children: [
          if (onBack != null) ...[
            _HeaderButton(
              icon: Icons.arrow_back,
              tooltip: MaterialLocalizations.of(context).backButtonTooltip,
              iconColor: accentRed,
              iconSize: 20,
              onTap: onBack!,
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: _BrandTitle(
              label: app.t('common.appName', 'SoloSalamina'),
            ),
          ),
          if (showCalendarActions) ...[
            _HeaderButton(
              icon: switch (app.calendarView) {
                'list' => Icons.format_list_bulleted,
                'cards' => Icons.view_agenda_outlined,
                _ => Icons.grid_view_rounded,
              },
              tooltip: switch (app.calendarView) {
                'list' => app.t('calendar.viewList'),
                'cards' => app.t('calendar.viewCards'),
                _ => app.t('calendar.viewGrid'),
              },
              iconColor: iconColor,
              onTap: () {
                // Cycle grid → list → cards → grid.
                const views = AppState.calendarViews;
                final next = views[(views.indexOf(app.calendarView) + 1) % views.length];
                app.setCalendarView(next);
              },
            ),
            const SizedBox(width: 8),
            _HeaderButton(
              icon: Icons.filter_list_rounded,
              tooltip: app.t('filters.title'),
              iconColor: iconColor,
              showBadge: app.filters.isActive,
              onTap: () => showCalendarFilterSheet(context),
            ),
            const SizedBox(width: 8),
          ],
          // Web semantics: the icon shows the CURRENT mode (moon when dark).
          _HeaderButton(
            icon: dark ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
            tooltip: app.t('settings.darkTheme'),
            iconColor: accentRed,
            iconSize: 20,
            onTap: () => app.setThemeMode(dark ? ThemeMode.light : ThemeMode.dark),
          ),
        ],
      ),
    );
  }
}

/// SoloSalamina wordmark (crest + "Solo Salamina"), replacing the old text
/// title. The dark variant recolors the black "Solo" to white so the mark
/// stays legible on dark/brutalism/cinema/neon backgrounds; "Salamina" keeps
/// its brand red in both.
class _BrandTitle extends StatelessWidget {
  const _BrandTitle({required this.label});

  /// Accessibility label (the wordmark is an image).
  final String label;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Semantics(
      label: label,
      image: true,
      child: SizedBox(
        height: 30,
        // scaleDown: full 30px height when space allows (News/Squad/...),
        // shrinks instead of clipping next to the calendar action buttons.
        child: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Image.asset(
            dark
                ? 'assets/images/solosalamina_wordmark_dark.png'
                : 'assets/images/solosalamina_wordmark.png',
            height: 30,
            excludeFromSemantics: true,
          ),
        ),
      ),
    );
  }
}

class _HeaderButton extends StatelessWidget {
  const _HeaderButton({
    required this.icon,
    required this.tooltip,
    required this.onTap,
    required this.iconColor,
    this.iconSize = 18,
    this.showBadge = false,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;
  final Color iconColor;
  final double iconSize;
  final bool showBadge;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    // Web `rounded-full bg-slate-100 dark:bg-[#1e293b]` — square under
    // brutalism/neon (`.rounded-full { border-radius: 0 }`), fill dropped
    // under cinema (THM-03).
    final shape = RoundedRectangleBorder(borderRadius: colors.br(999));
    return Tooltip(
      message: tooltip,
      child: Material(
        color: colors.headerButtonBg ?? colors.surfaceTile,
        shape: shape,
        child: InkWell(
          customBorder: shape,
          onTap: onTap,
          child: SizedBox(
            width: 40,
            height: 40,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Icon(icon, size: iconSize, color: iconColor),
                if (showBadge)
                  Positioned(
                    top: 7,
                    right: 7,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(borderRadius: AppColors.of(context).br(999), color: accentRed),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
