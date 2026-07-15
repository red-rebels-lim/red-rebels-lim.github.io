# QA-03: Volleyball accent color — purple → blue everywhere

**Status:** todo
**Batch:** calendar (`fix/qa-calendar`)
**Register rows:** GLB-07 (P1)
**Depends on:** -
**Estimated scope:** Small (touches many call sites)

## Context

The app renders women's volleyball in purple `#9C27B0` (its own sport palette). The web
renders **all volleyball blue** in every surface we captured:

- grid dots (`02-grid-apr-light-en-pwa.png`: Apr 7/16/19/20 blue; app shows purple)
- list-view sport labels (`06-list-view…-pwa`: "WOMEN'S VOLLEYBALL" blue; app purple)
- cards-view sport chips (`07-cards-view…-pwa`: blue chip; app purple)
- Greek/dark variants the same (`22-grid-el-dark-app.png`: "ΓΥΝΑΙΚΕΊΟ ΒΌΛΕΪ" purple)

Note the nuance: the **event sheet** sport label for women's volleyball cup is *green* on
both platforms (`03-day-selected…`: "WOMEN'S VOLLEYBALL CUP" green on web AND app) — don't
"fix" that. The purple→blue change applies to dots, list labels and card chips.

This was a documented deliberate deviation; the exact-copy criterion reopened it and the
stakeholder approved the register — treat as a straight fix.

## Ground truth

- Web `UpcomingEventCard` / calendar components tint all volleyball with the blue sport
  color (`#2196F3`, see sport colors in `app/src/index.css` and `data/sport-config`).
- Captures listed above.

## Implementation notes

- `flutter/lib/theme.dart` — sport-color mapping: point `volleyball-women` accents used by
  dots/labels/chips at the volleyball blue. Check whether a distinct women's purple is still
  used anywhere legitimately (stats? squad?) — from captures, stats pages don't color by
  sport, so a full remap is likely safe. Grep call sites of the purple token.
- Affected widgets: calendar grid dot painter (`pages/calendar_page.dart`),
  `widgets/calendar_list_view.dart`, `widgets/calendar_cards_view.dart`,
  `widgets/event_card.dart`.
- Keep the sheet's green cup-label behavior untouched (`widgets/event_details_sheet.dart`).

## Acceptance criteria

- [ ] Grid dots, list labels, card chips blue for both volleyball sports, light+dark+Greek
- [ ] Event-sheet cup label still green (matches web)
- [ ] `flutter analyze && flutter test` green; tests asserting purple updated deliberately
- [ ] Pairs 02/06/07/22 re-captured; GLB-07 → FIXED
