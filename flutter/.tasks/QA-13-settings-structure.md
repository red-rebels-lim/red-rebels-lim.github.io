# QA-13: Settings structure — section chips + white cards + icon tiles

**Status:** done (PR #88, merged 2026-07-15)
**Batch:** settings (`fix/qa-settings`)
**Register rows:** SET-01 (P1)
**Depends on:** -
**Estimated scope:** Large

## Context

The settings page has the largest single structural gap (captures
`13-settings-top-light-en-*`, `13b/13c` scrolls, `20` dark, `21` Greek dark).

Web anatomy:
- Section labels are **chips** (uppercase condensed text on a light slate rounded bg):
  `NOTIFICATIONS`, `VISUAL THEME`, `DISPLAY`, `SPORTS FILTER`, `TOOLS`, `ABOUT`.
- Each section is a **white card** (dark: dark card) containing rows.
- Every row leads with a **colored rounded icon tile** (e.g. red bell on pale red for Web
  Push, blue Telegram, blue calendar, red palette for Visual Theme, slate globe/moon…),
  then title + gray description line, control on the right.
- `CHANNELS` appears as an inner heading inside the notifications card;
  `NOTIFICATION PREVIEW` is a footer row of that card with a chevron (content = QA-21).

App today: one frosted panel, plain rows with bare outline icons, thin dividers between
sections, no cards, no chips, no icon tiles.

This task rebuilds the **shell** (chips, cards, icon-tile row component) and re-homes the
existing rows (notifications toggle, visual theme select, language, dark theme, about).
Missing *sections* (Sports Filter, Tools, Notification Preview, Calendar Sync) are QA-21;
control-type changes are QA-14.

## Ground truth

- Web `SettingsPage` + settings components (`app/src/pages/SettingsPage.tsx`,
  `app/src/components/` settings folder — locate via `NOTIFICATION PREVIEW` string).
- Captures 13/13b/13c/20/21.

## Implementation notes

- `flutter/lib/pages/settings_page.dart` — introduce `SettingsSectionChip`,
  `SettingsCard`, `SettingsRow(iconTile:, title:, subtitle:, trailing:)` widgets; tokens
  (chip bg, card bg, icon-tile tints) via `AppColors` from `index.css` values.
- Keep row semantics/state wiring untouched — presentation only.
- Verify per-theme: settings captures exist for brutalism/cinema/neon (24/26/28) —
  cards/chips restyle per theme on web; port what the tokens dictate, re-check in QA-16/17/18.

## Acceptance criteria

- [ ] Section chips, white cards, icon tiles side-by-side identical with PWA (light+dark+EL)
- [ ] `About` card: version + GitHub rows with icon tiles; `Made with love…` footer outside
- [ ] `flutter analyze && flutter test` green; settings widget tests updated
- [ ] Pairs 13/20/21 re-captured; SET-01 → FIXED
