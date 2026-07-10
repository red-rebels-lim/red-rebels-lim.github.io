import 'package:flutter/material.dart';

import '../models/players.dart';
import '../theme.dart';

/// Circular player portrait with a person-icon silhouette fallback, ported
/// from the web PlayerAvatar (sm = 36px rows, lg = 64px sheet header).
class PlayerAvatar extends StatelessWidget {
  const PlayerAvatar({super.key, required this.player, required this.size});

  final Player player;

  /// Diameter in logical pixels (36 for rows, 64 for the sheet).
  final double size;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final asset = player.photoAsset;
    final fallback = Icon(
      Icons.person,
      size: size * 0.55,
      color: colors.mutedForeground,
    );
    return Container(
      width: size,
      height: size,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(color: colors.muted, shape: BoxShape.circle),
      alignment: Alignment.center,
      child: asset == null
          ? fallback
          : Image.asset(
              asset,
              width: size,
              height: size,
              fit: BoxFit.cover,
              alignment: Alignment.topCenter,
              excludeFromSemantics: true,
              errorBuilder: (_, _, _) => fallback,
            ),
    );
  }
}
