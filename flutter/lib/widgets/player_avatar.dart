import 'package:flutter/material.dart';

import '../data/constants.dart';
import '../models/players.dart';
import '../theme.dart';

/// Circular player portrait ported from the web PlayerAvatar
/// (sm = 36px rows, lg = 64px sheet header).
///
/// Portrait resolution order: bundled asset → portrait served by the web app
/// (so players added via the live players.json feed get photos without an app
/// release) → person-icon silhouette.
class PlayerAvatar extends StatelessWidget {
  const PlayerAvatar({super.key, required this.player, required this.size});

  final Player player;

  /// Diameter in logical pixels (36 for rows, 64 for the sheet).
  final double size;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
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
      child: _portrait(fallback),
    );
  }

  Widget _portrait(Widget fallback) {
    final asset = player.photoAsset;
    if (asset == null) return fallback; // No photoUrl at all.

    // Tried when the bundled asset is missing (player served by the live
    // feed after this release shipped).
    Widget networkPortrait(BuildContext _, Object _, StackTrace? _) => Image.network(
          '$siteBaseUrl${player.photoUrl}',
          width: size,
          height: size,
          fit: BoxFit.cover,
          alignment: Alignment.topCenter,
          excludeFromSemantics: true,
          errorBuilder: (_, _, _) => fallback,
        );

    return Image.asset(
      asset,
      width: size,
      height: size,
      fit: BoxFit.cover,
      alignment: Alignment.topCenter,
      excludeFromSemantics: true,
      errorBuilder: networkPortrait,
    );
  }
}
