import 'package:flutter/material.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../logic/external_launch.dart';
import '../models/news.dart';
import '../state/app_state.dart';
import '../theme.dart';
import 'news_page.dart' show formatNewsDate;

/// Bridge to share_plus — injectable so widget tests can assert shares
/// without a real plugin behind them (same pattern as [openExternalUrl]).
@visibleForTesting
Future<void> Function(String text) shareText =
    (text) => SharePlus.instance.share(ShareParams(text: text));

/// Full-screen in-app reader for a solosalamina.com article. Renders the
/// WordPress HTML with pure widgets (no WebView — App Store 4.2 stance);
/// embeds degrade to the "open original" link.
class NewsArticlePage extends StatelessWidget {
  const NewsArticlePage({super.key, required this.article});

  final NewsArticle article;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);

    return Scaffold(
      // The app-wide scaffold color is transparent (the shell paints the
      // stadium backdrop) — a pushed route must supply its own themed
      // background or light mode renders dark text on black.
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.surfacePanel,
        foregroundColor: colors.foreground,
        title: Text(
          app.t('news.title', 'News'),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: colors.foreground,
          ),
        ),
        actions: [
          IconButton(
            tooltip: app.t('news.share', 'Share article'),
            icon: const Icon(Icons.share_outlined, size: 20),
            onPressed: () => shareText('${article.title}\n${article.link}'),
          ),
          IconButton(
            tooltip: app.t('news.openOriginal', 'Read on solosalamina.com'),
            icon: const Icon(Icons.open_in_browser, size: 20),
            onPressed: () => openExternalUrl(Uri.parse(article.link)),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          if (article.imageUrl != null)
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Image.network(
                article.imageUrl!,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => const SizedBox.shrink(),
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  article.title,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    height: 1.25,
                    color: colors.foreground,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  [
                    formatNewsDate(app, article.date),
                    ...article.categories,
                  ].join(' · '),
                  style: condensed(
                    size: 12,
                    color: colors.mutedForeground,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 16),
                HtmlWidget(
                  article.contentHtml,
                  textStyle: TextStyle(
                    fontSize: 15,
                    height: 1.5,
                    color: colors.foreground,
                  ),
                  onTapUrl: (url) => openExternalUrl(Uri.parse(url)),
                  // WP embeds (YouTube, social posts) need a WebView — degrade
                  // to the open-original chip below instead.
                  customWidgetBuilder: (element) =>
                      const {'iframe', 'script', 'video'}
                              .contains(element.localName)
                          ? const SizedBox.shrink()
                          : null,
                ),
                const SizedBox(height: 24),
                Center(
                  child: OutlinedButton.icon(
                    onPressed: () => openExternalUrl(Uri.parse(article.link)),
                    icon: const Icon(Icons.open_in_browser, size: 18),
                    label: Text(
                        app.t('news.openOriginal', 'Read on solosalamina.com')),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
