# QA-23: Share output — capture and compare both share texts

**Status:** todo
**Batch:** functional-gaps (`fix/qa-functional`)
**Register rows:** FUN-03 (P3, unverified)
**Depends on:** -
**Estimated scope:** Small

## Context

Never compared during Phase 1 — the native share sheet intercepts the flow on both sides.
Web has two share surfaces:

1. **Header share** (`MobileHeader.tsx:44-59`): shares
   `{title: "Red Rebels Calendar", url: window.location.href}` via `navigator.share`,
   clipboard fallback.
2. **Event-sheet share** (chip next to Home/Away): match-specific text — read the web
   component for the exact format (score, teams, date, likely a URL).

App: header share + sheet share exist (Phase 6, native share sheet). Unknown whether the
composed text matches.

## Method

On the emulator, tap share on both apps in the same states and read the share-sheet
preview (`adb exec-out screencap`), or intercept: for the app, unit-test the share-text
builder; for web, read the source — no capture needed if the code is unambiguous.

## Acceptance criteria

- [ ] Both share surfaces produce byte-identical text/URL payloads to the web (or the
      difference is documented and accepted in the register)
- [ ] Share-text builder covered by a unit test
- [ ] FUN-03 → FIXED / ACCEPTED with evidence
