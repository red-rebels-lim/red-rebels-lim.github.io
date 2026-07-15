# QA-04: Calendar grid — blank leading cells + day-card nits

**Status:** done (PR #84, merged 2026-07-15)
**Batch:** calendar (`fix/qa-calendar`)
**Register rows:** CAL-01 (P2), CAL-06 (P3)
**Depends on:** -
**Estimated scope:** Small

## Context

1. **CAL-01.** The app renders the previous month's trailing days (grayed `30 31` before
   Apr 1, `29 30` before Jul 1). The web leaves leading cells **blank** — but *does* render
   the next month's leading days grayed at the end (`1 2 3` after Apr 30 on both platforms).
   Asymmetric on purpose: copy it exactly (empty leading cells, grayed trailing cells).
2. **CAL-06.** Selected-day event cards: the app truncates titles slightly later than web
   ("Karmiotissa Pano Polemidion vs …" vs web "…v…") and paddings differ by a few px —
   compare `03-day-selected-apr19-light-en-*`. Align the card's horizontal padding/typography
   with the web card so the truncation point matches.

## Ground truth

- Web month grid behavior in `app/src/components/calendar/` (grid builds cells from the
  month matrix; leading slots render empty).
- Captures `01-grid-jul-light-en-*`, `02-grid-apr-light-en-*`, `03-day-selected-apr19-*`.

## Implementation notes

- `flutter/lib/pages/calendar_page.dart` — grid cell builder: emit empty widgets for
  leading offset instead of prev-month numbers; keep trailing next-month numbers grayed.
- Selected-day card lives in `widgets/event_card.dart` (or inline in calendar_page) —
  match web paddings.

## Acceptance criteria

- [ ] April + July grids: leading cells blank, trailing days grayed — identical to PWA
- [ ] Day-selected card truncation/padding matches web side-by-side
- [ ] `flutter analyze && flutter test` green (update grid widget tests)
- [ ] Pairs 01/02/03 re-captured; CAL-01/06 → FIXED
