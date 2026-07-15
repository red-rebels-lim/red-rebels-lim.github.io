import 'package:flutter/material.dart';

import '../theme.dart';

/// Full-screen backdrop behind every page, matching the web `AppBackground`
/// per visual theme:
///
/// - default — the stadium photo at 75% opacity under a soft dark gradient;
/// - brutalism — solid `--background`;
/// - cinema — the CSS vertical gradient (`#050506 → #020203` dark,
///   `#F1F5F9 → #F8FAFC` light);
/// - neon — solid `--background` plus the scanline overlay (dark mode only,
///   like the CSS `.theme-neon::after`), drifting slowly per the THM-07
///   stakeholder decision (2026-07-14);
/// - default + cinema in dark mode also drift the web's two ambient light
///   blobs (`.ambient-blob-1/2`, THM-04 decision: port the animation).
class AppBackground extends StatelessWidget {
  const AppBackground({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;

    final base = switch (colors.themeId) {
      'brutalism' => ColoredBox(color: colors.background),
      'cinema' => DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: dark
                  ? const [Color(0xFF050506), Color(0xFF020203)]
                  : const [Color(0xFFF1F5F9), Color(0xFFF8FAFC)],
            ),
          ),
          child: const SizedBox.expand(),
        ),
      'neon' => ColoredBox(
          color: colors.background,
          child: dark ? const _Scanlines(key: Key('neon-scanlines')) : null,
        ),
      _ => ColoredBox(
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
        ),
    };

    if (!dark || !colors.ambientBlobs) return base;
    return Stack(
      fit: StackFit.expand,
      children: [
        base,
        const _AmbientBlobs(key: Key('ambient-blobs')),
      ],
    );
  }
}

/// The web's two `ambient-blob` divs: fixed radial-gradient circles
/// (primary → transparent at 70%), 8% opacity, drifting on 20s/25s
/// ease-in-out loops. The CSS `blur(60px)` is approximated by the gradient's
/// soft falloff — a per-frame `ImageFilter` blur is not worth the battery.
class _AmbientBlobs extends StatefulWidget {
  const _AmbientBlobs({super.key});

  @override
  State<_AmbientBlobs> createState() => _AmbientBlobsState();
}

class _AmbientBlobsState extends State<_AmbientBlobs> with TickerProviderStateMixin {
  late final AnimationController _drift1 =
      AnimationController(vsync: this, duration: const Duration(seconds: 20));
  late final AnimationController _drift2 =
      AnimationController(vsync: this, duration: const Duration(seconds: 25));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // prefers-reduced-motion: freeze at the keyframe origin.
    if (MediaQuery.disableAnimationsOf(context)) {
      _drift1.stop();
      _drift2.stop();
    } else {
      _drift1.repeat();
      _drift2.repeat();
    }
  }

  @override
  void dispose() {
    _drift1.dispose();
    _drift2.dispose();
    super.dispose();
  }

  /// CSS keyframes at 0/33/66/100%, ease-in-out between stops.
  static (Offset, double) _keyframes(double t, List<(Offset, double)> stops) {
    final segments = [(0.0, 0.33), (0.33, 0.66), (0.66, 1.0)];
    for (var i = 0; i < segments.length; i++) {
      final (start, end) = segments[i];
      if (t <= end || i == segments.length - 1) {
        final local = Curves.easeInOut.transform(((t - start) / (end - start)).clamp(0, 1));
        final (fromOffset, fromScale) = stops[i];
        final (toOffset, toScale) = stops[i + 1];
        return (
          Offset.lerp(fromOffset, toOffset, local)!,
          fromScale + (toScale - fromScale) * local,
        );
      }
    }
    return stops.first;
  }

  @override
  Widget build(BuildContext context) {
    final primary = AppColors.of(context).primary;
    // 0%/33%/66%/100% keyframes from `blob-drift-1` / `blob-drift-2`.
    const stops1 = [
      (Offset.zero, 1.0),
      (Offset(30, -20), 1.1),
      (Offset(-20, 15), 0.95),
      (Offset.zero, 1.0),
    ];
    const stops2 = [
      (Offset.zero, 1.0),
      (Offset(-25, 25), 0.9),
      (Offset(15, -30), 1.05),
      (Offset.zero, 1.0),
    ];

    Widget blob(AnimationController controller, List<(Offset, double)> stops, double size) =>
        AnimatedBuilder(
          animation: controller,
          builder: (context, child) {
            final (offset, scale) = _keyframes(controller.value, stops);
            return Transform.translate(
              offset: offset,
              child: Transform.scale(scale: scale, child: child),
            );
          },
          child: IgnorePointer(
            child: Opacity(
              opacity: 0.08,
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [primary, primary.withValues(alpha: 0)],
                    stops: const [0, 0.7],
                  ),
                ),
              ),
            ),
          ),
        );

    return RepaintBoundary(
      child: LayoutBuilder(
        builder: (context, constraints) => Stack(
          children: [
            // CSS: 300px, top -50, right -80.
            Positioned(top: -50, right: -80, child: blob(_drift1, stops1, 300)),
            // CSS: 250px, bottom 20%, left -60.
            Positioned(
              bottom: constraints.maxHeight * 0.2,
              left: -60,
              child: blob(_drift2, stops2, 250),
            ),
          ],
        ),
      ),
    );
  }
}

/// Horizontal scanlines matching the CSS repeating gradient (2px transparent,
/// 2px cyan at 1.5% opacity), drifting one 4px period every few seconds —
/// the web overlay is static, but the stakeholder chose to animate it
/// (THM-07, 2026-07-14). Frozen under reduced-motion.
class _Scanlines extends StatefulWidget {
  const _Scanlines({super.key});

  @override
  State<_Scanlines> createState() => _ScanlinesState();
}

class _ScanlinesState extends State<_Scanlines> with SingleTickerProviderStateMixin {
  late final AnimationController _drift =
      AnimationController(vsync: this, duration: const Duration(seconds: 6));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _drift.stop();
    } else {
      _drift.repeat();
    }
  }

  @override
  void dispose() {
    _drift.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: CustomPaint(
        painter: _ScanlinePainter(_drift),
        size: Size.infinite,
      ),
    );
  }
}

class _ScanlinePainter extends CustomPainter {
  _ScanlinePainter(this.drift) : super(repaint: drift);

  final Animation<double> drift;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0xFF00FFFF).withValues(alpha: 0.015);
    // Slide the whole pattern down one 4px period per cycle.
    final phase = drift.value * 4;
    for (var y = phase - 4; y < size.height; y += 4) {
      canvas.drawRect(Rect.fromLTWH(0, y + 2, size.width, 2), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _ScanlinePainter oldDelegate) => oldDelegate.drift != drift;
}
