import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/constants.dart';
import '../logic/football_stats.dart';
import '../models/events.dart';
import '../state/app_state.dart';
import '../theme.dart';
import 'countdown_text.dart';
import 'event_details_sheet.dart';

/// One event row in the grid's selected-day list — a port of the web
/// UpcomingEventCard: date/score badge, sport label + title + date line,
/// trailing chevron. Tapping opens the details sheet.
class EventCard extends StatelessWidget {
  const EventCard({super.key, required this.event, required this.monthName});

  final SportEvent event;
  final String monthName;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final colors = AppColors.of(context);
    final info = monthInfo(monthName);
    final result = event.isPlayed ? matchResult(event.score, event.location, event.penalties) : null;

    // Web UpcomingEventCard `resultAccent`: green-500 / yellow-500 / #dc2828
    // for played results; blue-500 (volleyball) or #dc2828 (football) when
    // upcoming.
    final isVolleyball = event.sport == Sport.volleyballMen || event.sport == Sport.volleyballWomen;
    final accent = switch (result) {
      MatchResult.win => twGreen500,
      MatchResult.draw => twYellow500,
      MatchResult.loss => accentRed,
      null => isVolleyball ? twBlue500 : accentRed,
    };

    final monthLabel = app.t('months.$monthName');
    final monthAbbrev = monthLabel.substring(0, monthLabel.length < 3 ? monthLabel.length : 3);
    final hasScore = event.isPlayed && event.score != null;
    final hasTime = event.time.contains(':');
    final competitionLabel = [
      app.t(_sportKey(event.sport)),
      if (event.isCup) app.t('calendar.cup'),
      if (event.isFriendly) app.t('calendar.friendly'),
    ].join(' ');
    final target = eventDateTime(monthName, event);
    final radius = BorderRadius.circular(colors.cardRadius);

    TextStyle accentLabel(double size) => TextStyle(
          fontSize: size,
          fontWeight: FontWeight.bold,
          color: accent,
          letterSpacing: 0.5,
        );

    // Web card border: `border-blue-400/30` for volleyball, else
    // `border-slate-200 dark:border-slate-800` (QA CAL-04).
    final dark = theme.brightness == Brightness.dark;
    final borderColor = isVolleyball
        ? twBlue400.withValues(alpha: 0.3)
        : (dark ? twSlate800 : twSlate200);

    return Material(
      color: colors.surfaceTile,
      shape: RoundedRectangleBorder(borderRadius: radius, side: BorderSide(color: borderColor)),
      child: InkWell(
        borderRadius: radius,
        onTap: () => showEventDetailsSheet(context, event, monthName),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Date (upcoming) or score (played) badge.
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.1),
                  borderRadius: colors.br(8),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      hasScore ? event.score! : '${event.day}',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: accent),
                    ),
                    Text(
                      (hasScore ? app.t('popover.${result?.name ?? 'upcoming'}') : monthAbbrev).upperNoTonos,
                      style: accentLabel(10),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              // Sport/competition label, title, date · time, countdown.
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          isVolleyball ? Icons.sports_volleyball : Icons.sports_soccer,
                          size: 14,
                          color: accent,
                        ),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            competitionLabel.upperNoTonos,
                            style: accentLabel(10),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      matchTitle(app, event),
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$monthAbbrev ${event.day}, ${info.year}${hasTime ? ' • ${event.time}' : ''}',
                      style: TextStyle(fontSize: 12, color: colors.mutedForeground),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (!event.isPlayed && target.isAfter(DateTime.now())) ...[
                      const SizedBox(height: 4),
                      CountdownText(target: target),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Decorative chevron.
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(borderRadius: colors.br(999), color: colors.surfaceTileRaised),
                child: Icon(Icons.chevron_right, size: 18, color: theme.colorScheme.onSurface),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _sportKey(Sport sport) => switch (sport) {
      Sport.footballMen => 'sports.footballMen',
      Sport.volleyballMen => 'sports.volleyballMen',
      Sport.volleyballWomen => 'sports.volleyballWomen',
      Sport.meeting => 'sports.meeting',
    };

String sportLabelKey(Sport sport) => _sportKey(sport);

/// `<Home team> vs <Away team>` ordered by the event location, matching the
/// web CalendarListView/CardsView titles. The own team goes through the
/// translation table via its canonical uppercase key ('ΝΕΑ ΣΑΛΑΜΙΝΑ' — see
/// greekToTeamKey) so English mode renders 'Nea Salamis'; unmapped names
/// fall back to the Greek string. Meetings are bare translated titles, no
/// "vs" (web useCalendar parity).
String matchTitle(AppState app, SportEvent event) {
  if (event.isMeeting) return app.meetingTitle(event.opponent);
  final own = app.teamName('ΝΕΑ ΣΑΛΑΜΙΝΑ');
  final opponent = app.teamName(event.opponent);
  return event.location == MatchLocation.home ? '$own vs $opponent' : '$opponent vs $own';
}
