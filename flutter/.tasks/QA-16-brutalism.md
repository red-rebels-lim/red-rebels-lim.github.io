# QA-16: Brutalism — square corners + 2px borders

**Status:** todo
**Batch:** themes (`fix/qa-themes`)
**Register rows:** THM-01 (P2), THM-02 (P3)
**Depends on:** -
**Estimated scope:** Medium

## Context

1. **THM-01.** Web brutalism is **flat and square**: grid panel, cards, buttons, chips and
   the today-cell are sharp-cornered (today = solid pink square, `25-calendar-brutalism-pwa.png`).
   The app keeps its default rounded corners everywhere (`25-calendar-brutalism-cards-app.png`:
   rounded cards, rounded chips, rounded nav pills).
2. **THM-02.** Web brutalism draws **2px** header/nav borders (red top border above the
   bottom nav, header underline); the app ported only the colors at ~1px.

The marquee ticker already matches (present both sides) — don't touch it.

## Ground truth

- Brutalism token block in `app/src/index.css` (radius overrides → 0, border widths).
- Captures 24 (settings pair), 24b (Greek), 25 (calendar pair).

## Implementation notes

- `flutter/lib/theme.dart` — the theme system needs a per-theme **radius scale** (and border
  width) in `AppColors`/theme extension, defaulting to current values, zeroed for brutalism;
  widgets must consume the token instead of hardcoded `BorderRadius`. Expect a mechanical
  sweep of `widgets/*` + pages replacing literal radii — that sweep also future-proofs
  QA-17/18.
- Bottom nav active-tab treatment: web brutalism gives the active item a red-tinted square
  block (`25-*-pwa` bottom left) — port it in `widgets/bottom_nav.dart`.

## Acceptance criteria

- [ ] Calendar + settings under brutalism: square everything, 2px borders, side-by-side match
- [ ] Other themes unaffected (radius token defaults)
- [ ] `flutter analyze && flutter test` green; per-theme widget tests extended
- [ ] Pairs 24/25 re-captured; THM-01/02 → FIXED
