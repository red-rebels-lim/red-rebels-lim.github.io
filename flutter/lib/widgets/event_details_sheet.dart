import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/constants.dart';
import '../logic/football_stats.dart';
import '../models/events.dart';
import '../state/app_state.dart';
import '../theme.dart';
import 'team_logo.dart';

void showEventDetailsSheet(BuildContext context, SportEvent event, String monthName) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.6,
      maxChildSize: 0.95,
      builder: (context, controller) => SingleChildScrollView(
        controller: controller,
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
        child: _EventDetails(event: event, monthName: monthName),
      ),
    ),
  );
}

class _EventDetails extends StatelessWidget {
  const _EventDetails({required this.event, required this.monthName});

  final SportEvent event;
  final String monthName;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final isHome = event.location == MatchLocation.home;
    final opponent = app.teamName(event.opponent);
    final homeName = isHome ? app.teamName('ΝΕΑ ΣΑΛΑΜΙΝΑ') : opponent;
    final awayName = isHome ? opponent : app.teamName('ΝΕΑ ΣΑΛΑΜΙΝΑ');
    final info = monthInfo(monthName);
    final result = event.isPlayed ? matchResult(event.score, event.location, event.penalties) : null;
    final resultColor = switch (result) {
      MatchResult.win => winGreen,
      MatchResult.draw => drawAmber,
      MatchResult.loss => lossRed,
      null => theme.colorScheme.onSurface,
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Header: badges
        Wrap(
          spacing: 8,
          alignment: WrapAlignment.center,
          children: [
            _Badge(
              label: '${sportEmoji[event.sport.id]} ${app.t(_sportKey(event.sport))}',
              color: sportColor(event.sport),
            ),
            if (event.isCup) _Badge(label: app.t('calendar.cup'), color: theme.colorScheme.tertiary),
            if (event.matchday != null)
              _Badge(label: '${app.t('stats.matchday')} ${event.matchday}', color: theme.colorScheme.outline),
            _Badge(
              label: app.t(isHome ? 'locations.home' : 'locations.away'),
              color: theme.colorScheme.secondary,
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Teams + score
        Row(
          children: [
            Expanded(
              child: Column(
                children: [
                  isHome
                      // Decorative: the team name is rendered as text directly below.
                      ? Image.asset(ownLogoAsset, width: 56, height: 56, excludeFromSemantics: true, errorBuilder: (_, _, _) => const SizedBox(width: 56, height: 56))
                      : TeamLogo(logoPath: event.logo, name: opponent, size: 56),
                  const SizedBox(height: 8),
                  Text(homeName, textAlign: TextAlign.center, style: theme.textTheme.titleSmall),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Column(
                children: [
                  if (event.isPlayed && event.score != null) ...[
                    Text(
                      _displayScore(event),
                      style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold, color: resultColor),
                    ),
                    if (event.penalties != null)
                      Text(
                        '${app.t('calendar.penalties')}: ${event.penalties}',
                        style: theme.textTheme.bodySmall,
                      ),
                  ] else ...[
                    Text(
                      event.time.isEmpty ? app.t('popover.tbd') : event.time,
                      style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    Text(app.t('popover.upcoming'), style: theme.textTheme.bodySmall),
                  ],
                ],
              ),
            ),
            Expanded(
              child: Column(
                children: [
                  isHome
                      ? TeamLogo(logoPath: event.logo, name: opponent, size: 56)
                      // Decorative: the team name is rendered as text directly below.
                      : Image.asset(ownLogoAsset, width: 56, height: 56, excludeFromSemantics: true, errorBuilder: (_, _, _) => const SizedBox(width: 56, height: 56)),
                  const SizedBox(height: 8),
                  Text(awayName, textAlign: TextAlign.center, style: theme.textTheme.titleSmall),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          '${app.t('months.$monthName')} ${event.day}, ${info.year}',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
        if (event.venue != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.location_on_outlined, size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Flexible(
                  child: Text(
                    app.venueName(event.venue!),
                    style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                ),
              ],
            ),
          ),

        // Volleyball sets
        if (event.sets != null && event.sets!.isNotEmpty) ...[
          const SizedBox(height: 20),
          _SectionTitle(app.t('popover.sets')),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (final (i, set) in event.sets!.indexed)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Column(
                    children: [
                      Text('${app.t('popover.set')} ${i + 1}', style: theme.textTheme.labelSmall),
                      const SizedBox(height: 2),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text('${set.home}-${set.away}', style: const TextStyle(fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ],

        // Volleyball top scorers
        if (event.vbScorers != null && event.vbScorers!.isNotEmpty) ...[
          const SizedBox(height: 20),
          _SectionTitle(app.t('popover.vbScorers')),
          const SizedBox(height: 8),
          // Data lists home-team scorers before away-team scorers, so sort by
          // points (like the web popover) before taking the top entries.
          for (final s in ([...event.vbScorers!]..sort((a, b) => b.points.compareTo(a.points))).take(5))
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: [
                  Expanded(child: Text(app.i18n.playerName(s.name))),
                  Text('${s.points}', style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
        ],

        // Goalscorers
        if (event.scorers != null && event.scorers!.isNotEmpty) ...[
          const SizedBox(height: 20),
          _SectionTitle(app.t('popover.goalscorers')),
          const SizedBox(height: 8),
          for (final s in event.scorers!)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: [
                  const Text('⚽ '),
                  Expanded(
                    child: Text(
                      '${app.i18n.playerName(s.name)}'
                      '${s.type == 'pen' ? ' (${app.t('popover.pen')})' : ''}'
                      '${s.type == 'og' ? ' (${app.t('popover.og')})' : ''}',
                    ),
                  ),
                  Text("${s.minute}'", style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
                ],
              ),
            ),
        ],

        // Bookings
        if (event.bookings != null && event.bookings!.isNotEmpty) ...[
          const SizedBox(height: 20),
          _SectionTitle(app.t('popover.bookings')),
          const SizedBox(height: 8),
          for (final b in event.bookings!)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: [
                  Text(b.card == 'red' ? '🟥 ' : '🟨 '),
                  Expanded(child: Text(app.i18n.playerName(b.name))),
                  Text("${b.minute}'", style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
                ],
              ),
            ),
        ],

        // Substitutions
        if (event.subs != null && event.subs!.isNotEmpty) ...[
          const SizedBox(height: 20),
          _SectionTitle(app.t('popover.substitutions')),
          const SizedBox(height: 8),
          for (final sub in event.subs!)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: [
                  Expanded(
                    child: Text.rich(
                      TextSpan(children: [
                        const TextSpan(text: '▲ ', style: TextStyle(color: winGreen)),
                        TextSpan(text: app.i18n.playerName(sub.playerOn)),
                        const TextSpan(text: '  ▼ ', style: TextStyle(color: lossRed)),
                        TextSpan(text: app.i18n.playerName(sub.playerOff)),
                      ]),
                    ),
                  ),
                  Text("${sub.minute}'", style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
                ],
              ),
            ),
        ],
      ],
    );
  }

  /// Score shown home-team-first, like the web popover.
  String _displayScore(SportEvent e) => e.score ?? '';
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Text(
      text,
      style: theme.textTheme.labelLarge?.copyWith(
        color: theme.colorScheme.onSurfaceVariant,
        letterSpacing: 1.2,
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

String _sportKey(Sport sport) => switch (sport) {
      Sport.footballMen => 'sports.footballMen',
      Sport.volleyballMen => 'sports.volleyballMen',
      Sport.volleyballWomen => 'sports.volleyballWomen',
      Sport.meeting => 'sports.meeting',
    };
