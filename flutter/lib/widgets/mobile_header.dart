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
              text: '${app.t('common.appName', 'Red Rebels')} ${app.t('common.calendarLabel', 'Calendar')}',
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

/// Web `h1.font-condensed text-xl font-bold tracking-tight text-[#dc2828]`
/// plus the per-theme overrides in `index.css` (THM-03/THM-08):
///
/// - brutalism — `font-size: 14px; text-transform: uppercase;
///   letter-spacing: 3px` (which is also why the full title fits);
/// - cinema — gradient-clipped text, `foreground → primary` at 135°;
/// - neon — `text-shadow: 0 0 10px var(--primary)` (via [condensed]'s glow).
class _BrandTitle extends StatelessWidget {
  const _BrandTitle({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    if (colors.themeId == 'brutalism') {
      return Text(
        text.upperNoTonos,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: condensed(size: 14, color: accentRed, letterSpacing: 3),
      );
    }

    // Web `tracking-tight` = -0.025em at text-xl.
    final title = Text(
      text,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: condensed(size: 20, color: accentRed, letterSpacing: -0.5),
    );

    if (colors.themeId == 'cinema') {
      return ShaderMask(
        shaderCallback: (bounds) => LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [colors.foreground, colors.primary],
        ).createShader(bounds),
        // The gradient supplies the color; the glyphs just need full alpha.
        child: Text(
          text,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: condensed(size: 20, color: Colors.white, letterSpacing: -0.5),
        ),
      );
    }

    return title;
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
