# QA-26: First-run anchored tour (replaces the 3-page intro dialog)

**Status:** todo
**Batch:** functional-gaps (`fix/qa-functional`)
**Register rows:** FUN-02 (P2)
**Depends on:** QA-01 (final header button set — tour anchors to header buttons), QA-13 (settings shell, if a tour step anchors there)
**Estimated scope:** Large

## Context

Stakeholder decision 2026-07-14: replace the app's 3-page intro dialog with the web's
**anchored tour — "as detailed as possible in both languages"**.

The web tour: 7 steps on first run, each step anchors to a real UI element (spotlight +
tooltip), `Skip` at bottom-left, advances with Next. Known anchor from source:
`data-tour="layout"` on the view-switcher button (`MobileHeader.tsx:91`) — grep
`data-tour` across `app/src/**` for the full anchor list and step order, and read the tour
component (find via the `Skip` string / onboarding key in `lib/preferences`) for titles,
bodies, and the dismissed-flag key semantics.

"As detailed as possible" = don't trim copy; if the web copy is terse, keep it verbatim
anyway (i18n byte-copy rule) — additional steps/text beyond the web's 7 would need new i18n
keys and therefore stakeholder sign-off; flag before inventing any.

## Implementation notes

- Remove `flutter/lib/widgets/intro_dialog.dart` usage; keep the same "seen" persistence
  key semantics the app already has (first launch only, survives updates).
- Anchoring: overlay + `GlobalKey`s on the target widgets (view switcher, filter button,
  theme toggle, bottom-nav tabs, month nav, …per web's anchor list). Spotlight cutout +
  tooltip positioning mirroring the web's placement per step.
- Both languages: strings come from the existing tour keys in the flutter i18n JSONs
  (byte-copies of `app/src/i18n/{en,el}.json`) — verify the keys exist; if the web tour
  copy lives outside the JSONs, stop and ask before adding keys.
- Note: the app header will have **no share button** (QA-25/GLB-02) — if a web tour step
  targets share, that step needs a decision (skip the step vs re-anchor); flag it.
- Test: widget test driving the full tour (step order, skip, completion persists flag,
  Greek variant renders).

## Acceptance criteria

- [ ] Fresh install shows the anchored tour; steps/order/copy match the web tour in EN + EL
- [ ] Skip and complete both persist; never shows again
- [ ] `flutter analyze && flutter test` green with tour tests
- [ ] Fresh-install capture pair attached; FUN-02 → FIXED
