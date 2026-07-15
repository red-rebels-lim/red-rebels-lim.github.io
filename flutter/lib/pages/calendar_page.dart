import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/constants.dart';
import '../models/events.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/calendar_cards_view.dart';
import '../widgets/calendar_list_view.dart';
import '../widgets/event_card.dart';
import '../widgets/event_details_sheet.dart';

class CalendarPage extends StatefulWidget {
  const CalendarPage({super.key});

  @override
  State<CalendarPage> createState() => _CalendarPageState();
}

class _CalendarPageState extends State<CalendarPage> {
  late PageController _pageController;
  late int _monthIndex;
  int? _userSelectedDay;

  /// The grid and list/cards modes host separate PageViews; a re-attached
  /// controller would snap back to its construction-time `initialPage`, so
  /// the controller is rebuilt at the current month on every view switch.
  String? _attachedView;

  @override
  void initState() {
    super.initState();
    final app = context.read<AppState>();
    _monthIndex = monthOrder.indexOf(app.events.initialMonth(DateTime.now()));
    _pageController = PageController(initialPage: _monthIndex);
    _attachedView = app.calendarView;
  }

  void _syncControllerToView(String view) {
    if (_attachedView == view) return;
    _attachedView = view;
    // The outgoing PageView detaches at the end of this build — dispose its
    // controller only after the frame.
    final old = _pageController;
    WidgetsBinding.instance.addPostFrameCallback((_) => old.dispose());
    _pageController = PageController(initialPage: _monthIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _goToMonth(int index) {
    if (index < 0 || index >= monthOrder.length) return;
    _pageController.animateToPage(index, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
  }

  /// Web `findDefaultDay`: today is pre-selected when viewing the current
  /// month; other months start with no selection.
  int? _defaultDay(String monthName) {
    final info = monthInfo(monthName);
    final now = DateTime.now();
    final isCurrentMonth = info.year == now.year && info.month == now.month;
    return isCurrentMonth ? now.day : null;
  }

  /// Consumes a notification-tap deep link: jumps to the event's month and
  /// opens its details sheet. Unresolvable keys just show the calendar.
  void _maybeOpenPendingEvent(AppState app) {
    if (app.pendingEventKey == null) return;
    final key = app.consumePendingEventKey();
    final target = key == null ? null : app.events.findByEventKey(key);
    if (target == null) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final index = monthOrder.indexOf(target.monthName);
      if (index >= 0 && index != _monthIndex) {
        if (_pageController.hasClients) _pageController.jumpToPage(index);
        setState(() {
          _monthIndex = index;
          _userSelectedDay = null;
        });
      }
      showEventDetailsSheet(context, target.event, target.monthName);
    });
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    _maybeOpenPendingEvent(app);
    final monthName = monthOrder[_monthIndex];
    final info = monthInfo(monthName);
    final view = app.calendarView;
    _syncControllerToView(view);
    final selectedDay = _userSelectedDay ?? _defaultDay(monthName);

    final colors = AppColors.of(context);

    // Web structure: a `bg-white/70 dark:bg-transparent rounded-2xl` panel
    // wraps ONLY the month nav (+ the grid in grid view); list/cards rows
    // float directly on the page background below it.
    final panel = Container(
      margin: const EdgeInsets.fromLTRB(8, 8, 8, 0),
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: colors.surfacePanel,
        borderRadius: BorderRadius.circular(colors.panelRadius),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _MonthHeader(
            monthName: monthName,
            year: info.year,
            onPrevious: _monthIndex > 0 ? () => _goToMonth(_monthIndex - 1) : null,
            onNext: _monthIndex < monthOrder.length - 1 ? () => _goToMonth(_monthIndex + 1) : null,
          ),
          if (app.lastSyncFailed) const _StaleDataIndicator(),
          if (view == 'grid')
            SizedBox(
              height: _MonthGrid.heightFor(monthName),
              child: PageView.builder(
                controller: _pageController,
                itemCount: monthOrder.length,
                onPageChanged: (i) => setState(() {
                  _monthIndex = i;
                  _userSelectedDay = null;
                }),
                itemBuilder: (context, i) => _GridPage(
                  monthName: monthOrder[i],
                  selectedDay: i == _monthIndex ? selectedDay : null,
                  onDaySelected: (day) => setState(() => _userSelectedDay = day),
                ),
              ),
            ),
        ],
      ),
    );

    if (view == 'grid') {
      final events = app.filteredEventsFor(monthName)..sort((a, b) => a.day.compareTo(b.day));
      final dayEvents =
          selectedDay == null ? const <SportEvent>[] : events.where((e) => e.day == selectedDay).toList();
      return Column(
        children: [
          panel,
          // Web UpcomingEventsList: hidden entirely when the selected day has
          // no events; label chip + cards on the bare background.
          Expanded(
            child: dayEvents.isEmpty
                ? const SizedBox.shrink()
                : ListView(
                    padding: const EdgeInsets.fromLTRB(8, 24, 8, 16),
                    children: [
                      Align(
                        alignment: Alignment.centerLeft,
                        child: _SelectedDayChip(label: app.t('calendar.selectedDay')),
                      ),
                      const SizedBox(height: 12),
                      for (final (i, e) in dayEvents.indexed) ...[
                        if (i > 0) const SizedBox(height: 12),
                        EventCard(event: e, monthName: monthName),
                      ],
                    ],
                  ),
          ),
        ],
      );
    }

    // List / cards: standalone month-nav panel, view content below on the
    // background, month swipe preserved via the PageView.
    return Column(
      children: [
        panel,
        Expanded(
          child: PageView.builder(
            controller: _pageController,
            itemCount: monthOrder.length,
            onPageChanged: (i) => setState(() {
              _monthIndex = i;
              _userSelectedDay = null;
            }),
            itemBuilder: (context, i) {
              final events = app.filteredEventsFor(monthOrder[i])..sort((a, b) => a.day.compareTo(b.day));
              return view == 'list'
                  ? CalendarListView(monthName: monthOrder[i], events: events)
                  : CalendarCardsView(monthName: monthOrder[i], events: events);
            },
          ),
        ),
      ],
    );
  }
}

/// Opens the calendar filter sheet. Called from the global [MobileHeader].
void showCalendarFilterSheet(BuildContext context) {
  final app = context.read<AppState>();
  showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (_) => _FilterSheet(initial: app.filters, onApply: app.setFilters),
  );
}

class _GridPage extends StatelessWidget {
  const _GridPage({required this.monthName, required this.selectedDay, required this.onDaySelected});

  final String monthName;
  final int? selectedDay;
  final ValueChanged<int> onDaySelected;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final events = app.filteredEventsFor(monthName)..sort((a, b) => a.day.compareTo(b.day));
    // Non-scrolling scroll view: the shared PageView height tracks the
    // CURRENT month, so a neighbor month with one more week row would
    // otherwise overflow by 52px mid-swipe.
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: _MonthGrid(
        monthName: monthName,
        events: events,
        selectedDay: selectedDay,
        onDaySelected: onDaySelected,
      ),
    );
  }
}

class _MonthHeader extends StatelessWidget {
  const _MonthHeader({
    required this.monthName,
    required this.year,
    this.onPrevious,
    this.onNext,
  });

  final String monthName;
  final int year;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      child: Row(
        children: [
          _MonthNavButton(
            icon: Icons.chevron_left,
            tooltip: app.t('monthNav.previous'),
            onTap: onPrevious,
          ),
          Expanded(
            child: Text(
              '${app.t('months.$monthName')} $year'.toUpperCase(),
              textAlign: TextAlign.center,
              style: condensed(size: 18, color: theme.colorScheme.onSurface, letterSpacing: 1),
            ),
          ),
          _MonthNavButton(
            icon: Icons.chevron_right,
            tooltip: app.t('monthNav.next'),
            onTap: onNext,
          ),
        ],
      ),
    );
  }
}

/// Web month-nav chevron: `p-2 rounded-lg bg-slate-100 dark:bg-[#1e293b]`
/// with a 16px stroke icon — a 32px rounded square.
class _MonthNavButton extends StatelessWidget {
  const _MonthNavButton({required this.icon, required this.tooltip, this.onTap});

  final IconData icon;
  final String tooltip;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = AppColors.of(context);
    final radius = BorderRadius.circular(8);
    return Tooltip(
      message: tooltip,
      child: Material(
        color: colors.surfaceTile,
        borderRadius: radius,
        child: InkWell(
          onTap: onTap,
          borderRadius: radius,
          child: SizedBox(
            width: 32,
            height: 32,
            child: Icon(
              icon,
              size: 18,
              color: onTap == null
                  ? theme.colorScheme.onSurface.withValues(alpha: 0.3)
                  : theme.colorScheme.onSurface,
            ),
          ),
        ),
      ),
    );
  }
}

/// Subtle stale-data row shown when the last live-data sync failed
/// (FR-OFFLINE-2) — mirrors the web's muted FotMob-unavailable notice.
class _StaleDataIndicator extends StatelessWidget {
  const _StaleDataIndicator();

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.cloud_off, size: 14, color: muted),
          const SizedBox(width: 6),
          Text(
            app.t('errors.fetchFailed'),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: muted),
          ),
        ],
      ),
    );
  }
}

/// Web `SELECTED DAY` chip: `bg-white/70 dark:bg-transparent text-slate-700
/// dark:text-slate-400 px-2 py-1 rounded`.
class _SelectedDayChip extends StatelessWidget {
  const _SelectedDayChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: dark ? Colors.transparent : const Color(0xB3FFFFFF),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label.toUpperCase(),
        style: condensed(size: 11, color: dark ? twSlate400 : twSlate700, letterSpacing: 1.5),
      ),
    );
  }
}

class _MonthGrid extends StatelessWidget {
  const _MonthGrid({
    required this.monthName,
    required this.events,
    required this.selectedDay,
    required this.onDaySelected,
  });

  final String monthName;
  final List<SportEvent> events;
  final int? selectedDay;
  final ValueChanged<int> onDaySelected;

  static const _dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  /// Web cells are a fixed `h-12` (48px) with a ~24px header row and `p-4`
  /// container padding — intrinsic height, no stretching.
  static const _cellHeight = 48.0;
  static const _headerHeight = 28.0;
  static const _padding = 16.0;

  static double heightFor(String monthName) {
    final info = monthInfo(monthName);
    final weeks = (info.startDay + info.daysInMonth + 6) ~/ 7;
    return _padding * 2 + _headerHeight + weeks * (_cellHeight + 4);
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final dark = Theme.of(context).brightness == Brightness.dark;
    final info = monthInfo(monthName);
    final now = DateTime.now();
    final isCurrentMonth = info.year == now.year && info.month == now.month;

    final eventsByDay = <int, List<SportEvent>>{};
    for (final e in events) {
      eventsByDay.putIfAbsent(e.day, () => []).add(e);
    }

    final weeks = (info.startDay + info.daysInMonth + 6) ~/ 7;

    return Padding(
      padding: const EdgeInsets.all(_padding),
      child: Column(
        children: [
          SizedBox(
            height: _headerHeight,
            child: Row(
              children: [
                for (final key in _dayKeys)
                  Expanded(
                    child: Center(
                      child: Text(
                        app.t('days.$key').substring(0, 3).toUpperCase(),
                        // Web: `text-xs font-bold text-slate-700
                        // dark:text-slate-400 font-condensed tracking-wider`.
                        style: condensed(size: 12, color: dark ? twSlate400 : twSlate700, letterSpacing: 1),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          for (var week = 0; week < weeks; week++)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: SizedBox(
                height: _cellHeight,
                child: Row(
                  // Stretch so each cell fills the full 48px row — otherwise
                  // fills/dots hug the day number instead of the cell bounds.
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    for (var slot = week * 7; slot < week * 7 + 7; slot++)
                      Expanded(child: _buildCell(context, slot, isCurrentMonth ? now.day : null)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCell(BuildContext context, int slot, int? todayDay) {
    final info = monthInfo(monthName);
    final dark = Theme.of(context).brightness == Brightness.dark;
    final day = slot - info.startDay + 1;

    // Web parity (QA CAL-01): leading cells are blank; trailing cells show
    // the next month's day number grayed out.
    if (day < 1) return const SizedBox.shrink();
    if (day > info.daysInMonth) {
      return Center(
        child: Text(
          '${day - info.daysInMonth}',
          style: TextStyle(fontSize: 14, color: dark ? twSlate600 : twSlate300),
        ),
      );
    }

    final dayEvents = <SportEvent>[for (final e in events) if (e.day == day) e];
    final isToday = day == todayDay;
    final isSelected = day == selectedDay;
    return _DayCell(
      key: ValueKey('day-cell-$day'),
      day: day,
      events: dayEvents,
      isToday: isToday,
      isSelected: isSelected,
      onTap: () => onDaySelected(day),
    );
  }
}

/// Web `getDotColors`: one dot per sport GROUP — red for football, blue for
/// any volleyball, gray only when a day has nothing but meetings.
@visibleForTesting
List<Color> dotColorsFor(List<SportEvent> events) {
  if (events.isEmpty) return const [];
  final sports = {for (final e in events) e.sport};
  final colors = <Color>[
    if (sports.contains(Sport.footballMen)) accentRed,
    if (sports.contains(Sport.volleyballMen) || sports.contains(Sport.volleyballWomen)) twBlue500,
  ];
  if (colors.isEmpty && sports.contains(Sport.meeting)) colors.add(twSlate400);
  return colors;
}

class _DayCell extends StatelessWidget {
  const _DayCell({
    super.key,
    required this.day,
    required this.events,
    required this.isToday,
    required this.isSelected,
    this.onTap,
  });

  final int day;
  final List<SportEvent> events;
  final bool isToday;
  final bool isSelected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final dots = dotColorsFor(events);
    // Web: selected = red 20% fill + bold red number; today (unselected) =
    // 2px red ring + semibold red number; else medium slate number.
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: isSelected ? accentRed.withValues(alpha: 0.2) : null,
          border: isToday && !isSelected
              ? Border.all(color: accentRed.withValues(alpha: 0.5), width: 2)
              : null,
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Text(
              '$day',
              style: TextStyle(
                fontSize: 16,
                fontWeight: isSelected
                    ? FontWeight.bold
                    : isToday
                        ? FontWeight.w600
                        : FontWeight.w500,
                color: isSelected || isToday ? accentRed : (dark ? const Color(0xFFE2E8F0) : twSlate800),
              ),
            ),
            if (dots.isNotEmpty)
              Positioned(
                bottom: 4,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    for (final (i, color) in dots.indexed)
                      Container(
                        width: 4,
                        height: 4,
                        margin: EdgeInsets.only(left: i == 0 ? 0 : 2),
                        decoration: BoxDecoration(shape: BoxShape.circle, color: color),
                      ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _FilterSheet extends StatefulWidget {
  const _FilterSheet({required this.initial, required this.onApply});

  final FilterState initial;
  final ValueChanged<FilterState> onApply;

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late FilterState _filters = widget.initial;
  late final TextEditingController _searchController = TextEditingController(text: widget.initial.search);

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);

    Widget chipRow<T>({
      required String title,
      required List<(T, String)> options,
      required T? selected,
      required void Function(T?) onChanged,
    }) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ChoiceChip(
                label: Text(app.t('filters.all')),
                selected: selected == null,
                onSelected: (_) => onChanged(null),
              ),
              for (final (value, label) in options)
                ChoiceChip(
                  label: Text(label),
                  selected: selected == value,
                  onSelected: (_) => onChanged(selected == value ? null : value),
                ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      );
    }

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(app.t('filters.title'), style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          chipRow<Sport>(
            title: app.t('filters.sport'),
            options: [
              (Sport.footballMen, app.t('sports.footballMen')),
              (Sport.volleyballMen, app.t('sports.volleyballMen')),
              (Sport.volleyballWomen, app.t('sports.volleyballWomen')),
              (Sport.meeting, app.t('sports.meeting')),
            ],
            selected: _filters.sport,
            onChanged: (v) => setState(() => _filters = _filters.copyWith(sport: () => v)),
          ),
          chipRow<MatchLocation>(
            title: app.t('filters.location'),
            options: [
              (MatchLocation.home, app.t('locations.home')),
              (MatchLocation.away, app.t('locations.away')),
            ],
            selected: _filters.location,
            onChanged: (v) => setState(() => _filters = _filters.copyWith(location: () => v)),
          ),
          chipRow<MatchStatus>(
            title: app.t('filters.status'),
            options: [
              (MatchStatus.upcoming, app.t('status.upcoming')),
              (MatchStatus.played, app.t('status.played')),
            ],
            selected: _filters.status,
            onChanged: (v) => setState(() => _filters = _filters.copyWith(status: () => v)),
          ),
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              labelText: app.t('filters.searchOpponent'),
              hintText: app.t('filters.searchPlaceholder'),
              prefixIcon: const Icon(Icons.search),
              border: const OutlineInputBorder(),
            ),
            onChanged: (v) => setState(() => _filters = _filters.copyWith(search: v)),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    widget.onApply(const FilterState());
                    Navigator.of(context).pop();
                  },
                  child: Text(app.t('filters.clearAll')),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: () {
                    widget.onApply(_filters);
                    Navigator.of(context).pop();
                  },
                  child: Text(app.t('filters.apply')),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
