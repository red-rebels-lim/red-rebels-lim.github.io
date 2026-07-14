# QA-17: Cinema — typography, two-tone brand, plain header buttons

**Status:** todo
**Batch:** themes (`fix/qa-themes`)
**Register rows:** THM-03 (P2)
**Depends on:** -
**Estimated scope:** Medium

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
- Background: web = soft pale gradient, no stadium photo; app matched this already ✓ —
  the animated ambient blobs remain a stakeholder decision (THM-04, QA-25); don't build
  them here.

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
- [ ] Other themes unchanged
- [ ] `flutter analyze && flutter test` green; cinema variant tests updated
- [ ] Pairs 26/27 re-captured; THM-03 → FIXED
