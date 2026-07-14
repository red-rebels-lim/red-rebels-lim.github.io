# QA-14: Settings controls — language row, version string

**Status:** todo
**Batch:** settings (`fix/qa-settings`)
**Register rows:** SET-07 (P2), SET-09 (P3) — SET-08 dropped (decided: keep 3-way control)
**Depends on:** QA-13
**Estimated scope:** Small

## Context

1. **SET-07 Language.** Web: a row `Language … English >` — value + chevron opening a
   picker. App: inline segmented control `English | Greek`. Copy the web row; check what the
   web chevron actually opens on mobile (dialog/sheet/inline list) and clone it.
2. **SET-08 Dark Theme — NO WORK.** Stakeholder decision 2026-07-14 (QA-25): **keep the
   app's 3-way segmented control** (system/light/dark). Register row ACCEPTED. Just make
   sure QA-13's card restyle presents it cleanly in the web row shell.
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
- [ ] 3-way dark-theme control untouched functionally, restyled into the card row
- [ ] Version shows `v1.0.0` sourced from package info
- [ ] `flutter analyze && flutter test` green
- [ ] Pair 13 re-captured; SET-07/09 → FIXED
