# PWA-Parity QA — Findings Register

> Phase 2 deliverable of [QA-PARITY-HANDOFF.md](./QA-PARITY-HANDOFF.md). One row per
> verified difference between the installed PWA (ground truth) and the Flutter app,
> captured side-by-side on the same emulator.

| Field | Value |
|---|---|
| **Environment** | Android emulator `pixel_7` (1080×2400), Chrome-installed PWA (`red-rebels.com`, standalone) vs credentialed debug APK built from `main` (post-PR #82) |
| **Baseline** | English · light · onboarding dismissed · reference month April 2026 (July 2026 = empty month, October 2025 = penalties cup tie) |
| **Capture date** | 2026-07-14 |
| **Severity** | P1 breaks design/function · P2 clearly visible · P3 nit |
| **Classification** | BUG (fix app to match web) · NEEDS-STAKEHOLDER-DECISION (copying impossible or arguably wrong) · WEB-BUG (web is wrong; needs sign-off before touching `app/`) |
| **Status** | OPEN → FIXED (commit/PR) or ACCEPTED (stakeholder) |

Fix batches (Phase 3, one branch/PR each): **calendar** (GLB/CAL/EVT), **stats** (STA),
**squad** (SQD), **settings** (SET), **themes** (THM), **functional-gaps** (FUN + rows
marked *Phase 8/10*). Greek rows (GRK) ride with the batch that owns the affected surface.

## Global chrome

| ID | Area | State | Difference (web → app) | Severity | Classification | Status |
|---|---|---|---|---|---|---|
| GLB-01 | status bar | all pages, both modes | Web keeps the red `theme-color` status bar with light icons in light *and* dark; app draws a background-colored status bar with dark icons | P2 | BUG | FIXED (PR #84) |
| GLB-02 | header | all pages | App adds a 4th header button (filter funnel). Web mobile header has exactly three (view/share/theme); web's FilterPanel only opens via keyboard shortcut — mobile web users have **no** filter entry point | P2 | DECIDED 2026-07-14: **keep the app's filter button; remove ALL sharing from the app** (header button + event-sheet chip); web unchanged | ACCEPTED — removal shipped in PR #84 |
| GLB-03 | header | all pages | Theme-toggle icon semantics inverted: web icon shows the *current* state (moon when dark), app shows the *target* state (moon when light) | P2 | BUG | FIXED (PR #84) |
| GLB-04 | header | Stats & Squad pages | Web shows a circular back button before the title on non-calendar pages; app never renders one | P2 | BUG | FIXED (PR #84) |
| GLB-05 | page container | list/cards views, settings | App wraps every page in one large frosted rounded panel. Web only panels the calendar grid and stats; list/cards rows and settings cards sit directly on the background | P2 | BUG | FIXED (PR #84) |
| GLB-06 | background | all pages, light | App's light-mode overlay over `mobile.webp` is far lighter (heavy white haze, washed out); web keeps the photo darker and richer | P2 | BUG | FIXED (PR #84) |
| GLB-07 | sport colors | grid dots, list labels, cards chips, everywhere | Women's volleyball rendered purple `#9C27B0` in app; web renders **all** volleyball blue (dots, labels, chips) | P1 | BUG (previously accepted deviation, reopened per exact-copy criterion) | FIXED (PR #84) |

## Calendar

| ID | Area | State | Difference (web → app) | Severity | Classification | Status |
|---|---|---|---|---|---|---|
| CAL-01 | grid | all months | App renders leading previous-month day numbers (grayed); web leaves leading cells blank (both show trailing next-month days grayed) | P2 | BUG | FIXED (PR #84) |
| CAL-02 | month nav | season boundaries | App disables the chevrons at Aug 2025 / Aug 2026; web wraps within the season | P3 | DECIDED 2026-07-14: keep the app's disabled chevrons | ACCEPTED |
| CAL-03 | month nav | tab switch | Web resets to the current month when re-entering the Calendar tab; app preserves the last browsed month | P3 | DECIDED 2026-07-14: keep the app's month persistence | ACCEPTED |
| CAL-04 | cards/list rows | light | Event-card and row borders are red-tinted in app; web uses `border-slate-200` / `dark:border-slate-800` (volleyball cards blue-tinted) | P2 | BUG (previously accepted deviation, reopened) | FIXED (PR #84) |
| CAL-05 | header view icon | list/cards | App's view-switcher glyphs differ from the web's icon set (list/cards icons) | P3 | BUG | FIXED (PR #84) |
| CAL-06 | day-selected cards | grid + selection | Minor: app card paddings/title truncation point differ slightly (title cuts later than web) | P3 | BUG | FIXED (PR #84) |
| CAL-07 | grid selection | current month | Web pre-selects today when viewing the current month (`findDefaultDay`); app started with no selection | P3 | BUG (found during the fix batch) | FIXED (PR #84) |
| CAL-08 | view switch | grid ↔ list/cards | Switching views snapped the visible month back to the initial month (PageController re-attach); month now preserved | P2 | BUG (app-only, found during the fix batch) | FIXED (PR #84) |

## Event sheet

| ID | Area | State | Difference (web → app) | Severity | Classification | Status |
|---|---|---|---|---|---|---|
| EVT-01 | sheet surface | played events | Web tints the whole sheet by result (pale green win / pale red loss, gradient to bottom); app sheet is plain white/dark | P1 | BUG | FIXED (PR #84) |
| EVT-02 | chips row | all sheets | Web shows kickoff-time chip (`⏰ 18:30`, `🕐 90+3'`), venue pill (`📍 …`), yellow `🏆 Cup` chip, `✈️ Away` chip and share; app shows only `🚌 Away` + share, renders the venue as plain text, and adds a date line the web sheet doesn't have | P2 | BUG | FIXED (PR #84) |
| EVT-03 | competition label | cup matches | Web prints the league name (`CYPRUS 2ND DIVISION · MATCHDAY 1`) plus the Cup chip; app prints `CUP · MATCHDAY 1` and no chip | P2 | BUG | FIXED (PR #84) |
| EVT-04 | goalscorers tab | played football | Web lays scorers out per team side (home left / away right, minute + ball inline); app renders a single left-aligned list with minutes right | P2 | BUG | FIXED (PR #84) |
| EVT-05 | sheet title | volleyball | Web titles the sheet with the fixture (`NEA SALAMIS VS AEL`); app always says `MATCH RESULT` | P3 | BUG | FIXED (PR #84) |
| EVT-06 | penalties | cup shootout | Web renders `Penalties: 1-3` in amber; app in gray | P3 | BUG | FIXED (PR #84) |
| EVT-07 | result pill | all sheets | Web WIN/LOSS pill is filled with a pale tint; app pill is outlined on white | P3 | BUG | FIXED (PR #84) |
| EVT-08 | opponent logo fallback | teams without crest | Web shows a generic shield glyph; app shows a letter avatar in a pink circle | P3 | BUG | FIXED (PR #84) |
| EVT-09 | CTA | football sheets | Web shows `VIEW ALL STATISTICS` inside the initial sheet height; app requires expanding/scrolling to reach it | P3 | BUG | FIXED (PR #84) |
| EVT-10 | sheet chrome | all sheets | App adds a Material drag handle; web has none. App sheet lacks the web's close X on player sheets (present on event sheets) | P3 | BUG | FIXED (PR #84) |
| EVT-11 | tabs | football sheets | App tabs stretch full-width (Material TabBar); web tabs are compact and left-aligned | P3 | BUG | FIXED (PR #84) |
| EVT-12 | opponent scout | event sheet | Web has an opponent-scout popover tab (opponent form + head-to-head); app has nothing | P2 | BUG — *Phase 10* (functional-gaps batch) | FIXED (PR #93) |

## Stats

| ID | Area | State | Difference (web → app) | Severity | Classification | Status |
|---|---|---|---|---|---|---|
| STA-01 | sport selector | stats page | Web uses wrapping pill buttons (active solid red); app uses a Material TabBar with emoji icons whose labels truncate (`Men's Volleybal`, `Women's Volley`) | P2 | BUG (previously accepted, reopened) | FIXED (PR #86) |
| STA-02 | section design | all tabs | Web sections sit on the frosted panel with uppercase condensed headings and bordered stat tiles; app renders white Material cards with sentence-case bold headings. Section order also differs | P1 | BUG | FIXED (PR #86) |
| STA-03 | season summary | football + volleyball | Web: 3×3 tile grid (label above value, red Points) for football; hero `Win Rate` / `Points` tiles for volleyball. App: uniform rows inside one card and adds `W%` / `Difference` stats the web doesn't show | P2 | BUG | FIXED (PR #86) |
| STA-04 | set breakdown | volleyball tabs | Web: Sets Won/Lost horizontal bars + three win-scoreline tiles (3-0/3-1/3-2, red counts); app: six numeric tiles including loss scorelines, no bars | P2 | BUG | FIXED (PR #86) |
| STA-05 | performance split | all tabs | Web: Home/Away emoji tiles with colored `12W 2D 0L` counts; app ("Home vs Away"): progress bars with percentages and `14P 12W 2D 0L · 27-6` strings | P2 | BUG | FIXED (PR #86) |
| STA-06 | top scorers | volleyball (local data) + football (FotMob) | Web: avatar pill rows, #1 highlighted with red border + red count, no match count; app: plain numbered list with `points / matches` | P2 | BUG (volleyball fixable now; football list arrives with Phase 8) | FIXED (PR #86 volleyball; PR #94 football via FotMob) |
| STA-07 | FotMob blocks | football tab | Missing in app: League Standing tables (Promotion Group / 2. Division), League Rankings tiles, football Top Scorers, Next Match banner | P2 | BUG — *Phase 8* (functional-gaps batch) | FIXED (PR #94 — standings/rankings/top scorers; Next Match is not rendered by the web either, so not ported) |
| STA-08 | extra sections | football + volleyball | App renders `Records`, `Season Progress` (football) and `Records` (volleyball) — the web stats tabs render neither | P2 | BUG (remove for exact copy; flag if stakeholder wants to keep) | FIXED (PR #86) |
| STA-09 | recent form | all tabs | Web shows a `Last 5 Matches` subtitle under the heading; app omits it | P3 | BUG | FIXED (PR #86) |
| STA-10 | head-to-head | football + volleyball | Web table has a header band, uppercase column headers and yellow Draw column; app has plain sentence-case headers and unstyled D column | P3 | BUG | FIXED (PR #86) |

*Not findings:* goal-distribution chart and the volleyball streaks card (plan Phase 10 items)
are **not rendered by the web mobile stats tabs either** — no parity difference exists today.

## Squad

| ID | Area | State | Difference (web → app) | Severity | Classification | Status |
|---|---|---|---|---|---|---|
| SQD-01 | roster rows / stat tiles | squad + player sheet | Borders red-tinted in app; web uses slate borders | P3 | BUG | FIXED (PR #87) |
| SQD-02 | player sheet | stat tiles | App `GOALS` subtitle (`2 open · 0 pen · 0 OG`) wraps to two lines (narrower tile); web keeps one line | P3 | BUG | FIXED (PR #87) |
| SQD-03 | player sheet | chrome | Web has a close X; app only the drag handle | P3 | BUG | FIXED (PR #87) |

## Settings

| ID | Area | State | Difference (web → app) | Severity | Classification | Status |
|---|---|---|---|---|---|---|
| SET-01 | page structure | settings | Web: chip-styled section labels + white cards with colored rounded icon tiles per row; app: one frosted panel, plain rows, thin dividers, bare icons | P1 | BUG | FIXED (PR #88) |
| SET-02 | notification channels | settings | Web lists three channels (Web Push, Telegram Bot, Calendar Sync, each with a description); app has a single `Notifications — Match Reminders` toggle | P2 | DECIDED 2026-07-14: "only native push notifications on the flutter app — anything else can be removed" | ACCEPTED |
| SET-03 | calendar sync | settings | Web `Calendar Sync — auto-sync to your calendar app` channel missing in app (Phase 6 shipped only per-match add-to-calendar) | P2 | DECIDED 2026-07-14: dropped per the SET-02 "native push only" ruling — no sync channel in the app; Export Calendar (SET-06) still lands via QA-21 | ACCEPTED |
| SET-04 | notification preview | settings | Web has an expandable `NOTIFICATION PREVIEW` block; app has none | P2 | BUG — *Phase 10* (functional-gaps batch) | FIXED (PR #93) |
| SET-05 | sports filter | settings | Web `SPORTS FILTER` section (Football / Volleyball global toggles); app has none | P2 | BUG — *Phase 10* (functional-gaps batch) | FIXED (PR #93) |
| SET-06 | tools | settings | Web `TOOLS` card: Export Calendar + Print Calendar; app has neither | P2 | BUG for Export Calendar (functional-gaps); Print DECIDED 2026-07-14: omit on phones | FIXED (PR #93 — export via the hosted ICS feed; Print omitted by decision) |
| SET-07 | language control | settings | Web: `Language` row with value + chevron; app: inline segmented `English / Greek` control | P2 | BUG | FIXED (PR #88) |
| SET-08 | dark theme control | settings | Web: single toggle; app: 3-way segmented control (system / light / dark) | P2 | DECIDED 2026-07-14: keep the app's 3-way control | ACCEPTED |
| SET-09 | about | settings | Web shows `v1.0.0`; app shows `1.0.0` | P3 | BUG | FIXED (PR #88) |

## Greek

| ID | Area | State | Difference (web → app) | Severity | Classification | Status |
|---|---|---|---|---|---|---|
| GRK-01 | uppercase accents | all Greek uppercase text | App keeps tonos on uppercase (`ΕΙΔΟΠΟΙΉΣΕΙΣ`, `ΡΥΘΜΊΣΕΙΣ`, `ΝΊΚΗ`); browsers with `lang=el` drop it (`ΕΙΔΟΠΟΙΗΣΕΙΣ`) | P2 | BUG — DECIDED 2026-07-14: strip tonos on uppercase app-wide (QA-15) | FIXED (PR #88) |
| GRK-02 | settings labels | Greek settings | `Γλώσσα` wraps mid-word (`Γλώσσ / α`) next to the segmented control; web never breaks the word | P2 | BUG | FIXED (PR #88) |

## Visual themes

| ID | Area | State | Difference (web → app) | Severity | Classification | Status |
|---|---|---|---|---|---|---|
| THM-01 | brutalism | calendar + settings | App keeps rounded corners on cards/buttons/chips; web brutalism is flat and square | P2 | BUG | FIXED (PR #90) |
| THM-02 | brutalism | header/nav borders | App ported only colors; web uses 2px borders (app ~1px) | P3 | BUG (known deviation, reopened) | FIXED (PR #90) |
| THM-03 | cinema | all pages | Cinema typography not applied in app (web: Inter body, two-tone brand title, plain non-circular header buttons); app looks identical to default theme. Inter is already bundled — port is trivial | P2 | BUG (known deviation, reopened) | FIXED (PR #90) |
| THM-04 | cinema | background | Web animated ambient gradient blobs; app static | P3 | BUG — DECIDED 2026-07-14: port the animation (QA-17) | FIXED (PR #90) |
| THM-05 | neon | bottom nav | Web active tab is cyan with glow; app active tab stays red | P2 | BUG | FIXED (PR #90) |
| THM-06 | neon | calendar grid | Web keeps a white panel behind the HUD brackets; app draws the grid straight on the page background. Day numerals also use a techno/mono face in app vs plain sans on web; today-cell is filled pink on web vs red outline in app | P3 | BUG | FIXED (PR #90) |
| THM-07 | neon | scanlines | Static in app vs animated-feel CSS on web | P3 | BUG — DECIDED 2026-07-14: animate (QA-18) | FIXED (PR #90) |
| THM-08 | brutalism/cinema/neon | header brand | App brand title truncates (`Red Rebels Cal…`) under the wide-tracking theme fonts; web fits the full title | P2 | BUG | FIXED (PR #90) |

## Functional / behavior

| ID | Area | State | Difference (web → app) | Severity | Classification | Status |
|---|---|---|---|---|---|---|
| FUN-01 | cold start | force-stop + flaky network | App hung ~90 s on the splash screen once after force-stop with degraded emulator network — suspected blocking launch sync. Web shell paints immediately from SW cache | P2 | BUG (PLAUSIBLE — reproduce & verify against the HTTP layer's cache fallback) | FIXED (PR #92 — not reproducible under 4 degraded-network shapes, 1.4-1.5s cold starts; Firebase init capped at 5s as the only unbounded pre-frame await) |
| FUN-02 | first-run intro | fresh install | App: 3-page dialog; web: 7-step anchored tour | P2 | BUG — DECIDED 2026-07-14: build the anchored tour, "as detailed as possible in both languages" (QA-26) | OPEN |
| FUN-03 | share output | header/sheet share | Not yet compared (native share sheet intercepts) | P3 | DECIDED 2026-07-14: all sharing removed from the app (see GLB-02) — nothing left to compare | ACCEPTED (moot) |

## Verified equal (no finding)

- Month swipe navigation; today highlight (red outline); day-selection (pink fill, red text)
- View / theme / language persistence across app restart
- List-view row anatomy (score, sport label, WIN/LOSS, Home/Away · venue, upcoming date block, yellow kickoff time)
- Cards-view card anatomy (date, sport chip, title, big score, footer)
- Sets table in volleyball sheets; goalscorer data itself; player-sheet stats & match log values
- Squad section grouping (GK/DEF/MID/FWD with counts, M/G/C columns)
- Brutalism marquee ticker; neon HUD corner brackets; Orbitron month heading with glow
- Dark-mode token colors on nav/cards (Phase 7 spot-fix holding)

## Untestable while the season is over

Upcoming-event cards with live countdowns, reminder delivery timing, notification content
(both platforms idle equally — re-verify when 2026-27 fixtures land).
