# QA-24: Full re-capture + register close-out (Phase 4 exit)

**Status:** todo
**Batch:** functional-gaps (last PR) — handoff **Phase 4**
**Register rows:** all
**Depends on:** QA-01…QA-23 merged; QA-25 decisions resolved
**Estimated scope:** Medium (mechanical but long)

## Objective

The handoff's exit criterion: every register row FIXED or ACCEPTED, a final full capture
matrix attached to the closing PR, register 100% resolved.

## Steps

1. Rebuild the credentialed debug APK from `main` (all batches merged), reinstall.
2. Reset both apps to baseline (English/light/Default/onboarding dismissed).
3. Re-run the full Phase 1 capture matrix (~35–40 pairs; procedure + tap coordinates in
   QA-PARITY-HANDOFF.md §Emulator mechanics — re-derive coordinates from fresh screenshots,
   they drift with layout fixes).
4. Diff every pair; any residual difference = new register row → fix or escalate before
   closing.
5. Update every register row to FIXED (PR link) / ACCEPTED (stakeholder quote + date).
6. Closing PR: attach the capture set (or a committed contact-sheet under
   `docs/native-apps/qa-final-captures/` if the stakeholder wants it in-repo — ask; images
   in-repo are heavy), reference the register.
7. Restore emulator/app baseline state after the run.

## Acceptance criteria

- [ ] Register has zero OPEN rows
- [ ] Final capture set exists and is linked from the closing PR
- [ ] `flutter analyze && flutter test` green on the final merge
- [ ] Stakeholder sign-off recorded in the register header
