import 'package:flutter/material.dart';

import '../theme.dart';

/// Neon-only HUD frame around the main content panel, matching the web
/// `HudFrame`: four 16px cyan L-shaped corner brackets (2px strokes). For
/// every other theme the child passes through unchanged (web parity — the
/// component self-conditions on the visual theme).
class HudFrame extends StatelessWidget {
  const HudFrame({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final cyan = colors.neonCyan;
    if (colors.themeId != 'neon' || cyan == null) return child;

    // Web: relative mx-2 my-3 p-1 wrapper, w-4 h-4 border-2 corners.
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      child: Stack(
        children: [
          Padding(padding: const EdgeInsets.all(4), child: child),
          for (final (alignment, corner) in [
            (Alignment.topLeft, _Corner.topLeft),
            (Alignment.topRight, _Corner.topRight),
            (Alignment.bottomLeft, _Corner.bottomLeft),
            (Alignment.bottomRight, _Corner.bottomRight),
          ])
            Positioned.fill(
              child: Align(
                alignment: alignment,
                child: _HudCorner(key: Key('hud-corner-${corner.name}'), corner: corner, color: cyan),
              ),
            ),
        ],
      ),
    );
  }
}

enum _Corner { topLeft, topRight, bottomLeft, bottomRight }

class _HudCorner extends StatelessWidget {
  const _HudCorner({super.key, required this.corner, required this.color});

  final _Corner corner;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final side = BorderSide(color: color, width: 2);
    return SizedBox(
      width: 16,
      height: 16,
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(
            top: corner == _Corner.topLeft || corner == _Corner.topRight ? side : BorderSide.none,
            bottom: corner == _Corner.bottomLeft || corner == _Corner.bottomRight ? side : BorderSide.none,
            left: corner == _Corner.topLeft || corner == _Corner.bottomLeft ? side : BorderSide.none,
            right: corner == _Corner.topRight || corner == _Corner.bottomRight ? side : BorderSide.none,
          ),
        ),
      ),
    );
  }
}
