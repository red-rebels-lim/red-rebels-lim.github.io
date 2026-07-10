import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/constants.dart';
import '../models/events.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/calendar_cards_view.dart';
import '../widgets/calendar_list_view.dart';
import '../widgets/event_card.dart';

class CalendarPage extends StatefulWidget {
  const CalendarPage({super.key});

  @override
  State<CalendarPage> createState() => _CalendarPageState();
}

class _CalendarPageState extends State<CalendarPage> {
  late final PageController _pageController;
  late int _monthIndex;
  int? _selectedDay;

  @override
  void initState() {
    super.initState();
    final app = context.read<AppState>();
    _monthIndex = monthOrder.indexOf(app.events.initialMonth(DateTime.now()));
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

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final monthName = monthOrder[_monthIndex];
    final info = monthInfo(monthName);

    final colors = AppColors.of(context);
    return Column(
      children: [
        Expanded(
          child: Container(
            margin: const EdgeInsets.fromLTRB(8, 8, 8, 0),
            decoration: BoxDecoration(
              color: colors.surfacePanel,
              borderRadius: BorderRadius.circular(16),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: [
                _MonthHeader(
                  monthName: monthName,
                  year: info.year,
                  onPrevious: _monthIndex > 0 ? () => _goToMonth(_monthIndex - 1) : null,
                  onNext: _monthIndex < monthOrder.length - 1 ? () => _goToMonth(_monthIndex + 1) : null,
                ),
                if (app.lastSyncFailed) const _StaleDataIndicator(),
                Expanded(
                  child: PageView.builder(
                    controller: _pageController,
                    itemCount: monthOrder.length,
                    onPageChanged: (i) => setState(() {
                      _monthIndex = i;
                      _selectedDay = null;
                    }),
                    itemBuilder: (context, i) => _MonthView(
                      monthName: monthOrder[i],
                      view: app.calendarView,
                      selectedDay: i == _monthIndex ? _selectedDay : null,
                      onDaySelected: (day) => setState(() {
                        _selectedDay = _selectedDay == day ? null : day;
                      }),
                    ),
                  ),
                ),
              ],
            ),
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Row(
        children: [
          IconButton(
            onPressed: onPrevious,
            icon: const Icon(Icons.chevron_left),
            tooltip: app.t('monthNav.previous'),
          ),
          Expanded(
            child: Text(
              '${app.t('months.$monthName')} $year'.toUpperCase(),
              textAlign: TextAlign.center,
              style: condensed(size: 18, color: theme.colorScheme.onSurface, letterSpacing: 1.5),
            ),
          ),
          IconButton(
            onPressed: onNext,
            icon: const Icon(Icons.chevron_right),
            tooltip: app.t('monthNav.next'),
          ),
        ],
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

class _MonthView extends StatelessWidget {
  const _MonthView({
    required this.monthName,
    required this.view,
    required this.selectedDay,
    required this.onDaySelected,
  });

  final String monthName;

  /// 'grid' | 'list' | 'cards'.
  final String view;
  final int? selectedDay;
  final ValueChanged<int> onDaySelected;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final events = app.filteredEventsFor(monthName)..sort((a, b) => a.day.compareTo(b.day));

    if (view == 'list') return CalendarListView(monthName: monthName, events: events);
    if (view == 'cards') return CalendarCardsView(monthName: monthName, events: events);

    final dayEvents = selectedDay == null ? const <SportEvent>[] : events.where((e) => e.day == selectedDay).toList();

    return LayoutBuilder(
      builder: (context, constraints) => Column(
      children: [
        _MonthGrid(
          monthName: monthName,
          events: events,
          selectedDay: selectedDay,
          onDaySelected: onDaySelected,
          maxHeight: constraints.maxHeight * 0.6,
        ),
        const Divider(height: 1),
        Expanded(
          child: dayEvents.isEmpty
              ? (events.isEmpty
                  ? _EmptyMonth(message: app.t('calendar.noEvents'))
                  : ListView.separated(
                      padding: const EdgeInsets.all(12),
                      itemCount: events.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 8),
                      itemBuilder: (_, i) => EventCard(event: events[i], monthName: monthName),
                    ))
              : Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: _SelectedDayChip(label: app.t('calendar.selectedDay')),
                      ),
                    ),
                    Expanded(
                      child: ListView.separated(
                        padding: const EdgeInsets.all(12),
                        itemCount: dayEvents.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 8),
                        itemBuilder: (_, i) => EventCard(event: dayEvents[i], monthName: monthName),
                      ),
                    ),
                  ],
                ),
        ),
      ],
      ),
    );
  }
}

class _SelectedDayChip extends StatelessWidget {
  const _SelectedDayChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: colors.muted,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label.toUpperCase(),
        style: condensed(size: 11, color: colors.foreground, letterSpacing: 1.5),
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
    required this.maxHeight,
  });

  final String monthName;
  final List<SportEvent> events;
  final int? selectedDay;
  final ValueChanged<int> onDaySelected;
  final double maxHeight;

  static const _dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final info = monthInfo(monthName);
    final now = DateTime.now();
    final isCurrentMonth = info.year == now.year && info.month == now.month;

    final eventsByDay = <int, List<SportEvent>>{};
    for (final e in events) {
      eventsByDay.putIfAbsent(e.day, () => []).add(e);
    }

    final cells = <Widget>[];
    for (final key in _dayKeys) {
      cells.add(Center(
        child: Text(
          app.t('days.$key').substring(0, 3).toUpperCase(),
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
            fontWeight: FontWeight.bold,
          ),
        ),
      ));
    }
    for (var i = 0; i < info.startDay; i++) {
      cells.add(const SizedBox.shrink());
    }
    for (var day = 1; day <= info.daysInMonth; day++) {
      final dayEvents = eventsByDay[day] ?? const <SportEvent>[];
      final isToday = isCurrentMonth && day == now.day;
      final isSelected = day == selectedDay;
      cells.add(_DayCell(
        day: day,
        events: dayEvents,
        isToday: isToday,
        isSelected: isSelected,
        onTap: dayEvents.isEmpty ? null : () => onDaySelected(day),
      ));
    }

    // Size cells to their natural 1.1 aspect ratio, but never let the grid
    // exceed maxHeight (small screens, landscape, test surfaces).
    final totalRows = 1 + ((info.startDay + info.daysInMonth + 6) ~/ 7);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final cellWidth = constraints.maxWidth / 7;
          final naturalHeight = cellWidth / 1.1;
          final cellHeight = naturalHeight * totalRows > maxHeight ? maxHeight / totalRows : naturalHeight;
          return GridView.count(
            crossAxisCount: 7,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: cellWidth / cellHeight,
            children: cells,
          );
        },
      ),
    );
  }
}

class _DayCell extends StatelessWidget {
  const _DayCell({
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
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        margin: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: isSelected
              ? brandRed.withValues(alpha: 0.15)
              : events.isNotEmpty
                  ? theme.colorScheme.surfaceContainerHigh
                  : null,
          border: isToday ? Border.all(color: brandRed, width: 2) : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '$day',
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: isToday || events.isNotEmpty ? FontWeight.bold : null,
                color: isToday ? brandRed : null,
              ),
            ),
            if (events.isNotEmpty)
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (final e in events.take(3))
                    Container(
                      width: 6,
                      height: 6,
                      margin: const EdgeInsets.symmetric(horizontal: 1),
                      decoration: BoxDecoration(shape: BoxShape.circle, color: sportColor(e.sport)),
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _EmptyMonth extends StatelessWidget {
  const _EmptyMonth({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Text(message, style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
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
