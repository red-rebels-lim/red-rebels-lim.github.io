import 'package:flutter/material.dart';

import 'models/events.dart';

/// Brand red from the web app (--primary: #E02520).
const brandRed = Color(0xFFE02520);

const winGreen = Color(0xFF4CAF50);
const drawAmber = Color(0xFFFFC107);
const lossRed = Color(0xFFF44336);

Color sportColor(Sport sport) => switch (sport) {
      Sport.footballMen => brandRed,
      Sport.volleyballMen => const Color(0xFF1E88E5),
      Sport.volleyballWomen => const Color(0xFF8E24AA),
      Sport.meeting => const Color(0xFF757575),
    };

Color formColor(String result) => switch (result) {
      'W' => winGreen,
      'D' => drawAmber,
      'L' => lossRed,
      _ => const Color(0xFF999999),
    };

ThemeData buildTheme(Brightness brightness) {
  final scheme = ColorScheme.fromSeed(seedColor: brandRed, brightness: brightness);
  return ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    appBarTheme: AppBarTheme(
      backgroundColor: brightness == Brightness.light ? brandRed : scheme.surface,
      foregroundColor: brightness == Brightness.light ? Colors.white : scheme.onSurface,
      centerTitle: false,
    ),
    cardTheme: const CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
      margin: EdgeInsets.zero,
    ),
  );
}
