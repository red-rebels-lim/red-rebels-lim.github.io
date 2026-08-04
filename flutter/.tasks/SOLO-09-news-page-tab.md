# SOLO-09: News list page + 5th tab ⚠️ Greek sign-off

**Status:** done (PR #114, merged 2026-08-04)
**Batch:** news (`feat/news-feed`)
**Depends on:** SOLO-08
**Estimated scope:** Medium

## Context

New page in the `HomeShell` `IndexedStack` (`lib/main.dart:257-265`) + 5th tuple in
`lib/widgets/bottom_nav.dart:20-25`. Insert at index 3 → order Calendar, Stats, Squad,
News, Settings (safe: only `goToTab(0)`/`goToTab(1)` are hardcoded elsewhere).

## Implementation notes

- `lib/pages/news_page.dart`: `RefreshIndicator` → `ListView.builder` of cards:
  `Image.network` featured image (fixed aspect, `errorBuilder` placeholder — no new deps),
  stripped title, localized date via existing month helpers, first-category chip (Greek
  as-is, brand-red styling per `theme.dart`).
- States: first-load spinner (empty repo + refresh in flight); error → `news.error` +
  `news.retry` button; success-but-empty → `news.empty`.
- Nav tuple: `(Icons.newspaper_outlined, Icons.newspaper, app.t('nav.news', 'News'))`.
  Check 5-item density (Row is `spaceBetween` with 24px horizontal padding).
- i18n both bundles: `nav.news`, `news.{title,empty,error,retry}` — Greek strings listed
  in PR description for sign-off.
- Update 4-tab assumptions: `test/widget_test.dart`, any bottom-nav count assertions.

## Acceptance criteria

- [ ] News tab renders list from live feed on emulator; pull-to-refresh works
- [ ] Empty/error/loading states correct (airplane mode, no cache)
- [ ] Greek copy listed for sign-off; analyze + tests green
