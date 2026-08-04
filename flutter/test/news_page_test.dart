import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:solo_salamina/data/events_repository.dart';
import 'package:solo_salamina/data/news_repository.dart';
import 'package:solo_salamina/data/players_repository.dart';
import 'package:solo_salamina/i18n/i18n.dart';
import 'package:solo_salamina/logic/external_launch.dart';
import 'package:solo_salamina/pages/news_article_page.dart';
import 'package:solo_salamina/pages/news_page.dart';
import 'package:solo_salamina/state/app_state.dart';
import 'package:solo_salamina/theme.dart';

void main() {
  late EventsRepository events;
  late PlayersRepository players;
  late I18n i18n;
  late SharedPreferences prefs;
  late NewsRepository seededNews;
  late NewsRepository emptyNews;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
    events = await EventsRepository.load();
    players = await PlayersRepository.load();
    i18n = await I18n.load();
    prefs = await SharedPreferences.getInstance();

    // File IO deadlocks inside testWidgets' fake-async zone — seed here.
    final dir = await Directory.systemTemp.createTemp('news-page-test');
    final file = File('${dir.path}/news-cache.json');
    await file.writeAsString(
        File('test/fixtures/wp_posts.json').readAsStringSync());
    seededNews = await NewsRepository.load(cacheFile: (_) async => file);
    emptyNews = await NewsRepository.load(
        cacheFile: (_) async => File('${dir.path}/absent.json'));
  });

  Widget wrap(Widget child, {NewsRepository? news}) => ChangeNotifierProvider(
        create: (_) => AppState(
          events: events,
          players: players,
          news: news,
          i18n: i18n,
          prefs: prefs,
        ),
        child: MaterialApp(
          theme: buildTheme('default', Brightness.light),
          home: Scaffold(body: child),
        ),
      );

  AppState makeApp({NewsRepository? news}) => AppState(
        events: events,
        players: players,
        news: news,
        i18n: i18n,
        prefs: prefs,
      );

  Widget wrapWith(AppState app, Widget child) => ChangeNotifierProvider.value(
        value: app,
        child: MaterialApp(
          theme: buildTheme('default', Brightness.light),
          home: Scaffold(body: child),
        ),
      );

  group('newsCategories', () {
    test('unique names in order of first appearance', () {
      expect(newsCategories(seededNews.articles), [
        'Ποδόσφαιρο',
        'Ποδόσφαιρο Ανδρών',
        'Ακαδημία Ποδοσφαίρου',
      ]);
    });
  });

  group('category filter', () {
    testWidgets('shows only articles in the selected category', (tester) async {
      final app = makeApp(news: seededNews);
      app.setNewsCategory('Ακαδημία Ποδοσφαίρου');
      await tester.pumpWidget(wrapWith(app, const NewsPage()));
      await tester.pump();

      expect(find.textContaining('Ακαδημία'), findsWidgets);
      expect(find.textContaining('Ομόνοια'), findsNothing);
      expect(find.textContaining('Ανακεφαλαίωση'), findsNothing);
    });

    testWidgets('filtered-to-empty shows the emptyFiltered message',
        (tester) async {
      final app = makeApp(news: seededNews);
      app.setNewsCategory('Πετόσφαιρα');
      await tester.pumpWidget(wrapWith(app, const NewsPage()));
      await tester.pump();

      expect(find.text('No news in this category.'), findsOneWidget);
    });

    testWidgets('sheet applies and clears the category', (tester) async {
      final app = makeApp(news: seededNews);
      await tester.pumpWidget(wrapWith(
        app,
        Builder(
          builder: (context) => Center(
            child: OutlinedButton(
              onPressed: () => showNewsFilterSheet(context),
              child: const Text('open'),
            ),
          ),
        ),
      ));

      await tester.tap(find.text('open'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400)); // sheet animation

      expect(find.text('All'), findsOneWidget);
      expect(find.text('Ποδόσφαιρο'), findsOneWidget); // category chip
      await tester.tap(find.text('Ποδόσφαιρο Ανδρών'));
      await tester.pump();
      await tester.tap(find.text('Apply'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));

      expect(app.newsCategory, 'Ποδόσφαιρο Ανδρών');

      // Clear All resets to null.
      await tester.tap(find.text('open'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));
      await tester.tap(find.text('Clear All'));
      await tester.pump();
      expect(app.newsCategory, isNull);
    });
  });

  group('NewsPage', () {
    testWidgets('renders article cards from the repository', (tester) async {
      await tester.pumpWidget(wrap(const NewsPage(), news: seededNews));
      await tester.pump();

      expect(find.textContaining('Ομόνοια'), findsOneWidget);
      // Category chip renders uppercased Greek (tonos stripped).
      expect(find.textContaining('ΠΟΔΟΣΦΑΙΡΟ'), findsWidgets);
      // Later cards build lazily — scroll the third article into view.
      await tester.scrollUntilVisible(
        find.textContaining('Ακαδημία'),
        300,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.textContaining('Ακαδημία'), findsOneWidget);
    });

    testWidgets('shows the empty message without articles', (tester) async {
      await tester.pumpWidget(wrap(const NewsPage(), news: emptyNews));
      await tester.pump();

      expect(find.text('No news yet — pull down to refresh.'), findsOneWidget);
    });

    testWidgets('tapping a card opens the in-app reader', (tester) async {
      await tester.pumpWidget(wrap(const NewsPage(), news: seededNews));
      await tester.pump();

      await tester.tap(find.textContaining('Ομόνοια'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400)); // route transition

      expect(find.byType(NewsArticlePage), findsOneWidget);
      // Reader body includes the open-original CTA.
      expect(find.text('Read on solosalamina.com'), findsWidgets);
    });
  });

  group('NewsArticlePage', () {
    testWidgets('share and open-original hit the injectable bridges',
        (tester) async {
      final shared = <String>[];
      final opened = <Uri>[];
      final prevShare = shareText;
      final prevOpen = openExternalUrl;
      shareText = (text) async => shared.add(text);
      openExternalUrl = (url) async {
        opened.add(url);
        return true;
      };
      addTearDown(() {
        shareText = prevShare;
        openExternalUrl = prevOpen;
      });

      final article = seededNews.articles.first;
      await tester.pumpWidget(wrap(NewsArticlePage(article: article)));
      await tester.pump();

      await tester.tap(find.byIcon(Icons.share_outlined));
      expect(shared.single, contains(article.link));

      await tester.tap(find.byIcon(Icons.open_in_browser).last);
      expect(opened.single.toString(), article.link);
    });
  });
}
