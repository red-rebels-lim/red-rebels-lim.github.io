/// Data model mirroring app/src/types/players.ts from the web app.
library;

import 'events.dart';

/// Roster positions in web display order — football (GK, DEF, MID, FWD) and
/// volleyball (SETTER, OUTSIDE, OPPOSITE, MIDDLE, LIBERO).
enum Position {
  gk('GK'),
  def('DEF'),
  mid('MID'),
  fwd('FWD'),
  setter('SETTER'),
  outside('OUTSIDE'),
  opposite('OPPOSITE'),
  middle('MIDDLE'),
  libero('LIBERO');

  const Position(this.id);
  final String id;

  static Position fromId(String? id) =>
      Position.values.firstWhere((p) => p.id == id, orElse: () => Position.fwd);
}

class Player {
  const Player({
    required this.key,
    required this.sport,
    required this.active,
    required this.nameEl,
    required this.nameEn,
    required this.position,
    this.subPosition,
    this.shirtNumber,
    this.photoUrl,
    this.aliases = const [],
    this.dateOfBirth,
    this.nationality,
  });

  final String key;
  final Sport sport;
  final bool active;
  final String nameEl;
  final String nameEn;
  final Position position;
  final String? subPosition;
  final int? shirtNumber;

  /// Web public path, e.g. '/images/players/alberto_varo_lara.webp'.
  final String? photoUrl;
  final List<String> aliases;
  final String? dateOfBirth; // ISO date
  final String? nationality;

  String displayName(String language) => language == 'el' ? nameEl : nameEn;

  /// Bundled portrait asset path (photos are copied from the web app's
  /// public/images/players into assets/images/players).
  String? get photoAsset => photoUrl == null
      ? null
      : 'assets/images/players/${photoUrl!.split('/').last}';

  factory Player.fromJson(Map<String, dynamic> j) => Player(
    key: j['key'] as String,
    sport: Sport.fromId(j['sport'] as String?),
    active: j['active'] as bool? ?? false,
    nameEl: j['nameEl'] as String,
    nameEn: j['nameEn'] as String,
    position: Position.fromId(j['position'] as String?),
    subPosition: j['subPosition'] as String?,
    shirtNumber: (j['shirtNumber'] as num?)?.toInt(),
    photoUrl: j['photoUrl'] as String?,
    aliases: (j['aliases'] as List?)?.cast<String>() ?? const [],
    dateOfBirth: j['dateOfBirth'] as String?,
    nationality: j['nationality'] as String?,
  );
}
