# QA-02: Background overlay darkness + per-page panel structure

**Status:** done (PR #84, merged 2026-07-15)
**Batch:** calendar (`fix/qa-calendar`)
**Register rows:** GLB-06 (P2), GLB-05 (P2)
**Depends on:** -
**Estimated scope:** Medium

## Context

1. **GLB-06.** In light mode the app lays a much heavier white haze over the stadium photo
   (`mobile.webp`) than the web does — the whole app looks washed out. Compare
   `02-grid-apr-light-en-pwa.png` vs `-app.png`: the web keeps the photo dark and legible
   (dark smoke, visible crowd), the app is milky.
2. **GLB-05.** The app wraps *every* page in one large frosted rounded panel (month nav +
   content all inside it). The web panels **only** the calendar grid card and the stats page;
   in list and cards views the month-nav pill is its own element and the rows/cards float
   directly on the background; settings uses separate white cards per section (that part is
   QA-13's scope — this task fixes calendar list/cards).

## Ground truth

- `app/src/index.css` — background overlay gradient tokens (light + dark) over `mobile.webp`.
- `app/src/pages/CalendarPage.tsx` + `components/calendar/` — grid card is the only wrapped
  surface; list/cards render outside it.
- Captures `06-list-view-light-en-*`, `07-cards-view-light-en-*` (structure),
  `02-grid-apr-light-en-*` (overlay).

## Implementation notes

- `flutter/lib/widgets/app_background.dart` — port the exact overlay gradient stops/opacities
  from `index.css` per mode; kill any extra scrim the pages add.
- `flutter/lib/pages/calendar_page.dart`, `widgets/calendar_list_view.dart`,
  `widgets/calendar_cards_view.dart` — restructure: month-nav pill standalone; grid keeps its
  frosted card; list/cards content floats on the background like the web.
- Check dark mode after the change — web dark grid also sits on the bare background
  (`01-grid-jul-dark-en-pwa.png` shows no light panel).

## Acceptance criteria

- [ ] Light-mode background matches the PWA's darkness side-by-side on the same frame
- [ ] List and cards views: no page-wide panel, month-nav pill separate, rows/cards float
- [ ] Grid view keeps its panel (light) and matches web dark treatment in dark mode
- [ ] `flutter analyze && flutter test` green
- [ ] Pairs 01/02/06/07 re-captured; GLB-05/06 → FIXED
