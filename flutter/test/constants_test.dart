/// Unit tests for lib/data/constants.dart: monthInfo season-year assignment,
/// days-in-month/leap handling and eventDateTime parsing. All inputs are
/// explicit — no dependency on the current date. Pure logic — no assets.
library;

import 'package:flutter_test/flutter_test.dart';

import 'package:solo_salamina/data/constants.dart';
import 'package:solo_salamina/models/events.dart';

SportEvent eventOn(int day, String time) => SportEvent(
      day: day,
      sport: Sport.footballMen,
      location: MatchLocation.home,
      opponent: 'ΑΝΤΙΠΑΛΟΣ',
      time: time,
    );

void main() {
  group('monthInfo year assignment', () {
    test('july–december belong to the season start year', () {
      for (final m in ['july', 'august', 'september', 'october', 'november', 'december']) {
        expect(monthInfo(m).year, seasonStartYear, reason: m);
      }
    });

    test('january–june belong to the season end year', () {
      for (final m in ['january', 'february', 'march', 'april', 'may', 'june']) {
        expect(monthInfo(m).year, seasonEndYear, reason: m);
      }
    });

    test('month numbers are the Dart 1–12 calendar numbers', () {
      expect(monthInfo('september').month, 9);
      expect(monthInfo('december').month, 12);
      expect(monthInfo('january').month, 1);
      expect(monthInfo('august').month, 8);
    });
  });

  group('monthInfo daysInMonth', () {
    test('all twelve months of the 26/27 season', () {
      const expected = {
        'july': 31, 'august': 31,
        'september': 30, 'october': 31, 'november': 30, 'december': 31,
        'january': 31, 'february': 28, // 2027 is not a leap year
        'march': 31, 'april': 30, 'may': 31, 'june': 30,
      };
      for (final entry in expected.entries) {
        expect(monthInfo(entry.key).daysInMonth, entry.value, reason: entry.key);
      }
    });

    test('february length follows the season end year leap rule', () {
      // The formula delegates to DateTime day-zero rollover, so a leap
      // end-year would yield 29. Pin it against the real calendar for the
      // configured season year rather than a hardcoded 28.
      expect(monthInfo('february').daysInMonth, DateTime(seasonEndYear, 3, 0).day);
    });
  });

  group('monthInfo startDay (Monday-based weekday of day 1)', () {
    test('july 2026 starts on a Wednesday → 2', () {
      expect(monthInfo('july').startDay, 2);
    });

    test('february 2027 starts on a Monday → 0', () {
      expect(monthInfo('february').startDay, 0);
    });

    test('always within 0–6', () {
      for (final m in monthOrder) {
        final d = monthInfo(m).startDay;
        expect(d, inInclusiveRange(0, 6), reason: m);
      }
    });
  });

  group('eventDateTime', () {
    test('parses HH:mm kickoff times in the start-year months', () {
      final dt = eventDateTime('september', eventOn(21, '19:00'));
      expect(dt, DateTime(2026, 9, 21, 19, 0));
    });

    test('january events resolve to the season end year', () {
      final dt = eventDateTime('january', eventOn(10, '15:30'));
      expect(dt, DateTime(2027, 1, 10, 15, 30));
    });

    test('empty time string → midnight', () {
      expect(eventDateTime('october', eventOn(5, '')), DateTime(2026, 10, 5));
    });

    test('TBD (no colon) → midnight', () {
      expect(eventDateTime('october', eventOn(5, 'TBD')), DateTime(2026, 10, 5));
    });

    test('unparsable pieces around the colon fall back to 0', () {
      // Pinned behavior: a colon triggers parsing, each side defaults to 0.
      expect(eventDateTime('october', eventOn(5, '19:xx')), DateTime(2026, 10, 5, 19, 0));
      expect(eventDateTime('october', eventOn(5, 'xx:30')), DateTime(2026, 10, 5, 0, 30));
      expect(eventDateTime('october', eventOn(5, ':')), DateTime(2026, 10, 5));
    });

    test('single-digit hour and minute parse', () {
      expect(eventDateTime('october', eventOn(5, '9:5')), DateTime(2026, 10, 5, 9, 5));
    });
  });
}
