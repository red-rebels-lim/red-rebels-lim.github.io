import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../i18n/i18n.dart';
import '../logic/squad_stats.dart';
import '../models/events.dart';
import '../models/players.dart';
import '../state/app_state.dart';
import '../theme.dart';
import 'player_avatar.dart';

void showPlayerSheet(
  BuildContext context,
  Player player,
  // null for rosters without per-player season stats (volleyball) — the
  // sheet shows the bio header only.
  PlayerSeasonStats? stats,
) {
  // Web sheet chrome: no drag handle, close X inside the content (QA SQD-03).
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (_) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      maxChildSize: 0.95,
      builder: (context, controller) => SingleChildScrollView(
        controller: controller,
        // Edge-to-edge: keep the last content above the gesture bar.
        padding: EdgeInsets.fromLTRB(
            20, 12, 20, 32 + MediaQuery.viewPaddingOf(context).bottom),
        child: _PlayerDetails(player: player, stats: stats),
      ),
    ),
  );
}

int? _computeAge(String? dateOfBirth) {
  if (dateOfBirth == null) return null;
  final dob = DateTime.tryParse(dateOfBirth);
  if (dob == null) return null;
  final today = DateTime.now();
  var age = today.year - dob.year;
  if (today.month < dob.month ||
      (today.month == dob.month && today.day < dob.day)) {
    age--;
  }
  return age;
}

/// Player detail sheet content, ported from the web PlayerSheet.
class _PlayerDetails extends StatefulWidget {
  const _PlayerDetails({required this.player, required this.stats});

  final Player player;
  final PlayerSeasonStats? stats;

  @override
  State<_PlayerDetails> createState() => _PlayerDetailsState();
}

class _PlayerDetailsState extends State<_PlayerDetails> {
  bool _matchLogExpanded = false;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final colors = AppColors.of(context);
    final player = widget.player;
    final stats = widget.stats;
    final age = _computeAge(player.dateOfBirth);
    final reversedLog = stats?.matchLog.reversed.toList() ?? [];
    final visibleLog = _matchLogExpanded
        ? reversedLog
        : reversedLog.take(5).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // ── Close X (web Radix sheet chrome) ──
        Align(
          alignment: Alignment.centerRight,
          child: IconButton(
            icon: const Icon(Icons.close, size: 20),
            color: colors.mutedForeground,
            tooltip: MaterialLocalizations.of(context).closeButtonTooltip,
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        // ── Header: avatar + name + bio badges ──
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            PlayerAvatar(player: player, size: 64),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text.rich(
                    TextSpan(
                      children: [
                        if (player.shirtNumber != null)
                          TextSpan(
                            text: '#${player.shirtNumber} ',
                            style: const TextStyle(color: brandRed),
                          ),
                        TextSpan(
                          text: player.displayName(app.language).upperNoTonos,
                        ),
                      ],
                    ),
                    style: condensed(
                      size: 24,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: brandRed.withValues(alpha: 0.1),
                          borderRadius: colors.br(6),
                        ),
                        child: Text(
                          app
                              .t('squad.positions.${player.position.id}')
                              .upperNoTonos,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.8,
                            color: brandRed,
                          ),
                        ),
                      ),
                      if (player.subPosition != null)
                        Text(
                          app.t('squad.subPositions.${player.subPosition}'),
                          style: TextStyle(
                            fontSize: 13,
                            color: colors.mutedForeground,
                          ),
                        ),
                      if (age != null)
                        Text(
                          I18n.interpolate(app.t('squad.modal.age'), {
                            'age': age,
                          }),
                          style: TextStyle(
                            fontSize: 13,
                            color: colors.mutedForeground,
                          ),
                        ),
                      if (player.nationality != null)
                        Text(
                          player.nationality!,
                          style: TextStyle(
                            fontSize: 13,
                            color: colors.mutedForeground,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // Volleyball rosters have no per-player season stats yet — bio only.
        if (stats == null)
          const SizedBox.shrink()
        else if (stats.apps == 0)
          // ── No appearances yet ──
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              border: Border.all(color: colors.border),
              borderRadius: colors.br(8),
            ),
            child: Text(
              app.t('squad.modal.noApps'),
              textAlign: TextAlign.center,
              style: TextStyle(color: colors.mutedForeground),
            ),
          )
        else ...[
          // ── Season stats grid ──
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: _StatTile(
                    label: app.t('squad.modal.played'),
                    value: '${stats.apps}',
                    detail: I18n.interpolate(
                      app.t('squad.modal.startsAndSubs'),
                      {'starts': stats.starts, 'subs': stats.subAppearances},
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatTile(
                    label: app.t('squad.modal.goals'),
                    value: '${stats.goals}',
                    detail:
                        I18n.interpolate(app.t('squad.modal.goalBreakdown'), {
                          'openPlay': stats.goalsOpenPlay,
                          'penalty': stats.goalsPenalty,
                          'og': stats.ownGoals,
                        }),
                    emphasis: true,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatTile(
                    label: app.t('squad.modal.cards'),
                    value: '${stats.yellowCards}/${stats.redCards}',
                    detail: app.t('squad.modal.cardsBreakdown'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ── Match log ──
          Row(
            children: [
              Expanded(
                child: Text(
                  app.t('squad.modal.matchLog').upperNoTonos,
                  style: condensed(
                    size: 13,
                    color: colors.mutedForeground,
                    letterSpacing: 1.5,
                  ),
                ),
              ),
              if (reversedLog.length > 5)
                TextButton.icon(
                  onPressed: () =>
                      setState(() => _matchLogExpanded = !_matchLogExpanded),
                  style: TextButton.styleFrom(
                    foregroundColor: brandRed,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  icon: Icon(
                    _matchLogExpanded ? Icons.expand_less : Icons.expand_more,
                    size: 16,
                  ),
                  iconAlignment: IconAlignment.end,
                  label: Text(
                    app
                        .t(
                          _matchLogExpanded
                              ? 'squad.modal.collapse'
                              : 'squad.modal.expand',
                        )
                        .upperNoTonos,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          for (final entry in visibleLog) _MatchLogRow(entry: entry),
        ],
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.label,
    required this.value,
    this.detail,
    this.emphasis = false,
  });

  final String label;
  final String value;
  final String? detail;
  final bool emphasis;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = AppColors.of(context);
    final dark = theme.brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(12),
      // Web StatTile: `bg-white/70 dark:bg-[#1a1a1a]/50 border-slate-200
      // dark:border-slate-800` (QA SQD-01).
      decoration: BoxDecoration(
        color: dark ? const Color(0x801A1A1A) : const Color(0xB3FFFFFF),
        border: Border.all(color: dark ? twSlate800 : twSlate200),
        borderRadius: colors.br(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.upperNoTonos,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
              color: colors.mutedForeground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: condensed(
              size: 24,
              color: emphasis ? brandRed : theme.colorScheme.onSurface,
            ).copyWith(fontFeatures: const [FontFeature.tabularFigures()]),
          ),
          if (detail != null) ...[
            const SizedBox(height: 4),
            // Web keeps the detail on one line (`text-[11px]`, QA SQD-02);
            // scale down rather than wrap when the tile is narrow.
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                detail!,
                maxLines: 1,
                style: TextStyle(fontSize: 11, color: colors.mutedForeground),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _MatchLogRow extends StatelessWidget {
  const _MatchLogRow({required this.entry});

  final PlayerMatchAppearance entry;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final colors = AppColors.of(context);
    final opponent = app.teamName(entry.opponent);
    // 'start' → green S badge, 'sub' → grey B badge, 'none' → no badge (web parity).
    final (badgeLabel, badgeColor) = switch (entry.appearance) {
      'start' => (app.t('squad.modal.start'), winGreen),
      'sub' => (app.t('squad.modal.sub'), colors.mutedForeground),
      _ => (null, null),
    };

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 56,
            child: Text(
              // Web parity: English month key abbreviation, e.g. "SEP 4".
              '${entry.month.substring(0, 3).upperNoTonos} ${entry.day}',
              style: TextStyle(fontSize: 12, color: colors.mutedForeground),
            ),
          ),
          if (badgeLabel != null) ...[
            Container(
              width: 20,
              height: 20,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: badgeColor!.withValues(alpha: 0.15),
                borderRadius: colors.br(4),
              ),
              child: Text(
                badgeLabel,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: badgeColor,
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: Text(
              '${entry.location == MatchLocation.away ? '@ ' : ''}$opponent',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.bodyMedium,
            ),
          ),
          if (entry.score != null) ...[
            const SizedBox(width: 8),
            Text(
              entry.score!,
              style: TextStyle(fontSize: 12, color: colors.mutedForeground),
            ),
          ],
          if (entry.goals > 0) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                color: brandRed.withValues(alpha: 0.15),
                borderRadius: colors.br(4),
              ),
              child: Text(
                '${entry.goals}⚽',
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: brandRed,
                ),
              ),
            ),
          ],
          if (entry.yellowCard) ...[
            const SizedBox(width: 8),
            Container(
              width: 10,
              height: 14,
              decoration: BoxDecoration(
                color: drawAmber,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
          if (entry.redCard) ...[
            const SizedBox(width: 8),
            Container(
              width: 10,
              height: 14,
              decoration: BoxDecoration(
                color: lossRed,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
