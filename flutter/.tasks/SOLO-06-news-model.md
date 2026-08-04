# SOLO-06: NewsArticle model + fixture

**Status:** todo
**Batch:** news (`feat/news-feed`)
**Depends on:** -
**Estimated scope:** Small

## Context

News feed source (verified live): `https://solosalamina.com/wp-json/wp/v2/posts?per_page=20&_embed=1`
— WordPress REST JSON: `title/excerpt/content.rendered` (HTML), `date`, `link`,
`_embedded['wp:featuredmedia']`, `_embedded['wp:term']`. Content is Greek-only, shown as-is
in both app languages.

## Implementation notes

- `lib/models/news.dart` — `NewsArticle { int id; String title; String excerpt;
  String contentHtml; DateTime date; String link; String? imageUrl; List<String> categories; }`
- `fromJson`: strip tags + decode common HTML entities for title/excerpt (small local
  helper); `contentHtml` stays raw. `imageUrl`: `media_details.sizes.medium_large.source_url`
  → fallback `source_url`. Categories: `wp:term` flattened, `taxonomy == 'category'`,
  Greek names as-is. Null-tolerant: skip malformed posts, never throw.
- `test/fixtures/wp_posts.json`: trimmed real payload — 2-3 posts, one without featured
  media, Greek text + HTML entities in titles.
- `test/news_model_test.dart`: parse fixture, entity decoding, missing-media fallback,
  malformed post skipped.

## Acceptance criteria

- [ ] Fixture parses into expected articles; malformed entries skipped silently
- [ ] analyze + tests green
