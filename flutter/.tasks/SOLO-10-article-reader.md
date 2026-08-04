# SOLO-10: Article reader + share

**Status:** todo
**Batch:** news (`feat/news-feed`)
**Depends on:** SOLO-09
**Estimated scope:** Medium

## Context

In-app reader for WordPress `content.rendered` HTML. Architecture stance (docs/native-apps/
README.md): no WebView (App Store 4.2). `url_launcher` is already wired via the injectable
`openExternalUrl` bridge (`lib/pages/settings_page.dart:15-19`); `share_plus` is declared
but unused.

## Implementation notes

- `pubspec.yaml`: add `flutter_widget_from_html_core` (pure-widget HTML rendering, actively
  maintained; `flutter_html` rejected — stalled since ~2023).
- `lib/pages/news_article_page.dart`, pushed via `Navigator.push(MaterialPageRoute)` over
  the shell. Header row: back, share icon, open-in-browser icon. Body: featured image,
  title, date/category, rendered HTML.
- HtmlWidget config: `onTapUrl` → `openExternalUrl` bridge; `customWidgetBuilder` replaces
  `iframe`/`script` with an "open original" link chip (WP embeds can't render without WebView).
- Share: `share_plus` sharing `article.link` (+ title), behind an injectable static function
  pointer (mirror `openExternalUrl`) so tests can stub it.
- i18n both bundles: `news.{openOriginal,share}`.

## Acceptance criteria

- [ ] Real posts from the live feed render readably (images, paragraphs, headings)
- [ ] Embeds degrade to "open original" chip; links open externally
- [ ] Share sheet opens with article URL; analyze + tests green
