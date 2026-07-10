# Product Requirements Document — Red Rebels Native Apps (Android & iOS)

| Field | Value |
|---|---|
| **Product** | Red Rebels Calendar — Native mobile apps (Android + iOS) |
| **Parent product** | Red Rebels Calendar web PWA (`red-rebels.com`) — Nea Salamina (Νέα Σαλαμίνα) fan club |
| **Document** | Product Requirements Document (PRD) |
| **Status** | Draft v1 — for review |
| **Author** | Generated investigation (GodMode) |
| **Date** | 2026-06-11 |
| **Companion** | [TRD.md](./TRD.md) — Technical Requirements |
| **Decision context** | Drivers: iOS push reliability, native UX/perf, **sponsor/club mandate**, store presence. Approach: **truly native** (see §4.2). Scope: **parity + native extras**. Resourcing: **solo / volunteer**. |

---

## 1. Executive Summary

The Red Rebels Calendar is a mature React 19 + TypeScript PWA serving fans of Nea Salamina's football and volleyball teams in Limassol/Cyprus. It already delivers a 3-view match calendar, full statistics suite, squad roster, web-push + Telegram reminders, offline support, and bilingual (English/Greek) UX, backed by Parse/Back4App and a Cloudflare Worker.

This PRD defines the product requirements for shipping **native Android and iOS apps** that reach **feature parity** with the web app **plus native-only enhancements** (reliable push, home-screen widgets, iOS Live Activities, system calendar integration). The apps will share the existing backend unchanged — the same Parse classes, the same reminders cron, the same Telegram bot — so the club operates **one backend, three clients**.

The primary business driver is a **sponsor/club mandate** for a real, listed app on the App Store and Google Play. Secondary drivers are notification reliability on iOS (where PWA web push is constrained) and a more polished, native experience. Because the project is maintained **solo/volunteer**, the over-arching product constraint is **sustainability**: maximize what is built once and shared, minimize per-platform duplication, and phase delivery so value ships early.

---

## 2. Background & Current State

### 2.1 What exists today (the parity baseline)

The web app (`app/`) ships four primary surfaces:

1. **Calendar** — three view modes (grid / list / cards), month navigation (buttons, swipe, keyboard), live countdown to kickoff, event detail sheet (score, scorers, bookings, lineups, subs, volleyball sets, match report), filters (sport / location / status / opponent search), and a 7-step onboarding tour.
2. **Stats** — three sport tabs (men's football, men's volleyball, women's volleyball) with season summary, recent form, performance splits, head-to-head, top scorers, league table & rankings (football via FotMob), and volleyball set breakdowns.
3. **Squad** — men's football roster grouped by position, with per-player detail (portrait, season stats, full match log).
4. **Settings** — notification channels (web push / Telegram / calendar-subscribe), reminder tiers (24/12/2/1h), per-sport opt-in, alert types (new matches / time changes / score updates), language toggle (EN/EL), dark mode, four visual themes, .ics export, print, PWA install.

### 2.2 Why native (validated drivers)

| Driver | What the PWA can't fully deliver | Native answer |
|---|---|---|
| **Sponsor/club mandate** | A discoverable, branded listing on the two app stores | Real App Store + Play Store presence |
| **iOS push reliability** | iOS PWA web push requires home-screen install and is constrained/inconsistent | First-class APNs notifications |
| **Native UX/performance** | WebView/PWA feel, no widgets, no Live Activities | SwiftUI/Compose UI, widgets, Live Activities |
| **Store presence** | Install friction; not findable by searching the stores | Store search, ratings, install funnel |

> The build-vs-skip question was evaluated (see [§3](#3-rationale--alternatives-considered)). With a sponsor mandate present, store apps are a committed requirement, so this PRD assumes "build" and focuses on *how to scope it sustainably*.

---

## 3. Rationale & Alternatives Considered

This section records the engineering challenge so the decision is auditable.

| Option | Summary | Verdict |
|---|---|---|
| **A. Two fully-separate native apps** (independent Kotlin + Swift) | Maximum platform fidelity | **Rejected as default** — triples maintenance for a solo maintainer; domain logic (event model, stats, ICS, reminder windows, Greek↔English mapping) would be written twice |
| **B. Truly-native UI on a shared core (KMP)** | 100% native SwiftUI/Compose UI on a shared Kotlin Multiplatform core for logic/networking | **Recommended** — satisfies "truly native" (the UI users see/feel is native), avoids App Store Guideline 4.2 wrapper risk, writes domain logic once |
| **C. PWABuilder / TWA wrapper** | Thin wrapper of the PWA | **Rejected** — high risk of App Store Guideline 4.2 rejection; weak iOS story |
| **D. Stay PWA only** | Improve install + iOS push | **Rejected** — does not satisfy the sponsor mandate |

**Product decision:** Build native apps using **Option B** as the technical strategy that fulfills the stakeholder's "truly native" intent sustainably. Option A remains documented as a fallback in the TRD. The full technical justification, with citations, is in [TRD §2](./TRD.md#2-architecture-decision).

> **⚠️ Decision update (2026-07-10):** Implementation proceeded in **Flutter** and the stakeholder accepted Flutter as the stack (single Dart codebase for both platforms, `flutter/`). Option B is superseded — see the TRD §2 addendum. Two product-level consequences: the **web app's mobile view is the design ground truth** (overriding UX-1's "native conventions first" where they conflict), and delivery now follows [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) instead of §10's phasing. The parity matrix in §7 remains the authoritative scope.

---

## 4. Goals, Non-Goals & Constraints

### 4.1 Goals

- **G1.** Ship a native Android app (Google Play) and native iOS app (App Store) for the Nea Salamina fan club.
- **G2.** Achieve feature parity with the current web app across Calendar, Stats, Squad, and Settings.
- **G3.** Deliver reliable native push notifications (APNs + FCM) reusing the existing reminders pipeline.
- **G4.** Add high-value native-only features that justify the app over the PWA (widgets, iOS Live Activities, system calendar add).
- **G5.** Preserve full bilingual (EN/EL) support and the club's visual identity.
- **G6.** Keep the architecture sustainable for a **single volunteer maintainer** (one shared core, phased delivery).

### 4.2 Stakeholder-Defined Constraints

- **C1 — Truly native.** The stakeholder requires native apps, not a WebView wrapper. Interpreted as: **native UI (SwiftUI/Jetpack Compose) on each platform**, which is fully satisfied by the shared-core architecture (the shared layer is invisible Kotlin logic, not UI).
- **C2 — Solo/volunteer resourcing.** All scope, phasing, and effort estimates assume one part-time maintainer. This is the dominant constraint and the reason parity is phased rather than big-bang.
- **C3 — Shared backend, unchanged.** The native apps must reuse the existing Parse/Back4App backend, Cloudflare Worker, Telegram bot, and reminders cron. No backend rewrite.

### 4.3 Non-Goals (this release)

- **NG1.** No backend migration off Back4App/Cloudflare.
- **NG2.** No user accounts/login (the app is anonymous; preferences are device-scoped, matching today).
- **NG3.** No paid features, in-app purchases, or e-commerce.
- **NG4.** No live ticker for sports the web app doesn't already cover; no new data sources.
- **NG5.** No tablet-optimized or desktop (macOS/Windows) layouts in v1 (phone-first, matching the PWA's mobile-first design).
- **NG6.** No editing of `events.ts` data model or scraper behavior (data remains scraper-generated).

---

## 5. Target Users & Personas

| Persona | Description | Primary needs |
|---|---|---|
| **The match-day fan** (primary) | Cyprus-based Nea Salamina supporter, follows football + volleyball, mostly Greek-speaking | Knows when/where the next match is; reliable reminders; quick score check |
| **The diaspora fan** | Greek/Cypriot abroad, follows from afar, mixes EN/EL | Reminders in their timezone; stats; calendar sync |
| **The stats enthusiast** | Wants form, standings, top scorers, head-to-head | Rich, fast stats; squad detail |
| **The sponsor/club stakeholder** | Wants a credible, branded presence in the stores | A polished, findable, well-rated app |

**Locale & device assumptions:** Primarily Greek + English speakers; phone-first; mixed Android/iOS with meaningful iOS share (hence the iOS push driver). Network can be intermittent → offline-first matters.

---

## 6. Success Metrics (KPIs)

| Metric | Target (first 6 months post-launch) |
|---|---|
| Store presence | Live, approved listings on both stores in EN + EL |
| Install base | Migrate a meaningful share of existing PWA/Telegram users to native |
| Push opt-in rate | ≥ web app baseline; iOS opt-in materially higher than PWA web-push |
| Notification reliability | ≥99% of reminders delivered within the tier window (measured via `ReminderLog`) |
| Crash-free sessions | ≥99.5% (both platforms) |
| Store rating | ≥4.3★ average |
| Maintenance load | A new shared feature ships to both apps from **one** core change + thin UI per platform |

---

## 7. Scope — Feature Parity Matrix

Priority uses MoSCoW: **M**ust / **S**hould / **C**ould / **W**on't (this release).

### 7.1 Calendar

| # | Feature | Web today | Native priority | Notes |
|---|---|---|---|---|
| CAL-1 | Month calendar grid with match indicators | ✅ | **M** | Native calendar component per platform (see TRD §8) |
| CAL-2 | List view (played / upcoming) | ✅ | **M** | |
| CAL-3 | Cards view (rich match cards) | ✅ | **S** | Can follow grid + list in MVP |
| CAL-4 | Month navigation (prev/next, swipe, keyboard) | ✅ | **M** | Swipe is native gesture; keyboard N/A on phone |
| CAL-5 | Auto-scroll/jump to today | ✅ | **M** | |
| CAL-6 | Live countdown to kickoff | ✅ | **M** | Native timer; powers widget/Live Activity later |
| CAL-7 | Event detail sheet (score, scorers, bookings, lineups, subs, sets, report) | ✅ | **M** | Native bottom sheet |
| CAL-8 | Filters: sport / location / status / opponent search | ✅ | **M** | |
| CAL-9 | View-mode persistence | ✅ | **M** | Native local storage |
| CAL-10 | Onboarding tour (7 steps) | ✅ | **C** | Re-imagine as a short native first-run intro |

### 7.2 Stats

| # | Feature | Web today | Native priority | Notes |
|---|---|---|---|---|
| ST-1 | Three sport tabs (football, vb-men, vb-women) | ✅ | **M** | |
| ST-2 | Season summary | ✅ | **M** | Computed in shared core |
| ST-3 | Recent form + streaks | ✅ | **M** | |
| ST-4 | Performance split (home/away) | ✅ | **S** | |
| ST-5 | Head-to-head | ✅ | **S** | |
| ST-6 | Top scorers | ✅ | **M** | |
| ST-7 | League table & rankings (FotMob) | ✅ | **S** | Depends on FotMob fetch; degrade gracefully |
| ST-8 | Volleyball set breakdown | ✅ | **M** | |
| ST-9 | Charts/visualizations | ✅ | **C** | Swift Charts / Vico (native) |

### 7.3 Squad

| # | Feature | Web today | Native priority | Notes |
|---|---|---|---|---|
| SQ-1 | Roster grouped by position | ✅ | **S** | Men's football currently |
| SQ-2 | Player detail (portrait, season stats, match log) | ✅ | **S** | |
| SQ-3 | Player photos with silhouette fallback | ✅ | **S** | Reuse existing `/images/players/*` assets |

### 7.4 Settings & Notifications

| # | Feature | Web today | Native priority | Notes |
|---|---|---|---|---|
| SET-1 | Enable/disable push (native APNs/FCM) | ✅ (web push) | **M** | Replaces web push; see TRD §7 |
| SET-2 | Reminder tiers (24/12/2/1h) | ✅ | **M** | Same `NotifPreference` schema |
| SET-3 | Per-sport opt-in | ✅ | **M** | |
| SET-4 | Alert types (new / time change / score) | ✅ | **M** | |
| SET-5 | Telegram link/unlink | ✅ | **S** | Deep-link to existing bot; backend unchanged |
| SET-6 | Add to system calendar (.ics today) | ✅ | **S** | Native EventKit / CalendarContract (better than .ics) |
| SET-7 | Language toggle EN/EL | ✅ | **M** | Native localization + system locale |
| SET-8 | Dark mode | ✅ | **M** | Follow system + manual override |
| SET-9 | Visual themes (default/brutalism/cinema/neon) | ✅ | **C** | Nice-to-have; default theme is **M** |
| SET-10 | Notification preview | ✅ | **C** | |
| SET-11 | About / version / repo link | ✅ | **S** | |

### 7.5 Cross-cutting

| # | Feature | Web today | Native priority | Notes |
|---|---|---|---|---|
| X-1 | Bilingual EN/EL (incl. Greek tone-sensitive copy) | ✅ | **M** | Reuse `i18n/*.json` via generation (TRD §10) |
| X-2 | Offline viewing of fixtures/stats | ✅ (SW cache) | **M** | Local cache/DB (TRD §12) |
| X-3 | Share match (native share sheet) | ✅ (Web Share) | **S** | |
| X-4 | Analytics (GA/Clarity) | ✅ | **C** | Native SDK or Firebase; must be privacy-disclosed |
| X-5 | Brand identity (logos, colors, icons) | ✅ | **M** | Reuse existing assets/manifest colors |

### 7.6 Native-only enhancements (the "+ extras")

| # | Feature | Priority | Notes |
|---|---|---|---|
| N-1 | **Reliable native push** (APNs + FCM) | **M** | Core justification; reuses cron (TRD §7) |
| N-2 | **Home-screen widget** — next match / countdown | **S** | iOS WidgetKit, Android Glance |
| N-3 | **iOS Live Activities** — live match score on lock screen / Dynamic Island | **C** | Headline iOS differentiator; iOS 16.1+; broadcast push (iOS 18+) |
| N-4 | **Add-to-calendar** via EventKit / CalendarContract | **S** | Better UX than downloading .ics |
| N-5 | **App shortcuts / quick actions** (Next match, Settings) | **C** | |
| N-6 | **Standings/score widget** | **C** | |

---

## 8. Detailed Functional Requirements (selected)

> The matrix in §7 is the authoritative scope. This section expands the requirements that carry product nuance.

### 8.1 Notifications (FR-NOTIF)

- **FR-NOTIF-1:** On first launch (or via Settings), the app requests OS notification permission and registers a device token (APNs token on iOS, FCM token on Android).
- **FR-NOTIF-2:** The app persists notification preferences to the **same `NotifPreference` schema** the web app uses (`reminderHours`, `enabledSports`, `notifyNewEvents`, `notifyTimeChanges`, `notifyScoreUpdates`, `disabled`), so a user's choices are consistent and the existing cron honors them.
- **FR-NOTIF-3:** Reminder tiers (24/12/2/1h), per-sport opt-in, and alert types must match the web app's semantics exactly. No new tiers without a season-config change.
- **FR-NOTIF-4:** Notification payloads (title/body/deeplink) must render consistently across web, Android, iOS. Tapping a notification deep-links into the relevant match.
- **FR-NOTIF-5:** If the OS reports the token invalid/unregistered, the backend must clean it up (mirrors the existing 410/404 web-push cleanup).

### 8.2 Localization (FR-I18N)

- **FR-I18N-1:** All UI strings available in EN and EL, sourced from the existing `i18n/en.json` / `i18n/el.json` (converted, not re-translated — Greek copy is tone-sensitive and must be carried over verbatim).
- **FR-I18N-2:** Language follows system locale by default (Greek device → Greek), with a manual override in Settings persisted locally (matching web behavior).
- **FR-I18N-3:** Team-name translation (Greek→English key→display) is a **data concern** handled in the shared core, not in platform string files.

### 8.3 Offline (FR-OFFLINE)

- **FR-OFFLINE-1:** The full season's fixtures and computed stats are viewable offline (last-synced snapshot).
- **FR-OFFLINE-2:** The app refreshes data on launch/foreground when online; stale data is shown with a subtle indicator if a refresh fails.

### 8.4 Calendar add (FR-CAL-ADD)

- **FR-CAL-ADD-1:** Users can add an individual match (or all upcoming matches) to the system calendar via native APIs, with a default 2h reminder (matching the web .ics behavior), respecting OS calendar permissions.

---

## 9. UX & Design Requirements

- **UX-1 — Native conventions first.** Use platform-idiomatic navigation (iOS tab bar / SwiftUI navigation; Android bottom navigation / Material 3). Do not port web layouts pixel-for-pixel where it fights platform norms.
- **UX-2 — Brand consistency.** Preserve the Red Rebels identity: red (`#E02520`) and dark green (`#0a1810`) accents, existing logo/icon set, the four sports' emoji/iconography. Reuse `manifest.webmanifest` colors and the existing icon assets as the source for adaptive/app icons.
- **UX-3 — Accessibility.** Meet platform a11y baselines: VoiceOver/TalkBack labels, Dynamic Type / font scaling, sufficient contrast, focus order on sheets. (The web app already invests here; carry the intent over.)
- **UX-4 — Dark mode.** Follow system appearance with a manual override; default visual theme is required, the three alternate visual themes are optional.
- **UX-5 — Bilingual layout.** Greek strings are longer than English in places — layouts must not truncate or clip (test EL early).
- **UX-6 — Empty/error/offline states.** Every data surface needs explicit empty, loading, and error states (the web app's FotMob-unavailable banner is the model).

---

## 10. Release Plan & Phasing

Phasing is deliberately incremental to fit a solo maintainer and to ship value early. Each phase is independently releasable (internal/TestFlight/Internal Testing track before public).

| Phase | Theme | Includes | Exit criteria |
|---|---|---|---|
| **P0** | Foundation | Shared core (models, networking, stats, ICS, translate, reminder logic), repo/CI scaffolding, backend REST client, device-token store | Core unit-tested; both app shells compile & talk to backend |
| **P1** | Android MVP | Calendar (grid+list), event detail, native push, Settings (notifications + language + dark) | Android internal build delivers reminders reliably |
| **P2** | iOS MVP | Same scope as P1 on iOS, APNs push | iOS TestFlight build delivers reminders reliably |
| **P3** | Parity | Stats, Squad, cards view, filters, calendar-add, themes, full Settings | Feature matrix "M/S" complete on both platforms |
| **P4** | Native extras | Widget (next match/countdown), EventKit/CalendarContract, app shortcuts, iOS Live Activities | At least one shipped native-only feature per platform |
| **P5** | Store launch | Store listings (EN+EL), privacy labels/data-safety, screenshots, review, public release | Both apps approved & live |

> **Note on calendar time:** As a part-time solo effort, each phase spans weeks, not days. The TRD provides engineering-effort estimates; multiply by your realistic availability for calendar dates.

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Solo maintainer burnout / divergence** (3 codebases drifting) | High | High | Shared KMP core → write logic once; phase delivery; keep visual themes optional |
| App Store **Guideline 4.2** rejection (perceived as a web wrapper) | Medium | High | Truly-native UI + native push + widgets/Live Activities + offline; no WebView |
| **Push setup complexity** (APNs .p8, FCM service account, cron extension) | Medium | Medium | Reuse existing cron; document secrets; one transport at a time (FCM first, then APNs) |
| **iOS Parse SDK is dormant** | Medium | Medium | Avoid the iOS Parse SDK; use Parse REST via shared Ktor client (TRD §6) |
| **Store fees & accounts** ($99/yr Apple, $25 Google) | Low | Low | Confirm sponsor/club covers fees and owns the developer accounts |
| **events.ts plain-JS constraint** broken by a future change | Low | High | Don't touch the data pipeline; native apps consume data, not generate it |
| **Localization regressions** in Greek copy | Medium | Medium | Auto-generate strings from `i18n/*.json`; never hand-retranslate; flag to user |
| **Notification consistency** across 3 clients | Medium | Medium | Standardize payload shape server-side; shared message builder |

---

## 12. Assumptions & Open Questions

**Assumptions (proceed unless corrected):**
- The sponsor/club will own and fund the Apple Developer Program ($99/yr) and Google Play ($25 one-time) accounts.
- Bundle/application IDs follow a convention like `com.redrebels.calendar` (to be confirmed with the club's domain ownership).
- The existing Back4App plan supports the added device-token volume and (optionally) Parse Push, or push is sent from the cron directly.
- No user accounts are required; preferences remain device-scoped/anonymous as today.

**Open questions for the stakeholder:**
1. Who legally owns the developer accounts and app identity (club entity vs individual)? This affects store ownership and transfer risk.
2. Is **Telegram** still a required channel in the native app, or is native push expected to supersede it for app users (bot stays for non-app users)?
3. Are the three **alternate visual themes** (brutalism/cinema/neon) important enough to port, or is the default theme sufficient for v1?
4. Is **iOS Live Activities** (live in-match score) a "wow" feature the sponsor wants prioritized, or a later enhancement?
5. Should analytics (GA/Clarity) be carried into native, or replaced by a privacy-lighter solution (impacts privacy labels)?

---

## 13. Appendix — Source of Truth

- Feature parity is derived from the live web app (`app/src/pages/*`, `components/*`, `i18n/*.json`).
- Technical feasibility, architecture, and citations are in the companion **[TRD.md](./TRD.md)**.
- Domain rules (sports enum, season config, name mapping, `events.ts` constraints) are governed by the existing `CLAUDE.md` and `app/src/data/CLAUDE.md` — native apps consume these, they do not redefine them.
