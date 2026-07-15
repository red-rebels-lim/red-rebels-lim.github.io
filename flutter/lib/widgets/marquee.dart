import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';
import '../theme.dart';

/// Brutalism-only ticker between the header and page content, matching the
/// web `Marquee`: brand + sport names in uppercase, scrolling left on a 12s
/// loop between 2px top/bottom borders. Renders nothing for other themes
/// (web parity — the component self-conditions on the visual theme).
class Marquee extends StatefulWidget {
  const Marquee({super.key});

  @override
  State<Marquee> createState() => _MarqueeState();
}

class _MarqueeState extends State<Marquee> with SingleTickerProviderStateMixin {
  // CSS: animation marquee-scroll 12s linear infinite.
  late final AnimationController _controller =
      AnimationController(vsync: this, duration: const Duration(seconds: 12));

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);

    if (colors.themeId != 'brutalism') {
      _controller.stop();
      return const SizedBox.shrink();
    }
    if (!_controller.isAnimating) _controller.repeat();

    // (label, accent) pairs — web Marquee items.
    final items = [
      (app.t('common.appName', 'Red Rebels'), true),
      (app.t('sports.footballMen'), false),
      (app.t('sports.volleyballMen'), false),
      (app.t('sports.volleyballWomen'), false),
      (app.t('common.rebels', 'RED REBELS'), true),
    ];

    // CSS .marquee-inner span: 11px bold uppercase, 3px tracking, 48px gaps.
    final content = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final (label, accent) in items)
          Padding(
            padding: const EdgeInsets.only(right: 48),
            child: Text(
              label.upperNoTonos,
              maxLines: 1,
              style: condensed(
                size: 11,
                color: accent ? colors.primary : colors.mutedForeground,
                letterSpacing: 3 - colors.headingTrackingDelta,
              ),
            ),
          ),
      ],
    );

    return Container(
      key: const Key('marquee-ticker'),
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: colors.border, width: 2),
          bottom: BorderSide(color: colors.border, width: 2),
        ),
      ),
      child: ClipRect(
        child: SizedBox(
          height: 16,
          // Let the doubled row lay out at its intrinsic width beyond the
          // screen; the ClipRect crops it (CSS .marquee overflow: hidden).
          child: OverflowBox(
            maxWidth: double.infinity,
            alignment: Alignment.centerLeft,
            child: AnimatedBuilder(
              animation: _controller,
              // Content twice + translateX(-50%), like the CSS keyframes.
              child: Row(mainAxisSize: MainAxisSize.min, children: [content, content]),
              builder: (context, child) => FractionalTranslation(
                translation: Offset(-0.5 * _controller.value, 0),
                child: child,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
