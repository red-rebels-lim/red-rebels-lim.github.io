# QA-14: Settings controls — language row, dark-theme toggle, version string

**Status:** todo
**Batch:** settings (`fix/qa-settings`)
**Register rows:** SET-07 (P2), SET-08 (P2, partially blocked), SET-09 (P3)
**Depends on:** QA-13
**Estimated scope:** Small/Medium

## Context

1. **SET-07 Language.** Web: a row `Language … English >` — value + chevron opening a
   picker. App: inline segmented control `English | Greek`. Copy the web row; check what the
   web chevron actually opens on mobile (dialog/sheet/inline list) and clone it.
2. **SET-08 Dark Theme.** Web: single toggle (`Dark Theme` + moon icon tile). App: 3-way
   segmented control (system-auto / light / dark). Exact copy = plain toggle. **Blocked
   nuance (QA-25):** dropping "system" changes first-run behavior — web resolves the initial
   mode from `prefers-color-scheme` (`useTheme.ts`) then persists an explicit choice; the
   app can mirror exactly that (auto until first manual toggle) with just a toggle. Ask the
   stakeholder only if we believe an explicit system option must stay; default plan is the
   web-identical toggle + implicit system default.
3. **SET-09 Version.** Web `v1.0.0`; app `1.0.0`. Prefix `v`.

## Ground truth

- `app/src/hooks/useTheme.ts` — saved-else-`prefers-color-scheme` resolution; toggle writes
  explicit value.
- Web settings display card markup; captures 13b (light EN), 21 (Greek dark: toggle red/on).

## Implementation notes

- `flutter/lib/pages/settings_page.dart` + `state/app_state.dart` (theme mode enum: keep
  internal `system` state, expose it as toggle whose value = resolved brightness; first
  manual flip persists explicit mode — byte-for-byte the web behavior).
- Language picker: match web target exactly once inspected on the PWA.

## Acceptance criteria

- [ ] Language row renders value + chevron and opens the same picker style as PWA
- [ ] Dark theme is a single toggle; fresh install still follows system until first toggle
- [ ] Version shows `v1.0.0` sourced from package info
- [ ] `flutter analyze && flutter test` green (theme-mode state tests updated)
- [ ] Pair 13 re-captured; SET-07/08/09 → FIXED (SET-08 noted in QA-25 as resolved-by-design
      unless stakeholder objects)
