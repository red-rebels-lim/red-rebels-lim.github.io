import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../logic/squad_stats.dart';
import '../models/events.dart';
import '../models/players.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/player_avatar.dart';
import '../widgets/player_sheet.dart';

const _positionOrder = [Position.gk, Position.def, Position.mid, Position.fwd];

/// Squad roster page, ported from the web SquadPage: position sections with
/// M/G/C column captions, tappable player rows opening the detail sheet.
class SquadPage extends StatelessWidget {
  const SquadPage({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);

    final roster = app.players.all
        .where((p) => p.active && p.sport == Sport.footballMen)
        .toList();
    final stats = aggregateSquadStats(
      roster: roster,
      eventsByMonth: app.events.byMonth,
    );

    final grouped = <Position, List<Player>>{
      for (final pos in _positionOrder) pos: [],
    };
    for (final p in roster) {
      grouped[p.position]!.add(p);
    }
    for (final list in grouped.values) {
      list.sort(
        (a, b) => (a.shirtNumber ?? 999).compareTo(b.shirtNumber ?? 999),
      );
    }

    return Container(
      margin: const EdgeInsets.fromLTRB(8, 8, 8, 0),
      decoration: BoxDecoration(
        color: colors.surfacePanel,
        borderRadius: BorderRadius.circular(colors.panelRadius),
      ),
      clipBehavior: Clip.antiAlias,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 16),
            child: Text(
              app.t('nav.squad'),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: colors.foreground,
              ),
            ),
          ),
          for (final pos in _positionOrder)
            if (grouped[pos]!.isNotEmpty)
              _PositionSection(
                position: pos,
                players: grouped[pos]!,
                stats: stats,
              ),
        ],
      ),
    );
  }
}

class _PositionSection extends StatelessWidget {
  const _PositionSection({
    required this.position,
    required this.players,
    required this.stats,
  });

  final Position position;
  final List<Player> players;
  final Map<String, PlayerSeasonStats> stats;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final colors = AppColors.of(context);
    final captionStyle = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w700,
      letterSpacing: 1.2,
      color: colors.mutedForeground,
    );

    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Header: '<LABEL> (n)' + M/G/C column captions ──
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Expanded(
                  child: Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(
                          text: app
                              .t('squad.positions.${position.id}')
                              .toUpperCase(),
                        ),
                        TextSpan(
                          text: '  (${players.length})',
                          style: condensed(
                            size: 15,
                            weight: FontWeight.w600,
                            color: colors.mutedForeground,
                          ),
                        ),
                      ],
                    ),
                    style: condensed(
                      size: 16,
                      color: colors.foreground,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                // Right padding mirrors the row's trailing chevron area (16 + 12).
                Padding(
                  padding: const EdgeInsets.only(right: 28),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 28,
                        child: Text(
                          app.t('squad.colApps').toUpperCase(),
                          textAlign: TextAlign.right,
                          style: captionStyle,
                        ),
                      ),
                      const SizedBox(width: 12),
                      SizedBox(
                        width: 20,
                        child: Text(
                          app.t('squad.colGoals').toUpperCase(),
                          textAlign: TextAlign.right,
                          style: captionStyle,
                        ),
                      ),
                      const SizedBox(width: 12),
                      SizedBox(
                        width: 20,
                        child: Text(
                          app.t('squad.colCards').toUpperCase(),
                          textAlign: TextAlign.right,
                          style: captionStyle,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // ── Rows card — web: `border border-slate-200 dark:border-slate-800`
          //    (QA SQD-01: slate, not the red-tinted primary border) ──
          Container(
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerLow,
              border: Border.all(
                color: theme.brightness == Brightness.dark ? twSlate800 : twSlate200,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: [
                for (final (i, player) in players.indexed) ...[
                  if (i > 0)
                    Divider(
                      height: 1,
                      thickness: 1,
                      color: theme.brightness == Brightness.dark ? twSlate800 : twSlate200,
                    ),
                  _PlayerRow(
                    player: player,
                    stats: stats[player.key] ?? PlayerSeasonStats(player.key),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PlayerRow extends StatelessWidget {
  const _PlayerRow({required this.player, required this.stats});

  final Player player;
  final PlayerSeasonStats stats;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    final cardsTotal = stats.yellowCards + stats.redCards;
    final tabular = const [FontFeature.tabularFigures()];

    return InkWell(
      onTap: () => showPlayerSheet(context, player, stats),
      child: Container(
        constraints: const BoxConstraints(minHeight: 56),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            SizedBox(
              width: 32,
              child: Text(
                player.shirtNumber != null ? '#${player.shirtNumber}' : '—',
                textAlign: TextAlign.right,
                style: condensed(
                  size: 15,
                  color: colors.mutedForeground,
                  letterSpacing: 0.5,
                ).copyWith(fontFeatures: tabular),
              ),
            ),
            const SizedBox(width: 12),
            PlayerAvatar(player: player, size: 36),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                player.displayName(app.language).toUpperCase(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: condensed(
                  size: 16,
                  color: colors.foreground,
                  letterSpacing: 0.8,
                ),
              ),
            ),
            SizedBox(
              width: 28,
              child: Text(
                '${stats.apps}',
                textAlign: TextAlign.right,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: colors.foreground,
                  fontFeatures: tabular,
                ),
              ),
            ),
            const SizedBox(width: 12),
            SizedBox(
              width: 20,
              child: Text(
                '${stats.goals}',
                textAlign: TextAlign.right,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: brandRed,
                  fontFeatures: tabular,
                ),
              ),
            ),
            const SizedBox(width: 12),
            SizedBox(
              width: 20,
              child: Text(
                '$cardsTotal',
                textAlign: TextAlign.right,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: colors.mutedForeground,
                  fontFeatures: tabular,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Icon(Icons.chevron_right, size: 16, color: colors.mutedForeground),
          ],
        ),
      ),
    );
  }
}
