# QA-12: Squad borders, player-sheet tile wrap + close X

**Status:** done (PR #87, merged 2026-07-15)
**Batch:** squad (`fix/qa-squad`)
**Register rows:** SQD-01 (P3), SQD-02 (P3), SQD-03 (P3)
**Depends on:** -
**Estimated scope:** Small

## Context

The squad page survived QA well — three nits (captures `11-squad-top-light-en-*`,
`12-player-sheet-light-en-*`):

1. **SQD-01.** Roster row cards and player-sheet stat tiles have red-tinted borders in app;
   web uses slate borders (same family as CAL-04).
2. **SQD-02.** Player-sheet `GOALS` tile subtitle `2 open · 0 pen · 0 OG` wraps onto two
   lines in app (narrower tile / larger padding); web keeps it on one line. Match web tile
   width/padding/font-size.
3. **SQD-03.** Web player sheet has a close **X** top-right; app has only the drag handle
   (and per EVT-10 the handle itself should go). Add the X (web: slate icon button),
   remove the handle.

## Ground truth

- Web squad page + player sheet under `app/src/components/` (squad section; find via
  `MATCH LOG` / `SHOW ALL` strings).
- Captures 11/11b/12.

## Implementation notes

- `flutter/lib/pages/squad_page.dart`, `widgets/player_sheet.dart`,
  `widgets/player_avatar.dart` (only if the avatar ring color is part of the border issue).
- Border tokens shared with QA-05 — if the calendar batch already added slate border tokens
  to `AppColors`, reuse them.

## Acceptance criteria

- [ ] Row/tile borders slate in light+dark; subtitle one line; X closes the sheet
- [ ] `flutter analyze && flutter test` green
- [ ] Pairs 11/12 re-captured; SQD-01/02/03 → FIXED
