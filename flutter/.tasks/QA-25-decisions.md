# QA-25: Stakeholder decisions — RESOLVED 2026-07-14

**Status:** done (all 10 questions answered by the stakeholder, 2026-07-14)
**Batch:** — (decision log)

All previously blocked register rows are resolved. Where a decision creates work, the
owning task has been updated. Do not re-litigate these inside other tasks.

| Row | Decision | Consequence |
|---|---|---|
| GLB-02 | **Keep the app's filter button. Remove ALL sharing from the Flutter app** — the header share button *and* the event-sheet share chip. Web stays unchanged | QA-01 (header: view → filter → theme, no share), QA-06 (sheet: no share chip). Deliberate deviation from web, recorded in register |
| CAL-02 | Keep disabled chevrons at season boundaries | Register ACCEPTED, no work |
| CAL-03 | Keep app's month persistence across tab switches | Register ACCEPTED, no work |
| SET-02 | "Only native push notifications on the flutter app. Anything else can be removed" | Single toggle confirmed; no Web Push/Telegram/Calendar-Sync channel rows. Register ACCEPTED |
| SET-03 | Dropped (follows SET-02: native push only — no auto-sync channel) | Removed from QA-21 scope. Export Calendar is unaffected |
| SET-06 (print) | Omit Print Calendar on phones | Register ACCEPTED (print half); QA-21 still delivers Export Calendar |
| SET-08 | **Keep the app's 3-way theme control** (system / light / dark) | Removed from QA-14 scope. Register ACCEPTED |
| GRK-01 | **Strip tonos on uppercase Greek app-wide** (match browsers / Greek convention) | Added to QA-15 |
| THM-04 | **Port the cinema animated gradient blobs** | Added to QA-17 |
| THM-07 | **Animate the neon scanlines** | Added to QA-18 |
| FUN-02 | **Build the web's anchored first-run tour, "as detailed as possible in both languages"** | New task QA-26 (replaces the 3-page intro dialog) |

Side effects applied:
- FUN-03 (share-output comparison) is moot — QA-23 cancelled.
- QA-19 (brand truncation) must verify title width with the final 3-button header.
