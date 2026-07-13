/// Shared helpers for the stats logic tests: build an [EventsRepository]
/// from a synthetic month → events payload via a temp cache file, so the
/// tests are fully deterministic and independent of the bundled asset.
library;

import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart' show addTearDown;

import 'package:red_rebels_calendar/data/events_repository.dart';

/// Builds a repository whose data is exactly [months]. Must be called from
/// inside a test body (registers the temp-dir cleanup via [addTearDown]).
Future<EventsRepository> repoWith(Map<String, List<Map<String, Object?>>> months) async {
  final dir = await Directory.systemTemp.createTemp('stats-test');
  addTearDown(() => dir.delete(recursive: true));
  final file = File('${dir.path}/events-cache.json');
  await file.writeAsString(json.encode({'events': months}));
  return EventsRepository.load(cacheFile: () async => file);
}

/// A played league football match in raw feed shape.
Map<String, Object?> football({
  int day = 1,
  String opponent = 'ΑΝΤΙΠΑΛΟΣ',
  String location = 'home',
  String? score,
  String status = 'played',
  String competition = 'league',
  String sport = 'football-men',
}) =>
    {
      'day': day,
      'sport': sport,
      'location': location,
      'opponent': opponent,
      'time': '19:00',
      'status': status,
      'score': ?score,
      'competition': competition,
    };

/// A played volleyball match in raw feed shape. [sets] are [home, away]
/// point pairs; [scorers] are raw vbScorers maps.
Map<String, Object?> volleyball({
  String sport = 'volleyball-men',
  int day = 1,
  String opponent = 'ΑΝΤΙΠΑΛΟΣ',
  String location = 'home',
  String? score,
  String status = 'played',
  String competition = 'league',
  List<List<int>>? sets,
  List<Map<String, Object?>>? scorers,
}) =>
    {
      'day': day,
      'sport': sport,
      'location': location,
      'opponent': opponent,
      'time': '18:00',
      'status': status,
      'score': ?score,
      'competition': competition,
      'sets': ?sets?.map((s) => {'home': s[0], 'away': s[1]}).toList(),
      'vbScorers': ?scorers,
    };
