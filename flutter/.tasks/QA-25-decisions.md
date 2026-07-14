# QA-25: Stakeholder decisions holding pen

**Status:** blocked (waiting on stakeholder)
**Batch:** — (feeds every batch)
**Register rows:** GLB-02, CAL-02, CAL-03, SET-02, SET-06 (print half), SET-08 (system option), GRK-01, THM-04, THM-07, FUN-02
**Depends on:** stakeholder answers
**Estimated scope:** n/a — decision log

Do **not** resolve any of these inside another task. When a decision lands, either move the
row into the owning task (fix) or mark the register row ACCEPTED with the quote + date.

## The questions

| Row | Question | Options |
|---|---|---|
| GLB-02 | App has a filter button; web mobile has **no way to open filters at all** (keyboard shortcut only) | (a) treat as WEB-BUG: add a filter trigger to the web header (needs sign-off to touch `app/`), keep the app button styled to match; (b) exact copy: remove the app button |
| CAL-02 | Month nav at season boundaries | (a) keep app's disabled chevrons (ACCEPT); (b) copy web's wrap-around |
| CAL-03 | Web resets to current month on Calendar tab re-entry; app preserves | (a) ACCEPT app behavior; (b) copy the reset |
| SET-02 | Single native `Notifications` toggle vs web's 3-channel list | confirm the single-toggle presentation is the accepted native translation (Telegram already dropped 2026-07-13) |
| SET-06 | `Print Calendar` row on a phone | (a) omit (ACCEPT difference); (b) include (share-to-print intent) |
| SET-08 | Web dark theme = plain toggle; app also offers explicit "system" | default plan (QA-14): toggle + implicit follow-system-until-first-toggle, byte-matching web behavior — object only if an explicit system option must stay |
| GRK-01 | Greek uppercase keeps tonos in app (`ΡΥΘΜΊΣΕΙΣ`); browsers drop it (`ΡΥΘΜΙΣΕΙΣ`) | (a) ACCEPT Dart behavior; (b) strip tonos on uppercase via a helper (typographically the Greek convention) — affects all uppercase Greek text app-wide |
| THM-04 | Cinema animated ambient blobs | (a) skip on mobile (ACCEPT); (b) port with animation |
| THM-07 | Neon scanlines animated-feel vs static | (a) ACCEPT static; (b) animate |
| FUN-02 | First-run intro: app 3-page dialog vs web 7-step anchored tour | (a) ACCEPT re-imagined dialog (PRD CAL-10 said "re-imagine"); (b) build the anchored tour |

## Notes

- GRK-01 answer should be recorded in `flutter/CLAUDE.md` (or the repo CLAUDE.md domain
  glossary) either way — it will recur.
- If GLB-02(a): the web change is a separate `app/` PR with its own sign-off, CSP untouched,
  and the register row reclassified WEB-BUG.
