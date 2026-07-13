import 'package:add_2_calendar/add_2_calendar.dart' as a2c;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../data/constants.dart';
import '../logic/football_stats.dart';
import '../models/events.dart';
import '../state/app_state.dart';
import '../theme.dart';
import 'countdown_text.dart';
import 'event_card.dart' show matchTitle, sportLabelKey;
import 'team_logo.dart';

/// Bridge to the add_2_calendar platform channel — injectable so widget
/// tests can assert the tap without a real plugin behind it.
@visibleForTesting
Future<bool> Function(a2c.Event event) addEventToDeviceCalendar = a2c.Add2Calendar.addEvent2Cal;

void showEventDetailsSheet(BuildContext context, SportEvent event, String monthName) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      maxChildSize: 0.95,
      builder: (context, controller) => SingleChildScrollView(
        controller: controller,
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
        child: _EventDetails(event: event, monthName: monthName),
      ),
    ),
  );
}

/// Event popover content, ported from the web EventPopover sheet.
class _EventDetails extends StatelessWidget {
  const _EventDetails({required this.event, required this.monthName});

  final SportEvent event;
  final String monthName;

  bool get _isVolleyball => event.sport == Sport.volleyballMen || event.sport == Sport.volleyballWomen;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final colors = AppColors.of(context);
    final isHome = event.location == MatchLocation.home;
    final opponent = app.teamName(event.opponent);
    final own = app.teamName(teamName);
    final homeName = isHome ? own : opponent;
    final awayName = isHome ? opponent : own;
    final info = monthInfo(monthName);
    final result = event.isPlayed ? matchResult(event.score, event.location, event.penalties) : null;
    final resultColor = switch (result) {
      MatchResult.win => winGreen,
      MatchResult.draw => drawAmber,
      MatchResult.loss => lossRed,
      null => theme.colorScheme.onSurface,
    };
    final hasTime = event.time.contains(':');
    final kickoff = eventDateTime(monthName, event);

    final tabs = _buildTabs(app);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // ── Header ──
        Stack(
          alignment: Alignment.center,
          children: [
            Text(
              app.t(event.isPlayed ? 'popover.matchResult' : 'popover.upcoming').toUpperCase(),
              textAlign: TextAlign.center,
              style: condensed(size: 13, color: colors.mutedForeground, letterSpacing: 2.5),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: IconButton(
                icon: const Icon(Icons.close, size: 20),
                color: colors.mutedForeground,
                tooltip: MaterialLocalizations.of(context).closeButtonTooltip,
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),

        // ── Hero: home | VS + result pill | away ──
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _TeamSide(isOwn: isHome, name: homeName, event: event, opponent: opponent)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  Text('VS', style: condensed(size: 16, color: colors.mutedForeground, letterSpacing: 2.5)),
                  if (result != null) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        border: Border.all(color: resultColor),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        app.t('popover.${result.name}').toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5,
                          color: resultColor,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Expanded(child: _TeamSide(isOwn: !isHome, name: awayName, event: event, opponent: opponent)),
          ],
        ),
        const SizedBox(height: 12),

        // ── Score / time + countdown ──
        if (event.isPlayed && event.score != null) ...[
          Text.rich(
            TextSpan(children: [
              TextSpan(
                text: event.score!.replaceAll('-', ' - '),
                style: condensed(size: 40, weight: FontWeight.w800, color: resultColor)
                    .copyWith(fontFeatures: const [FontFeature.tabularFigures()]),
              ),
              TextSpan(text: ' ${_isVolleyball ? '🏐' : '⚽'}', style: const TextStyle(fontSize: 30)),
            ]),
            textAlign: TextAlign.center,
          ),
          if (event.penalties != null)
            Text(
              '${app.t('calendar.penalties')}: ${event.penalties}',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall?.copyWith(color: colors.mutedForeground),
            ),
        ] else ...[
          Text(
            hasTime ? event.time : app.t('popover.tbd'),
            textAlign: TextAlign.center,
            style: condensed(size: 36, weight: FontWeight.w800, color: theme.colorScheme.onSurface)
                .copyWith(fontFeatures: const [FontFeature.tabularFigures()]),
          ),
          if (kickoff.isAfter(DateTime.now()))
            Center(child: CountdownText(target: kickoff, size: 14)),
        ],
        const SizedBox(height: 8),

        // ── Competition / matchday ──
        Text(
          _competitionLabel(app),
          textAlign: TextAlign.center,
          style: condensed(size: 12, color: colors.mutedForeground, letterSpacing: 2),
        ),
        const SizedBox(height: 12),

        // ── Chips: home/away + share ──
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                isHome ? '🏠 ${app.t('popover.homeGround')}' : '🚌 ${app.t('popover.awayGround')}',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(width: 8),
            Material(
              color: theme.colorScheme.surfaceContainerHighest,
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: () => _share(app, homeName, awayName),
                child: SizedBox(
                  width: 32,
                  height: 32,
                  child: Tooltip(
                    message: app.t('popover.shareMatch'),
                    child: Icon(Icons.share_outlined, size: 15, color: colors.mutedForeground),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // ── Date + venue ──
        Text(
          '${app.t('months.$monthName')} ${event.day}, ${info.year}',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyMedium?.copyWith(color: colors.mutedForeground),
        ),
        if (event.venue != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.location_on_outlined, size: 16, color: colors.mutedForeground),
                const SizedBox(width: 4),
                Flexible(
                  child: Text(
                    app.venueName(event.venue!),
                    style: theme.textTheme.bodyMedium?.copyWith(color: colors.mutedForeground),
                  ),
                ),
              ],
            ),
          ),

        // ── Tabbed match details ──
        if (tabs.isNotEmpty) ...[
          const SizedBox(height: 16),
          DefaultTabController(
            length: tabs.length,
            child: Column(
              children: [
                TabBar(
                  labelColor: brandRed,
                  unselectedLabelColor: colors.mutedForeground,
                  indicatorColor: brandRed,
                  dividerColor: colors.primaryBorderSubtle,
                  labelStyle: condensed(size: 12, letterSpacing: 0.8),
                  labelPadding: const EdgeInsets.symmetric(horizontal: 6),
                  tabs: [for (final tab in tabs) Tab(text: tab.label.toUpperCase(), height: 40)],
                ),
                SizedBox(
                  height: 240,
                  child: TabBarView(
                    children: [
                      for (final tab in tabs)
                        SingleChildScrollView(
                          padding: const EdgeInsets.only(top: 12),
                          child: tab.content,
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],

        // ── Match report ──
        if (event.reportEN != null || event.reportEL != null) ...[
          const SizedBox(height: 20),
          Text(
            app.t('matchReport.title').toUpperCase(),
            style: condensed(size: 12, color: colors.mutedForeground, letterSpacing: 2),
          ),
          const SizedBox(height: 8),
          Text(
            (app.language == 'el' ? event.reportEL ?? event.reportEN : event.reportEN ?? event.reportEL)!,
            style: theme.textTheme.bodyMedium?.copyWith(height: 1.5),
          ),
        ],

        // ── View all statistics CTA ──
        const SizedBox(height: 20),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: brandRed,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: const StadiumBorder(),
          ),
          onPressed: () {
            app.goToTab(1);
            Navigator.of(context).pop();
          },
          child: Text(
            '📊 ${app.t('popover.viewAllStats')}'.toUpperCase(),
            style: condensed(size: 14, color: Colors.white, letterSpacing: 1.5),
          ),
        ),

        // ── Add to calendar (upcoming with a confirmed kickoff time only) ──
        if (!event.isPlayed && hasTime) ...[
          const SizedBox(height: 10),
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              foregroundColor: brandRed,
              side: const BorderSide(color: brandRed),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: const StadiumBorder(),
            ),
            onPressed: () => _addToCalendar(context, app),
            child: Text(
              '📅 ${app.t('settings.exportCalendar')}'.toUpperCase(),
              style: condensed(size: 14, color: brandRed, letterSpacing: 1.5),
            ),
          ),
        ],
      ],
    );
  }

  /// Hands the match to the device calendar (SET-6/FR-CAL-ADD). Only called
  /// for upcoming events with a confirmed time — TBD events hide the button.
  Future<void> _addToCalendar(BuildContext context, AppState app) async {
    final start = eventDateTime(monthName, event);
    final calEvent = a2c.Event(
      title: matchTitle(app, event),
      startDate: start,
      endDate: start.add(const Duration(hours: 2)),
      location: event.venue != null ? app.venueName(event.venue!) : null,
      description: '${app.t(sportLabelKey(event.sport))} · '
          '${event.isCup ? app.t('calendar.cup') : app.t('popover.competition')}',
    );
    try {
      final ok = await addEventToDeviceCalendar(calEvent);
      if (!ok && context.mounted) _showCalendarError(context, app);
    } catch (_) {
      if (context.mounted) _showCalendarError(context, app);
    }
  }

  /// Same bottom-snackbar error pattern as the settings page.
  static void _showCalendarError(BuildContext context, AppState app) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(app.t('error.title'))));
  }

  /// Tab list built exactly like the web EventPopover (lines 354-367).
  List<({String label, Widget content})> _buildTabs(AppState app) {
    final tabs = <({String label, Widget content})>[];
    if (_isVolleyball) {
      if (event.sets?.isNotEmpty ?? false) {
        tabs.add((label: app.t('popover.sets'), content: _SetsTab(event: event)));
      }
      if (event.vbScorers?.isNotEmpty ?? false) {
        tabs.add((label: app.t('popover.vbScorers'), content: _VbScorersTab(event: event)));
      }
    } else {
      if (event.scorers?.isNotEmpty ?? false) {
        tabs.add((label: app.t('popover.goalscorers'), content: _ScorersTab(event: event)));
      }
      if (event.bookings?.isNotEmpty ?? false) {
        tabs.add((label: app.t('popover.bookings'), content: _BookingsTab(event: event)));
      }
    }
    if ((event.lineupHome?.isNotEmpty ?? false) || (event.lineupAway?.isNotEmpty ?? false)) {
      tabs.add((label: app.t('popover.lineup'), content: _LineupsTab(event: event)));
    }
    if (event.subs?.isNotEmpty ?? false) {
      tabs.add((label: app.t('popover.substitutions'), content: _SubsTab(event: event)));
    }
    return tabs;
  }

  String _competitionLabel(AppState app) {
    final base = event.isCup
        ? app.t('calendar.cup')
        : event.sport == Sport.footballMen
            ? app.t('popover.competition')
            : app.t(sportLabelKey(event.sport));
    final matchday = event.matchday != null ? ' · ${app.t('popover.matchday')} ${event.matchday}' : '';
    return '$base$matchday'.toUpperCase();
  }

  void _share(AppState app, String homeName, String awayName) {
    final hasTime = event.time.contains(':');
    final detail = event.isPlayed && event.score != null
        ? event.score!
        : (hasTime ? event.time : app.t('popover.tbd'));
    SharePlus.instance.share(ShareParams(text: '${matchTitle(app, event)} — $detail'));
  }
}

/// One side of the hero row: logo above team name.
class _TeamSide extends StatelessWidget {
  const _TeamSide({required this.isOwn, required this.name, required this.event, required this.opponent});

  final bool isOwn;
  final String name;
  final SportEvent event;
  final String opponent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        isOwn
            // Decorative: the team name is rendered as text directly below.
            ? Image.asset(ownLogoAsset,
                width: 56,
                height: 56,
                excludeFromSemantics: true,
                errorBuilder: (_, _, _) => const SizedBox(width: 56, height: 56))
            : TeamLogo(logoPath: event.logo, name: opponent, size: 56),
        const SizedBox(height: 8),
        Text(
          name,
          textAlign: TextAlign.center,
          style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}

// ── Tab contents ──────────────────────────────────────────────────────────────

class _SetsTab extends StatelessWidget {
  const _SetsTab({required this.event});

  final SportEvent event;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    return Column(
      children: [
        for (final (i, set) in event.sets!.indexed)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 3),
            child: Row(
              children: [
                Expanded(
                  child: Text('${set.home}',
                      textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
                SizedBox(
                  width: 64,
                  child: Text(
                    '${app.t('popover.set')} ${i + 1}',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                ),
                Expanded(
                  child: Text('${set.away}',
                      textAlign: TextAlign.left, style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _VbScorersTab extends StatelessWidget {
  const _VbScorersTab({required this.event});

  final SportEvent event;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final sorted = [...event.vbScorers!]..sort((a, b) => b.points.compareTo(a.points));
    return Column(
      children: [
        for (final s in sorted)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 2),
            child: Row(
              children: [
                const Text('🏐 '),
                Expanded(child: Text(app.i18n.playerName(s.name))),
                Text('${s.points}', style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
          ),
      ],
    );
  }
}

class _ScorersTab extends StatelessWidget {
  const _ScorersTab({required this.event});

  final SportEvent event;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    return Column(
      children: [
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
    );
  }
}

class _BookingsTab extends StatelessWidget {
  const _BookingsTab({required this.event});

  final SportEvent event;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    return Column(
      children: [
        for (final b in event.bookings!)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 3),
            child: Row(
              children: [
                Container(
                  width: 12,
                  height: 16,
                  decoration: BoxDecoration(
                    color: b.card == 'red' ? lossRed : drawAmber,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(child: Text(app.i18n.playerName(b.name))),
                Text("${b.minute}'", style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
              ],
            ),
          ),
      ],
    );
  }
}

class _LineupsTab extends StatelessWidget {
  const _LineupsTab({required this.event});

  final SportEvent event;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final colors = AppColors.of(context);
    final isHome = event.location == MatchLocation.home;
    final opponent = app.teamName(event.opponent);
    final own = app.teamName(teamName);
    final homeName = isHome ? own : opponent;
    final awayName = isHome ? opponent : own;
    // Left column = match home team (same mapping as the web LineupsSection).
    final left = (isHome ? event.lineupHome : event.lineupAway) ?? const <LineupPlayer>[];
    final right = (isHome ? event.lineupAway : event.lineupHome) ?? const <LineupPlayer>[];

    Widget column(String header, List<LineupPlayer> players, {required bool alignEnd}) => Expanded(
          child: Column(
            crossAxisAlignment: alignEnd ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              Text(
                header,
                style: theme.textTheme.labelSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: colors.mutedForeground,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 6),
              for (final p in players)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 1.5),
                  child: Text.rich(
                    TextSpan(children: [
                      if (p.number != null)
                        TextSpan(
                          text: '${p.number}. ',
                          style: TextStyle(color: colors.mutedForeground),
                        ),
                      TextSpan(text: app.i18n.playerName(p.name)),
                      if (p.position != null)
                        TextSpan(
                          text: ' ${p.position}',
                          style: TextStyle(fontSize: 10, color: colors.mutedForeground),
                        ),
                    ]),
                    style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w500),
                    textAlign: alignEnd ? TextAlign.right : TextAlign.left,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
            ],
          ),
        );

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        column(homeName, left, alignEnd: false),
        const SizedBox(width: 12),
        column(awayName, right, alignEnd: true),
      ],
    );
  }
}

class _SubsTab extends StatelessWidget {
  const _SubsTab({required this.event});

  final SportEvent event;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    return Column(
      children: [
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
    );
  }
}
