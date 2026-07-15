import 'package:flutter/material.dart';

/// Opponent logo from bundled assets. Missing crests fall back to the web's
/// shield emoji (`🛡️`, EventPopover's `text-2xl` span — QA EVT-08).
class TeamLogo extends StatelessWidget {
  const TeamLogo({super.key, this.logoPath, required this.name, this.size = 36});

  /// Path as stored in events data, e.g. "images/team_logos/ΑΕΛ.webp".
  final String? logoPath;
  final String name;
  final double size;

  @override
  Widget build(BuildContext context) {
    // Decorative: the team name is always rendered as adjacent text wherever
    // TeamLogo is used, so announcing it again would duplicate.
    final fallback = ExcludeSemantics(
      child: SizedBox(
        width: size,
        height: size,
        child: Center(child: Text('🛡️', style: TextStyle(fontSize: size * 0.45))),
      ),
    );
    if (logoPath == null || logoPath!.isEmpty) return fallback;
    return Image.asset(
      'assets/${logoPath!}',
      width: size,
      height: size,
      fit: BoxFit.contain,
      excludeFromSemantics: true,
      errorBuilder: (_, _, _) => fallback,
    );
  }
}
