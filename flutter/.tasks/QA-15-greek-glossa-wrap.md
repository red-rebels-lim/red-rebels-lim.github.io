# QA-15: Greek — "Γλώσσα" mid-word wrap

**Status:** todo
**Batch:** settings (`fix/qa-settings`)
**Register rows:** GRK-02 (P2)
**Depends on:** QA-14
**Estimated scope:** Small

## Context

In Greek settings the `Γλώσσα` label breaks mid-word (`Γλώσσ` / `α`) beside the language
control; `Σκοτεινό Θέμα` wraps too (two words — acceptable only if web does the same).
Capture `21-settings-el-dark-app.png` vs `-pwa.png`: web never breaks inside a word (row
label gets enough width; control sizes to content).

Likely fixed for free by QA-14 (the web-style `value >` row is much narrower than the
segmented control), but verify explicitly in Greek + both modes, and guard against
regression at larger font scales.

## Implementation notes

- `flutter/lib/pages/settings_page.dart` — ensure the label `Text` gets flexible width and
  `softWrap` behavior matching web (word-boundary wrap only); no `Expanded` starving the
  label column.
- Sweep other Greek labels on the page for mid-word breaks after the QA-13/14 restyle.

## Acceptance criteria

- [ ] No mid-word breaks anywhere in Greek settings (light + dark)
- [ ] `flutter analyze && flutter test` green
- [ ] Pair 21 re-captured; GRK-02 → FIXED
