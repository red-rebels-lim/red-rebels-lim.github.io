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
    seededNews = await NewsRepository.load(cacheFile: () async => file);
    emptyNews = await NewsRepository.load(
        cacheFile: () async => File('${dir.path}/absent.json'));
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
