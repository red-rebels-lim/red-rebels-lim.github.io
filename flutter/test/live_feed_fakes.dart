/// Shared fakes for the live-data feed tests (events.json + players.json).
library;

import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

/// A valid events feed payload (the wrapped shape published by
/// app/scripts/generate-events-json.ts) with data distinct from the bundled
/// asset so swaps are observable.
final String eventsPayload = json.encode({
  'season': '2025/2026',
  'generatedAt': '2026-07-10T12:00:00.000Z',
  'events': {
    'september': [
      {
        'day': 21,
        'sport': 'football-men',
        'location': 'home',
        'opponent': 'ΑΠΟΕΛ',
        'time': '19:00',
        'status': 'upcoming',
        'competition': 'league',
      },
    ],
  },
});

/// A valid players feed payload — a single-player roster so swaps against the
/// full bundled roster are observable.
final String playersPayload = json.encode({
  'generatedAt': '2026-07-10T12:00:00.000Z',
  'players': [
    {
      'key': 'live_test_player',
      'sport': 'football-men',
      'active': true,
      'nameEl': 'Παίκτης Τεστ',
      'nameEn': 'Live Test Player',
      'position': 'GK',
      'shirtNumber': 99,
      'photoUrl': '/images/players/live_test_player.webp',
    },
  ],
});

/// Serves both feeds by URL. [body] overrides the response for every request
/// (used to feed malformed payloads to a single repository).
MockClient okClient([String? body]) => MockClient((request) async {
      final payload = body ??
          (request.url.path.endsWith('players.json') ? playersPayload : eventsPayload);
      return http.Response.bytes(utf8.encode(payload), 200);
    });

/// Fails every request with a socket error (offline).
MockClient failingClient() => MockClient((_) async => throw const SocketException('offline'));

/// Serves the events feed but fails the players feed.
MockClient playersFailingClient() => MockClient((request) async {
      if (request.url.path.endsWith('players.json')) {
        throw const SocketException('offline');
      }
      return http.Response.bytes(utf8.encode(eventsPayload), 200);
    });
