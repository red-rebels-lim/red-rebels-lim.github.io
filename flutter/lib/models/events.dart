/// Data model mirroring app/src/types/events.ts from the web app.
library;

enum Sport {
  footballMen('football-men'),
  volleyballMen('volleyball-men'),
  volleyballWomen('volleyball-women'),
  meeting('meeting');

  const Sport(this.id);
  final String id;

  static Sport fromId(String? id) => Sport.values.firstWhere(
        (s) => s.id == id,
        orElse: () => Sport.footballMen,
      );
}

enum MatchLocation { home, away }

enum MatchStatus { played, upcoming }

enum Competition { league, cup }

class Scorer {
  const Scorer({required this.name, required this.minute, required this.team, this.type});

  final String name;
  final String minute;
  final String team; // 'home' | 'away'
  final String? type; // 'pen' | 'og'

  factory Scorer.fromJson(Map<String, dynamic> j) => Scorer(
        name: j['name'] as String,
        minute: '${j['minute'] ?? ''}',
        team: j['team'] as String,
        type: j['type'] as String?,
      );
}

class Booking {
  const Booking({required this.name, required this.minute, required this.team, required this.card});

  final String name;
  final String minute;
  final String team; // 'home' | 'away'
  final String card; // 'yellow' | 'red'

  factory Booking.fromJson(Map<String, dynamic> j) => Booking(
        name: j['name'] as String,
        minute: '${j['minute'] ?? ''}',
        team: j['team'] as String,
        card: j['card'] as String,
      );
}

class LineupPlayer {
  const LineupPlayer({required this.name, this.number, this.position});

  final String name;
  final int? number;
  final String? position;

  factory LineupPlayer.fromJson(Map<String, dynamic> j) => LineupPlayer(
        name: j['name'] as String,
        number: (j['number'] as num?)?.toInt(),
        position: j['position'] as String?,
      );
}

class Substitution {
  const Substitution({required this.playerOn, required this.playerOff, required this.minute, required this.team});

  final String playerOn;
  final String playerOff;
  final String minute;
  final String team;

  factory Substitution.fromJson(Map<String, dynamic> j) => Substitution(
        playerOn: j['playerOn'] as String,
        playerOff: j['playerOff'] as String,
        minute: '${j['minute'] ?? ''}',
        team: j['team'] as String,
      );
}

class VolleyballSet {
  const VolleyballSet({required this.home, required this.away});

  final int home;
  final int away;

  factory VolleyballSet.fromJson(Map<String, dynamic> j) => VolleyballSet(
        home: (j['home'] as num).toInt(),
        away: (j['away'] as num).toInt(),
      );
}

class VolleyballScorer {
  const VolleyballScorer({required this.name, required this.points, required this.team});

  final String name;
  final int points;
  final String team; // 'home' | 'away'

  factory VolleyballScorer.fromJson(Map<String, dynamic> j) => VolleyballScorer(
        name: j['name'] as String,
        points: (j['points'] as num).toInt(),
        team: j['team'] as String,
      );
}

class SportEvent {
  const SportEvent({
    required this.day,
    required this.sport,
    required this.location,
    required this.opponent,
    required this.time,
    this.venue,
    this.logo,
    this.status,
    this.score,
    this.competition,
    this.penalties,
    this.reportEN,
    this.reportEL,
    this.scorers,
    this.bookings,
    this.duration,
    this.matchday,
    this.lineupHome,
    this.lineupAway,
    this.subs,
    this.sets,
    this.vbScorers,
  });

  final int day;
  final Sport sport;
  final MatchLocation location;
  final String opponent;
  final String time;
  final String? venue;
  final String? logo;
  final MatchStatus? status;
  final String? score;
  final Competition? competition;
  final String? penalties;
  final String? reportEN;
  final String? reportEL;
  final List<Scorer>? scorers;
  final List<Booking>? bookings;
  final String? duration;
  final int? matchday;
  final List<LineupPlayer>? lineupHome;
  final List<LineupPlayer>? lineupAway;
  final List<Substitution>? subs;
  final List<VolleyballSet>? sets;
  final List<VolleyballScorer>? vbScorers;

  bool get isMeeting => sport == Sport.meeting;
  bool get isPlayed => status == MatchStatus.played;
  bool get isCup => competition == Competition.cup;

  factory SportEvent.fromJson(Map<String, dynamic> j) {
    final lineup = j['lineup'] as Map<String, dynamic>?;
    return SportEvent(
      day: (j['day'] as num).toInt(),
      sport: Sport.fromId(j['sport'] as String?),
      location: j['location'] == 'away' ? MatchLocation.away : MatchLocation.home,
      opponent: j['opponent'] as String? ?? '',
      time: j['time'] as String? ?? '',
      venue: j['venue'] as String?,
      logo: j['logo'] as String?,
      status: switch (j['status']) {
        'played' => MatchStatus.played,
        'upcoming' => MatchStatus.upcoming,
        _ => null,
      },
      score: j['score'] as String?,
      competition: switch (j['competition']) {
        'cup' => Competition.cup,
        'league' => Competition.league,
        _ => null,
      },
      penalties: j['penalties'] as String?,
      reportEN: j['reportEN'] as String?,
      reportEL: j['reportEL'] as String?,
      scorers: (j['scorers'] as List?)?.map((e) => Scorer.fromJson(e as Map<String, dynamic>)).toList(),
      bookings: (j['bookings'] as List?)?.map((e) => Booking.fromJson(e as Map<String, dynamic>)).toList(),
      duration: j['duration'] as String?,
      matchday: (j['matchday'] as num?)?.toInt(),
      lineupHome: (lineup?['home'] as List?)?.map((e) => LineupPlayer.fromJson(e as Map<String, dynamic>)).toList(),
      lineupAway: (lineup?['away'] as List?)?.map((e) => LineupPlayer.fromJson(e as Map<String, dynamic>)).toList(),
      subs: (j['subs'] as List?)?.map((e) => Substitution.fromJson(e as Map<String, dynamic>)).toList(),
      sets: (j['sets'] as List?)?.map((e) => VolleyballSet.fromJson(e as Map<String, dynamic>)).toList(),
      vbScorers: (j['vbScorers'] as List?)?.map((e) => VolleyballScorer.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }
}

/// A [SportEvent] paired with the month it belongs to, so views and stats can
/// resolve concrete dates.
class DatedEvent {
  const DatedEvent({required this.monthName, required this.event, required this.date});

  final String monthName;
  final SportEvent event;
  final DateTime date;
}

class FilterState {
  const FilterState({this.sport, this.location, this.status, this.search = ''});

  /// null means "all" for each of these.
  final Sport? sport;
  final MatchLocation? location;
  final MatchStatus? status;
  final String search;

  bool get isActive => sport != null || location != null || status != null || search.isNotEmpty;

  FilterState copyWith({
    Sport? Function()? sport,
    MatchLocation? Function()? location,
    MatchStatus? Function()? status,
    String? search,
  }) =>
      FilterState(
        sport: sport != null ? sport() : this.sport,
        location: location != null ? location() : this.location,
        status: status != null ? status() : this.status,
        search: search ?? this.search,
      );

  bool matches(SportEvent e, String translatedOpponent) {
    if (sport != null && e.sport != sport) return false;
    if (location != null && e.location != location) return false;
    if (status != null && e.status != status) return false;
    if (search.isNotEmpty) {
      final q = search.toLowerCase();
      if (!e.opponent.toLowerCase().contains(q) && !translatedOpponent.toLowerCase().contains(q)) {
        return false;
      }
    }
    return true;
  }
}
