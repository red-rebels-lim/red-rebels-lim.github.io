import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/constants.dart';
import '../logic/football_stats.dart';
import '../models/events.dart';
import '../state/app_state.dart';
import '../theme.dart';
import 'event_details_sheet.dart';
import 'team_logo.dart';

/// One event row in list/day views. Tapping opens the details sheet.
class EventCard extends StatelessWidget {
  const EventCard({super.key, required this.event, required this.monthName});

  final SportEvent event;
  final String monthName;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final opponent = app.teamName(event.opponent);
    final isHome = event.location == MatchLocation.home;
    final result = event.isPlayed ? matchResult(event.score, event.location, event.penalties) : null;

    final resultColor = switch (result) {
      MatchResult.win => winGreen,
      MatchResult.draw => drawAmber,
      MatchResult.loss => lossRed,
      null => theme.colorScheme.outline,
    };

    return Card(
      color: theme.colorScheme.surfaceContainerLow,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => showEventDetailsSheet(context, event, monthName),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 48,
                decoration: BoxDecoration(
                  color: sportColor(event.sport),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 10),
              TeamLogo(logoPath: event.logo, name: opponent),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isHome ? '$teamName – $opponent' : '$opponent – $teamName',
                      style: theme.textTheme.titleSmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      [
                        '${sportEmoji[event.sport.id]} ${app.t(_sportKey(event.sport))}',
                        if (event.isCup) app.t('calendar.cup'),
                        '$monthDayLabel ${event.time.isEmpty ? app.t('popover.tbd') : event.time}',
                      ].join(' · '),
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              if (event.isPlayed && event.score != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: resultColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    event.score!,
                    style: TextStyle(fontWeight: FontWeight.bold, color: resultColor),
                  ),
                )
              else
                Icon(
                  isHome ? Icons.home_outlined : Icons.directions_bus_outlined,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
            ],
          ),
        ),
      ),
    );
  }

  String get monthDayLabel => '${event.day}';
}

String _sportKey(Sport sport) => switch (sport) {
      Sport.footballMen => 'sports.footballMen',
      Sport.volleyballMen => 'sports.volleyballMen',
      Sport.volleyballWomen => 'sports.volleyballWomen',
      Sport.meeting => 'sports.meeting',
    };

String sportLabelKey(Sport sport) => _sportKey(sport);
