/// Unit tests for lib/i18n/i18n.dart against the real bundled en/el assets:
/// dotted-key traversal, the en-fallback chain, fotmob team/venue lookups
/// (including keys containing dots, the 'Olympiada N. (W)' class of bug),
/// player-name annotation stripping and interpolate().
library;

import 'package:flutter_test/flutter_test.dart';

import 'package:red_rebels_calendar/i18n/i18n.dart';

void main() {
  late I18n i18n;

  // Asset loading must happen outside testWidgets' fake-async zone (see
  // widget_test.dart).
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    i18n = await I18n.load();
  });

  group('t — dotted-key traversal', () {
    test('resolves nested keys per language', () {
      expect(i18n.t('en', 'squad.positions.GK'), 'Goalkeepers');
      expect(i18n.t('el', 'squad.positions.GK'), 'Τερματοφύλακες');
      expect(i18n.t('en', 'stats.matches'), 'Matches');
      expect(i18n.t('el', 'stats.matches'), 'Αγώνες');
    });

    test('traversal through a leaf value fails cleanly to the key', () {
      // 'stats.matches' is a string; going one level deeper must not throw.
      expect(i18n.t('en', 'stats.matches.deeper'), 'stats.matches.deeper');
    });

    test('missing key returns the fallback when provided, else the key', () {
      expect(i18n.t('en', 'no.such.key'), 'no.such.key');
      expect(i18n.t('en', 'no.such.key', 'FB'), 'FB');
      expect(i18n.t('el', 'no.such.key', 'FB'), 'FB');
    });

    test('unknown language falls back through the en chain', () {
      expect(i18n.t('fr', 'squad.positions.GK'), 'Goalkeepers');
      expect(i18n.t('fr', 'no.such.key', 'FB'), 'FB');
    });

    test('a key that is a subtree (not a string) falls back to the key', () {
      expect(i18n.t('en', 'squad.positions'), 'squad.positions');
    });
  });

  group('teamName — fotmob team lookup', () {
    test('translates Greek uppercase events names per language', () {
      expect(i18n.teamName('en', 'ΝΕΑ ΣΑΛΑΜΙΝΑ'), 'Nea Salamis');
      expect(i18n.teamName('el', 'ΝΕΑ ΣΑΛΑΜΙΝΑ'), 'Νέα Σαλαμίνα');
      expect(i18n.teamName('en', 'ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ'), 'Doxa Katokopia');
      expect(i18n.teamName('el', 'ΔΟΞΑ ΚΑΤΩΚΟΠΙΑΣ'), 'Δόξα Κατωκοπιάς');
    });

    test('team keys containing a dot resolve (Olympiada N. (W) bug class)', () {
      // 'ΟΛΥΜΠΙΑΔΑ Ν. (Γ)' maps to the i18n key 'Olympiada N. (W)', which
      // contains a dot — a naive dotted-path lookup would mis-split it and
      // fall back to the raw key. The Greek value proves the direct table
      // lookup worked in the el bundle.
      expect(i18n.teamName('el', 'ΟΛΥΜΠΙΑΔΑ Ν. (Γ)'), 'Ολυμπιάδα Ν. (Γ)');
      expect(i18n.teamName('en', 'ΟΛΥΜΠΙΑΔΑ Ν. (Γ)'), 'Olympiada N. (W)');
    });

    test('unknown Greek names pass through unchanged', () {
      expect(i18n.teamName('en', 'ΑΓΝΩΣΤΗ ΟΜΑΔΑ'), 'ΑΓΝΩΣΤΗ ΟΜΑΔΑ');
      expect(i18n.teamName('el', 'ΑΓΝΩΣΤΗ ΟΜΑΔΑ'), 'ΑΓΝΩΣΤΗ ΟΜΑΔΑ');
    });
  });

  group('venueName — fotmob venue lookup', () {
    test('translates known venues per language', () {
      expect(i18n.venueName('en', 'Αγίου Αθανασίου'), 'Agiou Athanasiou');
      expect(i18n.venueName('el', 'Αγίου Αθανασίου'), 'Αγίου Αθανασίου');
    });

    test('unknown venues pass through unchanged', () {
      expect(i18n.venueName('en', 'Άγνωστο Γήπεδο'), 'Άγνωστο Γήπεδο');
    });
  });

  group('playerName — annotation stripping', () {
    test('strips a trailing (Πέναλτι) annotation', () {
      expect(i18n.playerName('ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ (Πέναλτι)'), 'ΠΑΝΑΓΙΩΤΗΣ ΛΟΥΚΑ');
    });

    test('strips annotations mid-string, leaving a single join space', () {
      expect(i18n.playerName('Α (Πέναλτι) Β'), 'Α Β');
    });

    test('leaves unannotated names unchanged', () {
      expect(i18n.playerName('Daniel Pérez'), 'Daniel Pérez');
    });
  });

  group('interpolate', () {
    test('fills i18next-style placeholders', () {
      expect(
        I18n.interpolate('{{starts}} start · {{subs}} sub', {'starts': 5, 'subs': 9}),
        '5 start · 9 sub',
      );
    });

    test('works against the real bundled templates', () {
      expect(
        I18n.interpolate(i18n.t('en', 'squad.modal.startsAndSubs'), {'starts': 5, 'subs': 9}),
        '5 start · 9 sub',
      );
      expect(
        I18n.interpolate(i18n.t('el', 'squad.modal.startsAndSubs'), {'starts': 5, 'subs': 9}),
        '5 βασικός · 9 αλλαγή',
      );
    });

    test('replaces every occurrence of the same placeholder', () {
      expect(I18n.interpolate('{{x}} and {{x}}', {'x': 'a'}), 'a and a');
    });

    test('leaves unknown placeholders in place', () {
      expect(I18n.interpolate('{{known}} {{unknown}}', {'known': 1}), '1 {{unknown}}');
    });

    test('empty vars map returns the template untouched', () {
      expect(I18n.interpolate('static text', {}), 'static text');
    });
  });
}
