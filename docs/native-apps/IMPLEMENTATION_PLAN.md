# Flutter App Parity — Implementation Plan

| Field | Value |
|---|---|
| **Scope** | Bring the Flutter app (`flutter/`) to full design + feature parity with the web app's mobile view |
| **Basis** | Parity audit of 2026-07-10 (Flutter code vs `app/` mobile view vs [PRD](./PRD.md) §7 matrix) |
| **Stack decision** | Flutter is the accepted stack for the native apps (supersedes the TRD's KMP recommendation — see TRD §2 addendum) |
| **Design baseline** | The web app **mobile view** is the visual ground truth. Where this conflicts with PRD UX-1 ("native conventions first"), the web design wins. |
| **Status** | Phase 1 in progress |

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

- Share match (native share sheet), add-to-calendar via native calendar APIs, Telegram deep link, short native first-run intro, GitHub link in About.
- Optional / decide later: FotMob league table, analytics, the three alternate visual themes (PRD priority: Could).

**Exit criteria:** PRD Should-rows closed; store-launch prep (listings, screenshots, privacy labels) can begin as its own track.

---

## Sizing & sequencing notes

- Relative size: P1 ≈ P2 > P3 ≈ P4; **P5 is the largest** (backend + both platforms + physical devices); P6 is many small items.
- Phases 1–3 require **no backend changes**.
- Phases 1+2 alone resolve the "exact same design and structure" gap for the surfaces that exist today.
- Each phase ships as one or a few PRs; `flutter analyze` + `flutter test` green is the merge bar, plus the phase's exit criteria.
