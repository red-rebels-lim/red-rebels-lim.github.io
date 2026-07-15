# QA-15: Greek — "Γλώσσα" mid-word wrap + strip tonos on uppercase

**Status:** done (PR #88, merged 2026-07-15)
**Batch:** settings (`fix/qa-settings`)
**Register rows:** GRK-02 (P2), GRK-01 (P2 — decided 2026-07-14: strip)
**Depends on:** QA-14
**Estimated scope:** Small/Medium

## Context

In Greek settings the `Γλώσσα` label breaks mid-word (`Γλώσσ` / `α`) beside the language
control; `Σκοτεινό Θέμα` wraps too (two words — acceptable only if web does the same).
Capture `21-settings-el-dark-app.png` vs `-pwa.png`: web never breaks inside a word (row
label gets enough width; control sizes to content).

Likely fixed for free by QA-14 (the web-style `value >` row is much narrower than the
segmented control), but verify explicitly in Greek + both modes, and guard against
regression at larger font scales.

## GRK-01 — strip tonos on uppercase (decided 2026-07-14)

The app currently keeps tonos accents on uppercase Greek (`ΡΥΘΜΊΣΕΙΣ`, `ΝΊΚΗ`,
`ΕΙΔΟΠΟΙΉΣΕΙΣ`); browsers with `lang=el` drop them, which is also the Greek typographic
convention. Stakeholder decided: **strip app-wide**.

- Add a helper in `flutter/lib/i18n/i18n.dart` (e.g. `String elUpper(String s)`) that
  uppercases and removes the acute accent (ά→Α, έ→Ε, ή→Η, ί→Ι, ό→Ο, ύ→Υ, ώ→Ω; keep the
  dialytika: ϊ→Ϊ, ϋ→Ϋ; handle ΐ/ΰ → Ϊ/Ϋ) — only for Greek text being uppercased, never for
  stored data.
- Sweep every uppercasing call site: bottom-nav labels, section headings via `condensed()`,
  sheet titles, sport labels/chips, result pills, weekday row. Unit-test the helper against
  the strings visible in captures 21/22/23.

## Implementation notes (GRK-02)

- `flutter/lib/pages/settings_page.dart` — ensure the label `Text` gets flexible width and
  `softWrap` behavior matching web (word-boundary wrap only); no `Expanded` starving the
  label column.
- Sweep other Greek labels on the page for mid-word breaks after the QA-13/14 restyle.

## Acceptance criteria

- [ ] No mid-word breaks anywhere in Greek settings (light + dark)
- [ ] All uppercase Greek app-wide renders without tonos, matching the PWA
      (`ΗΜΕΡΟΛΟΓΙΟ / ΣΤΑΤΙΣΤΙΚΑ / ΡΟΣΤΕΡ / ΡΥΘΜΙΣΕΙΣ` nav, `ΝΙΚΗ`/`ΗΤΤΑ` pills, headings)
- [ ] Dialytika preserved where web preserves it (`ΒΟΛΕΪ`)
- [ ] `flutter analyze && flutter test` green incl. helper unit tests
- [ ] Pairs 21/22/23 re-captured; GRK-01/02 → FIXED
