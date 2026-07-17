import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/constants.dart';
import '../logic/football_stats.dart';
import '../models/events.dart';
import '../state/app_state.dart';
import '../theme.dart';
import 'event_card.dart' show matchTitle, sportLabelKey;
import 'event_details_sheet.dart';

/// Vertical stack of match cards (port of CalendarCardsView.tsx).
class CalendarCardsView extends StatelessWidget {
  const CalendarCardsView({super.key, required this.monthName, required this.events});

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

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      itemCount: events.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (_, i) => _MatchCard(event: events[i], monthName: monthName),
    );
  }
}

class _MatchCard extends StatelessWidget {
  const _MatchCard({required this.event, required this.monthName});

  final SportEvent event;
  final String monthName;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final colors = AppColors.of(context);
    final info = monthInfo(monthName);
    final result = event.isPlayed ? matchResult(event.score, event.location, event.penalties) : null;
    // Web MatchCard `resultStyles`: green-500 / yellow-500 / red-500.
    final resultColor = switch (result) {
      MatchResult.win => twGreen500,
      MatchResult.draw => twYellow500,
      MatchResult.loss => twRed500,
      null => colors.primary,
    };
    final monthAbbrev = app.t('months.$monthName');
    final dateLabel =
        '${monthAbbrev.substring(0, monthAbbrev.length < 3 ? monthAbbrev.length : 3)} ${event.day}, ${info.year}';
    final accent = sportColor(event.sport);
    final hasTime = event.time.contains(':');

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: colors.br(12),
        side: BorderSide(color: colors.primaryBorderSubtle),
      ),
      child: InkWell(
        borderRadius: colors.br(12),
        onTap: () => showEventDetailsSheet(context, event, monthName),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header: date + sport pill.
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    dateLabel,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colors.mutedForeground,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: accent.withValues(alpha: 0.12),
                      borderRadius: colors.br(999),
                    ),
                    child: Text(
                      app.t(sportLabelKey(event.sport)).upperNoTonos,
                      style: condensed(size: 10, color: accent, letterSpacing: 1.5),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              // Title.
              Text(
                matchTitle(app, event),
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              // Score or time.
              Text(
                event.isPlayed && event.score != null
                    ? event.score!.replaceAll('-', ' - ')
                    : (hasTime ? event.time : app.t('popover.tbd')),
                textAlign: TextAlign.center,
                style: condensed(
                  size: event.isPlayed ? 30 : 24,
                  weight: FontWeight.w800,
                  color: event.isPlayed ? resultColor : colors.primary,
                ).copyWith(fontFeatures: const [FontFeature.tabularFigures()]),
              ),
              const SizedBox(height: 10),
              Container(height: 1, color: colors.primaryBorderSubtle.withValues(alpha: 0.5)),
              const SizedBox(height: 10),
              // Footer: location (+ cup) and result pill / upcoming label.
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text.rich(
                    TextSpan(children: [
                      TextSpan(
                        text: app.t(event.location == MatchLocation.home ? 'locations.home' : 'locations.away'),
                        style: theme.textTheme.bodySmall?.copyWith(color: colors.mutedForeground),
                      ),
                      if (event.isCup)
                        // Web: `text-amber-500` cup tag.
                        TextSpan(
                          text: '  ${app.t('calendar.cup')}',
                          style: theme.textTheme.bodySmall?.copyWith(color: twAmber500, fontWeight: FontWeight.bold),
                        ),
                      if (event.isFriendly)
                        // Web: `text-sky-500` friendly tag.
                        TextSpan(
                          text: '  ${app.t('calendar.friendly')}',
                          style: theme.textTheme.bodySmall?.copyWith(color: twSky500, fontWeight: FontWeight.bold),
                        ),
                    ]),
                  ),
                  if (result != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: resultColor.withValues(alpha: 0.12),
                        borderRadius: colors.br(999),
                      ),
                      child: Text(
                        app.t('popover.${result.name}').upperNoTonos,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                          color: resultColor,
                        ),
                      ),
                    )
                  else
                    Text(
                      app.t('popover.upcoming').upperNoTonos,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                        color: colors.primary,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
