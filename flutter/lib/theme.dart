import 'package:flutter/material.dart';

import 'models/events.dart';

/// Design tokens ported from the web app (`app/src/index.css`).
/// The web mobile view is the design ground truth — keep these in sync.
const brandRed = Color(0xFFE02520);

/// Logo / active-nav red used by the web header and bottom nav (`#dc2828`).
const accentRed = Color(0xFFDC2828);

const winGreen = Color(0xFF4CAF50);
const drawAmber = Color(0xFFFFC107);
const lossRed = Color(0xFFF44336);

/// Sport accents (web chart tokens).
Color sportColor(Sport sport) => switch (sport) {
      Sport.footballMen => brandRed,
      Sport.volleyballMen => const Color(0xFF2196F3),
      Sport.volleyballWomen => const Color(0xFF9C27B0),
      Sport.meeting => const Color(0xFF757575),
    };

Color formColor(String result) => switch (result) {
      'W' => winGreen,
      'D' => drawAmber,
      'L' => lossRed,
      _ => const Color(0xFF999999),
    };

/// Per-brightness palette mirroring `:root` / `.dark` in index.css.
class AppColors {
  const AppColors({
    required this.background,
    required this.foreground,
    required this.card,
    required this.muted,
    required this.mutedForeground,
    required this.border,
    required this.primaryBorderSubtle,
    required this.surfacePanel,
    required this.navBackground,
    required this.navBorder,
    required this.navInactive,
  });

  final Color background;
  final Color foreground;
  final Color card;
  final Color muted;
  final Color mutedForeground;
  final Color border;
  final Color primaryBorderSubtle;

  /// Translucent panel behind the calendar/stats content (web `bg-white/70`).
  final Color surfacePanel;
  final Color navBackground;
  final Color navBorder;
  final Color navInactive;

  static const light = AppColors(
    background: Color(0xFFF8FAFC),
    foreground: Color(0xFF1E293B),
    card: Color(0xFFFFFFFF),
    muted: Color(0xFFE2E8F0),
    mutedForeground: Color(0xFF64748B),
    border: Color(0xFFCBD5E1),
    primaryBorderSubtle: Color(0x26E02520),
    surfacePanel: Color(0xB3FFFFFF),
    navBackground: Color(0xFFF1F5F9),
    navBorder: Color(0xFFE2E8F0),
    navInactive: Color(0xFF94A3B8),
  );

  static const dark = AppColors(
    background: Color(0xFF0A1810),
    foreground: Color(0xFFF8FAFC),
    card: Color(0xFF1A0F0F),
    muted: Color(0xFF1E293B),
    mutedForeground: Color(0xFF94A3B8),
    border: Color(0x4DE02520),
    primaryBorderSubtle: Color(0x33E02520),
    surfacePanel: Color(0x141E293B),
    navBackground: Color(0xCC1E293B),
    navBorder: Color(0x14FFFFFF),
    navInactive: Color(0xFF94A3B8),
  );

  static AppColors of(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? dark : light;
}

/// Barlow Condensed style for headings, nav labels and section titles
/// (web `font-condensed` — always paired with uppercase text).
TextStyle condensed({
  double size = 14,
  FontWeight weight = FontWeight.w700,
  Color? color,
  double letterSpacing = 1.0,
}) =>
    TextStyle(
      fontFamily: 'BarlowCondensed',
      fontSize: size,
      fontWeight: weight,
      color: color,
      letterSpacing: letterSpacing,
    );

ThemeData buildTheme(Brightness brightness) {
  final c = brightness == Brightness.dark ? AppColors.dark : AppColors.light;
  final scheme = ColorScheme(
    brightness: brightness,
    primary: brandRed,
    onPrimary: Colors.white,
    secondary: c.muted,
    onSecondary: c.foreground,
    error: lossRed,
    onError: Colors.white,
    surface: c.background,
    onSurface: c.foreground,
  ).copyWith(
    surfaceContainerLow: c.card,
    surfaceContainerHighest: c.muted,
    outline: c.border,
    onSurfaceVariant: c.mutedForeground,
  );
  return ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    fontFamily: 'Barlow',
    // The stadium photo (AppBackground) sits behind every page.
    scaffoldBackgroundColor: Colors.transparent,
    cardTheme: CardThemeData(
      elevation: 0,
      color: c.card,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
      margin: EdgeInsets.zero,
    ),
    bottomSheetTheme: BottomSheetThemeData(backgroundColor: c.card),
  );
}
