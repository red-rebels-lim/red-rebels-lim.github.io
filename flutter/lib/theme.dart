import 'dart:ui' show FontVariation, lerpDouble;

import 'package:flutter/material.dart';

import 'logic/football_stats.dart' show MatchResult;
import 'models/events.dart';

/// Design tokens ported from the web app (`app/src/index.css`).
/// The web mobile view is the design ground truth — keep these in sync.
const brandRed = Color(0xFFE02520);

/// Logo / active-nav red used by the web header and bottom nav (`#dc2828`).
const accentRed = Color(0xFFDC2828);

const winGreen = Color(0xFF4CAF50);
const drawAmber = Color(0xFFFFC107);
const lossRed = Color(0xFFF44336);

/// Tailwind palette values the web calendar surfaces use literally
/// (`text-green-500`, `bg-blue-500/10`, `text-amber-500`, …). The stat
/// tokens above stay for the charts; these are for list/cards/sheet parity.
const twGreen500 = Color(0xFF22C55E);
const twYellow500 = Color(0xFFEAB308);
const twRed500 = Color(0xFFEF4444);
const twBlue500 = Color(0xFF3B82F6);
const twBlue400 = Color(0xFF60A5FA);
const twAmber500 = Color(0xFFF59E0B);
const twSky500 = Color(0xFF0EA5E9);
const twSky400 = Color(0xFF38BDF8);
const twAmber400 = Color(0xFFFBBF24);
const twSlate200 = Color(0xFFE2E8F0);
const twSlate300 = Color(0xFFCBD5E1);
const twSlate400 = Color(0xFF94A3B8);
const twSlate500 = Color(0xFF64748B);
const twSlate600 = Color(0xFF475569);
const twSlate700 = Color(0xFF334155);
const twSlate800 = Color(0xFF1E293B);

/// Result-tinted event-sheet surface, ported from EventPopover's
/// `resultBadge` class map (`dialogBg`/`dialogBorder`/badge/score colors).
class SheetResultStyle {
  const SheetResultStyle({
    required this.surface,
    required this.surfaceBottom,
    required this.borderColor,
    required this.badgeBg,
    required this.badgeBorder,
    required this.badgeText,
    required this.score,
  });

  final Color surface;

  /// Dark mode uses a `to-[#0a0a0a]` gradient; light mode is flat.
  final Color surfaceBottom;
  final Color borderColor;
  final Color badgeBg;
  final Color badgeBorder;
  final Color badgeText;
  final Color score;

  static SheetResultStyle of(MatchResult? result, {required bool dark}) {
    switch (result) {
      case MatchResult.win:
        return dark
            ? const SheetResultStyle(
                surface: Color(0xFF0A1A0A), surfaceBottom: Color(0xFF0A0A0A),
                borderColor: Color(0x8022C55E),
                badgeBg: Color(0xFF1A6B1A), badgeBorder: Color(0xFF2D8A2D),
                badgeText: Color(0xFF86EFAC), score: Color(0xFF86EFAC))
            : const SheetResultStyle(
                surface: Color(0xFFF0FDF4), surfaceBottom: Color(0xFFF0FDF4),
                borderColor: Color(0x8022C55E),
                badgeBg: Color(0xFFDCFCE7), badgeBorder: Color(0xFF4ADE80),
                badgeText: Color(0xFF15803D), score: Color(0xFF16A34A));
      case MatchResult.draw:
        return dark
            ? const SheetResultStyle(
                surface: Color(0xFF1A1A0A), surfaceBottom: Color(0xFF0A0A0A),
                borderColor: Color(0x80EAB308),
                badgeBg: Color(0xFF6B5A00), badgeBorder: Color(0xFF8A7500),
                badgeText: Color(0xFFFDE047), score: Color(0xFFFDE047))
            : const SheetResultStyle(
                surface: Color(0xFFFEFCE8), surfaceBottom: Color(0xFFFEFCE8),
                borderColor: Color(0x80EAB308),
                badgeBg: Color(0xFFFEF9C3), badgeBorder: Color(0xFFFACC15),
                badgeText: Color(0xFFA16207), score: Color(0xFFCA8A04));
      case MatchResult.loss:
        return dark
            ? const SheetResultStyle(
                surface: Color(0xFF1A0A0A), surfaceBottom: Color(0xFF0A0A0A),
                borderColor: Color(0x80EF4444),
                badgeBg: Color(0xFF6B1A1A), badgeBorder: Color(0xFF8A2020),
                badgeText: Color(0xFFFCA5A5), score: Color(0xFFFCA5A5))
            : const SheetResultStyle(
                surface: Color(0xFFFEF2F2), surfaceBottom: Color(0xFFFEF2F2),
                borderColor: Color(0x80EF4444),
                badgeBg: Color(0xFFFEE2E2), badgeBorder: Color(0xFFF87171),
                badgeText: Color(0xFFB91C1C), score: Color(0xFFDC2626));
      case null:
        // Upcoming: white / dark surface-dark→#0a0a0a gradient, primary border.
        return dark
            ? const SheetResultStyle(
                surface: Color(0xFF1A0F0F), surfaceBottom: Color(0xFF0A0A0A),
                borderColor: Color(0x66E02520),
                badgeBg: Color(0xFF2A1A1A), badgeBorder: Color(0x66E02520),
                badgeText: Color(0xFFFCA5A5), score: Colors.white)
            : const SheetResultStyle(
                surface: Colors.white, surfaceBottom: Colors.white,
                borderColor: Color(0x66E02520),
                badgeBg: twSlate200, badgeBorder: Color(0x66E02520),
                badgeText: Color(0xFFB91C1C), score: Colors.black);
    }
  }
}

/// Visual themes, in web picker order (`useVisualTheme.ts`).
const visualThemes = ['default', 'brutalism', 'cinema', 'neon'];

/// Display uppercase matching browsers with `lang=el` (QA GRK-01, decided
/// 2026-07-14): Greek drops the tonos on uppercase (ΡΥΘΜΊΣΕΙΣ → ΡΥΘΜΙΣΕΙΣ)
/// but keeps the dialytika (Ϊ/Ϋ — ΒΟΛΕΪ stays). Dart's `toUpperCase()` keeps
/// the accents, so every DISPLAY call site uses this instead. Never use it
/// for data normalization (alias matching keeps plain `toUpperCase()`).
extension DisplayUpper on String {
  static const _tonosMap = {
    'Ά': 'Α', 'Έ': 'Ε', 'Ή': 'Η', 'Ί': 'Ι', 'Ό': 'Ο', 'Ύ': 'Υ', 'Ώ': 'Ω',
    // ΐ/ΰ (dialytika+tonos) have no simple uppercase mapping — Dart's
    // toUpperCase() leaves them as-is (Μαΐου → ΜΑΐΟΥ). Map them to the
    // dialytika-only capitals (QA task #18: the widget showed ΜΑΪ́ΟΥ).
    'ΐ': 'Ϊ', 'ΰ': 'Ϋ',
  };

  String get upperNoTonos {
    var s = toUpperCase();
    for (final e in _tonosMap.entries) {
      s = s.replaceAll(e.key, e.value);
    }
    // Combining acute/grave left over from ΐ/ΰ-style inputs.
    return s.replaceAll('́', '').replaceAll('̀', '');
  }
}

/// Sport accents as the web calendar renders them: `text-primary` red for
/// football, `text-blue-500` for ALL volleyball (the web never uses the
/// women's purple on calendar surfaces — QA register GLB-07).
Color sportColor(Sport sport) => switch (sport) {
      Sport.footballMen => brandRed,
      Sport.volleyballMen || Sport.volleyballWomen => twBlue500,
      Sport.meeting => const Color(0xFF757575),
    };

Color formColor(String result) => switch (result) {
      'W' => winGreen,
      'D' => drawAmber,
      'L' => lossRed,
      _ => const Color(0xFF999999),
    };

/// Per-theme, per-brightness palette mirroring the token blocks in
/// index.css (`:root`/`.dark` for default; `.theme-brutalism`,
/// `.theme-cinema`, `.theme-neon` with their `.light` variants).
///
/// Registered as a [ThemeExtension] on [ThemeData] by [buildTheme], so
/// widgets resolve the active visual theme via [AppColors.of].
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.themeId,
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
    this.surfaceTile = const Color(0xFF1E293B),
    this.surfaceTileRaised = const Color(0xFF334155),
    this.primary = brandRed,
    this.neonCyan,
    this.panelRadius = 16,
    this.cardRadius = 12,
    this.headingFontFamily = 'BarlowCondensed',
    this.bodyFontFamily = 'Barlow',
    this.headingTrackingDelta = 0,
    this.headingGlow = false,
    this.squareCorners = false,
    this.headerBorder = const Color(0x14FFFFFF),
    this.chromeBorderWidth = 1,
    this.navActive = accentRed,
    this.navActiveGlow = false,
    this.navActiveBg,
    this.headerButtonBg,
    this.ambientBlobs = false,
  });

  /// 'default' | 'brutalism' | 'cinema' | 'neon' — which token block this
  /// palette was ported from (lets structural widgets branch on the theme).
  final String themeId;

  final Color background;
  final Color foreground;
  final Color card;
  final Color muted;
  final Color mutedForeground;
  final Color border;
  final Color primaryBorderSubtle;

  /// Translucent panel behind the calendar/stats content (web `bg-white/70`
  /// for default; the theme's `--surface-overlay` for the alternates).
  final Color surfacePanel;
  final Color navBackground;
  final Color navBorder;
  final Color navInactive;

  /// Web mobile calendar tiles — month-nav buttons and UpcomingEventCard
  /// background (Tailwind `bg-slate-100 dark:bg-[#1e293b]`). These are
  /// literal utility classes on the web, so they do not vary per visual
  /// theme — only per brightness. Defaults are the dark values; light
  /// palettes override.
  final Color surfaceTile;

  /// Raised chip on a tile — the card chevron circle (web
  /// `bg-slate-200 dark:bg-slate-700`).
  final Color surfaceTileRaised;

  /// Web `--primary` — brand red everywhere except neon dark (`#FF2D20`).
  final Color primary;

  /// Web `--neon-cyan` — set only by the neon theme (HUD brackets, nav glow).
  final Color? neonCyan;

  /// Corner radius of the frosted page panels (web `--radius`-driven:
  /// brutalism/neon 0, cinema larger).
  final double panelRadius;

  /// Corner radius for cards and inner tiles.
  final double cardRadius;

  /// Heading font (web `--font-heading`); null = platform default.
  final String? headingFontFamily;

  /// Body font (web `--font-body`); null = platform default.
  final String? bodyFontFamily;

  /// Extra letter-spacing added to condensed headings (brutalism's wide
  /// uppercase tracking, CSS `letter-spacing: 3px`).
  final double headingTrackingDelta;

  /// Neon `text-shadow: 0 0 8px currentColor` on condensed headings.
  final bool headingGlow;

  /// Brutalism and neon zero `--radius` AND `.rounded-full`, squaring every
  /// corner — chips, pills and circular buttons included (THM-01).
  final bool squareCorners;

  /// Web header underline: `border-slate-200 dark:border-[var(--border-subtle)]`
  /// (brutalism overrides both modes to `var(--border)`).
  final Color headerBorder;

  /// Header/nav border width — brutalism draws 2px chrome borders (THM-02).
  final double chromeBorderWidth;

  /// Active bottom-nav tab color — cyan under neon (THM-05), red elsewhere.
  final Color navActive;

  /// Neon dark: `text-shadow: 0 0 10px var(--neon-cyan)` on the active tab.
  final bool navActiveGlow;

  /// Brutalism: `nav a.active { background: rgba(224,37,32,0.08) }`.
  final Color? navActiveBg;

  /// Cinema drops the circular header-button fills (THM-03); null keeps the
  /// default `bg-slate-100 dark:bg-[#1e293b]` tile.
  final Color? headerButtonBg;

  /// Web `AppBackground` drifts two ambient blobs in dark mode on the
  /// default and cinema themes (THM-04).
  final bool ambientBlobs;

  /// Corner radius for a web `rounded-*` utility: every rounded class maps
  /// through `--radius`, which brutalism/neon zero. [base] is the web
  /// default-theme pixel value (999 for `rounded-full`).
  BorderRadius br(double base) =>
      squareCorners ? BorderRadius.zero : BorderRadius.circular(base);

  // ── Default theme (`:root` / `.dark`) ──────────────────────────────────

  static const light = AppColors(
    themeId: 'default',
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
    surfaceTile: Color(0xFFF1F5F9),
    surfaceTileRaised: Color(0xFFE2E8F0),
    headerBorder: Color(0xFFE2E8F0),
    ambientBlobs: true,
  );

  static const dark = AppColors(
    themeId: 'default',
    background: Color(0xFF0A1810),
    foreground: Color(0xFFF8FAFC),
    card: Color(0xFF1A0F0F),
    muted: Color(0xFF1E293B),
    mutedForeground: Color(0xFF94A3B8),
    border: Color(0x4DE02520),
    primaryBorderSubtle: Color(0x33E02520),
    // Web dark renders the calendar with no panel box at all
    // (`bg-white/70 dark:bg-transparent`).
    surfacePanel: Color(0x00000000),
    navBackground: Color(0xCC1E293B),
    navBorder: Color(0x14FFFFFF),
    navInactive: Color(0xFF94A3B8),
    ambientBlobs: true,
  );

  // ── Brutalism (`.theme-brutalism`) ──────────────────────────────────────
  // Body text stays Barlow: the web hardcodes `font-['Barlow',sans-serif]`
  // on <main>, so `--font-body` never reaches page content — only headings
  // (`.font-condensed` → `--font-heading`) vary per theme. The wide 3px
  // tracking applies to the `h1` brand title only, not all headings.

  static const brutalismLight = AppColors(
    themeId: 'brutalism',
    background: Color(0xFFF8FAFC),
    foreground: Color(0xFF1E293B),
    card: Color(0xFFFFFFFF),
    muted: Color(0xFFE2E8F0),
    mutedForeground: Color(0xFF64748B),
    border: Color(0xFFCBD5E1),
    primaryBorderSubtle: Color(0xFFE2E8F0),
    surfacePanel: Color(0xB3FFFFFF),
    navBackground: Color(0xFFF8FAFC),
    navBorder: brandRed, // CSS: nav border-top 2px solid var(--primary)
    navInactive: Color(0xFF64748B),
    surfaceTile: Color(0xFFF1F5F9),
    surfaceTileRaised: Color(0xFFE2E8F0),
    panelRadius: 0,
    cardRadius: 0,
    headingFontFamily: 'SpaceGrotesk',
    squareCorners: true,
    headerBorder: Color(0xFFCBD5E1),
    chromeBorderWidth: 2,
    navActiveBg: Color(0x14E02520),
  );

  static const brutalismDark = AppColors(
    themeId: 'brutalism',
    background: Color(0xFF09090B),
    foreground: Color(0xFFFAFAFA),
    card: Color(0xFF09090B),
    muted: Color(0xFF27272A),
    mutedForeground: Color(0xFFA1A1AA),
    border: Color(0xFF3F3F46),
    primaryBorderSubtle: Color(0xFF3F3F46),
    surfacePanel: Color(0x00000000),
    navBackground: Color(0xFF09090B),
    navBorder: brandRed,
    navInactive: Color(0xFFA1A1AA),
    panelRadius: 0,
    cardRadius: 0,
    headingFontFamily: 'SpaceGrotesk',
    squareCorners: true,
    headerBorder: Color(0xFF3F3F46),
    chromeBorderWidth: 2,
    navActiveBg: Color(0x14E02520),
  );

  // ── Cinema (`.theme-cinema`) ────────────────────────────────────────────
  // Headings switch to Inter (`--font-heading`); body stays Barlow like
  // every theme (hardcoded on the web's <main>).

  static const cinemaLight = AppColors(
    themeId: 'cinema',
    background: Color(0xFFF8FAFC),
    foreground: Color(0xFF1E293B),
    card: Color(0xFFFFFFFF),
    muted: Color(0xFFF1F5F9),
    mutedForeground: Color(0xFF64748B),
    border: Color(0x14000000),
    primaryBorderSubtle: Color(0x0F000000),
    surfacePanel: Color(0xB3FFFFFF),
    navBackground: Color(0xD9F8FAFC),
    navBorder: Color(0x14000000),
    navInactive: Color(0xFF64748B),
    surfaceTile: Color(0xFFF1F5F9),
    surfaceTileRaised: Color(0xFFE2E8F0),
    panelRadius: 24,
    cardRadius: 16,
    headingFontFamily: 'Inter',
    headerBorder: Color(0xFFE2E8F0),
    headerButtonBg: Color(0x00000000),
    ambientBlobs: true,
  );

  static const cinemaDark = AppColors(
    themeId: 'cinema',
    background: Color(0xFF020203),
    foreground: Color(0xFFEDEDEF),
    card: Color(0xFF0A0A0C),
    muted: Color(0xFF18181B),
    mutedForeground: Color(0xFF8A8F98),
    border: Color(0x14FFFFFF),
    primaryBorderSubtle: Color(0x14FFFFFF),
    surfacePanel: Color(0x00000000),
    navBackground: Color(0xBF020203),
    navBorder: Color(0x14FFFFFF),
    navInactive: Color(0xFF8A8F98),
    panelRadius: 24,
    cardRadius: 16,
    headingFontFamily: 'Inter',
    headerBorder: Color(0x1AFFFFFF),
    headerButtonBg: Color(0x00000000),
    ambientBlobs: true,
  );

  // ── Neon HUD (`.theme-neon`) ────────────────────────────────────────────

  static const neonLight = AppColors(
    themeId: 'neon',
    background: Color(0xFFF0F4F8),
    foreground: Color(0xFF1A202C),
    card: Color(0xFFFFFFFF),
    muted: Color(0xFFE2E8F0),
    mutedForeground: Color(0xFF718096),
    border: Color(0x330891B2),
    primaryBorderSubtle: Color(0x1A0891B2),
    surfacePanel: Color(0xB3FFFFFF),
    navBackground: Color(0xEBF0F4F8),
    navBorder: Color(0x330891B2),
    navInactive: Color(0xFF718096),
    surfaceTile: Color(0xFFF1F5F9),
    surfaceTileRaised: Color(0xFFE2E8F0),
    primary: brandRed,
    neonCyan: Color(0xFF0891B2),
    panelRadius: 0,
    cardRadius: 0,
    headingFontFamily: 'Orbitron',
    squareCorners: true,
    headerBorder: Color(0xFFE2E8F0),
    navActive: Color(0xFF0891B2),
  );

  static const neonDark = AppColors(
    themeId: 'neon',
    background: Color(0xFF0A0A0F),
    foreground: Color(0xFFE4E4E7),
    card: Color(0xFF12121A),
    muted: Color(0xFF1E1E2A),
    mutedForeground: Color(0xFF71717A),
    border: Color(0x2600FFFF),
    primaryBorderSubtle: Color(0x1A00FFFF),
    surfacePanel: Color(0x00000000),
    navBackground: Color(0xE60A0A0F),
    navBorder: Color(0x2600FFFF),
    navInactive: Color(0xFF71717A),
    primary: Color(0xFFFF2D20),
    neonCyan: Color(0xFF00FFFF),
    panelRadius: 0,
    cardRadius: 0,
    headingFontFamily: 'Orbitron',
    headingGlow: true,
    squareCorners: true,
    headerBorder: Color(0x1A00FFFF),
    navActive: Color(0xFF00FFFF),
    navActiveGlow: true,
  );

  /// Palette for a visual theme + brightness. Unknown ids fall back to the
  /// default theme (mirrors `useVisualTheme`'s validation).
  static AppColors resolve(String visualTheme, Brightness brightness) {
    final dark = brightness == Brightness.dark;
    return switch (visualTheme) {
      'brutalism' => dark ? brutalismDark : brutalismLight,
      'cinema' => dark ? cinemaDark : cinemaLight,
      'neon' => dark ? neonDark : neonLight,
      _ => dark ? AppColors.dark : AppColors.light,
    };
  }

  static AppColors of(BuildContext context) =>
      Theme.of(context).extension<AppColors>()!;

  @override
  AppColors copyWith({
    String? themeId,
    Color? background,
    Color? foreground,
    Color? card,
    Color? muted,
    Color? mutedForeground,
    Color? border,
    Color? primaryBorderSubtle,
    Color? surfacePanel,
    Color? navBackground,
    Color? navBorder,
    Color? navInactive,
    Color? surfaceTile,
    Color? surfaceTileRaised,
    Color? primary,
    Color? neonCyan,
    double? panelRadius,
    double? cardRadius,
    String? headingFontFamily,
    String? bodyFontFamily,
    double? headingTrackingDelta,
    bool? headingGlow,
    bool? squareCorners,
    Color? headerBorder,
    double? chromeBorderWidth,
    Color? navActive,
    bool? navActiveGlow,
    Color? navActiveBg,
    Color? headerButtonBg,
    bool? ambientBlobs,
  }) =>
      AppColors(
        themeId: themeId ?? this.themeId,
        background: background ?? this.background,
        foreground: foreground ?? this.foreground,
        card: card ?? this.card,
        muted: muted ?? this.muted,
        mutedForeground: mutedForeground ?? this.mutedForeground,
        border: border ?? this.border,
        primaryBorderSubtle: primaryBorderSubtle ?? this.primaryBorderSubtle,
        surfacePanel: surfacePanel ?? this.surfacePanel,
        navBackground: navBackground ?? this.navBackground,
        navBorder: navBorder ?? this.navBorder,
        navInactive: navInactive ?? this.navInactive,
        surfaceTile: surfaceTile ?? this.surfaceTile,
        surfaceTileRaised: surfaceTileRaised ?? this.surfaceTileRaised,
        primary: primary ?? this.primary,
        neonCyan: neonCyan ?? this.neonCyan,
        panelRadius: panelRadius ?? this.panelRadius,
        cardRadius: cardRadius ?? this.cardRadius,
        headingFontFamily: headingFontFamily ?? this.headingFontFamily,
        bodyFontFamily: bodyFontFamily ?? this.bodyFontFamily,
        headingTrackingDelta: headingTrackingDelta ?? this.headingTrackingDelta,
        headingGlow: headingGlow ?? this.headingGlow,
        squareCorners: squareCorners ?? this.squareCorners,
        headerBorder: headerBorder ?? this.headerBorder,
        chromeBorderWidth: chromeBorderWidth ?? this.chromeBorderWidth,
        navActive: navActive ?? this.navActive,
        navActiveGlow: navActiveGlow ?? this.navActiveGlow,
        navActiveBg: navActiveBg ?? this.navActiveBg,
        headerButtonBg: headerButtonBg ?? this.headerButtonBg,
        ambientBlobs: ambientBlobs ?? this.ambientBlobs,
      );

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    // Discrete tokens (theme id, fonts, flags) snap at the midpoint.
    final snap = t < 0.5 ? this : other;
    return AppColors(
      themeId: snap.themeId,
      background: Color.lerp(background, other.background, t)!,
      foreground: Color.lerp(foreground, other.foreground, t)!,
      card: Color.lerp(card, other.card, t)!,
      muted: Color.lerp(muted, other.muted, t)!,
      mutedForeground: Color.lerp(mutedForeground, other.mutedForeground, t)!,
      border: Color.lerp(border, other.border, t)!,
      primaryBorderSubtle: Color.lerp(primaryBorderSubtle, other.primaryBorderSubtle, t)!,
      surfacePanel: Color.lerp(surfacePanel, other.surfacePanel, t)!,
      navBackground: Color.lerp(navBackground, other.navBackground, t)!,
      navBorder: Color.lerp(navBorder, other.navBorder, t)!,
      navInactive: Color.lerp(navInactive, other.navInactive, t)!,
      surfaceTile: Color.lerp(surfaceTile, other.surfaceTile, t)!,
      surfaceTileRaised: Color.lerp(surfaceTileRaised, other.surfaceTileRaised, t)!,
      primary: Color.lerp(primary, other.primary, t)!,
      neonCyan: Color.lerp(neonCyan, other.neonCyan, t),
      panelRadius: lerpDouble(panelRadius, other.panelRadius, t)!,
      cardRadius: lerpDouble(cardRadius, other.cardRadius, t)!,
      headingFontFamily: snap.headingFontFamily,
      bodyFontFamily: snap.bodyFontFamily,
      headingTrackingDelta:
          lerpDouble(headingTrackingDelta, other.headingTrackingDelta, t)!,
      headingGlow: snap.headingGlow,
      squareCorners: snap.squareCorners,
      headerBorder: Color.lerp(headerBorder, other.headerBorder, t)!,
      chromeBorderWidth: lerpDouble(chromeBorderWidth, other.chromeBorderWidth, t)!,
      navActive: Color.lerp(navActive, other.navActive, t)!,
      navActiveGlow: snap.navActiveGlow,
      navActiveBg: Color.lerp(navActiveBg, other.navActiveBg, t),
      headerButtonBg: Color.lerp(headerButtonBg, other.headerButtonBg, t),
      ambientBlobs: snap.ambientBlobs,
    );
  }
}

// The active heading tokens, captured by [buildTheme] so [condensed] stays a
// context-free helper (its many call sites pass no BuildContext). Only one
// visual theme is ever active per app, and heading typography does not vary
// with brightness, so a module-level snapshot is safe.
String? _headingFontFamily = 'BarlowCondensed';
double _headingTrackingDelta = 0;
bool _headingGlow = false;

/// Heading style for nav labels and section titles (web `font-condensed` —
/// always paired with uppercase text). The font family follows the active
/// visual theme's `--font-heading`: Barlow Condensed (default), Space
/// Grotesk (brutalism), platform default (cinema), Orbitron (neon).
TextStyle condensed({
  double size = 14,
  FontWeight weight = FontWeight.w700,
  Color? color,
  double letterSpacing = 1.0,
}) =>
    TextStyle(
      fontFamily: _headingFontFamily,
      // None of the heading fonts (Barlow Condensed, Space Grotesk, Orbitron)
      // cover Greek. Without an in-app fallback, Flutter falls through to the
      // platform font, which on some devices renders a lunate Σ ("C") and
      // drops tonos accents. Roboto Condensed carries full Greek and keeps
      // the narrow proportions the design leans on.
      fontFamilyFallback: const ['RobotoCondensed'],
      // The alternate heading fonts ship as variable TTFs; pin the weight
      // axis so bold headings render properly (static fonts ignore this).
      fontVariations: [FontVariation.weight(weight.value.toDouble())],
      fontSize: size,
      fontWeight: weight,
      color: color,
      letterSpacing: letterSpacing + _headingTrackingDelta,
      // Neon: text-shadow 0 0 8px currentColor on condensed headings.
      shadows: _headingGlow && color != null
          ? [Shadow(color: color.withValues(alpha: 0.8), blurRadius: 8)]
          : null,
    );

ThemeData buildTheme(String visualTheme, Brightness brightness) {
  final c = AppColors.resolve(visualTheme, brightness);
  _headingFontFamily = c.headingFontFamily;
  _headingTrackingDelta = c.headingTrackingDelta;
  _headingGlow = c.headingGlow;
  final scheme = ColorScheme(
    brightness: brightness,
    primary: c.primary,
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
  // Body fonts (Barlow, Space Grotesk) lack Greek; Inter covers it and is
  // exactly the web's fallback in its `'Barlow', 'Inter', sans-serif` stack.
  // Wired through textTheme because ThemeData(fontFamily:) has no fallback
  // parameter. JetBrains Mono (neon body) has native Greek — the fallback is
  // simply never consulted there.
  const bodyFallback = ['Inter'];
  final baseText = ThemeData(brightness: brightness, useMaterial3: true)
      .textTheme
      .apply(fontFamily: c.bodyFontFamily, fontFamilyFallback: bodyFallback);
  return ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    fontFamily: c.bodyFontFamily,
    textTheme: baseText,
    extensions: [c],
    // AppBackground (photo / gradient / solid) sits behind every page.
    scaffoldBackgroundColor: Colors.transparent,
    cardTheme: CardThemeData(
      elevation: 0,
      color: c.card,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(c.cardRadius)),
      ),
      margin: EdgeInsets.zero,
    ),
    bottomSheetTheme: BottomSheetThemeData(backgroundColor: c.card),
  );
}
