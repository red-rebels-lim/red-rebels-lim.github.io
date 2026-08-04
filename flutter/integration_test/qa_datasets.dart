/// Synthetic QA datasets (docs/native-apps/TEST-PLAN.md §4.5).
///
/// Each dataset is an events.json-shaped payload (bare month map, the
/// bundled-asset shape EventsRepository._parsePayload accepts). The live
/// 26/27 feed cannot exercise every scenario (no cup/penalties, no
/// volleyball data yet, no imminent kickoffs), so the suite injects these.
///
/// Time-relative datasets are computed against the real clock, so countdown
/// scenarios are always exercisable. Months resolve through the season
/// window in data/constants.dart (July -> June); events outside the current
/// season window cannot be represented and are skipped by the builders.
library;

import 'package:solo_salamina/data/constants.dart';

const _monthNames = <int, String>{
  1: 'january', 2: 'february', 3: 'march', 4: 'april', 5: 'may', 6: 'june',
  7: 'july', 8: 'august', 9: 'september', 10: 'october', 11: 'november',
  12: 'december',
};

/// Month key for [date] when it falls inside the current season window.
String? seasonMonthFor(DateTime date) {
  final name = _monthNames[date.month]!;
  final info = monthInfo(name);
  return info.year == date.year ? name : null;
}

Map<String, dynamic> qaDataset(String name) => switch (name) {
      'full-season' => qaFullSeason(),
      'cup-penalties' => _only(qaFullSeason(), (e) => e['competition'] == 'cup'),
      'volleyball' => _only(qaFullSeason(), (e) => (e['sport'] as String).startsWith('volleyball')),
      'unknown-team' => _only(qaFullSeason(), (e) => e['opponent'] == qaUnknownOpponent),
      'upcoming-soon' => qaUpcomingSoon(),
      'no-upcoming' => _only(qaFullSeason(), (e) => e['status'] == 'played'),
      // An entirely-empty payload is treated as malformed and falls back to
      // the bundled feed — one present-but-empty month keeps it valid.
      'empty' => const <String, dynamic>{'september': <Map<String, dynamic>>[]},
      _ => throw ArgumentError('unknown QA dataset: $name'),
    };

Map<String, dynamic> _only(Map<String, dynamic> data, bool Function(Map<String, dynamic>) keep) {
  final out = <String, dynamic>{};
  for (final entry in data.entries) {
    final kept = (entry.value as List).cast<Map<String, dynamic>>().where(keep).toList();
    if (kept.isNotEmpty) out[entry.key] = kept;
  }
  return out;
}

const qaUnknownOpponent = 'ΤΕΣΤ ΓΙΟΥΝΑΪΤΕΝΤ';

/// Our XI for lineup fixtures — deliberately uses names with i18n mappings
/// plus one without, so translation fallbacks are visible.
List<Map<String, dynamic>> _ourLineup() => [
      for (final (i, name) in const [
        'ΤΕΣΤ ΤΕΡΜΑΤΟΦΥΛΑΚΑΣ', 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', 'ΑΜΥΝΤΙΚΟΣ ΔΥΟ',
        'ΑΜΥΝΤΙΚΟΣ ΤΡΙΑ', 'ΑΜΥΝΤΙΚΟΣ ΤΕΣΣΕΡΑ', 'ΜΕΣΟΣ ΕΝΑ', 'ΜΕΣΟΣ ΔΥΟ',
        'ΜΕΣΟΣ ΤΡΙΑ', 'ΕΠΙΘΕΤΙΚΟΣ ΕΝΑ', 'ΕΠΙΘΕΤΙΚΟΣ ΔΥΟ', 'ΕΠΙΘΕΤΙΚΟΣ ΤΡΙΑ',
      ].indexed)
        {'name': name, 'number': i + 1},
    ];

List<Map<String, dynamic>> _theirLineup() => [
      {'name': 'OPPONENT ONE', 'number': 1},
      {'name': 'OPPONENT TWO', 'number': 7},
      {'name': 'OPPONENT THREE', 'number': 9},
    ];

/// Fixed-calendar dataset: a dense synthetic season.
///
/// September: home league win (scorers incl. penalty, bookings, lineups both
/// sides, subs, report) + away league loss (our lineup in lineup.away — the
/// side-attribution regression case, task #11).
/// October: away cup draw decided on penalties + volleyball (men 3-1 home,
/// women 2-3 away, both with sets + top scorers).
/// November: TBD home fixture vs a team with no crest/no i18n mapping + a
/// dated away fixture.
Map<String, dynamic> qaFullSeason() => {
      'september': [
        {
          'day': 5,
          'sport': 'football-men',
          'location': 'home',
          'opponent': 'ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ',
          'time': '19:00',
          'venue': 'Stadio Vitex Ammochostos Epistrofi',
          'logo': 'images/team_logos/ΔΟΞΑ_ΚΑΤΩΚΟΠΙΑΣ.webp',
          'status': 'played',
          'score': '3-1',
          'competition': 'league',
          'matchday': 1,
          'scorers': [
            {'name': 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', 'minute': '23', 'team': 'home'},
            {'name': 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ  (Πέναλτι)', 'minute': '58', 'team': 'home', 'type': 'pen'},
            {'name': 'ΤΕΣΤ ΣΚΟΡΕΡ', 'minute': '77', 'team': 'home'},
            {'name': 'OPPONENT TWO', 'minute': '89', 'team': 'away'},
          ],
          'bookings': [
            {'name': 'ΜΕΣΟΣ ΕΝΑ', 'minute': '31', 'team': 'home', 'card': 'yellow'},
            {'name': 'OPPONENT THREE', 'minute': '66', 'team': 'away', 'card': 'red'},
          ],
          'lineup': {'home': _ourLineup(), 'away': _theirLineup()},
          'subs': [
            {'playerOn': 'ΤΕΣΤ ΑΛΛΑΓΗ', 'playerOff': 'ΜΕΣΟΣ ΤΡΙΑ', 'minute': '60', 'team': 'home'},
          ],
          'reportEN': 'A commanding home win sealed by a second-half surge.',
          'reportEL': 'Καθαρή εντός έδρας νίκη με ξέσπασμα στο δεύτερο ημίχρονο.',
        },
        {
          'day': 12,
          'sport': 'football-men',
          'location': 'away',
          'opponent': 'ΑΕΛ',
          'time': '18:00',
          'logo': 'images/team_logos/ΑΕΛ.webp',
          'status': 'played',
          'score': '2-0',
          'competition': 'league',
          'matchday': 2,
          'scorers': [
            {'name': 'OPPONENT ONE', 'minute': '15', 'team': 'home'},
            {'name': 'OPPONENT TWO', 'minute': '52', 'team': 'home'},
          ],
          // Correct attribution for an away match: our XI under lineup.away.
          'lineup': {'home': _theirLineup(), 'away': _ourLineup()},
          'subs': [
            {'playerOn': 'ΤΕΣΤ ΑΛΛΑΓΗ', 'playerOff': 'ΕΠΙΘΕΤΙΚΟΣ ΕΝΑ', 'minute': '70', 'team': 'away'},
          ],
        },
      ],
      'october': [
        {
          'day': 3,
          'sport': 'football-men',
          'location': 'away',
          'opponent': 'ΑΠΟΕΛ',
          'time': '20:00',
          'status': 'played',
          'score': '2-2',
          'competition': 'cup',
          'matchday': 1,
          'penalties': '1-3',
          'scorers': [
            {'name': 'ΤΕΣΤ ΣΚΟΡΕΡ', 'minute': '44', 'team': 'away'},
            {'name': 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ', 'minute': '90+2', 'team': 'away'},
            {'name': 'OPPONENT ONE', 'minute': '12', 'team': 'home'},
            {'name': 'OPPONENT THREE', 'minute': '75', 'team': 'home'},
          ],
        },
        {
          'day': 10,
          'sport': 'volleyball-men',
          'location': 'home',
          'opponent': 'ΑΝΟΡΘΩΣΙΣ',
          'time': '19:30',
          'status': 'played',
          'score': '3-1',
          'competition': 'league',
          'matchday': 1,
          'sets': [
            {'home': 25, 'away': 20},
            {'home': 23, 'away': 25},
            {'home': 25, 'away': 18},
            {'home': 25, 'away': 22},
          ],
          'vbScorers': [
            {'name': 'ΤΕΣΤ ΠΟΝΤΕΡ', 'points': 18, 'team': 'home'},
            {'name': 'ΤΕΣΤ ΚΕΝΤΡΙΚΟΣ', 'points': 12, 'team': 'home'},
          ],
        },
        {
          'day': 17,
          'sport': 'volleyball-women',
          'location': 'away',
          'opponent': 'ΑΕΛ (Γ)',
          'time': '18:30',
          'status': 'played',
          'score': '2-3',
          'competition': 'league',
          'matchday': 2,
          'sets': [
            {'home': 25, 'away': 23},
            {'home': 20, 'away': 25},
            {'home': 25, 'away': 21},
            {'home': 22, 'away': 25},
            {'home': 13, 'away': 15},
          ],
        },
      ],
      'november': [
        {
          'day': 7,
          'sport': 'football-men',
          'location': 'home',
          'opponent': qaUnknownOpponent,
          'time': '',
          'status': 'upcoming',
          'competition': 'league',
          'matchday': 9,
          'dateTbd': true,
        },
        {
          'day': 21,
          'sport': 'football-men',
          'location': 'away',
          'opponent': 'ΑΕΚ ΛΑΡΝΑΚΑΣ',
          'time': '15:00',
          'venue': 'AEK Arena',
          'status': 'upcoming',
          'competition': 'league',
          'matchday': 11,
        },
      ],
    };

/// Time-relative dataset for countdown-cadence scenarios (C-14, L-03):
/// kickoffs ~40 minutes, ~5 hours and ~3 days from now.
Map<String, dynamic> qaUpcomingSoon() {
  final now = DateTime.now();
  final out = <String, List<Map<String, dynamic>>>{};

  void add(DateTime dt, Map<String, dynamic> event) {
    final month = seasonMonthFor(dt);
    if (month == null) return; // outside the season window — skip
    out.putIfAbsent(month, () => []).add({
      ...event,
      'day': dt.day,
      'time': '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}',
    });
  }

  add(now.add(const Duration(minutes: 40)), {
    'sport': 'football-men',
    'location': 'home',
    'opponent': 'ΑΕΛ',
    'status': 'upcoming',
    'competition': 'league',
    'matchday': 3,
  });
  add(now.add(const Duration(hours: 5)), {
    'sport': 'volleyball-men',
    'location': 'away',
    'opponent': 'ΑΝΟΡΘΩΣΙΣ',
    'status': 'upcoming',
    'competition': 'league',
    'matchday': 4,
  });
  add(now.add(const Duration(days: 3)), {
    'sport': 'football-men',
    'location': 'home',
    'opponent': 'ΑΠΟΕΛ',
    'status': 'upcoming',
    'competition': 'league',
    'matchday': 5,
  });
  return out;
}
