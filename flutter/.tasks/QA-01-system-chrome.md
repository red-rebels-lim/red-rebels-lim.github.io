# QA-01: System chrome — red status bar, theme-icon semantics, back button, view glyphs, share removal

**Status:** todo
**Batch:** calendar (`fix/qa-calendar`)
**Register rows:** GLB-01 (P2), GLB-03 (P2), GLB-04 (P2), CAL-05 (P3), GLB-02 (decided)
**Depends on:** -
**Estimated scope:** Small/Medium

## Context

Four header/chrome mismatches verified on the emulator (captures `01/02-grid-*`,
`08-stats-*`, `11-squad-*`):

1. **GLB-01 status bar.** The PWA keeps a **red** status bar with light icons in *both*
   light and dark modes — it comes from the `theme-color` meta in `app/index.html`. The app
   currently draws a background-colored status bar with dark icons in light mode and a dark
   gray one in dark mode.
2. **GLB-03 theme toggle icon.** Web `MobileHeader.tsx:115` renders `{isDark ? moon : sun}` —
   the icon shows the **current** state (moon = currently dark). The app renders the
   **target** state (moon shown in light mode). Copy the web: sun in light, moon in dark,
   red `#dc2828` icon color, same 20px stroke style.
3. **GLB-04 back button.** Web shows a circular back button (arrow-left, red icon, slate
   circle) before the title on Stats and Squad pages (`MobileHeader` `showBack` prop,
   navigates to `/`). The app header never shows one.
4. **CAL-05 view-switcher glyphs.** The web's three view icons are exact SVGs in
   `app/src/components/layout/MobileHeader.tsx:14-30` (grid = four squares, list = three
   lines with leading dots, cards = two wide rounded rects). App glyphs currently differ
   (e.g. list shows a hamburger-with-block icon).

## Ground truth

- `app/src/components/layout/MobileHeader.tsx` — button order (view → share → theme),
  circular `bg-slate-100 dark:bg-[#1e293b]` buttons, icon SVGs, back-button markup.
- `app/index.html` — `theme-color` meta (red).
- Captures: PWA status bar red at both `01-grid-jul-light-en-pwa.png` and
  `01-grid-jul-dark-en-pwa.png` (regenerable per handoff §Phase 1).

## Implementation notes

- `flutter/lib/widgets/mobile_header.dart` — icon fix, back button (show on stats/squad;
  pop/switch to calendar tab on tap; web navigates to `/` i.e. the Calendar tab).
- Status bar: `AnnotatedRegion<SystemUiOverlayStyle>` or `SystemChrome.setSystemUIOverlayStyle`
  with the theme's red + `Brightness.light` icons; wire through `AppColors` so brutalism/
  cinema/neon keep their own header treatment (verify what the PWA does per theme before
  hardcoding — under neon/cinema the web theme-color stays red).
- **GLB-02 decision (2026-07-14)**: keep the filter button, **remove the header share
  button** — final button set is view → filter → theme (calendar page) / theme (+back) on
  other pages. Strip the share handler + any now-dead share plumbing reachable only from it
  (the sheet chip removal happens in QA-06).

## Acceptance criteria

- [ ] Status bar red + light icons in light and dark, matching PWA side-by-side
- [ ] Sun icon in light mode, moon in dark, both red, matching web SVG shapes
- [ ] Back button on Stats/Squad identical to web (position, colors, radius) and functional
- [ ] View-switcher glyphs pixel-match the web icons in all three states
- [ ] No share button anywhere in the header; filter button retained and functional
- [ ] `flutter analyze && flutter test` green; widget tests updated for header changes
- [ ] Affected pairs re-captured; register rows GLB-01/03/04, CAL-05 → FIXED
