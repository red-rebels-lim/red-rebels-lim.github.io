# QA-19: Theme fonts — brand title truncation

**Status:** todo
**Batch:** themes (`fix/qa-themes`)
**Register rows:** THM-08 (P2)
**Depends on:** QA-17 (cinema font churn), ideally after QA-18
**Estimated scope:** Small

## Context

Under the wide-tracking theme fonts the app's header brand truncates —
`Red Rebels Cal…` in brutalism (`25-*-app`), cinema (`27-*-app`) and neon (`29-*-app`) —
while the web always fits the full `Red Rebels Calendar` at the same viewport width.
In the default theme the app fits fine.

Root cause to confirm: app title font-size/letter-spacing per theme larger than web's, or
the four header buttons squeezing the title (web has three — GLB-02 decision pending; do
NOT remove the button here, but be aware the final width changes if QA-25 removes it).

## Ground truth

- Web header brand styles per theme (`index.css` theme blocks + `MobileHeader` title
  classes); captures 25/27/29 pwa frames show full title in every theme.

## Implementation notes

- `flutter/lib/widgets/mobile_header.dart` + theme title styles in `theme.dart` — port the
  web's per-theme title size/tracking; verify at 1080×2400 with all four header buttons
  and again with three (so the fix is robust to the GLB-02 outcome).
- No `FittedBox`/auto-shrink hacks unless the web does the equivalent — copy the web's
  actual sizing.

## Acceptance criteria

- [ ] Full brand title visible in all four themes, EN + EL, light + dark
- [ ] `flutter analyze && flutter test` green
- [ ] Pairs 25/27/29 re-captured; THM-08 → FIXED
