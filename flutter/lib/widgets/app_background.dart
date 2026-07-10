import 'package:flutter/material.dart';

import '../theme.dart';

/// Full-screen stadium photo behind every page, matching the web
/// `AppBackground` (default theme): base surface colour, the hero image at
/// 75% opacity, and a soft dark gradient so foreground panels stay readable.
class AppBackground extends StatelessWidget {
  const AppBackground({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;
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
