# SOLO-08: AppState news wiring

**Status:** todo
**Batch:** news (`feat/news-feed`)
**Depends on:** SOLO-07
**Estimated scope:** Small

## Context

`AppState.syncEvents()` (`lib/state/app_state.dart:281-302`) already `Future.wait`s the
events/players refreshes and sets `lastSyncFailed`/`lastSyncAt`. Many tests construct
AppState directly — the news repo must be optional.

## Implementation notes

- Optional ctor param `NewsRepository? news` (existing test constructions keep compiling).
- Add `news.refresh()` to the `Future.wait` in `syncEvents()`; `notifyListeners()` after.
- Reuse the existing combined stale/lastSync indicator — no per-feed flag.

## Acceptance criteria

- [ ] Pull-to-refresh + startup sync refresh news alongside events/players
- [ ] Existing AppState tests compile unchanged; analyze + tests green
