import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../logic/football_stats.dart';
import '../logic/volleyball_stats.dart';
import '../models/events.dart';
import '../state/app_state.dart';
import '../theme.dart';

class StatsPage extends StatelessWidget {
  const StatsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    return DefaultTabController(
      length: 3,
      child: Container(
        margin: const EdgeInsets.fromLTRB(8, 8, 8, 0),
        decoration: BoxDecoration(
          color: colors.surfacePanel,
          borderRadius: BorderRadius.circular(colors.panelRadius),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  app.t('nav.stats').toUpperCase(),
                  style: condensed(size: 18, color: colors.foreground, letterSpacing: 1.5),
                ),
              ),
            ),
            TabBar(
              indicatorColor: brandRed,
              labelColor: brandRed,
              unselectedLabelColor: colors.mutedForeground,
              labelStyle: condensed(size: 13, letterSpacing: 0.5),
              tabs: [
                Tab(text: '⚽ ${app.t('stats.mensFootball')}'),
                Tab(text: '🏐 ${app.t('stats.mensVolleyball')}'),
                Tab(text: '🏐 ${app.t('stats.womensVolleyball')}'),
              ],
            ),
            const Expanded(
              child: TabBarView(
                children: [
                  _FootballStatsTab(),
                  _VolleyballStatsTab(sport: Sport.volleyballMen),
                  _VolleyballStatsTab(sport: Sport.volleyballWomen),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FootballStatsTab extends StatelessWidget {
  const _FootballStatsTab();

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final stats = calculateFootballStats(app.events);

    if (stats.overall.played == 0) {
      return Center(child: Text(app.t('stats.noMatchesYet')));
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _SectionCard(
          title: app.t('stats.overallStats'),
          child: Column(
            children: [
              Row(
                children: [
                  _StatBox(label: app.t('stats.matches'), value: '${stats.overall.played}'),
                  _StatBox(label: app.t('stats.wins'), value: '${stats.overall.wins}', color: winGreen),
                  _StatBox(label: app.t('stats.draws'), value: '${stats.overall.draws}', color: drawAmber),
                  _StatBox(label: app.t('stats.losses'), value: '${stats.overall.losses}', color: lossRed),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _StatBox(label: app.t('stats.points'), value: '${stats.overall.points}'),
                  _StatBox(label: app.t('stats.winPct'), value: '${stats.overall.winPercentage}%'),
                  _StatBox(label: app.t('stats.goals'), value: '${stats.overall.goalsFor}-${stats.overall.goalsAgainst}'),
                  _StatBox(
                    label: app.t('stats.goalDifference'),
                    value: stats.overall.goalDifference >= 0 ? '+${stats.overall.goalDifference}' : '${stats.overall.goalDifference}',
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _StatBox(label: app.t('stats.cleanSheets'), value: '${stats.cleanSheets}'),
                  _StatBox(label: app.t('stats.avgGoalsFor'), value: '${stats.avgGoalsFor}'),
                  _StatBox(label: app.t('stats.avgGoalsAgainst'), value: '${stats.avgGoalsAgainst}'),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _SectionCard(
          title: app.t('stats.recentForm'),
          child: _FormRow(results: [for (final m in stats.recentForm) (m.result, app.teamName(m.opponent), m.score)]),
        ),
        const SizedBox(height: 16),
        _SectionCard(
          title: app.t('stats.homeVsAway'),
          child: Column(
            children: [
              _SplitRow(label: app.t('stats.home'), stats: _splitText(stats.home), winPct: stats.home.winPercentage),
              const SizedBox(height: 8),
              _SplitRow(label: app.t('stats.away'), stats: _splitText(stats.away), winPct: stats.away.winPercentage),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _SectionCard(
          title: app.t('stats.streaks'),
          child: Column(
            children: [
              _KeyValueRow(app.t('stats.currentStreak'), _streakLabel(app, stats.currentStreak)),
              _KeyValueRow(app.t('stats.longestWinStreak'), '${stats.longestWinStreak}'),
              _KeyValueRow(app.t('stats.longestUnbeatenStreak'), '${stats.longestUnbeatenStreak}'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _SectionCard(
          title: app.t('stats.records'),
          child: Column(
            children: [
              if (stats.biggestWin != null)
                _KeyValueRow(app.t('stats.biggestWin'), '${app.teamName(stats.biggestWin!.opponent)} (${stats.biggestWin!.score})'),
              if (stats.heaviestDefeat != null)
                _KeyValueRow(app.t('stats.heaviestDefeat'), '${app.teamName(stats.heaviestDefeat!.opponent)} (${stats.heaviestDefeat!.score})'),
              if (stats.biggestWin == null && stats.heaviestDefeat == null) Text(app.t('stats.noData')),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _SectionCard(
          title: app.t('stats.seasonProgress'),
          subtitle: app.t('stats.seasonProgressSummary'),
          child: SizedBox(
            height: 140,
            child: CustomPaint(
              size: Size.infinite,
              painter: _SparklinePainter(
                values: [0, ...stats.pointsProgression.map((p) => p.points.toDouble())],
                color: brandRed,
                gridColor: Theme.of(context).colorScheme.outlineVariant,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        _SectionCard(
          title: app.t('stats.headToHead'),
          child: _H2HTable(
            rows: [
              for (final h in stats.headToHead.take(10))
                (app.teamName(h.opponent), h.played, h.wins, h.draws, h.losses, '${h.goalsFor}-${h.goalsAgainst}'),
            ],
            hasDraws: true,
          ),
        ),
      ],
    );
  }

  String _splitText(TeamStats s) => '${s.played}P ${s.wins}W ${s.draws}D ${s.losses}L · ${s.goalsFor}-${s.goalsAgainst}';

  String _streakLabel(AppState app, StreakInfo streak) {
    final type = switch (streak.type) {
      'W' => app.t('stats.wins'),
      'D' => app.t('stats.draws'),
      'L' => app.t('stats.losses'),
      _ => app.t('stats.longestUnbeatenStreak'),
    };
    return '${streak.count} $type';
  }
}

class _VolleyballStatsTab extends StatelessWidget {
  const _VolleyballStatsTab({required this.sport});

  final Sport sport;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final stats = calculateVolleyballStats(app.events, sport);

    if (stats.overall.played == 0) {
      return Center(child: Text(app.t('stats.noMatchesYet')));
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _SectionCard(
          title: app.t('stats.overallStats'),
          child: Column(
            children: [
              Row(
                children: [
                  _StatBox(label: app.t('stats.matches'), value: '${stats.overall.played}'),
                  _StatBox(label: app.t('stats.winsCount'), value: '${stats.overall.wins}', color: winGreen),
                  _StatBox(label: app.t('stats.lossesCount'), value: '${stats.overall.losses}', color: lossRed),
                  _StatBox(label: app.t('stats.winRate'), value: '${stats.overall.winPercentage}%'),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _StatBox(label: app.t('stats.setsWon'), value: '${stats.overall.setsWon}'),
                  _StatBox(label: app.t('stats.setsLost'), value: '${stats.overall.setsLost}'),
                  _StatBox(label: app.t('stats.setWinPct'), value: '${stats.overall.setWinPercentage}%'),
                  _StatBox(label: app.t('stats.totalPoints'), value: '${stats.overall.pointsScored}'),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _SectionCard(
          title: app.t('stats.recentForm'),
          child: _FormRow(results: [for (final m in stats.recentForm) (m.result, app.teamName(m.opponent), m.score)]),
        ),
        const SizedBox(height: 16),
        _SectionCard(
          title: app.t('stats.setBreakdown'),
          child: Row(
            children: [
              _StatBox(label: '3-0', value: '${stats.setBreakdown.threeZero}', color: winGreen),
              _StatBox(label: '3-1', value: '${stats.setBreakdown.threeOne}', color: winGreen),
              _StatBox(label: '3-2', value: '${stats.setBreakdown.threeTwo}', color: winGreen),
              _StatBox(label: '2-3', value: '${stats.setBreakdown.twoThree}', color: lossRed),
              _StatBox(label: '1-3', value: '${stats.setBreakdown.oneThree}', color: lossRed),
              _StatBox(label: '0-3', value: '${stats.setBreakdown.zeroThree}', color: lossRed),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _SectionCard(
          title: app.t('stats.homeVsAway'),
          child: Column(
            children: [
              _SplitRow(
                label: app.t('stats.home'),
                stats: '${stats.home.played}P ${stats.home.wins}W ${stats.home.losses}L · ${stats.home.setsWon}-${stats.home.setsLost}',
                winPct: stats.home.winPercentage,
              ),
              const SizedBox(height: 8),
              _SplitRow(
                label: app.t('stats.away'),
                stats: '${stats.away.played}P ${stats.away.wins}W ${stats.away.losses}L · ${stats.away.setsWon}-${stats.away.setsLost}',
                winPct: stats.away.winPercentage,
              ),
            ],
          ),
        ),
        if (stats.topScorers.isNotEmpty) ...[
          const SizedBox(height: 16),
          _SectionCard(
            title: app.t('stats.topScorers'),
            child: Column(
              children: [
                for (final (i, s) in stats.topScorers.indexed)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        SizedBox(width: 24, child: Text('${i + 1}.', style: const TextStyle(fontWeight: FontWeight.bold))),
                        Expanded(child: Text(app.i18n.playerName(s.name), maxLines: 1, overflow: TextOverflow.ellipsis)),
                        Text('${s.totalPoints}', style: const TextStyle(fontWeight: FontWeight.bold)),
                        Text(' / ${s.matchesPlayed}', style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),
        _SectionCard(
          title: app.t('stats.records'),
          child: Column(
            children: [
              if (stats.biggestWin != null)
                _KeyValueRow(app.t('stats.biggestWin'), '${app.teamName(stats.biggestWin!.opponent)} (${stats.biggestWin!.score})'),
              if (stats.heaviestDefeat != null)
                _KeyValueRow(app.t('stats.heaviestDefeat'), '${app.teamName(stats.heaviestDefeat!.opponent)} (${stats.heaviestDefeat!.score})'),
              if (stats.biggestWin == null && stats.heaviestDefeat == null) Text(app.t('stats.noData')),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _SectionCard(
          title: app.t('stats.headToHead'),
          child: _H2HTable(
            rows: [
              for (final h in stats.headToHead.take(10))
                (app.teamName(h.opponent), h.played, h.wins, null, h.losses, '${h.setsWon}-${h.setsLost}'),
            ],
            hasDraws: false,
          ),
        ),
      ],
    );
  }
}

// --- shared building blocks ---

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, this.subtitle, required this.child});

  final String title;
  final String? subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      color: theme.colorScheme.surfaceContainerLow,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
            if (subtitle != null)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(subtitle!, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
              ),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  const _StatBox({required this.label, required this.value, this.color});

  final String label;
  final String value;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Column(
        children: [
          Text(value, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            maxLines: 2,
          ),
        ],
      ),
    );
  }
}

class _FormRow extends StatelessWidget {
  const _FormRow({required this.results});

  /// (result, opponent, score)
  final List<(String, String, String)> results;

  @override
  Widget build(BuildContext context) {
    if (results.isEmpty) return Text(Provider.of<AppState>(context, listen: false).t('stats.noData'));
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        for (final (result, opponent, score) in results)
          Tooltip(
            message: '$opponent $score',
            triggerMode: TooltipTriggerMode.tap,
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(shape: BoxShape.circle, color: formColor(result)),
              alignment: Alignment.center,
              child: Text(result, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
      ],
    );
  }
}

class _SplitRow extends StatelessWidget {
  const _SplitRow({required this.label, required this.stats, required this.winPct});

  final String label;
  final String stats;
  final int winPct;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(label, style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold)),
            const Spacer(),
            Text(stats, style: theme.textTheme.bodySmall),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: winPct / 100,
            minHeight: 8,
            backgroundColor: theme.colorScheme.surfaceContainerHighest,
            color: brandRed,
          ),
        ),
        const SizedBox(height: 2),
        Text('$winPct%', style: theme.textTheme.labelSmall),
      ],
    );
  }
}

class _KeyValueRow extends StatelessWidget {
  const _KeyValueRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: Text(label, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant))),
          const SizedBox(width: 12),
          Flexible(child: Text(value, textAlign: TextAlign.end, style: const TextStyle(fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}

class _H2HTable extends StatelessWidget {
  const _H2HTable({required this.rows, required this.hasDraws});

  /// (opponent, played, wins, draws (null for volleyball), losses, goals/sets)
  final List<(String, int, int, int?, int, String)> rows;
  final bool hasDraws;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    if (rows.isEmpty) return Text(app.t('stats.noData'));

    TextStyle? headerStyle = theme.textTheme.labelSmall?.copyWith(
      color: theme.colorScheme.onSurfaceVariant,
      fontWeight: FontWeight.bold,
    );

    return Table(
      columnWidths: {
        0: const FlexColumnWidth(3),
        1: const FlexColumnWidth(1),
        2: const FlexColumnWidth(1),
        if (hasDraws) 3: const FlexColumnWidth(1),
        hasDraws ? 4 : 3: const FlexColumnWidth(1),
        hasDraws ? 5 : 4: const FlexColumnWidth(2),
      },
      children: [
        TableRow(
          children: [
            Text(app.t('stats.opponent'), style: headerStyle),
            Text(app.t('stats.played'), style: headerStyle, textAlign: TextAlign.center),
            Text(app.t('stats.w'), style: headerStyle, textAlign: TextAlign.center),
            if (hasDraws) Text(app.t('stats.d'), style: headerStyle, textAlign: TextAlign.center),
            Text(app.t('stats.l'), style: headerStyle, textAlign: TextAlign.center),
            Text(app.t('stats.goalsCol'), style: headerStyle, textAlign: TextAlign.end),
          ],
        ),
        for (final (opponent, played, wins, draws, losses, goals) in rows)
          TableRow(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Text(opponent, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall),
              ),
              Text('$played', textAlign: TextAlign.center, style: theme.textTheme.bodySmall),
              Text('$wins', textAlign: TextAlign.center, style: theme.textTheme.bodySmall?.copyWith(color: winGreen, fontWeight: FontWeight.bold)),
              if (hasDraws)
                Text('${draws ?? 0}', textAlign: TextAlign.center, style: theme.textTheme.bodySmall),
              Text('$losses', textAlign: TextAlign.center, style: theme.textTheme.bodySmall?.copyWith(color: lossRed)),
              Text(goals, textAlign: TextAlign.end, style: theme.textTheme.bodySmall),
            ],
          ),
      ],
    );
  }
}

/// Lightweight line chart for points progression (replaces the web app's
/// charting library).
class _SparklinePainter extends CustomPainter {
  _SparklinePainter({required this.values, required this.color, required this.gridColor});

  final List<double> values;
  final Color color;
  final Color gridColor;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.length < 2) return;
    final maxValue = values.reduce((a, b) => a > b ? a : b);
    if (maxValue == 0) return;

    final gridPaint = Paint()
      ..color = gridColor
      ..strokeWidth = 0.5;
    for (var i = 1; i <= 3; i++) {
      final y = size.height * i / 4;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final path = Path();
    for (var i = 0; i < values.length; i++) {
      final x = size.width * i / (values.length - 1);
      final y = size.height - (values[i] / maxValue) * size.height;
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    final fillPath = Path.from(path)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(
      fillPath,
      Paint()..color = color.withValues(alpha: 0.12),
    );
    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..strokeWidth = 2.5
        ..style = PaintingStyle.stroke
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(_SparklinePainter oldDelegate) =>
      oldDelegate.values != values || oldDelegate.color != color;
}
