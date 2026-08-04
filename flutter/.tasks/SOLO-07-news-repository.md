# SOLO-07: NewsRepository

**Status:** todo
**Batch:** news (`feat/news-feed`)
**Depends on:** SOLO-06
**Estimated scope:** Small/Medium

## Context

Clone the `lib/data/events_repository.dart` contract — the house pattern for remote feeds
with disk cache. News has no meaningful bundled snapshot, so no asset fallback: cold start
without cache = empty list (page shows loading/error states instead).

## Implementation notes

- `lib/data/news_repository.dart`:
  - `static const remoteUrl = 'https://solosalamina.com/wp-json/wp/v2/posts?per_page=20&_embed=1';`
  - `static Future<NewsRepository> load({Future<File?> Function()? cacheFile})` — reads
    `news-cache.json` from app-documents dir (path_provider), injectable file fn, try/catch → empty.
  - `Future<bool> refresh({http.Client? client})` — 10s timeout, `statusCode != 200 → false`,
    `utf8.decode(response.bodyBytes)` (Greek!), parse null-tolerant, best-effort `_persist(raw)`,
    `finally` close self-created client, never throws.
  - v1 = fixed latest-20; leave documented `page` seam for a later "load more".
- `test/news_repository_test.dart`: MockClient (package:http/testing) success / non-200 /
  malformed / timeout → false without throwing; Greek utf8 round-trip; cache persist +
  reload via temp-dir `cacheFile`.

## Acceptance criteria

- [ ] Offline cold start with cache shows cached articles; without cache, empty list
- [ ] refresh never throws; all failure modes return false
- [ ] analyze + tests green
