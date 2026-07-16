# Flutter App Parity — Implementation Plan

| Field | Value |
|---|---|
| **Scope** | Bring the Flutter app (`flutter/`) to full design + feature parity with the web app's mobile view |
| **Basis** | Parity audit of 2026-07-10 (Flutter code vs `app/` mobile view vs [PRD](./PRD.md) §7 matrix) |
| **Stack decision** | Flutter is the accepted stack for the native apps (supersedes the TRD's KMP recommendation — see TRD §2 addendum) |
| **Design baseline** | The web app **mobile view** is the visual ground truth. Where this conflicts with PRD UX-1 ("native conventions first"), the web design wins. |
| **Status** | Phases 1–8 + 10 delivered (incl. the 2026-07-14→16 exact-copy QA sweep, PRs #84–#97, register 100% resolved); Phase 9 Android widget delivered — iOS widget + iOS push (P5 PR 2) blocked on Apple Developer membership |

Audit summary that drives this plan: of the PRD's 44 parity-matrix rows the Flutter app implemented 15, partially covered 7, and missed 22 — including 5 Must-priority rows (all notifications) — and its visual design was generic Material 3 rather than the web app's design language.

---

## Phase 1 — Design system & app shell

**Goal:** every screen uses the web app's visual language; no generic Material 3 remains.

- Bundle **Barlow** + **Barlow Condensed** fonts (OFL); condensed uppercase for headings, nav labels, section titles.
- Port the exact token set from `app/src/index.css`: light + dark palettes (dark bg `#0a1810`, card `#1a0f0f`, red-alpha borders), sport colors (`#E02520` football, `#2196F3` volleyball men, `#9C27B0` volleyball women), result colors (`#4CAF50`/`#FFC107`/`#F44336`), radius scale.
- **Stadium-photo background** (`mobile.webp`) with gradient overlay; translucent "frosted" panels for calendar/stats containers.
- **4-tab bottom nav** (Calendar / Statistics / Squad / Settings — Squad is a placeholder until Phase 3): 10px uppercase condensed labels, red active state, matching the web `BottomNav`.
- Global header matching the web `MobileHeader`: red brand title, circular buttons — view switcher (calendar tab), share, theme toggle.
- Language default follows the **device locale** (FR-I18N-2); app version read from package info instead of hardcoded.
- PRD/TRD amended to record the Flutter stack decision.

**Exit criteria:** side-by-side screenshots of calendar grid, nav and header are indistinguishable from the web mobile view.

## Phase 2 — Calendar parity

**Goal:** all three views and the event sheet match the web exactly.

- Add **cards view**; view switcher cycles grid → list → cards, persisted.
- Rebuild list view with **Played / Upcoming** sections and the web's score-left row layout.
- Rebuild the event sheet to the web design: "Match Result" header, team logos + VS + result pill, large colored score, competition label, home/away chip + share, **tabbed sections** (Goalscorers / Bookings / **Lineups** / Subs; Sets / Top Scorers for volleyball), **match report**, "View All Statistics" CTA.
- Countdown lives in the upcoming-event card (web pattern); remove the invented full-width banner.

**Exit criteria:** every calendar flow (browse, filter, open played + upcoming events for both sports) matches the web screenshots.

## Phase 3 — Squad

**Goal:** the fourth tab has full parity.

- Export `app/src/data/players.ts` + player photos into Flutter assets (extend the `flutter/tool/` generator).
- Squad page: position sections (GK/DEF/MID/FWD) with counts; player rows (#, avatar with silhouette fallback, bilingual name, apps/goals/cards); player detail sheet (portrait, season stats grid, expandable match log).

**Exit criteria:** Squad matches the web page; stat aggregations equal the web's for the same data.

## Phase 4 — Connectivity & live data

**Goal:** fixtures stop being frozen at build time.

- Publish the generated `events.json` on the deployed site (web build-step addition).
- Flutter HTTP layer: refresh on launch/foreground, cache the last snapshot locally, stale-data indicator on failure (FR-OFFLINE-2).

**Exit criteria:** a score update on the site appears in the app without an app-store release; airplane mode still shows the last snapshot.

## Phase 5 — Push notifications *(largest phase; the PRD's core Must pillar)*

**Goal:** native reminders through the existing backend.

- FCM (Android) + APNs (iOS) token registration; tokens stored via Parse REST using the existing `NotifPreference` schema (FR-NOTIF-2).
- Full Settings notifications section: channel toggle, reminder tiers (24/12/2/1h), per-sport opt-in, alert types, notification preview.
- Extend the `.github/scripts` cron to fan out to FCM/APNs alongside web push + Telegram (reuse `lib/message-builder.js`), including invalid-token cleanup (FR-NOTIF-5).

**Exit criteria:** a reminder fires on physical Android + iOS devices from the real cron, honoring tier/sport preferences.

## Phase 6 — Tools & polish

- Share match (native share sheet), add-to-calendar via native calendar APIs, short native first-run intro, GitHub link in About.
- ~~Telegram deep link~~ — **dropped 2026-07-13 (stakeholder decision, resolves PRD §12 Q2):** native push supersedes Telegram inside the apps; the bot remains for non-app users via the web.

**Exit criteria:** PRD Should-rows closed; store-launch prep (listings, screenshots, privacy labels) can begin as its own track.

## Phase 7 — Visual themes *(stakeholder decision 2026-07-13: in scope, next after Phase 6)*

**Goal:** the web's three alternate visual themes — brutalism, cinema, neon — selectable in Settings, alongside default.

- Generalize `AppColors` from two palettes (light/dark) to theme-keyed sets (4 themes × 2 modes), token values ported exactly from `app/src/index.css`.
- Bundle Space Grotesk, JetBrains Mono, Orbitron (OFL, like Barlow).
- Structural widgets: Marquee ticker (brutalism), HudFrame corner brackets (neon), gradient background variant (cinema).
- Settings "Visual Theme" picker persisted like the web's `visual_theme`; per-theme widget tests.

**Exit criteria:** each theme matches its web mobile counterpart side-by-side; theme choice survives restart.

## Phase 8 — FotMob live stats

**Goal:** close the last big Stats-page parity gap — the web blocks powered by FotMob at runtime.

- League Table, League Rankings, football Top Scorers, Next Match banner, fetched from FotMob like `app/src/lib/fotmob.ts` (same caching intent), through the app's existing HTTP layer.
- Degrade gracefully exactly like the web (FR/UX-6): loading skeletons, unavailable-banner on failure, everything else still renders.

**Exit criteria:** football tab shows live standings/scorers when online; airplane mode shows the local-computed stats untouched.

## Phase 9 — Home-screen widget (PRD N-2, Should)

**Goal:** next-match/countdown widget on both platforms — the highest-value native extra.

- Android Glance widget + iOS WidgetKit extension reading the cached events snapshot; deep-links into the app.
- Ship after Phase 5 PR 2 (iOS push) unblocks, so the iOS work lands in one Xcode pass.

**Exit criteria:** widget shows the next fixture with countdown on both platforms and survives data refresh.

## Phase 10 — Small parity gaps (one batch PR)

- Opponent Scout section in the event sheet (web popover tab: opponent form + head-to-head).
- Global sports filter in Settings (persistent football/volleyball toggles filtering calendar, stats, squad — web `sport_filters` parity).
- Notification preview in Settings (sample notifications, web SET-10).
- Volleyball streaks card (logic already computed, never rendered).
- Goal distribution chart (last missing stats visualization).
- Calendar-feed subscription (webcal link / add-all-upcoming — complements Phase 6's single-match add).

**Exit criteria:** the PRD §7 matrix has no remaining unimplemented Must/Should rows besides externally-blocked items.

## Unscheduled / post-launch

- **iOS push (Phase 5 PR 2)** — externally blocked: Apple Developer membership + APNs `.p8` upload to Firebase; config + physical-device test once cleared.
- Analytics (X-4, Could — carries store privacy-label implications; decide before store submission).
- iOS Live Activities, app shortcuts, standings widget (PRD N-3/N-5/N-6, Could).
- Intentionally not applicable on mobile: print calendar, PWA install, keyboard shortcuts.

---

## Sizing & sequencing notes

- Relative size: P1 ≈ P2 > P3 ≈ P4; **P5 is the largest** (backend + both platforms + physical devices); P6 is many small items.
- Phases 1–3 require **no backend changes**.
- Phases 1+2 alone resolve the "exact same design and structure" gap for the surfaces that exist today.
- Each phase ships as one or a few PRs; `flutter analyze` + `flutter test` green is the merge bar, plus the phase's exit criteria.
