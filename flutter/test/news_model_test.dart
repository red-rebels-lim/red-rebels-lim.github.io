import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import 'package:solo_salamina/models/news.dart';

void main() {
  final fixture =
      json.decode(File('test/fixtures/wp_posts.json').readAsStringSync())
          as List;

  group('NewsArticle.fromJson', () {
    test('parses valid posts and skips the malformed entry', () {
      final articles = [
        for (final post in fixture)
          ?NewsArticle.fromJson(post as Map<String, dynamic>),
      ];
      // Fixture holds 3 real posts + 1 malformed (no id/title).
      expect(fixture.length, 4);
      expect(articles.length, 3);
    });

    test('first post has stripped Greek title, link and category', () {
      final a = NewsArticle.fromJson(fixture[0] as Map<String, dynamic>)!;
      expect(a.title, contains('Ομόνοια'));
      expect(a.title, isNot(contains('<')));
      expect(a.excerpt, isNot(contains('<p>')));
      expect(a.link, startsWith('https://solosalamina.com/'));
      expect(a.categories, contains('Ποδόσφαιρο'));
      expect(a.contentHtml, contains('<')); // reader gets raw HTML
      expect(a.date.year, 2026);
    });

    test('prefers medium_large featured image, tolerates missing media', () {
      final withMedia = NewsArticle.fromJson(fixture[0] as Map<String, dynamic>)!;
      expect(withMedia.imageUrl, isNotNull);
      expect(withMedia.imageUrl, contains('wp-content'));

      // Second fixture post deliberately has no wp:featuredmedia.
      final noMedia = NewsArticle.fromJson(fixture[1] as Map<String, dynamic>)!;
      expect(noMedia.imageUrl, isNull);
    });

    test('date_gmt is parsed as UTC', () {
      final j = {
        'id': 1,
        'title': {'rendered': 'x'},
        'link': 'https://solosalamina.com/x/',
        'date_gmt': '2026-08-03T18:18:37',
      };
      final a = NewsArticle.fromJson(j)!;
      expect(a.date.toUtc(), DateTime.utc(2026, 8, 3, 18, 18, 37));
    });
  });

  group('htmlToPlainText', () {
    test('strips tags and collapses whitespace', () {
      expect(htmlToPlainText('<p>Νέα  <b>Σαλαμίνα</b></p>\n<p>2-0</p>'),
          'Νέα Σαλαμίνα 2-0');
    });

    test('decodes named and numeric entities', () {
      expect(htmlToPlainText('&laquo;Solo&raquo; &amp; &#916;&hellip;'),
          '«Solo» & Δ…');
      expect(htmlToPlainText('&#x394;'), 'Δ');
    });
  });
}
