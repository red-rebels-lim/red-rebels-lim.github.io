import 'dart:convert';

import 'package:http/http.dart' as http;

/// FotMob live-data client, ported from the web `app/src/lib/fotmob.ts`
/// (Phase 8 / QA-20 — register rows STA-07 and STA-06 football half).
///
/// Same endpoint, same 5-minute in-memory cache, same parser semantics.
/// Every failure path returns null — callers degrade like the web
/// (skeletons while loading, error banner + retry, blocks hidden when a
/// parse yields nothing). The web also parses a NextMatch banner, but never
/// renders it (`NextMatch.tsx` is referenced only by its tests), so it is
/// deliberately not ported.

/// `NEA_SALAMINA_ID` in the web constants. FotMob ids are NOT
/// season-specific — this is the club id, not a competition id.
const neaSalaminaFotMobId = 8590;

class LeagueTableRow {
  const LeagueTableRow({
    required this.id,
    required this.name,
    required this.shortName,
    required this.played,
    required this.wins,
    required this.draws,
    required this.losses,
    required this.goalDifference,
    required this.pts,
    required this.position,
    this.qualColor,
  });

  final int id;
  final String name;
  final String shortName;
  final int played;
  final int wins;
  final int draws;
  final int losses;
  final int goalDifference;
  final int pts;
  final int position;

  /// CSS color string for the qualification dot (e.g. `#2AD572`).
  final String? qualColor;
}

class TableLegendEntry {
  const TableLegendEntry({required this.color, required this.title});

  final String color;
  final String title;
}

class LeagueTableData {
  const LeagueTableData({required this.leagueName, required this.rows, required this.legend});

  final String leagueName;
  final List<LeagueTableRow> rows;
  final List<TableLegendEntry> legend;
}

class FotMobTopScorer {
  const FotMobTopScorer({required this.name, required this.goals});

  final String name;
  final int goals;
}

class LeagueRanking {
  const LeagueRanking({
    required this.label,
    required this.value,
    required this.rank,
    required this.totalTeams,
  });

  final String label;
  final String value;
  final int rank;
  final int totalTeams;
}

class FotMobParsed {
  const FotMobParsed({required this.tables, required this.topScorers, required this.rankings});

  final List<LeagueTableData> tables;
  final List<FotMobTopScorer> topScorers;
  final List<LeagueRanking> rankings;
}

/// Shared instance used by the stats page — replaceable in tests, matching
/// the repo's injectable-bridge convention.
FotMobClient fotMobClient = FotMobClient();

class FotMobClient {
  FotMobClient({this.httpClientFactory});

  static const apiUrl =
      'https://www.fotmob.com/api/data/teams?id=$neaSalaminaFotMobId&ccode3=CYP';
  static const cacheTtl = Duration(minutes: 5);
  static const _fetchTimeout = Duration(seconds: 10);

  /// Injectable HTTP client factory for tests; null → a client is created
  /// (and closed) per call.
  final http.Client Function()? httpClientFactory;

  FotMobParsed? _cached;
  DateTime? _cachedAt;

  /// Fetches and parses the team data. Returns the cached parse within the
  /// TTL; null on any failure (network, non-200, malformed) — never throws.
  Future<FotMobParsed?> fetch() async {
    final cached = _cached;
    if (cached != null &&
        _cachedAt != null &&
        DateTime.now().difference(_cachedAt!) < cacheTtl) {
      return cached;
    }

    final c = httpClientFactory?.call() ?? http.Client();
    try {
      final response = await c
          .get(Uri.parse(apiUrl), headers: const {'Accept': 'application/json'})
          .timeout(_fetchTimeout);
      if (response.statusCode != 200) return null;
      final decoded = json.decode(utf8.decode(response.bodyBytes));
      if (decoded is! Map<String, dynamic>) return null;
      final parsed = parseTeamData(decoded);
      _cached = parsed;
      _cachedAt = DateTime.now();
      return parsed;
    } catch (_) {
      return null;
    } finally {
      if (httpClientFactory == null) c.close();
    }
  }
}

/// Web `parseFotMobData` — each block parser tolerates missing branches.
FotMobParsed parseTeamData(Map<String, dynamic> data) => FotMobParsed(
      tables: parseLeagueTables(data),
      topScorers: parseTopScorers(data),
      rankings: parseLeagueRankings(data),
    );

int _asInt(dynamic v) => v is int ? v : (v is num ? v.round() : 0);

/// Web `parseLeagueTables`: tables nest under
/// `overview.table[0].data.tables[].table.all`.
List<LeagueTableData> parseLeagueTables(Map<String, dynamic> data) {
  try {
    final wrapper = (data['overview'] as Map<String, dynamic>?)?['table'] as List?;
    if (wrapper == null || wrapper.isEmpty) return const [];
    final dataObj = (wrapper[0] as Map<String, dynamic>?)?['data'] as Map<String, dynamic>?;
    final nested = dataObj?['tables'] as List?;
    if (nested == null || nested.isEmpty) return const [];

    return [
      for (final t in nested.cast<Map<String, dynamic>>())
        LeagueTableData(
          leagueName: t['leagueName'] as String? ?? '',
          rows: [
            for (final row in ((t['table'] as Map<String, dynamic>?)?['all'] as List? ?? const [])
                .cast<Map<String, dynamic>>())
              LeagueTableRow(
                id: _asInt(row['id']),
                name: row['name'] as String? ?? '',
                shortName: row['shortName'] as String? ?? '',
                played: _asInt(row['played']),
                wins: _asInt(row['wins']),
                draws: _asInt(row['draws']),
                losses: _asInt(row['losses']),
                goalDifference: _asInt(row['goalConDiff']),
                pts: _asInt(row['pts']),
                position: _asInt(row['idx']),
                qualColor: row['qualColor'] as String?,
              ),
          ],
          legend: [
            for (final l in (t['legend'] as List? ?? const []).cast<Map<String, dynamic>>())
              TableLegendEntry(
                color: l['color'] as String? ?? '',
                title: l['title'] as String? ?? '',
              ),
          ],
        ),
    ];
  } catch (_) {
    return const [];
  }
}

/// Web `parseTopScorers`: goals live in `stat.value` (or top-level `value`).
List<FotMobTopScorer> parseTopScorers(Map<String, dynamic> data) {
  try {
    final players = ((((data['overview'] as Map<String, dynamic>?)?['topPlayers']
            as Map<String, dynamic>?)?['byGoals'] as Map<String, dynamic>?)?['players'] as List?)
        ?.cast<Map<String, dynamic>>();
    if (players == null) return const [];
    return [
      for (final p in players.take(3))
        FotMobTopScorer(
          name: p['name'] as String? ?? '',
          goals: _asInt((p['stat'] as Map<String, dynamic>?)?['value'] ?? p['value']),
        ),
    ];
  } catch (_) {
    return const [];
  }
}

/// Web `parseLeagueRankings`: `stats.teams[]` categories where our team is
/// the participant.
List<LeagueRanking> parseLeagueRankings(Map<String, dynamic> data) {
  try {
    final categories =
        ((data['stats'] as Map<String, dynamic>?)?['teams'] as List?)?.cast<Map<String, dynamic>>();
    if (categories == null) return const [];

    final rankings = <LeagueRanking>[];
    for (final cat in categories) {
      final participant = cat['participant'] as Map<String, dynamic>?;
      if (participant == null || _asInt(participant['teamId']) != neaSalaminaFotMobId) continue;
      final topThree = cat['topThree'] as List?;
      final rank = _asInt(participant['rank']);
      rankings.add(LeagueRanking(
        label: cat['header'] as String? ?? '',
        value: '${participant['value']}',
        rank: rank,
        totalTeams: (topThree?.length ?? 0) > rank ? topThree!.length : rank,
      ));
    }
    return rankings;
  } catch (_) {
    return const [];
  }
}
