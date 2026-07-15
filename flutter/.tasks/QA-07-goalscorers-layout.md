# QA-07: Goalscorers tab — per-team side layout

**Status:** done (PR #84, merged 2026-07-15)
**Batch:** calendar (`fix/qa-calendar`)
**Register rows:** EVT-04 (P2)
**Depends on:** QA-06
**Estimated scope:** Small/Medium

## Context

Web lays scorers out by team side, like a match-center timeline:
`15-sheet-penalties-light-en-pwa.png` shows Nea Salamis' scorer right-aligned
(`45+7' ⚽ Kostas Charalampous`) and the opponent's left-aligned
(`Algassime Bah ⚽ 90+3'`). Single-scorer case (`04-*-pwa`) centers the name block with the
ball icon after the name and the minute beside it.

App renders one flat left-aligned list (ball, name, minute right) regardless of team —
losing the home/away attribution entirely.

## Ground truth

- Web goalscorers renderer in the event-sheet component (`app/src/components/calendar/`);
  scorer team attribution comes from the event data model (`types/events.ts`).
- Scorer annotations like `"(Πέναλτι)"` are intentional — web strips parens via
  `translatePlayerName` before lookup; mirror whatever the flutter i18n layer already does.

## Implementation notes

- `flutter/lib/widgets/event_details_sheet.dart` goalscorers tab: two-column row layout —
  our scorers on the side matching the web (verify: web puts *home team* scorers left,
  *away* right, by comparing 04 (Salamis away → its scorer ΘΕΟΔΟΣΗΣ ΚΥΠΡΟΥ appears… check
  live before coding) — confirm the rule against the PWA with one home and one away match.
- Ball icon placement: after the name on the left side, before the name on the right
  (mirror of web capture 15).

## Acceptance criteria

- [ ] Two-team match renders scorers on correct opposing sides identical to PWA
- [ ] Single-team scorer list matches web centering/alignment
- [ ] `flutter analyze && flutter test` green + a widget test for the two-sided layout
- [ ] Pairs 04/15 re-captured; EVT-04 → FIXED
