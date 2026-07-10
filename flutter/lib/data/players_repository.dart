import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

import '../models/players.dart';

/// Loads the bundled players.json (generated from the web app's players.ts
/// by tool/generate_players_json.mjs).
class PlayersRepository {
  PlayersRepository._(this.all);

  /// Full roster in source order.
  final List<Player> all;

  static Future<PlayersRepository> load() async {
    final raw = await rootBundle.loadString('assets/data/players.json');
    final decoded = json.decode(raw) as List;
    final players = decoded
        .map((e) => Player.fromJson(e as Map<String, dynamic>))
        .toList();
    return PlayersRepository._(players);
  }
}
