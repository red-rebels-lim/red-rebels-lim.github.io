# SOLO-04: i18n brand strings ⚠️ Greek sign-off

**Status:** done (PR #113, merged 2026-08-04)
**Batch:** rebrand (`feat/solosalamina-rebrand`)
**Depends on:** -
**Estimated scope:** Small

## Context

Brand strings live in both i18n bundles (`assets/i18n/en.json` + `el.json`, lines 3-5 and
~346) and feed `mobile_header.dart:53` (header) and `marquee.dart:42,46` (brutalism ticker).
Brand stays Latin-script in both locales (it's the partner site's name).

## Implementation notes

- Both bundles: `common.appName` = "SoloSalamina", `common.rebels` = "SOLOSALAMINA",
  `common.brandText` = "SoloSalamina 26/27", `settings.previewTitle` = "SoloSalamina Calendar".
- Check `test/i18n_test.dart` for pinned values.
- CLAUDE.md guardrail: list every `el.json` change in the PR description for user sign-off.

## Acceptance criteria

- [ ] Header + marquee show SoloSalamina branding in both languages
- [ ] Greek-file diff explicitly listed in PR description
- [ ] analyze + tests green
