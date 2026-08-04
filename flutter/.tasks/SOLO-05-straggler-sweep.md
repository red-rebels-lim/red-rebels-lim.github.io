# SOLO-05: Rebrand straggler sweep

**Status:** todo
**Batch:** rebrand (`feat/solosalamina-rebrand`)
**Depends on:** SOLO-02, SOLO-03, SOLO-04
**Estimated scope:** Small

## Context

Catch remaining "Red Rebels"/"redrebels" mentions after the main renames. User-visible
strings must be clean; code comments citing web parity may stay.

## Implementation notes

- `grep -ri "red rebels\|redrebels" flutter/ --include="*.dart" --include="*.json" --include="*.md" --include="*.yaml"`
- Known: `lib/firebase_options.dart:1` comment, `flutter/README.md`, docs references.
- Deliberately KEEP: `settings_page.dart` GitHub repo link (repo rename is a later user
  action), `siteBaseUrl='https://red-rebels.com'` in `lib/data/constants.dart` (data
  hosting re-homed later — add a `// TODO(sunset)` comment only), bundle IDs (Phase 3).

## Acceptance criteria

- [ ] No user-visible "Red Rebels" string outside deliberately-kept items
- [ ] analyze + tests green
