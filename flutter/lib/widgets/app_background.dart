import 'package:flutter/material.dart';

import '../theme.dart';

/// Full-screen backdrop behind every page, matching the web `AppBackground`
/// per visual theme:
///
/// - default — the stadium photo at 75% opacity under a soft dark gradient;
/// - brutalism — solid `--background`;
/// - cinema — the CSS vertical gradient (`#050506 → #020203` dark,
///   `#F1F5F9 → #F8FAFC` light); the web's animated ambient blobs are
///   skipped (continuous blur animation is not worth the battery);
/// - neon — solid `--background` plus a static scanline overlay (dark mode
///   only, like the CSS `.theme-neon::after`).
class AppBackground extends StatelessWidget {
  const AppBackground({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;

    switch (colors.themeId) {
      case 'brutalism':
        return ColoredBox(color: colors.background);
      case 'cinema':
        return DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: dark
                  ? const [Color(0xFF050506), Color(0xFF020203)]
                  : const [Color(0xFFF1F5F9), Color(0xFFF8FAFC)],
            ),
          ),
        );
      case 'neon':
        return ColoredBox(
          color: colors.background,
          child: dark
              ? const CustomPaint(
                  key: Key('neon-scanlines'),
                  painter: _ScanlinePainter(),
                  size: Size.infinite,
                )
              : null,
        );
      default:
        return ColoredBox(
          color: colors.background,
          child: Stack(
            fit: StackFit.expand,
            children: [
              Opacity(
                opacity: 0.75,
                child: Image.asset(
                  'assets/images/bg/stadium.webp',
                  fit: BoxFit.cover,
                  alignment: Alignment.center,
                  excludeFromSemantics: true,
                ),
              ),
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: dark
                        ? const [Color(0x66000000), Color(0x33000000), Color(0x66000000)]
                        : const [Color(0x0D000000), Color(0x05000000), Color(0x0D000000)],
                  ),
                ),
              ),
            ],
          ),
        );
    }
  }
}

/// Static horizontal scanlines matching the CSS repeating gradient:
/// 2px transparent, 2px cyan at 1.5% opacity. No animation — cheap to paint
/// once and let the raster cache hold it.
class _ScanlinePainter extends CustomPainter {
  const _ScanlinePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0xFF00FFFF).withValues(alpha: 0.015);
    for (var y = 2.0; y < size.height; y += 4) {
      canvas.drawRect(Rect.fromLTWH(0, y, size.width, 2), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _ScanlinePainter oldDelegate) => false;
}
