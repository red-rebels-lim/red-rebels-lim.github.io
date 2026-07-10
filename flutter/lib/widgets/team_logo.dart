import 'package:flutter/material.dart';

import '../theme.dart';

/// Opponent logo from bundled assets, with a monogram fallback when the
/// asset is missing (mirrors the web app's silhouette fallback).
class TeamLogo extends StatelessWidget {
  const TeamLogo({super.key, this.logoPath, required this.name, this.size = 36});

  /// Path as stored in events data, e.g. "images/team_logos/ΑΕΛ.webp".
  final String? logoPath;
  final String name;
  final double size;

  @override
  Widget build(BuildContext context) {
    final fallback = _Monogram(name: name, size: size);
    if (logoPath == null || logoPath!.isEmpty) return fallback;
    return Image.asset(
      'assets/${logoPath!}',
      width: size,
      height: size,
      fit: BoxFit.contain,
      // Decorative: the team name is always rendered as adjacent text
      // wherever TeamLogo is used, so announcing it again would duplicate.
      excludeFromSemantics: true,
      errorBuilder: (_, _, _) => fallback,
    );
  }
}

class _Monogram extends StatelessWidget {
  const _Monogram({required this.name, required this.size});

  final String name;
  final double size;

  @override
  Widget build(BuildContext context) {
    final initial = name.isEmpty ? '?' : name.characters.first;
    // Decorative fallback avatar — screen readers would otherwise announce a
    // stray single letter; the team name is always adjacent text.
    return ExcludeSemantics(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: brandRed.withValues(alpha: 0.12),
        ),
        alignment: Alignment.center,
        child: Text(
          initial,
          style: TextStyle(color: brandRed, fontWeight: FontWeight.bold, fontSize: size * 0.45),
        ),
      ),
    );
  }
}
