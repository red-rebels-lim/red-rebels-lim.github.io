import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../logic/football_stats.dart';
import '../logic/volleyball_stats.dart';
import '../models/events.dart';
import '../state/app_state.dart';
import '../theme.dart';

/// Stats page ported from the web `StatsPage.tsx` + `components/stats/*`:
/// one frosted panel holding the heading, the wrapping pill sport selector
/// and the active tab's sections — the whole page scrolls together, and the
/// sections use the web's `stat-section` design (uppercase condensed titles,
/// bordered translucent tiles). The former FotMob blocks (league table /
/// rankings / football top scorers) show the shared empty state until they
/// are generated from our own saved results (stakeholder decision
/// 2026-07-17 — the feed kept serving last season after promotion).
class StatsPage extends StatefulWidget {
  const StatsPage({super.key});

  @override
  State<StatsPage> createState() => _StatsPageState();
}

class _StatsPageState extends State<StatsPage> {
  String _activeTab = 'football';

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;

    final tabs = [
      ('football', app.t('stats.mensFootball')),
      ('volleyball-men', app.t('stats.mensVolleyball')),
      ('volleyball-women', app.t('stats.womensVolleyball')),
    ];

    return Container(
      margin: const EdgeInsets.fromLTRB(8, 8, 8, 0),
      decoration: BoxDecoration(
        color: colors.surfacePanel,
        borderRadius: BorderRadius.circular(colors.panelRadius),
      ),
      clipBehavior: Clip.antiAlias,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // Web: `text-lg font-bold text-slate-900 dark:text-slate-100`,
          // sentence case, body font.
          Text(
            app.t('nav.stats'),
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: dark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 8),
          // Sport selector: wrapping pills (never truncates — QA STA-01).
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final (value, label) in tabs)
                  _SportPill(
                    label: label,
                    selected: _activeTab == value,
                    onTap: () => setState(() => _activeTab = value),
                  ),
              ],
            ),
          ),
          if (_activeTab == 'football')
            const _FootballSections()
          else
            _VolleyballSections(
              sport: _activeTab == 'volleyball-men' ? Sport.volleyballMen : Sport.volleyballWomen,
            ),
        ],
      ),
    );
  }
}

/// Web pill: `px-4 py-2 rounded-full text-xs font-bold tracking-wide`;
/// active `bg-primary text-white`, inactive slate-200 / #1a1a1a.
class _SportPill extends StatelessWidget {
  const _SportPill({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: selected ? colors.primary : (dark ? const Color(0xFF1A1A1A) : twSlate200),
      borderRadius: colors.br(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: colors.br(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.3,
              color: selected ? Colors.white : (dark ? twSlate400 : twSlate600),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Tab compositions (web FootballStatsTab / VolleyballStatsTab order) ──────

class _FootballSections extends StatelessWidget {
  const _FootballSections();

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final stats = calculateFootballStats(app.events);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _SeasonSummarySection(stats: stats),
        _RecentFormSection(results: [for (final m in stats.recentForm) (m.result, app.teamName(m.opponent), m.score)]),
        // Former FotMob blocks — empty until generated from local results.
        _EmptyStatSection(titleKey: 'stats.leagueStanding'),
        _PerformanceSplitSection(
          home: (stats.home.played, stats.home.wins, stats.home.draws, stats.home.losses),
          away: (stats.away.played, stats.away.wins, stats.away.draws, stats.away.losses),
          showDraws: true,
        ),
        _EmptyStatSection(titleKey: 'stats.topScorers'),
        _EmptyStatSection(titleKey: 'stats.leagueRankings'),
        _HeadToHeadSection(
          rows: [
            for (final h in stats.headToHead.take(10))
              (app.teamName(h.opponent), h.played, h.wins, h.draws, h.losses, '${h.goalsFor}-${h.goalsAgainst}'),
          ],
        ),
      ],
    );
  }
}

/// Titled section in the shared empty state — placeholder for the former
/// FotMob blocks until they are computed from our own saved results.
class _EmptyStatSection extends StatelessWidget {
  const _EmptyStatSection({required this.titleKey});

  final String titleKey;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    return _Section(
      title: app.t(titleKey),
      child: Text(
        app.t('stats.noData'),
        textAlign: TextAlign.center,
        style: TextStyle(color: colors.mutedForeground),
      ),
    );
  }
}

/// Web `getOrdinalSuffix` / the Greek `{rank}ος` (LeagueRankings.tsx).
@visibleForTesting
String formatOrdinalRank(int rank, String language) {
  // Greek ordinals are masculine-form: 2ος. The braces are load-bearing —
  // 'ος' would otherwise merge into the identifier.
  // ignore: unnecessary_brace_in_string_interps
  if (language == 'el') return '${rank}ος';
  final v = rank % 100;
  if (v >= 11 && v <= 13) return '${rank}th';
  return switch (rank % 10) {
    1 => '${rank}st',
    2 => '${rank}nd',
    3 => '${rank}rd',
    _ => '${rank}th',
  };
}

/// Web `tApi`: `fotmob.{category}.{apiString}` lookup, raw string fallback.
String tApi(AppState app, String category, String apiString) {
  final translated = app.t('fotmob.$category.$apiString', '');
  return translated.isEmpty ? apiString : translated;
}

class _VolleyballSections extends StatelessWidget {
  const _VolleyballSections({required this.sport});

  final Sport sport;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final stats = calculateVolleyballStats(app.events, sport);
    final women = sport == Sport.volleyballWomen;

    final recentForm = _RecentFormSection(
      results: [for (final m in stats.recentForm) (m.result, app.teamName(m.opponent), m.score)],
    );
    final seasonSummary = _VolleyballSummarySection(stats: stats, women: women);
    final performanceSplit = _PerformanceSplitSection(
      home: (stats.home.played, stats.home.wins, null, stats.home.losses),
      away: (stats.away.played, stats.away.wins, null, stats.away.losses),
      showDraws: false,
    );
    // Web volleyball TopScorers keeps the raw feed names (no i18n lookup).
    final topScorers = _TopScorersSection(
      scorers: [for (final s in stats.topScorers) (s.name, s.totalPoints)],
    );

    // Web: women = Recent Form → Summary → Split → Scorers;
    //      men = Summary → Set Breakdown → Recent Form → Split → Scorers.
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: women
          ? [recentForm, seasonSummary, performanceSplit, topScorers]
          : [
              seasonSummary,
              _SetBreakdownSection(
                setsWon: stats.overall.setsWon,
                setsLost: stats.overall.setsLost,
                threeZero: stats.setBreakdown.threeZero,
                threeOne: stats.setBreakdown.threeOne,
                threeTwo: stats.setBreakdown.threeTwo,
              ),
              recentForm,
              performanceSplit,
              topScorers,
            ],
    );
  }
}

// ── Shared building blocks (web `stat-section` / tile classes) ──────────────

/// `stat-section`: 24px bottom margin; `stat-section-title`: 18px condensed
/// uppercase, 16px below.
class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title.upperNoTonos, style: condensed(size: 18, color: colors.foreground, letterSpacing: 0.9)),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

/// Web stat tile chrome: `rounded-lg bg-white/5 dark:bg-[#1a1a1a]/50 border
/// border-slate-200 dark:border-slate-800`.
BoxDecoration _tileDecoration(BuildContext context) {
  final dark = Theme.of(context).brightness == Brightness.dark;
  return BoxDecoration(
    color: dark ? const Color(0x801A1A1A) : const Color(0x0DFFFFFF),
    border: Border.all(color: dark ? twSlate800 : twSlate200),
    borderRadius: AppColors.of(context).br(8),
  );
}

class _SeasonSummarySection extends StatelessWidget {
  const _SeasonSummarySection({required this.stats});

  final FootballStats stats;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;
    final green = dark ? const Color(0xFF4ADE80) : const Color(0xFF16A34A);

    final cards = <(String, String, Color?)>[
      (app.t('stats.matches'), '${stats.overall.played}', null),
      (app.t('stats.wins'), '${stats.overall.wins}', green),
      (app.t('stats.draws'), '${stats.overall.draws}', null),
      (app.t('stats.losses'), '${stats.overall.losses}', colors.primary),
      (app.t('stats.goals'), '${stats.overall.goalsFor}-${stats.overall.goalsAgainst}', null),
      (app.t('stats.points'), '${stats.overall.points}', colors.primary),
      (app.t('stats.cleanSheets'), '${stats.cleanSheets}', null),
      (app.t('stats.avgGoalsFor'), '${stats.avgGoalsFor}', null),
      (app.t('stats.avgGoalsAgainst'), '${stats.avgGoalsAgainst}', null),
    ];

    return _Section(
      title: app.t('stats.seasonSummary'),
      child: _TileGrid(
        columns: 3,
        children: [
          for (final (label, value, color) in cards)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: _tileDecoration(context),
              child: Column(
                children: [
                  _TileLabel(label, center: true),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: color ?? colors.foreground,
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

class _VolleyballSummarySection extends StatelessWidget {
  const _VolleyballSummarySection({required this.stats, required this.women});

  final VolleyballStats stats;
  final bool women;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;
    final green = dark ? const Color(0xFF4ADE80) : const Color(0xFF16A34A);

    // Web hero pair: women = Points + Sets Won; men = Win Rate + Points.
    final heroes = women
        ? [
            (app.t('stats.totalPoints'), '${stats.overall.pointsScored}'),
            (app.t('stats.setsWon'), '${stats.overall.setsWon}'),
          ]
        : [
            (app.t('stats.winRate'), '${stats.overall.winPercentage}%'),
            (app.t('stats.totalPoints'), '${stats.overall.pointsScored}'),
          ];

    return _Section(
      title: app.t('stats.seasonSummary'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              for (final (i, hero) in heroes.indexed) ...[
                if (i > 0) const SizedBox(width: 16),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: _tileDecoration(context),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _TileLabel(hero.$1),
                        const SizedBox(height: 4),
                        Text(
                          hero.$2,
                          style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: colors.primary),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),
          _TileGrid(
            columns: 3,
            children: [
              for (final (label, value, color) in <(String, String, Color?)>[
                (app.t('stats.matches'), '${stats.overall.played}', null),
                (app.t('stats.wins'), '${stats.overall.wins}', green),
                (app.t('stats.losses'), '${stats.overall.losses}', colors.primary),
              ])
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: _tileDecoration(context),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(child: _TileLabel(label)),
                      Text(
                        value,
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color ?? colors.foreground),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SetBreakdownSection extends StatelessWidget {
  const _SetBreakdownSection({
    required this.setsWon,
    required this.setsLost,
    required this.threeZero,
    required this.threeOne,
    required this.threeTwo,
  });

  final int setsWon;
  final int setsLost;
  final int threeZero;
  final int threeOne;
  final int threeTwo;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;
    final total = setsWon + setsLost;

    Widget bar(String label, int value, Color fill) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            children: [
              SizedBox(
                width: 80,
                child: Text(
                  label,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: colors.mutedForeground),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ClipRRect(
                  borderRadius: colors.br(999),
                  child: LinearProgressIndicator(
                    value: total == 0 ? 0 : value / total,
                    minHeight: 24,
                    backgroundColor: dark ? Colors.white.withValues(alpha: 0.05) : const Color(0x0D000000),
                    color: fill,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              SizedBox(
                width: 32,
                child: Text(
                  '$value',
                  textAlign: TextAlign.right,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: colors.foreground),
                ),
              ),
            ],
          ),
        );

    return _Section(
      title: app.t('stats.setBreakdown'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          bar(app.t('stats.setsWon'), setsWon, brandRed),
          bar(app.t('stats.setsLost'), setsLost, colors.mutedForeground.withValues(alpha: 0.3)),
          const SizedBox(height: 8),
          _TileGrid(
            columns: 3,
            children: [
              for (final (label, value) in [('3-0', threeZero), ('3-1', threeOne), ('3-2', threeTwo)])
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: _tileDecoration(context),
                  child: Column(
                    children: [
                      Text(label, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: colors.foreground)),
                      Text('$value', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: colors.primary)),
                      _TileLabel(app.t('stats.winsCount'), center: true),
                    ],
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RecentFormSection extends StatelessWidget {
  const _RecentFormSection({required this.results});

  /// (result, opponent, score)
  final List<(String, String, String)> results;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    return _Section(
      title: app.t('stats.recentForm'),
      child: Column(
        children: [
          Text(
            app.t('stats.last5Matches'),
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: colors.mutedForeground),
          ),
          const SizedBox(height: 12),
          if (results.isEmpty)
            Text(app.t('stats.noData'), style: TextStyle(color: colors.mutedForeground))
          else
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 12,
              runSpacing: 12,
              children: [
                for (final (result, opponent, score) in results)
                  Tooltip(
                    message: '$opponent ($score)',
                    triggerMode: TooltipTriggerMode.tap,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(borderRadius: AppColors.of(context).br(999), color: formColor(result)),
                      alignment: Alignment.center,
                      child: Text(
                        result,
                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),
              ],
            ),
        ],
      ),
    );
  }
}

class _PerformanceSplitSection extends StatelessWidget {
  const _PerformanceSplitSection({required this.home, required this.away, required this.showDraws});

  /// (played, wins, draws, losses) — draws null for volleyball.
  final (int, int, int?, int) home;
  final (int, int, int?, int) away;
  final bool showDraws;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;
    final green = dark ? const Color(0xFF4ADE80) : const Color(0xFF16A34A);
    final yellow = dark ? const Color(0xFFFACC15) : twYellow500;

    Widget tile(String label, String emoji, (int, int, int?, int) data) {
      final (played, wins, draws, losses) = data;
      return Expanded(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: _tileDecoration(context),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  borderRadius: AppColors.of(context).br(999),
                  color: dark ? twSlate800 : twSlate200,
                ),
                alignment: Alignment.center,
                child: Text(emoji, style: const TextStyle(fontSize: 20)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _TileLabel(label),
                    Text.rich(
                      TextSpan(children: [
                        TextSpan(
                          text: '$played ',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: colors.foreground),
                        ),
                        TextSpan(
                          text: app.t('stats.matches'),
                          style: TextStyle(fontSize: 12, color: twSlate500),
                        ),
                      ]),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text.rich(
                      TextSpan(children: [
                        TextSpan(text: '$wins${app.t('stats.w')}  ', style: TextStyle(color: green)),
                        if (showDraws)
                          TextSpan(text: '${draws ?? 0}${app.t('stats.d')}  ', style: TextStyle(color: yellow)),
                        TextSpan(text: '$losses${app.t('stats.l')}', style: TextStyle(color: colors.primary)),
                      ]),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    return _Section(
      title: app.t('stats.performanceSplit'),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            tile(app.t('stats.home'), '🏠', home),
            const SizedBox(width: 12),
            tile(app.t('stats.away'), '✈️', away),
          ],
        ),
      ),
    );
  }
}

/// Shared top-scorers rows (volleyball now; QA-20 reuses it for the FotMob
/// football list). Web: #1 row gets the primary border + primary count.
class _TopScorersSection extends StatelessWidget {
  const _TopScorersSection({required this.scorers});

  /// (name, value)
  final List<(String, int)> scorers;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;
    if (scorers.isEmpty) return const SizedBox.shrink();

    return _Section(
      title: app.t('stats.topScorers'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final (i, scorer) in scorers.indexed)
            Container(
              margin: EdgeInsets.only(top: i == 0 ? 0 : 8),
              padding: const EdgeInsets.all(12),
              decoration: _tileDecoration(context).copyWith(
                border: i == 0 ? Border.all(color: colors.primary) : null,
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 16,
                    child: Text('${i + 1}', style: const TextStyle(fontSize: 14, color: twSlate400, fontWeight: FontWeight.w500)),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      borderRadius: AppColors.of(context).br(999),
                      color: dark ? twSlate700 : twSlate300,
                    ),
                    alignment: Alignment.center,
                    child: const Text('👤', style: TextStyle(fontSize: 18)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      scorer.$1,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontWeight: FontWeight.w500, color: colors.foreground),
                    ),
                  ),
                  Text(
                    '${scorer.$2}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: i == 0 ? colors.primary : colors.foreground,
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

class _HeadToHeadSection extends StatelessWidget {
  const _HeadToHeadSection({required this.rows});

  /// (opponent, played, wins, draws, losses, goals)
  final List<(String, int, int, int, int, String)> rows;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;
    final headerBg = dark ? twSlate800.withValues(alpha: 0.5) : const Color(0xFFF1F5F9);
    final rowBorder = BorderSide(color: dark ? twSlate800 : twSlate200);

    if (rows.isEmpty) {
      return _Section(
        title: app.t('stats.headToHead'),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Text(
            app.t('stats.noData'),
            textAlign: TextAlign.center,
            style: TextStyle(color: colors.mutedForeground),
          ),
        ),
      );
    }

    Widget headerCell(String text, {TextAlign align = TextAlign.center}) => Container(
          color: headerBg,
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          child: Text(
            text.upperNoTonos,
            textAlign: align,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: dark ? twSlate400 : twSlate500),
          ),
        );

    Widget cell(Widget child) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          child: child,
        );

    TextStyle bold(Color color) => TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color);

    return _Section(
      title: app.t('stats.headToHead'),
      child: Table(
        columnWidths: const {
          0: FlexColumnWidth(3),
          1: FlexColumnWidth(1),
          2: FlexColumnWidth(1),
          3: FlexColumnWidth(1),
          4: FlexColumnWidth(1),
          5: FlexColumnWidth(1.6),
        },
        defaultVerticalAlignment: TableCellVerticalAlignment.middle,
        children: [
          TableRow(
            decoration: BoxDecoration(border: Border(bottom: rowBorder)),
            children: [
              headerCell(app.t('stats.opponent'), align: TextAlign.left),
              headerCell(app.t('stats.played')),
              headerCell(app.t('stats.w')),
              headerCell(app.t('stats.d')),
              headerCell(app.t('stats.l')),
              headerCell(app.t('stats.goalsCol')),
            ],
          ),
          for (final (opponent, played, wins, draws, losses, goals) in rows)
            TableRow(
              decoration: BoxDecoration(border: Border(bottom: rowBorder)),
              children: [
                cell(Text(opponent, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: colors.foreground))),
                cell(Text('$played', textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: colors.mutedForeground))),
                cell(Text('$wins', textAlign: TextAlign.center, style: bold(const Color(0xFF4ADE80)))),
                cell(Text('$draws', textAlign: TextAlign.center, style: bold(const Color(0xFFFACC15)))),
                cell(Text('$losses', textAlign: TextAlign.center, style: bold(const Color(0xFFF87171)))),
                cell(Text(goals, textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: colors.mutedForeground))),
              ],
            ),
        ],
      ),
    );
  }
}

// ── Small helpers ────────────────────────────────────────────────────────────

class _TileLabel extends StatelessWidget {
  const _TileLabel(this.text, {this.center = false});

  final String text;
  final bool center;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Text(
      text,
      textAlign: center ? TextAlign.center : TextAlign.start,
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: dark ? twSlate400 : twSlate500),
    );
  }
}

/// Fixed-column grid built from rows (the web `grid grid-cols-3 gap-3`).
class _TileGrid extends StatelessWidget {
  const _TileGrid({required this.columns, required this.children});

  final int columns;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < children.length; i += columns) {
      rows.add(Padding(
        padding: EdgeInsets.only(top: i == 0 ? 0 : 12),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (var j = 0; j < columns; j++) ...[
                if (j > 0) const SizedBox(width: 12),
                Expanded(
                  child: i + j < children.length ? children[i + j] : const SizedBox.shrink(),
                ),
              ],
            ],
          ),
        ),
      ));
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: rows);
  }
}
