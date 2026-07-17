import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../logic/football_stats.dart';
import '../models/events.dart';
import '../state/app_state.dart';
import '../theme.dart';
import 'event_card.dart' show matchTitle, sportLabelKey;
import 'event_details_sheet.dart';

/// Sectioned Played/Upcoming list (port of CalendarListView.tsx).
class CalendarListView extends StatelessWidget {
  const CalendarListView({super.key, required this.monthName, required this.events});

  final String monthName;

  /// Month events, already filtered and sorted by day.
  final List<SportEvent> events;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);

    if (events.isEmpty) {
      return Center(
        child: Text(
          app.t('calendar.noEvents'),
          style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
      );
    }

    final played = events.where((e) => e.isPlayed).toList();
    final upcoming = events.where((e) => !e.isPlayed).toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      children: [
        if (played.isNotEmpty) ...[
          _SectionLabel(text: app.t('calendar.played')),
          for (final e in played) _ListRow(event: e, monthName: monthName),
        ],
        if (upcoming.isNotEmpty) ...[
          _SectionLabel(text: app.t('calendar.upcomingSection')),
          for (final e in upcoming) _ListRow(event: e, monthName: monthName),
        ],
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Text(
            text.upperNoTonos,
            style: condensed(size: 12, color: colors.mutedForeground, letterSpacing: 2),
          ),
          const SizedBox(width: 8),
          Expanded(child: Container(height: 1, color: colors.primaryBorderSubtle)),
        ],
      ),
    );
  }
}

class _ListRow extends StatelessWidget {
  const _ListRow({required this.event, required this.monthName});

  final SportEvent event;
  final String monthName;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final colors = AppColors.of(context);
    final result = event.isPlayed ? matchResult(event.score, event.location, event.penalties) : null;
    // Web ListItem `resultColors`: text-green-500 / text-yellow-500 / text-red-500.
    final resultColor = switch (result) {
      MatchResult.win => twGreen500,
      MatchResult.draw => twYellow500,
      MatchResult.loss => twRed500,
      null => theme.colorScheme.onSurface,
    };
    final monthAbbrev = app.t('months.$monthName');
    final hasTime = event.time.contains(':');

    return InkWell(
      onTap: () => showEventDetailsSheet(context, event, monthName),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(color: colors.primaryBorderSubtle.withValues(alpha: 0.5)),
          ),
        ),
        child: Row(
          children: [
            // Date or score badge.
            SizedBox(
              width: 48,
              child: event.isPlayed && event.score != null
                  ? Text(
                      event.score!,
                      textAlign: TextAlign.center,
                      style: condensed(size: 16, color: resultColor),
                    )
                  : Column(
                      children: [
                        Text('${event.day}', style: condensed(size: 18, color: theme.colorScheme.onSurface)),
                        Text(
                          monthAbbrev.substring(0, monthAbbrev.length < 3 ? monthAbbrev.length : 3).upperNoTonos,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                            color: colors.mutedForeground,
                          ),
                        ),
                      ],
                    ),
            ),
            const SizedBox(width: 12),
            // Info.
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text.rich(
                    TextSpan(children: [
                      TextSpan(
                        text: app.t(sportLabelKey(event.sport)).upperNoTonos,
                        style: condensed(size: 10, color: sportColor(event.sport), letterSpacing: 1.5),
                      ),
                      if (event.isCup)
                        // Web: `text-amber-500` cup tag.
                        TextSpan(
                          text: '  ${app.t('calendar.cup').upperNoTonos}',
                          style: condensed(size: 10, color: twAmber500, letterSpacing: 1.5),
                        ),
                      if (event.isFriendly)
                        // Web: `text-sky-500` friendly tag.
                        TextSpan(
                          text: '  ${app.t('calendar.friendly').upperNoTonos}',
                          style: condensed(size: 10, color: twSky500, letterSpacing: 1.5),
                        ),
                    ]),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    matchTitle(app, event),
                    style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    [
                      app.t(event.location == MatchLocation.home ? 'locations.home' : 'locations.away'),
                      if (event.venue != null) app.venueName(event.venue!),
                    ].join(' • '),
                    style: theme.textTheme.bodySmall?.copyWith(color: colors.mutedForeground),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Result label or kickoff time.
            if (event.isPlayed && result != null)
              Text(
                app.t('popover.${result.name}').upperNoTonos,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: resultColor),
              )
            else if (hasTime)
              // Web: `text-primary` kickoff time.
              Text(event.time, style: condensed(size: 14, color: colors.primary)),
          ],
        ),
      ),
    );
  }
}
