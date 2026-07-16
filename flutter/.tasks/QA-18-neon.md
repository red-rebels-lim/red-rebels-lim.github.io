# QA-18: Neon — cyan active nav, grid panel fill, day numerals, today cell

**Status:** done (PR #90, merged 2026-07-15)
**Batch:** themes (`fix/qa-themes`)
**Register rows:** THM-05 (P2), THM-06 (P3), THM-07 (P3 — decided 2026-07-14: animate)
**Depends on:** -
**Estimated scope:** Medium

## Context

Captures `29-calendar-neon-*`, `28-settings-neon-*`:

1. **THM-05 bottom nav active color.** Web neon: active tab **cyan with glow**
   (`CALENDAR` cyan in `29-*-pwa`; `SETTINGS` cyan glow in `28-*-pwa`). App: active tab stays
   red (with glow). Switch the neon palette's nav-active token to the web cyan.
2. **THM-06 grid panel + numerals + today cell.**
   - Web keeps a **white panel** behind the HUD corner brackets; the app draws the grid
     straight on the page background (brackets only).
   - Day numerals: web uses the default sans for day numbers (Orbitron only for the month
     title + weekday row); the app applies a techno/mono face to the numbers too.
   - Today cell: web = filled pink square; app = red outlined rounded square.

3. **THM-07 scanlines — decided 2026-07-14: ANIMATE.** The app's scanline overlay is
   static; the web's has an animated feel (slow vertical drift/flicker — read the exact CSS
   animation in the neon block of `index.css`). Recreate in the neon overlay layer
   (`widgets/app_background.dart` or `hud_frame.dart`) with an `AnimationController`;
   freeze under `MediaQuery.disableAnimations`.

HUD corner brackets and the glowing Orbitron month title already match ✓ (`hud_frame.dart`).

## Ground truth

- Neon token block in `app/src/index.css` (accent cyan, panel bg).
- Captures 28/29.

## Implementation notes

- `flutter/lib/theme.dart` — neon palette: nav-active → cyan token; grid panel fill token.
- `flutter/lib/pages/calendar_page.dart` / `widgets/hud_frame.dart` — panel inside brackets;
  day-number `TextStyle` falls back to body font under neon (limit Orbitron/mono to the
  title + weekday labels, mirroring web).
- Today-cell shape per QA-16's radius/token work if it lands first (neon keeps rounded? web
  neon today-cell is a *square-ish* filled pink cell — verify against fresh capture, the
  translate bar hid part of the top in `29-*-pwa`).

## Acceptance criteria

- [ ] Neon calendar + settings side-by-side match: cyan active nav, white panel, plain day
      numerals, filled today cell
- [ ] Scanlines animate like the web; frozen under reduced-motion; no jank
- [ ] `flutter analyze && flutter test` green; neon variant tests updated
- [ ] Pairs 28/29 re-captured; THM-05/06/07 → FIXED
