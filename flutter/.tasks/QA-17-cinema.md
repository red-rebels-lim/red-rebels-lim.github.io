# QA-17: Cinema — typography, two-tone brand, plain header buttons

**Status:** done (PR #90, merged 2026-07-15)
**Batch:** themes (`fix/qa-themes`)
**Register rows:** THM-03 (P2), THM-04 (P3 — decided 2026-07-14: port the animation)
**Depends on:** -
**Estimated scope:** Medium/Large

## Context

Under cinema the app looks nearly identical to the default theme — the theme's typography
was never ported (`27-calendar-cinema-app.png` vs `-pwa.png`, `26-settings-cinema-*`):

- **Body/heading font**: web cinema specifies **Inter** for body + headings (register note:
  Inter is already bundled in the app for the Greek fallback — switching cinema onto it is
  trivial now).
- **Brand title**: web renders a two-tone title — `Red Rebels` dark red + `Calendar` bright
  red — in the cinema face; app shows the default single-red condensed title (and truncates,
  see QA-19).
- **Header buttons**: web cinema drops the circular button backgrounds — plain icons; app
  keeps the circles.
- **THM-04 ambient blobs — decided 2026-07-14: PORT the animation.** Web cinema drifts
  large soft gradient blobs slowly behind the content. Read the keyframes/gradients from
  the cinema block in `index.css` and recreate with an `AnimationController` +
  `CustomPainter`/transform layer in `widgets/app_background.dart` (cinema branch only).
  Keep it cheap: repaint-boundary the layer, target the web's timing, and respect
  `MediaQuery.disableAnimations` (reduced-motion) by freezing the blobs.

## Ground truth

- Cinema token/font block in `app/src/index.css`.
- Captures 26/27/27b.

## Implementation notes

- `flutter/lib/theme.dart` — per-theme font family is presumably already keyed (Orbitron
  works under neon); add cinema → Inter for body + headings; brand title style hook in
  `widgets/mobile_header.dart` for the two-tone spans (web splits the string — copy exactly
  which words get which color).
- Header button circle removal: theme-dependent decoration token, not a widget fork.

## Acceptance criteria

- [ ] Cinema calendar + settings match PWA: Inter everywhere, two-tone brand, no button circles
- [ ] Ambient blobs animate like the web (side-by-side video/frame comparison); frozen under
      reduced-motion; no jank on the emulator
- [ ] Other themes unchanged
- [ ] `flutter analyze && flutter test` green; cinema variant tests updated
- [ ] Pairs 26/27 re-captured; THM-03/04 → FIXED
