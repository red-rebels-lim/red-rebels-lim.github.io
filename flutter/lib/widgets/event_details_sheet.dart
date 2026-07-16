import 'package:add_2_calendar/add_2_calendar.dart' as a2c;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/constants.dart';
import '../logic/football_stats.dart';
import '../logic/scout.dart';
import '../models/events.dart';
import '../state/app_state.dart';
import '../theme.dart';
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
    // Web sheet has no drag handle (QA EVT-10); surface + border are drawn
    // by _EventSheetSurface so the result tint can own the whole sheet.
    backgroundColor: Colors.transparent,
    builder: (context) => _EventSheetSurface(event: event, monthName: monthName),
  );
}

/// Result-tinted sheet surface (QA EVT-01): web `dialogBg`/`dialogBorder` —
/// pale green/yellow/red in light mode, near-black gradients in dark, with a
/// result-colored border and `rounded-t-3xl` corners. Content-sized up to
/// 90% of the screen, like the web's `max-h-[90vh]`.
class _EventSheetSurface extends StatelessWidget {
  const _EventSheetSurface({required this.event, required this.monthName});

  final SportEvent event;
  final String monthName;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final result = event.isPlayed ? matchResult(event.score, event.location, event.penalties) : null;
    final style = SheetResultStyle.of(result, dark: dark);

    return Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.9),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [style.surface, style.surfaceBottom],
        ),
        border: Border(top: BorderSide(color: style.borderColor)),
        borderRadius: BorderRadius.vertical(
          top: AppColors.of(context).br(24).topLeft,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
        child: _EventDetails(event: event, monthName: monthName, resultStyle: style),
      ),
    );
  }
}

/// Event sheet content, ported from the web EventPopover.
class _EventDetails extends StatelessWidget {
  const _EventDetails({required this.event, required this.monthName, required this.resultStyle});

  final SportEvent event;
  final String monthName;
  final SheetResultStyle resultStyle;

  bool get _isVolleyball => event.sport == Sport.volleyballMen || event.sport == Sport.volleyballWomen;

  /// Web `isFootballPlayed` — gates the MATCH RESULT title, the competition
  /// line and the stats CTA.
  bool get _isFootballPlayed => event.sport == Sport.footballMen && event.isPlayed;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final dark = theme.brightness == Brightness.dark;
    final isHome = event.location == MatchLocation.home;
    final opponent = app.teamName(event.opponent);
    final own = app.teamName(teamName);
    final homeName = isHome ? own : opponent;
    final awayName = isHome ? opponent : own;
    final result = event.isPlayed ? matchResult(event.score, event.location, event.penalties) : null;
    final hasTime = event.time.contains(':');
    final mutedLabel = dark ? Colors.white.withValues(alpha: 0.4) : twSlate400;

    // Web meeting layout: big 📅, title, single time tile.
    if (event.sport == Sport.meeting) {
      return _MeetingDetails(event: event, hasTime: hasTime);
    }

    final tabs = _buildTabs(app, isHome, homeName, awayName);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // ── Top bar: MATCH RESULT for played football, fixture title else ──
        Stack(
          alignment: Alignment.center,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 20, bottom: 12),
              child: Text(
                (_isFootballPlayed ? app.t('popover.matchResult') : matchTitle(app, event)).upperNoTonos,
                textAlign: TextAlign.center,
                style: condensed(
                  size: 13,
                  color: dark ? Colors.white.withValues(alpha: 0.6) : twSlate500,
                  letterSpacing: 2.5,
                ),
              ),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: IconButton(
                icon: const Icon(Icons.close, size: 20),
                color: theme.colorScheme.onSurfaceVariant,
                tooltip: MaterialLocalizations.of(context).closeButtonTooltip,
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ],
        ),

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
                  Text('VS', style: condensed(size: 18, weight: FontWeight.w900, color: mutedLabel, letterSpacing: 2.5)),
                  const SizedBox(height: 6),
                  // Web badge: filled tint + border (result colors, or the
                  // slate/red upcoming pill).
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: resultStyle.badgeBg,
                      border: Border.all(color: resultStyle.badgeBorder),
                      borderRadius: AppColors.of(context).br(999),
                    ),
                    child: Text(
                      app.t('popover.${result?.name ?? 'upcoming'}').upperNoTonos,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                        color: resultStyle.badgeText,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(child: _TeamSide(isOwn: !isHome, name: awayName, event: event, opponent: opponent)),
          ],
        ),

        // ── Score (played only — upcoming carries its time as a chip) ──
        if (event.isPlayed && event.score != null) ...[
          const SizedBox(height: 8),
          Text.rich(
            TextSpan(children: [
              TextSpan(
                text: event.score!.replaceAll('-', ' - '),
                style: condensed(size: 48, weight: FontWeight.w900, color: resultStyle.score)
                    .copyWith(fontFeatures: const [FontFeature.tabularFigures()]),
              ),
              TextSpan(text: ' ${_isVolleyball ? '🏐' : '⚽'}', style: const TextStyle(fontSize: 36)),
            ]),
            textAlign: TextAlign.center,
          ),
          if (event.penalties != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                '${app.t('calendar.penalties')}: ${event.penalties}',
                textAlign: TextAlign.center,
                // Web: `text-yellow-300/70`.
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFFFDE047).withValues(alpha: 0.7),
                ),
              ),
            ),
        ],

        // ── Competition / matchday — played football only ──
        if (_isFootballPlayed) ...[
          const SizedBox(height: 4),
          Text(
            [
              app.t('popover.competition'),
              if (event.matchday != null) '${app.t('popover.matchday')} ${event.matchday}',
            ].join(' · ').upperNoTonos,
            textAlign: TextAlign.center,
            style: condensed(size: 12, color: mutedLabel, letterSpacing: 2),
          ),
        ],

        // ── Info chips (web order; share removed per QA GLB-02 decision) ──
        const SizedBox(height: 12),
        Wrap(
          alignment: WrapAlignment.center,
          spacing: 8,
          runSpacing: 8,
          children: [
            if (event.duration != null) _InfoChip(icon: '🕐', label: event.duration!),
            _InfoChip(
              icon: isHome ? '🏠' : '✈️',
              label: app.t(isHome ? 'popover.homeGround' : 'popover.awayGround'),
            ),
            if (event.venue != null) _InfoChip(icon: '📍', label: app.venueName(event.venue!)),
            if (!_isFootballPlayed && hasTime) _InfoChip(icon: '⏰', label: event.time),
            if (event.isCup) const _CupChip(),
          ],
        ),

        // ── Opponent scouting card — upcoming matches only (web EVT-12) ──
        if (!event.isPlayed && event.sport != Sport.meeting) ...[
          const SizedBox(height: 16),
          _OpponentScoutCard(opponent: event.opponent, sport: event.sport),
        ],

        // ── Tabbed match details (played only, like the web) ──
        if (event.isPlayed && tabs.isNotEmpty) ...[
          const SizedBox(height: 12),
          DefaultTabController(
            length: tabs.length,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TabBar(
                  isScrollable: true,
                  tabAlignment: TabAlignment.start,
                  labelColor: dark ? Colors.white : const Color(0xFF0F172A),
                  unselectedLabelColor: dark ? Colors.white.withValues(alpha: 0.6) : twSlate500,
                  indicatorColor: brandRed,
                  indicatorSize: TabBarIndicatorSize.label,
                  dividerColor: dark ? Colors.white.withValues(alpha: 0.1) : twSlate200,
                  labelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
                  labelPadding: const EdgeInsets.symmetric(horizontal: 10),
                  tabs: [for (final tab in tabs) Tab(text: tab.label.upperNoTonos, height: 40)],
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
        if (event.isPlayed && (event.reportEN != null || event.reportEL != null)) ...[
          const SizedBox(height: 12),
          Text(
            app.t('matchReport.title').upperNoTonos,
            style: condensed(size: 12, color: theme.colorScheme.onSurfaceVariant, letterSpacing: 2),
          ),
          const SizedBox(height: 8),
          Text(
            (app.language == 'el' ? event.reportEL ?? event.reportEN : event.reportEN ?? event.reportEL)!,
            style: theme.textTheme.bodyMedium?.copyWith(height: 1.5),
          ),
        ],

        // ── View all statistics CTA — played football only (web) ──
        if (_isFootballPlayed) ...[
          const SizedBox(height: 16),
          Material(
            clipBehavior: Clip.antiAlias,
            borderRadius: AppColors.of(context).br(16),
            child: Ink(
              decoration: const BoxDecoration(
                // Web: `bg-gradient-to-r from-primary to-red-700`.
                gradient: LinearGradient(colors: [brandRed, Color(0xFFB91C1C)]),
              ),
              child: InkWell(
                onTap: () {
                  final app = context.read<AppState>();
                  app.goToTab(1);
                  Navigator.of(context).pop();
                },
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Text(
                    '📊 ${app.t('popover.viewAllStats')}'.upperNoTonos,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],

        // ── Add to calendar — native extra kept from Phase 6 (upcoming with
        //    a confirmed kickoff time only; the web has no equivalent) ──
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
              '📅 ${app.t('settings.exportCalendar')}'.upperNoTonos,
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

  /// Tab list built exactly like the web EventPopover.
  List<({String label, Widget content})> _buildTabs(AppState app, bool isHome, String homeName, String awayName) {
    final tabs = <({String label, Widget content})>[];
    if (_isVolleyball) {
      if (event.sets?.isNotEmpty ?? false) {
        tabs.add((label: app.t('popover.sets'), content: _SetsTab(event: event)));
      }
      if (event.vbScorers?.isNotEmpty ?? false) {
        tabs.add((label: app.t('popover.vbScorers'), content: _VbScorersTab(event: event, isHome: isHome)));
      }
    } else {
      if (event.scorers?.isNotEmpty ?? false) {
        tabs.add((label: app.t('popover.goalscorers'), content: _ScorersTab(event: event, isHome: isHome)));
      }
      if (event.bookings?.isNotEmpty ?? false) {
        tabs.add((label: app.t('popover.bookings'), content: _BookingsTab(event: event, isHome: isHome)));
      }
    }
    if ((event.lineupHome?.isNotEmpty ?? false) || (event.lineupAway?.isNotEmpty ?? false)) {
      tabs.add((label: app.t('popover.lineup'), content: _LineupsTab(event: event)));
    }
    if (event.subs?.isNotEmpty ?? false) {
      tabs.add((label: app.t('popover.substitutions'), content: _SubsTab(event: event, homeName: homeName, awayName: awayName)));
    }
    return tabs;
  }
}

/// Web meeting sheet: 📅 + title + a single boxed time row.
class _MeetingDetails extends StatelessWidget {
  const _MeetingDetails({required this.event, required this.hasTime});

  final SportEvent event;
  final bool hasTime;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final colors = AppColors.of(context);
    final dark = theme.brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('📅', textAlign: TextAlign.center, style: TextStyle(fontSize: 56)),
          const SizedBox(height: 16),
          Text(
            matchTitle(app, event),
            textAlign: TextAlign.center,
            style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: dark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF8FAFC),
              border: Border.all(color: colors.primaryBorderSubtle, width: 2),
              borderRadius: colors.br(12),
            ),
            child: Column(
              children: [
                Text(
                  app.t('popover.time').upperNoTonos,
                  style: condensed(size: 11, color: colors.mutedForeground, letterSpacing: 1.5),
                ),
                const SizedBox(height: 8),
                Text(
                  '⏰ ${hasTime ? event.time : app.t('popover.tbd')}',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Web `InfoChip`: emoji + label pill on slate-100 / white-8%.
class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});

  final String icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dark = theme.brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: dark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFF1F5F9),
        border: Border.all(color: dark ? Colors.white.withValues(alpha: 0.1) : twSlate200),
        borderRadius: AppColors.of(context).br(999),
      ),
      child: Text(
        '$icon $label',
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: theme.colorScheme.onSurface),
      ),
    );
  }
}

/// Web cup chip: `bg-amber-500/20 border-amber-500/30 text-amber-400`.
class _CupChip extends StatelessWidget {
  const _CupChip();

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: twAmber500.withValues(alpha: 0.2),
        border: Border.all(color: twAmber500.withValues(alpha: 0.3)),
        borderRadius: AppColors.of(context).br(999),
      ),
      child: Text(
        '🏆 ${app.t('calendar.cup')}',
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: twAmber400),
      ),
    );
  }
}

/// One side of the hero row: 64px logo above the team name.
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
                width: 64,
                height: 64,
                excludeFromSemantics: true,
                errorBuilder: (_, _, _) => const SizedBox(width: 64, height: 64))
            : TeamLogo(logoPath: event.logo, name: opponent, size: 64),
        const SizedBox(height: 8),
        Text(
          name,
          textAlign: TextAlign.center,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}

// ── Tab contents ──────────────────────────────────────────────────────────────
//
// The football/volleyball detail rows all use the web's three-column
// `[1fr_auto_1fr]` layout: match-home entries on the left, match-away on the
// right, minute/points centered.

class _ThreeColRow extends StatelessWidget {
  const _ThreeColRow({required this.left, required this.center, required this.right, this.centerWidth = 40});

  final Widget left;
  final Widget center;
  final Widget right;
  final double centerWidth;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(child: Align(alignment: Alignment.centerRight, child: left)),
          SizedBox(width: centerWidth, child: Center(child: center)),
          Expanded(child: Align(alignment: Alignment.centerLeft, child: right)),
        ],
      ),
    );
  }
}

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
          _ThreeColRow(
            centerWidth: 56,
            left: Text('${set.home}', style: const TextStyle(fontWeight: FontWeight.bold)),
            center: Text(
              '${app.t('popover.set')} ${i + 1}',
              style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            right: Text('${set.away}', style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
      ],
    );
  }
}

class _VbScorersTab extends StatelessWidget {
  const _VbScorersTab({required this.event, required this.isHome});

  final SportEvent event;
  final bool isHome;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final sorted = [...event.vbScorers!]..sort((a, b) => b.points.compareTo(a.points));
    bool onLeft(VolleyballScorer s) => isHome ? s.team == 'home' : s.team == 'away';
    return Column(
      children: [
        for (final s in sorted)
          _ThreeColRow(
            left: !onLeft(s)
                ? const SizedBox.shrink()
                : Text('${app.i18n.playerName(s.name)} 🏐',
                    textAlign: TextAlign.right,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
            center: Text('${s.points}pts',
                style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
            right: onLeft(s)
                ? const SizedBox.shrink()
                : Text('🏐 ${app.i18n.playerName(s.name)}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
          ),
      ],
    );
  }
}

class _ScorersTab extends StatelessWidget {
  const _ScorersTab({required this.event, required this.isHome});

  final SportEvent event;
  final bool isHome;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final sorted = [...event.scorers!]
      ..sort((a, b) => (int.tryParse(a.minute) ?? 0).compareTo(int.tryParse(b.minute) ?? 0));
    bool onLeft(Scorer s) => isHome ? s.team == 'home' : s.team == 'away';

    String suffix(Scorer s) => s.type == 'pen'
        ? ' (${app.t('popover.pen')})'
        : s.type == 'og'
            ? ' (${app.t('popover.og')})'
            : '';

    return Column(
      children: [
        for (final s in sorted)
          _ThreeColRow(
            left: !onLeft(s)
                ? const SizedBox.shrink()
                : Text('${app.i18n.playerName(s.name)}${suffix(s)} ⚽',
                    textAlign: TextAlign.right,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
            center: Text("${s.minute}'",
                style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
            right: onLeft(s)
                ? const SizedBox.shrink()
                : Text('⚽ ${app.i18n.playerName(s.name)}${suffix(s)}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
          ),
      ],
    );
  }
}

class _BookingsTab extends StatelessWidget {
  const _BookingsTab({required this.event, required this.isHome});

  final SportEvent event;
  final bool isHome;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final sorted = [...event.bookings!]
      ..sort((a, b) => (int.tryParse(a.minute) ?? 0).compareTo(int.tryParse(b.minute) ?? 0));
    bool onLeft(Booking b) => isHome ? b.team == 'home' : b.team == 'away';

    Widget card(Booking b) => Container(
          width: 12,
          height: 16,
          decoration: BoxDecoration(
            color: b.card == 'red' ? const Color(0xFFDC2626) : twYellow500,
            borderRadius: BorderRadius.circular(2),
          ),
        );

    Widget name(Booking b, {required TextAlign align}) => Flexible(
          child: Text(app.i18n.playerName(b.name),
              textAlign: align,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        );

    return Column(
      children: [
        for (final b in sorted)
          _ThreeColRow(
            left: !onLeft(b)
                ? const SizedBox.shrink()
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [name(b, align: TextAlign.right), const SizedBox(width: 6), card(b)],
                  ),
            center: Text("${b.minute}'",
                style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
            right: onLeft(b)
                ? const SizedBox.shrink()
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [card(b), const SizedBox(width: 6), name(b, align: TextAlign.left)],
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
    // Left column = match home team (same mapping as the web LineupsSection);
    // the away column mirrors: position first, then name, then number.
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
                    TextSpan(
                      children: alignEnd
                          ? [
                              if (p.position != null)
                                TextSpan(
                                  text: '${p.position} ',
                                  style: TextStyle(fontSize: 10, color: colors.mutedForeground),
                                ),
                              TextSpan(text: app.i18n.playerName(p.name)),
                              if (p.number != null)
                                TextSpan(
                                  text: ' ${p.number}.',
                                  style: TextStyle(color: colors.mutedForeground),
                                ),
                            ]
                          : [
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
                            ],
                    ),
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

/// Web SubstitutionsSection: rows grouped per team under a team header, each
/// on a soft rounded slate row with green ↑ on / red ↓ off arrows.
class _SubsTab extends StatelessWidget {
  const _SubsTab({required this.event, required this.homeName, required this.awayName});

  final SportEvent event;
  final String homeName;
  final String awayName;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final colors = AppColors.of(context);
    final dark = theme.brightness == Brightness.dark;
    final rowBg = dark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF8FAFC);

    List<Substitution> teamSubs(String team) => [
          for (final s in event.subs!)
            if (s.team == team) s
        ]..sort((a, b) => (int.tryParse(a.minute) ?? 0).compareTo(int.tryParse(b.minute) ?? 0));

    Widget subRow(Substitution s) => Container(
          margin: const EdgeInsets.only(bottom: 6),
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: rowBg, borderRadius: colors.br(8)),
          child: Row(
            children: [
              Expanded(
                child: Text.rich(
                  TextSpan(children: [
                    const TextSpan(text: '↑ ', style: TextStyle(color: Color(0xFF4ADE80), fontWeight: FontWeight.bold)),
                    TextSpan(text: app.i18n.playerName(s.playerOn), style: const TextStyle(fontWeight: FontWeight.w500)),
                  ]),
                  style: const TextStyle(fontSize: 11),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              SizedBox(
                width: 40,
                child: Text(
                  "${s.minute}'",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: colors.mutedForeground),
                ),
              ),
              Expanded(
                child: Text.rich(
                  TextSpan(children: [
                    TextSpan(text: app.i18n.playerName(s.playerOff), style: TextStyle(color: colors.mutedForeground)),
                    const TextSpan(text: ' ↓', style: TextStyle(color: Color(0xFFF87171), fontWeight: FontWeight.bold)),
                  ]),
                  style: const TextStyle(fontSize: 11),
                  textAlign: TextAlign.right,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        );

    Widget group(String header, List<Substitution> subs) => subs.isEmpty
        ? const SizedBox.shrink()
        : Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                header,
                style: theme.textTheme.labelSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: colors.mutedForeground,
                ),
              ),
              const SizedBox(height: 6),
              for (final s in subs) subRow(s),
              const SizedBox(height: 10),
            ],
          );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        group(homeName, teamSubs('home')),
        group(awayName, teamSubs('away')),
      ],
    );
  }
}

/// Web `OpponentScoutCard` — season head-to-head + last meeting against this
/// opponent, shown on upcoming non-meeting sheets (QA EVT-12). Volleyball
/// hides the draw column and the goals line, exactly like the web.
class _OpponentScoutCard extends StatelessWidget {
  const _OpponentScoutCard({required this.opponent, required this.sport});

  final String opponent;
  final Sport sport;

  // Tailwind 400-tier accents used by the web card's tiles.
  static const _green400 = Color(0xFF4ADE80);
  static const _yellow400 = Color(0xFFFACC15);
  static const _red400 = Color(0xFFF87171);

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    final isVolleyball = sport == Sport.volleyballMen || sport == Sport.volleyballWomen;

    final h2h = getOpponentH2H(app.events, opponent, sport);
    final last = getLastMeeting(app.events, opponent, sport);

    final surface = BoxDecoration(
      color: Colors.white.withValues(alpha: 0.05),
      border: Border.all(color: colors.primaryBorderSubtle),
      borderRadius: colors.br(12),
    );

    Widget heading(String text) => Text(
          text.upperNoTonos,
          textAlign: TextAlign.center,
          style: condensed(size: 12, color: muted, letterSpacing: 1.5),
        );

    if (h2h == null && last == null) {
      // Web empty state: "First meeting this season".
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: surface,
        child: Column(
          children: [
            heading(app.t('popover.scouting')),
            const SizedBox(height: 4),
            Text(app.t('popover.firstMeeting'),
                style: TextStyle(fontSize: 14, color: muted)),
          ],
        ),
      );
    }

    Widget h2hTile(int count, String label, Color accent) => Expanded(
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.1),
              borderRadius: colors.br(8),
            ),
            child: Column(
              children: [
                Text('$count',
                    style: condensed(size: 18, weight: FontWeight.w900, color: accent)),
                Text(label.upperNoTonos,
                    style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: accent.withValues(alpha: 0.7))),
              ],
            ),
          ),
        );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: surface,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          heading(app.t('popover.scouting')),
          if (h2h != null) ...[
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerLeft,
              child: heading(app.t('popover.h2hRecord')),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                h2hTile(h2h.wins, app.t('stats.w'), _green400),
                if (!isVolleyball) ...[
                  const SizedBox(width: 8),
                  h2hTile(h2h.draws, app.t('stats.d'), _yellow400),
                ],
                const SizedBox(width: 8),
                h2hTile(h2h.losses, app.t('stats.l'), _red400),
              ],
            ),
            if (!isVolleyball) ...[
              const SizedBox(height: 8),
              Text(
                '${app.t('stats.goals')}: ${h2h.goalsFor}-${h2h.goalsAgainst}',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: muted),
              ),
            ],
          ],
          if (last != null) ...[
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerLeft,
              child: heading(app.t('popover.lastMeeting')),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: colors.br(8),
              ),
              child: Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      borderRadius: colors.br(999),
                      color: switch (last.result) {
                        MatchResult.win => twGreen500,
                        MatchResult.draw => twYellow500,
                        MatchResult.loss => twRed500,
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text.rich(TextSpan(children: [
                      TextSpan(
                        text: last.score,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppColors.of(context).foreground,
                        ),
                      ),
                      TextSpan(
                        text:
                            '  (${app.t(last.location == MatchLocation.home ? 'popover.homeGround' : 'popover.awayGround')})',
                        style: TextStyle(fontSize: 12, color: muted),
                      ),
                    ])),
                  ),
                  Text(
                    '${app.t('months.${last.month}').substring(0, 3)} ${last.day}',
                    style: TextStyle(fontSize: 12, color: muted),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
