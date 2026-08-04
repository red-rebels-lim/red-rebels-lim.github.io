import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/news.dart';
import '../state/app_state.dart';
import '../theme.dart';
import 'news_article_page.dart';

/// English month-index → i18n `months.*` key (news dates are arbitrary
/// calendar dates, unlike the season-ordered monthOrder in constants).
const _monthKeys = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

String formatNewsDate(AppState app, DateTime date) =>
    '${date.day} ${app.t('months.${_monthKeys[date.month - 1]}')} ${date.year}';

/// Club news from solosalamina.com: pull-to-refresh card list, tap opens the
/// in-app reader. Content is Greek-only and shown as-is in both languages.
class NewsPage extends StatelessWidget {
  const NewsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final colors = AppColors.of(context);
    final articles = app.news?.articles ?? const <NewsArticle>[];

    return Container(
      margin: const EdgeInsets.fromLTRB(8, 8, 8, 0),
      decoration: BoxDecoration(
        color: colors.surfacePanel,
        borderRadius: BorderRadius.circular(colors.panelRadius),
      ),
      clipBehavior: Clip.antiAlias,
      child: RefreshIndicator(
        onRefresh: () => app.syncEvents(),
        child: articles.isEmpty
            ? _EmptyState(app: app, colors: colors)
            : ListView.builder(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(12),
                itemCount: articles.length + 1,
                itemBuilder: (context, i) {
                  if (i == 0) {
                    return Padding(
                      padding: const EdgeInsets.only(left: 4, bottom: 8),
                      child: Text(
                        app.t('news.title', 'News'),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: colors.foreground,
                        ),
                      ),
                    );
                  }
                  return _ArticleCard(article: articles[i - 1]);
                },
              ),
      ),
    );
  }
}

/// Spinner while the first sync is in flight, `errors.fetchFailed` + retry
/// when it failed, `news.empty` otherwise. Scrollable so pull-to-refresh
/// still works from every state.
class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.app, required this.colors});

  final AppState app;
  final AppColors colors;

  @override
  Widget build(BuildContext context) {
    final Widget body;
    if (app.syncing) {
      body = const CircularProgressIndicator(strokeWidth: 2.5);
    } else if (app.lastSyncFailed) {
      body = Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            app.t('errors.fetchFailed', 'Failed to load live data'),
            textAlign: TextAlign.center,
            style: TextStyle(color: colors.mutedForeground),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => app.syncEvents(),
            child: Text(app.t('errors.retry', 'Retry')),
          ),
        ],
      );
    } else {
      body = Text(
        app.t('news.empty', 'No news yet — pull down to refresh.'),
        textAlign: TextAlign.center,
        style: TextStyle(color: colors.mutedForeground),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: SizedBox(
          height: constraints.maxHeight,
          child: Center(
            child: Padding(padding: const EdgeInsets.all(24), child: body),
          ),
        ),
      ),
    );
  }
}

class _ArticleCard extends StatelessWidget {
  const _ArticleCard({required this.article});

  final NewsArticle article;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    final colors = AppColors.of(context);
    final borderColor =
        theme.brightness == Brightness.dark ? twSlate800 : twSlate200;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: theme.colorScheme.surfaceContainerLow,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: borderColor),
          borderRadius: colors.br(8),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => NewsArticlePage(article: article),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (article.imageUrl != null)
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: Image.network(
                    article.imageUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => ColoredBox(
                      color: borderColor,
                      child: Icon(Icons.newspaper,
                          size: 40, color: colors.mutedForeground),
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (article.categories.isNotEmpty) ...[
                          _CategoryChip(label: article.categories.first),
                          const SizedBox(width: 8),
                        ],
                        Text(
                          formatNewsDate(app, article.date),
                          style: condensed(
                            size: 12,
                            color: colors.mutedForeground,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      article.title,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        height: 1.3,
                        color: colors.foreground,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: brandRed.withValues(alpha: 0.12),
        borderRadius: colors.br(999),
      ),
      child: Text(
        label.upperNoTonos,
        style: condensed(size: 11, color: brandRed, letterSpacing: 1.1),
      ),
    );
  }
}
