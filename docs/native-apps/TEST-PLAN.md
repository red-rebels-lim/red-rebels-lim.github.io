# Red Rebels Native Apps — Full Test Plan

| Field | Value |
|---|---|
| **Scope** | Flutter app (`flutter/`) on Android + iOS, incl. the Android home-screen widget |
| **Basis** | [PRD](./PRD.md) §7 parity matrix + §8 functional requirements, [QA-COMPARISON](./QA-COMPARISON.md) register, QA-25 stakeholder decisions (2026-07-14), [IMPLEMENTATION_PLAN](./IMPLEMENTATION_PLAN.md) exit criteria |
| **Design ground truth** | The web app's **mobile view** (390×844) — pixel-perfect target, minus the ACCEPTED deviations in §3 |
| **Author / date** | Claude Code, 2026-07-27 |
| **Companion** | TEST-RUN-*.md — one per executed run, results keyed to the scenario IDs below |

---

## 1. Objectives & scope

Verify, on real emulators/simulators:

1. **Functional parity** — every Must/Should row of the PRD §7 matrix behaves correctly on device.
2. **Visual fidelity** — screens are pixel-perfect against the web mobile ground truth (§9 protocol), across light/dark, all four visual themes, and both languages.
3. **Native extras** — the Android next-match widget (Phase 9) end to end.
4. **Responsiveness** — layouts hold on small / default / large phone screens and at increased font scale (PRD UX-3, UX-5).
5. **Resilience** — offline snapshot, stale-data indicator, cold start, preference persistence.

**Out of scope for this plan** (externally blocked or ruled out):

- iOS push (Phase 5 PR 2) and the **iOS widget** — blocked on Apple Developer membership. iOS coverage = build, boot, UI verification on simulators.
- Tablet/desktop layouts — PRD NG4/NG5 (phone-first). iPads only get a does-not-crash smoke check.
- Telegram, sharing, print, calendar-sync channel — removed/omitted by stakeholder decisions.
- Physical-device push delivery timing (cron E2E) — covered by the Phase 5 exit criteria, not repeatable per-run.

## 2. References

- `docs/native-apps/PRD.md` — requirement IDs used in the Trace column (CAL-*, ST-*, SQ-*, SET-*, X-*, N-*, FR-*, UX-*).
- `docs/native-apps/QA-COMPARISON.md` — the resolved parity register; regressions against FIXED rows are bugs.
- `flutter/.tasks/QA-25-decisions.md` — stakeholder rulings.
- Memory/tooling: single AVD `pixel_7`; `simctl` cannot inject taps → iOS UI flows are driven via `flutter run` + Dart MCP driver where possible, otherwise static screenshot verification.

## 3. Accepted deviations — do NOT report as bugs

These are deliberate, stakeholder-approved differences from the web (2026-07-14):

1. **No sharing anywhere** in the app (header button + event-sheet chip removed); web keeps its share UI.
2. **Filter button in the header** (web mobile has no filter entry point).
3. **Native push only** in Settings — no Web Push / Telegram / Calendar-Sync channel rows.
4. **3-way theme control** (system/light/dark) vs web's single toggle.
5. **Disabled month chevrons** at season bounds (web wraps); **month persistence** across tab switches (web resets to today).
6. **Print Calendar omitted** on phones.
7. Uppercase Greek strips tonos app-wide (matches browser `lang=el` behavior — this one matches web *rendering*, deviates from raw strings).

## 4. Test environments & device matrix

### 4.1 Android (functional + visual + widget)

| Config | How | Used for |
|---|---|---|
| **Default** — pixel_7 AVD, 1080×2400 @ 420dpi, Play services | native | Full functional pass, widget, pixel-perfect captures |
| **Old small phone** — `qa_nexus_one` AVD (Nexus One profile, 480×800 @ ~245dpi, 3.7") | real AVD, API 36 image | Worst-case small-screen sweep (M-*) |
| **Old mid phone** — `qa_nexus_5` AVD (Nexus 5 profile, 1080×1920 @ 480dpi, 5") | real AVD, API 36 image | 2013-class phone sweep |
| **Small phone** — 720×1600 @ 280dpi | `adb shell wm size 720x1600; wm density 280` on pixel_7 | Layout/truncation sweep |
| **Large/tall** — 1440×3120 @ 560dpi | `adb shell wm size 1440x3120; wm density 560` | Layout sweep |
| **Font scale 1.3** | `adb shell settings put system font_scale 1.3` | UX-3 dynamic type sweep |
| Reset | `wm size reset; wm density reset; font_scale 1.0` | after M-pass |

> **Older Android OS versions:** only API 36/37 system images are installed locally. The old-*hardware* profiles above run on the current OS. If old-OS coverage is wanted (app minSdk is Flutter's default), download e.g. `system-images;android-28` (~1.5 GB) and add an AVD — recorded as an optional matrix extension, not part of the default run.

Build: `flutter build apk --debug --dart-define=BACK4APP_APP_ID=… --dart-define=BACK4APP_JS_KEY=…` (values = the `VITE_` ones in `app/.env.local`; without them the push UI renders disabled). Drive UI with `adb shell input tap/swipe` (screenshots display at 0.833×: multiply displayed coords by 1.2).

### 4.2 iOS (build + visual)

| Simulator | Size class | Used for |
|---|---|---|
| **QA iPhone SE 3** (4.7", 750×1334, home button, iOS 26.5) | smallest supported iPhone | worst-case small-screen sweep |
| **QA iPhone 13 mini** (5.4", 1080×2340) | small notched | layout sweep |
| iPhone 17e | smallest current phone | layout sweep |
| iPhone 17 | mid | primary iOS visual pass |
| iPhone 17 Pro Max | largest | layout sweep |
| iPad (A16) | tablet | smoke: launches, no crash, usable (NG5 — no tablet layout expected) |

Build: `flutter build ios --simulator --debug` with the same dart-defines; install via `xcrun simctl install`, launch via `simctl launch`, capture via `simctl io screenshot`. Interactive flows via `flutter run -d <sim>` + Dart MCP `flutter_driver_command` when available.

### 4.3 Web ground truth

`cd app && npm run dev`, Playwright MCP at **390×844**. Same data source (site `events.json` is generated from the same `events.ts`).

### 4.4 Test data baseline (season 26/27, as of 2026-07-27)

- Played: 4 Poland friendlies (AKS 0–4, Korona 2–2, Radomiak 2–3, Termalica 1–1 with subs/lineups).
- Upcoming: Omonia 29 Maiou friendly (Aug 5, dated — drives countdown/widget/add-to-calendar), First Official Training meeting (Jul 31), full CFA First Division schedule with **TBD dates**.
- **No cup fixture with penalties, no volleyball match data yet** → covered by synthetic datasets (§4.5), not skipped.
- Record the exact `events.json` snapshot hash in the run report — data changes between runs.

### 4.5 Synthetic datasets (full-coverage fake data)

Live 26/27 data cannot exercise every scenario, so the suite ships fixture feeds in `flutter/test/fixtures/qa/` and injects them into the debug app (swap the on-device `events-cache.json` via `adb run-as com.redrebels.red_rebels_calendar`, then relaunch; restore afterwards). Datasets:

| Dataset | Contents | Unlocks |
|---|---|---|
| `qa-full-season.json` | Dense season: home+away played league matches (W/D/L), scorers with `(Πέναλτι)` annotations, bookings, lineups+subs both sides | D-01…D-06, E-03/05/06/07, side-attribution regression |
| `qa-cup-penalties.json` | Cup tie with `penalties: "1-3"`, cup chip | D-07, D-08 |
| `qa-volleyball.json` | Men's + women's volleyball with 3-0/3-1/3-2 set results, top scorers | D-09, E-04/08/09, blue treatments |
| `qa-upcoming-soon.json` | Matches kicking off in minutes/hours/days | C-14 cadence tiers, widget `12m`/`4h 12m`/`38d 4h`, L-03 |
| `qa-no-upcoming.json` | Only played events | L-10 widget empty state, list-view empty Upcoming |
| `qa-unknown-team.json` | Opponent with no crest asset / no i18n mapping | D-12 fallback, translation fallback |
| `qa-empty.json` | Empty events array | global empty states, no-crash |

Widget scenarios also use these (the widget reads the same cached snapshot; trigger a refresh, then check the launcher).

## 5. Automated gates (run first, every time)

| ID | Gate | Command | Pass criterion |
|---|---|---|---|
| G-01 | Static analysis | `cd flutter && flutter analyze` | 0 issues |
| G-02 | Unit + widget tests | `cd flutter && flutter test` | all green (incl. `qa_*_parity_test.dart`, `visual_theme_test.dart`, `home_widget_test.dart`) |
| G-03 | Android compile | debug APK builds | success |
| G-04 | iOS compile | `flutter build ios --simulator` | success |

---

## 6. Scenario catalogue

Severity on failure: **P1** breaks design/function · **P2** clearly visible/incorrect · **P3** nit — same scheme as the QA register.

### A. App shell & chrome

| ID | Scenario | Steps | Expected | Trace |
|---|---|---|---|---|
| A-01 | Cold launch to calendar | Launch fresh install | Splash → calendar grid on current month, today pre-selected; < 3 s on emulator | CAL-5, FUN-01 |
| A-02 | Status bar | All 4 tabs, light + dark | Red theme-color status bar, light icons in both modes | GLB-01 |
| A-03 | Header — calendar tab | Observe | Red brand title (never truncated), circular buttons: view switcher, theme toggle, filter funnel; **no share** | GLB-02/03, §3.1–2 |
| A-04 | Header — stats/squad/settings | Navigate to each | Circular back button before the title on non-calendar pages; back returns to calendar | GLB-04 |
| A-05 | Theme toggle semantics | Tap toggle in light mode | Icon shows **current** state (sun when light, moon when dark), web semantics | GLB-03 |
| A-06 | Bottom nav | Cycle all 4 tabs | 10px uppercase condensed labels, red active state; active tab persists content state | X-5 |
| A-07 | Background | All pages, light + dark | Stadium photo `mobile.webp` + gradient overlay; light overlay NOT washed out; only calendar grid + stats get frosted panels (not list/cards/settings) | GLB-05/06 |
| A-08 | Back gesture/button | Android system back from stats → calendar; back on calendar | Navigates to calendar; back on calendar exits (no dead loop) | UX-1 |

### B. First-run onboarding tour

| ID | Scenario | Steps | Expected | Trace |
|---|---|---|---|---|
| B-01 | Tour appears once | Fresh install (or clear data), launch | 7-step tour starts; centered dialog styling matching web | CAL-10, FUN-02 |
| B-02 | Tour content EN | Step through all 7 | Steps match web copy verbatim; progress indicator; Next/Back/Skip work | FUN-02 |
| B-03 | Tour content EL | Clear data, set Greek, relaunch | All 7 steps in Greek, verbatim from `el.json`, no clipping | X-1, UX-5 |
| B-04 | Tour dismissal persists | Finish tour, kill app, relaunch | Tour does not reappear | CAL-9 |
| B-05 | Tour skip | Clear data, skip at step 1 | Tour closes, never reappears | FUN-02 |

### C. Calendar

| ID | Scenario | Steps | Expected | Trace |
|---|---|---|---|---|
| C-01 | Grid anatomy | Current month | Mon-first grid, match-day dots in sport colors (red football, blue volleyball — women's volleyball also blue), today red-outlined, selected day pink fill + red text | CAL-1, GLB-07 |
| C-02 | Leading/trailing days | Month with offset start | Leading previous-month cells **blank**; trailing next-month days grayed | CAL-01 |
| C-03 | Today pre-selection | Open app on current month | Today selected by default; its events (or empty state) listed below grid | CAL-07 |
| C-04 | Day selection | Tap a match day | Pink fill; event card(s) below with correct sport chip, title, score/kickoff | CAL-1 |
| C-05 | Empty month | Navigate to a fixture-less month | Grid renders, no dots, empty-state below | UX-6 |
| C-06 | Month nav — chevrons | Prev/next across several months | Correct month labels; chevrons **disabled** at Aug 2026 / Aug 2027 season bounds | CAL-4, §3.5 |
| C-07 | Month nav — swipe | Swipe left/right on grid | Pages animate to next/prev month, header follows | CAL-4 |
| C-08 | View switcher cycle | Tap header view button ×3 | grid → list → cards → grid; icons match web glyph set | CAL-2/3, CAL-05 |
| C-09 | View persistence | Set cards view, kill app, relaunch | Cards view restored | CAL-9 |
| C-10 | Month preserved on view switch | Go to +2 months, switch grid→list→grid | Visible month unchanged | CAL-08 |
| C-11 | Month persistence across tabs | Browse to another month, visit Stats, return | Same month still shown (app deviation, ACCEPTED) | §3.5 |
| C-12 | List view anatomy | List view, month with played + upcoming | Played/Upcoming sections; score left, sport label, WIN/LOSS pill, Home/Away · venue, upcoming rows show date block + yellow kickoff time; slate borders (volleyball rows blue-tinted never red) | CAL-2, CAL-04 |
| C-13 | Cards view anatomy | Cards view | Date, sport chip, title, big score (played) / countdown (upcoming), footer; no giant frosted wrapper panel | CAL-3, GLB-05 |
| C-14 | Live countdown ticks | Cards/list with upcoming dated fixture | Countdown text in web format, ticks down in real time (observe ≥1 min) | CAL-6 |
| C-15 | TBD-date fixtures | Find a TBD league fixture | Renders without crash; no bogus countdown; kickoff shown as TBD-equivalent (compare web) | UX-6 |
| C-16 | Filters — sport | Header funnel → toggle a sport off | Grid dots/list/cards hide that sport everywhere; filter state visible | CAL-8 |
| C-17 | Filters — location | Home only / Away only | Correct subset in all 3 views | CAL-8 |
| C-18 | Filters — status | Played / Upcoming | Correct subset | CAL-8 |
| C-19 | Filters — opponent search | Type partial opponent (EN + EL) | Matching fixtures only; diacritic/case-insensitive like web | CAL-8, X-1 |
| C-20 | Filters combine + clear | Sport+location+search together, then clear | AND semantics; clear restores all | CAL-8 |
| C-21 | Filter persistence | Set filter, switch tabs, return | Matches web behavior (verify against web ground truth) | CAL-8 |

### D. Event details sheet

| ID | Scenario | Steps | Expected | Trace |
|---|---|---|---|---|
| D-01 | Played football — win/loss tint | Open played match | Sheet surface tinted by result (pale green win / pale red loss, gradient); filled WIN/LOSS pill | EVT-01/07 |
| D-02 | Sheet header | Same | Fixture title, team crests + VS, large colored score, competition label `LEAGUE NAME · MATCHDAY N` | EVT-03/05 |
| D-03 | Chips row | Same | Kickoff-time chip ⏰, venue pill 📍, ✈️ Away chip when away; **no share chip, no date line** | EVT-02, §3.1 |
| D-04 | Goalscorers tab | Played match with scorers | Per-team layout (home left / away right), minute + ball inline; `(Πέναλτι)`-style annotations render translated | EVT-04 |
| D-05 | Bookings / Lineups / Subs tabs | Cycle tabs | Compact left-aligned tabs (not full-width); data matches events feed (Termalica friendly has subs) | EVT-11 |
| D-06 | Match report | Match with report | Report section renders | CAL-7 |
| D-07 | Cup match label + chip | Open cup fixture *(N/A if none in feed)* | League name + yellow 🏆 Cup chip, not `CUP · MATCHDAY` | EVT-03 |
| D-08 | Penalties | Cup shootout fixture *(N/A if none)* | `Penalties: 1-3` in amber | EVT-06 |
| D-09 | Volleyball sheet | Open volleyball match | Title = fixture name; Sets table; Top Scorers tab; blue accents | EVT-05, ST-8 |
| D-10 | Upcoming fixture sheet | Open upcoming match | Countdown, kickoff chip, venue; no result pill/score | CAL-6/7 |
| D-11 | Opponent scout | Open scout tab/popover | Opponent form + head-to-head present | EVT-12 |
| D-12 | Crest fallback | Opponent without crest asset | Generic shield glyph (not letter avatar) | EVT-08 |
| D-13 | CTA visibility | Football sheet initial height | `VIEW ALL STATISTICS` visible without scrolling; navigates to Stats | EVT-09 |
| D-14 | Sheet chrome | Any sheet | No Material drag handle; close X present; drag-down dismisses | EVT-10 |

### E. Stats

| ID | Scenario | Steps | Expected | Trace |
|---|---|---|---|---|
| E-01 | Sport selector | Stats page | Wrapping pill buttons (active solid red), full labels never truncated | STA-01 |
| E-02 | Section design + order | All tabs | Frosted panel, uppercase condensed headings, bordered stat tiles; section order = web | STA-02 |
| E-03 | Season summary — football | Football tab | 3×3 tile grid, label above value, red Points; **no** W%/Difference extras | STA-03/08 |
| E-04 | Season summary — volleyball | Both volleyball tabs | Hero Win Rate / Points tiles | STA-03 |
| E-05 | Recent form | All tabs | `Last 5 Matches` subtitle; W/D/L chips match feed data | ST-3, STA-09 |
| E-06 | Performance split | All tabs | Home/Away emoji tiles with colored `12W 2D 0L` counts (no progress bars) | ST-4, STA-05 |
| E-07 | Head-to-head | All tabs | Header band, uppercase columns, yellow Draw column | ST-5, STA-10 |
| E-08 | Top scorers — volleyball | Volleyball tabs | Avatar pill rows, #1 red border + red count, no match counts | ST-6, STA-06 |
| E-09 | Set breakdown | Volleyball tabs | Sets Won/Lost bars + three win-scoreline tiles (3-0/3-1/3-2, red counts) | ST-8, STA-04 |
| E-10 | FotMob standings | Football tab, online | League Standing table(s) render with Nea Salamina highlighted | ST-7, STA-07 |
| E-11 | FotMob rankings + scorers | Football tab, online | League Rankings tiles + football Top Scorers | STA-07 |
| E-12 | FotMob graceful degrade | Airplane mode → Stats football | Unavailable banner (web model); local-computed stats still render | UX-6, FR-OFFLINE-1 |
| E-13 | Zero-state season | 26/27 pre-season: league sections | Sensible zero/empty states, no NaN/crash (friendlies-only data) | UX-6 |
| E-14 | Stats CTA round-trip | Event sheet → View All Statistics | Lands on correct sport tab | EVT-09 |

### F. Squad

| ID | Scenario | Steps | Expected | Trace |
|---|---|---|---|---|
| F-01 | Roster grouping | Squad tab | GK/DEF/MID/FWD sections with counts; rows: #, avatar, bilingual name, M/G/C columns; slate borders | SQ-1, SQD-01 |
| F-02 | Photo fallback | Player without photo | Silhouette fallback | SQ-3 |
| F-03 | Player sheet | Tap player | Portrait, season stats grid (GOALS subtitle on one line), expandable match log; close X | SQ-2, SQD-02/03 |
| F-04 | Match log data | Compare a player's log | Rows equal web for same player | SQ-2 |
| F-05 | Squad in Greek | Greek pass | Greek names primary, no truncation | X-1 |

### G. Settings

| ID | Scenario | Steps | Expected | Trace |
|---|---|---|---|---|
| G-05 | Page structure | Settings tab | Chip-styled section labels, white cards, colored rounded icon tiles per row; no giant frosted wrapper | SET-01 |
| G-06 | Notifications master toggle | Toggle on | OS permission prompt (first time); toggle sticks; single native-push channel only | SET-1, FR-NOTIF-1, §3.3 |
| G-07 | Reminder tiers | Toggle 24/12/2/1h combinations | Persisted; survives restart | SET-2, FR-NOTIF-3 |
| G-08 | Per-sport opt-in | Toggle sports | Persisted | SET-3 |
| G-09 | Alert types | new/time change/score toggles | Persisted | SET-4 |
| G-10 | Notification preview | Expand preview block | Sample notifications render, localized | SET-04, SET-10 |
| G-11 | Back4App registration | Enable push, then check `PushSubscription`/`NotifPreference` via Parse REST | Row written with FCM token, platform field; prefs match UI (error-142 regression guard) | FR-NOTIF-2 |
| G-12 | Sports filter (global) | Toggle Football off | Calendar, stats tabs, squad respect it; persisted | SET-05 |
| G-13 | Tools — Export Calendar | Tap export | Hosted ICS feed hand-off (share/open intent); no Print row | SET-06, §3.6 |
| G-14 | Add to calendar | From upcoming event sheet | System calendar insert flow with 2h default reminder | N-4, FR-CAL-ADD-1 |
| G-15 | Language row | Change EN→EL | Row with value + chevron (web pattern); instant app-wide relanguage; persists | SET-7, FR-I18N-2 |
| G-16 | System-locale default | Clear data, device locale el-GR, launch | App starts in Greek | FR-I18N-2 |
| G-17 | Dark mode 3-way | system/light/dark each | Correct mode applied incl. following system; persists | SET-8, §3.4 |
| G-18 | Visual theme picker | Select each of 4 themes | Applied instantly; persists across restart | SET-9 |
| G-19 | About | Observe | `v1.0.0`-style version from package info, GitHub link opens | SET-11, SET-09 |

### H. Greek language pass (repeat key screens with EL)

| ID | Scenario | Expected | Trace |
|---|---|---|---|
| H-01 | Uppercase tonos | All uppercase Greek stripped of tonos (`ΕΙΔΟΠΟΙΗΣΕΙΣ` not `ΕΙΔΟΠΟΙΉΣΕΙΣ`) — headings, nav, pills, result pills | GRK-01 |
| H-02 | No mid-word wraps | `Γλώσσα` and other labels never break mid-word next to controls | GRK-02 |
| H-03 | Longer-string layouts | Calendar rows, stats tiles, settings rows absorb longer EL strings without clip/ellipsis where web doesn't | UX-5 |
| H-04 | Team names | Opponents in Greek everywhere (calendar, sheets, stats, scout) | FR-I18N-3 |
| H-05 | Dates/months | Month headings + date blocks localized | X-1 |

### I. Dark mode + visual themes (visual pass matrix)

Capture each of the 4 key screens (calendar grid, list, stats, settings) in every cell; compare to web.

| ID | Theme | Checks beyond tokens | Trace |
|---|---|---|---|
| I-01 | Default light/dark | Dark bg `#0a1810`, card `#1a0f0f`; nav/card token colors | X-5 |
| I-02 | Brutalism | Flat square corners everywhere, 2px borders, marquee ticker animates, full brand title fits | THM-01/02/08 |
| I-03 | Cinema | Inter body font, two-tone brand title, plain non-circular header buttons, **animated** gradient blobs | THM-03/04 |
| I-04 | Neon | Cyan active nav tab with glow, white panel behind HUD brackets, techno/mono day numerals, pink-filled today, **animated** scanlines, Orbitron month heading with glow | THM-05/06/07 |
| I-05 | Theme × mode × language | Spot-check each theme in dark + one Greek screen per theme | X-1 |

### J. Offline & data refresh

| ID | Scenario | Steps | Expected | Trace |
|---|---|---|---|---|
| J-01 | Offline cold start | Airplane mode → force-stop → launch | Full season browsable from cached snapshot; no hang (< 3 s to frame) | FR-OFFLINE-1, FUN-01 |
| J-02 | Stale indicator | Same | Subtle stale-data indicator shown after failed refresh | FR-OFFLINE-2 |
| J-03 | Refresh on foreground | Online again, background → foreground | Feed refetched; indicator clears | FR-OFFLINE-2 |
| J-04 | Live-feed swap | (If feasible) point at changed feed | New data appears without reinstall | Phase 4 exit |
| J-05 | First-install offline | Clear data, airplane mode, launch | Bundled `events.json` renders (no empty app) | FR-OFFLINE-1 |

### K. Push & notifications (Android)

| ID | Scenario | Steps | Expected | Trace |
|---|---|---|---|---|
| K-01 | Permission flow | Fresh install → enable notifications | OS prompt; deny → toggle reflects denial gracefully; allow → enabled | FR-NOTIF-1 |
| K-02 | Token registration | After enable | FCM token row in Back4App (see G-11) | FR-NOTIF-2 |
| K-03 | Test push render | Local send via `fcm-sender.js` + service-account JSON | Notification renders title/body; tap deep-links to the match | FR-NOTIF-4 |
| K-04 | Disable cleanup | Toggle off | `disabled` flag set (row not orphaned) | FR-NOTIF-5 |

### L. Android home-screen widget (Phase 9)

| ID | Scenario | Steps | Expected | Trace |
|---|---|---|---|---|
| L-01 | Add widget | Long-press home → widgets → Red Rebels | Widget lists with preview; placeable | N-2 |
| L-02 | Content | Observe | Next dated fixture: opponent, crests, kickoff, diagonal design (17° raked panel + seam) | N-2 |
| L-03 | Countdown format + tick | Observe across a re-render | Web `useCountdown` cadence: `38d 4h` / `4h 12m` / `12m`; updates without opening app | CAL-6 |
| L-04 | Sport treatment | Next fixture volleyball (or force via data) | Panel flips to volleyball blue | N-2 |
| L-05 | Deep link | Tap widget | App opens to the relevant match/calendar | FR-NOTIF-4 analog |
| L-06 | Resize | Resize to min and max grid sizes | Canvas background re-renders cleanly, no stretched diagonal, text fits | N-2 |
| L-07 | Localization | Switch app to Greek, trigger widget update | Pre-localized strings + per-language countdown unit letters | X-1 |
| L-08 | Dark mode | Toggle system dark | Widget surface adapts (or stays per design) — compare approved design | N-2 |
| L-09 | Data refresh survival | Refresh feed in app, return home | Widget shows updated fixture; survives reboot of launcher process | Phase 9 exit |
| L-10 | No-upcoming state | (If data allows / stub) | Sensible empty state, no crash | UX-6 |

### M. Screen sizes & font scale (Android `wm`, iOS device set)

Repeat this reduced sweep per size config: calendar grid, list, cards, event sheet, stats football, squad, settings, widget (Android), tour step 1.

| ID | Config | Checks |
|---|---|---|
| M-01 | 720×1600 @ 280dpi | No RenderFlex overflow stripes, no clipped headers/pills, sheet CTA still initially visible, nav labels fit |
| M-02 | 1440×3120 @ 560dpi | Same; no over-stretched hero tiles |
| M-03 | font_scale 1.3 | Text scales without overlap/clip; settings rows grow, don't truncate |
| M-04 | iPhone 17e | Same checklist as M-01 |
| M-05 | iPhone 17 Pro Max | Same as M-02 |
| M-06 | iPad (A16) smoke | Launches, usable, no crash (phone layout acceptable per NG5) |

### N. Pixel-perfect visual protocol

For each key screen: app screenshot (default config) vs web at 390×844, same data, same language/theme/mode.

1. Capture pairs for: calendar grid / list / cards, event sheet (played + upcoming), stats (football + one volleyball), squad, player sheet, settings, tour dialog — × {EN light} baseline, then the I-matrix variants.
2. Normalize widths and overlay/diff (visual inspection + `magick compare` where geometry allows; emulator DPR differences mean **structural** pixel-perfection: spacing, radii, borders, colors, typography, alignment — not literal pixel equality across DPRs).
3. Any delta not in §3 accepted list → finding with severity.

### O. iOS-specific

| ID | Scenario | Expected | Trace |
|---|---|---|---|
| O-01 | Build + install + launch | No crash on all 3 simulators, iOS 26.5 | G-04 |
| O-02 | Key-screen visual pass | Same rendering as Android (Flutter parity) — calendar, stats, squad, settings, sheets | X-5 |
| O-03 | Safe areas | Notch/home-indicator: header and bottom nav respect insets on 17 Pro Max + 17e | UX-1 |
| O-04 | Push UI state | Notifications section present; enabling without APNs entitlement degrades gracefully (no crash) | SET-1 (blocked) |
| O-05 | Locale default | Simulator set to el-GR → app in Greek | FR-I18N-2 |
| O-06 | iOS widget | **Blocked** (Apple membership) — record as SKIPPED | N-2 |

### P. Performance & stability

| ID | Scenario | Expected | Trace |
|---|---|---|---|
| P-01 | Cold start timing | Force-stop → launch ≤ ~1.5–3 s to first frame on emulator (Firebase init capped at 5 s) | FUN-01 |
| P-02 | Degraded network launch | Emulator network throttled: no splash hang > 5 s | FUN-01 |
| P-03 | Month-swipe jank | Rapid swiping: no dropped-frame stutter or blank pages | CAL-4 |
| P-04 | Sheet open/close stress | Open/dismiss 10 sheets quickly: no leak/crash | CAL-7 |
| P-05 | Logcat sweep | After the full pass: no uncaught exceptions/Flutter errors in logcat | — |

---

## 6b. Findings → tasks protocol

Every failure or suspicious behavior found during a run becomes **its own task** (harness task list), at creation time, with:

- Title `BUG <severity>: <one-line defect>` (or `DATA`/`PERF` prefix).
- Description: surface, exact repro steps, expected vs actual, environment (device, build, locale/theme), and a web-ground-truth caveat when parity needs confirming.
- **Evidence attached by path**: screenshots and, for interactive bugs, an `adb screenrecord` clip. All artifacts live in `docs/native-apps/test-runs/<date>/` (`shots/`, `*.mp4`) so they survive the session and are browsable in the IDE.
- Findings also land in the run report's register with their task number.

## 6c. Re-runnable test suite

All scripted workflows are codified so any run is one command, no Claude required:

```
flutter/
  integration_test/            # scenario-ID-tagged Flutter integration tests
    calendar_test.dart         # C-*: views, nav, filters, persistence
    event_sheet_test.dart      # D-*: sheets incl. synthetic cup/volleyball data
    stats_squad_test.dart      # E-*/F-*
    settings_i18n_test.dart    # G-*/H-*: language, dark, themes, prefs persistence
    tour_test.dart             # B-*
  test/fixtures/qa/            # §4.5 synthetic datasets
  tool/qa/
    run-suite.sh               # orchestrator: boot device(s) → build → gates →
                               #   integration tests per device → device-level passes
    device-pass.sh             # adb-only flows: widget add/verify, airplane mode,
                               #   wm-size sweep, font-scale, cold-start timing, screenshots
    inject-dataset.sh          # push a §4.5 fixture as the app's events cache (debug run-as)
    collect-artifacts.sh       # pull screenshots/videos into docs/native-apps/test-runs/<date>/
```

- `run-suite.sh --android [avd]` / `--ios [sim]` / `--all`; `--dataset qa-cup-penalties` to pin a fixture.
- Integration tests run on **both platforms** via `flutter test integration_test -d <device>` — this is how iOS gets driven despite simctl's no-tap limit.
- The suite prints a scenario-ID pass/fail table; screenshots land in the artifacts dir.

## 7. Exit criteria

- G-01…G-04 green.
- Zero P1 findings; P2s triaged (fix or explicitly accept); P3s logged.
- All Must-priority scenario groups (A–D, E core, G push/language/dark, J, K, L) executed on Android; O-01/02/03 on iOS at 3 sizes.
- Visual N-protocol deltas limited to §3 accepted deviations.
- Run report committed as `TEST-RUN-<date>.md` with screenshot index.

## 8. Known execution constraints

- `simctl` cannot inject taps — iOS interactive flows need `flutter run` + Dart MCP driver; otherwise iOS is verified statically per screen (navigation done via deep links/relaunch where possible).
- Reminder-delivery timing (cron) is not tested per-run; K-03 uses a direct FCM send instead.
- The emulator AVD set has no small-screen device — `wm size/density` emulation is the accepted stand-in.
- Off-season data gaps: penalties/cup scenarios may be N/A until 26/27 cup fixtures land.
