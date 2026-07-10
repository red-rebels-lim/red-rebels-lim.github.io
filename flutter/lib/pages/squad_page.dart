import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';
import '../theme.dart';

/// Placeholder until Phase 3 of the implementation plan ports the web
/// squad page (roster by position + player detail sheet).
class SquadPage extends StatelessWidget {
  const SquadPage({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    return Center(
      child: Container(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: colors.surfacePanel,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.people_alt_outlined, size: 48, color: colors.mutedForeground),
            const SizedBox(height: 12),
            Text(
              app.t('nav.squad', 'Squad').toUpperCase(),
              style: condensed(size: 18, color: colors.foreground),
            ),
            const SizedBox(height: 4),
            Text(
              app.language == 'el' ? 'Έρχεται σύντομα' : 'Coming soon',
              style: TextStyle(color: colors.mutedForeground),
            ),
          ],
        ),
      ),
    );
  }
}
