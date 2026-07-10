# Technical Requirements Document — Red Rebels Native Apps (Android & iOS)

| Field | Value |
|---|---|
| **Product** | Red Rebels Calendar — Native mobile apps |
| **Document** | Technical Requirements Document (TRD) |
| **Status** | Draft v1 — for review |
| **Date** | 2026-06-11 |
| **Companion** | [PRD.md](./PRD.md) — Product Requirements |
| **Audience** | The implementing engineer (solo/volunteer) |
| **Backend** | Unchanged: Parse/Back4App + Cloudflare Worker + GitHub Actions cron + Telegram bot |

> **Citations.** Architecture and platform claims below are backed by the reference research and the codebase audit conducted for this document. External URLs are inlined where the claim is non-obvious. Internal `path:line` references point at the existing repo.

---

## 1. Scope & Principles

This TRD specifies how to build **truly-native** Android and iOS apps reaching parity (+ native extras) with the Red Rebels web app, under a **solo-maintainer** constraint and a **no-backend-rewrite** rule.

**Engineering principles:**
1. **Write domain logic once.** Event model, season rules, reminder windowing, stats math, ICS generation, and Greek↔English name mapping are identical across platforms → shared core, not duplicated.
2. **Native UI per platform.** SwiftUI on iOS, Jetpack Compose on Android — no WebView (avoids App Store Guideline 4.2 wrapper rejection; see §16).
3. **Reuse the backend verbatim.** The Parse classes, the reminders cron, and the Telegram bot stay; we extend transports, we don't replace systems.
4. **Phase to ship value early.** Android MVP → iOS MVP → parity → extras → launch (PRD §10).

---

## 2. Architecture Decision

> **⚠️ Decision update (2026-07-10) — Flutter supersedes the KMP recommendation below.**
> Implementation proceeded in **Flutter** (`flutter/`), and the stakeholder confirmed Flutter as the accepted stack after review. §2.1–2.3 are retained for the decision record but are **no longer the plan of record**. Consequences of the change:
> - One Dart codebase replaces the `:shared` KMP module + SwiftUI + Compose split; domain logic (models, season rules, stats, name mapping) lives in `flutter/lib/{models,logic,data}`.
> - The UI is Flutter-rendered rather than platform widgets. The Guideline 4.2 analysis still holds (no WebView; Flutter apps are accepted on both stores) but the "100% native widgets" claim in §2.1 no longer applies.
> - The **web app's mobile view is the design ground truth** (stakeholder decision, overrides PRD UX-1 where they conflict).
> - Networking/push (§6–7) map to Flutter equivalents: Parse REST over `http`, `firebase_messaging` (FCM) + APNs. Backend plan is unchanged.
> - Delivery follows [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md), which replaces the §14 build order.

### 2.1 Recommendation: Kotlin Multiplatform (KMP) shared core + native UI *(superseded — see decision update above)*

**Decision:** Build a **Kotlin Multiplatform** shared module (`:shared`) containing models, networking, stats/ICS logic, and preference/reminder logic, consumed by:
- **Android:** Jetpack Compose UI (`:androidApp`) — Kotlin all the way down.
- **iOS:** SwiftUI UI (`iosApp`) consuming the shared module compiled to a native XCFramework via Kotlin/Native.

This is the canonical "shared logic, native UI" KMP pattern. KMP has been **Stable since 2023**, and explicitly supports keeping SwiftUI on iOS while sharing business logic ([kotlinlang.org/multiplatform](https://kotlinlang.org/multiplatform/), [KMP FAQ](https://kotlinlang.org/docs/multiplatform/faq.html)).

**Why this satisfies "truly native":** The UI the user sees and feels is 100% SwiftUI / Compose — genuine native widgets, native gestures, native push. The shared layer is invisible Kotlin logic compiled to a native framework on iOS. There is **no WebView**, so the Guideline 4.2 "repackaged website" risk does not apply.

**Why this fits a solo maintainer:** Shared business logic is "the default starting point — the risk is low, the payoff is immediate (one implementation instead of two for every feature), and the migration path is incremental" ([Batteries Included, 2026](https://batteriesincluded.io/insights/kotlin-multiplatform-and-compose-multiplatform)). The non-trivial domain logic (stats computation, reminder windowing, name mapping, ICS) is written and tested once.

### 2.2 Swift interop: use SKIE

Kotlin `suspend`/`Flow` map awkwardly into Objective-C headers consumed by Swift. Adopt **SKIE** (Touchlab compiler plugin): Kotlin `Flow` → Swift `AsyncSequence`, `suspend` → Swift `async`, sealed classes → Swift enums ([skie.touchlab.co](https://skie.touchlab.co/)). It is the lower-friction choice for a solo dev vs the more verbose KMP-NativeCoroutines.

### 2.3 Alternatives (documented, not chosen)

| Alternative | When it would win | Why not here |
|---|---|---|
| **Compose Multiplatform UI on iOS** (share UI too) | If you want one UI codebase and accept non-SwiftUI look | CMP iOS is production-ready since 1.8.0 (May 2025) and used by Netflix/Cash App, but its UI doesn't render as SwiftUI system components and the library ecosystem is younger ([JetBrains 1.8.0](https://blog.jetbrains.com/kotlin/2025/05/compose-multiplatform-1-8-0-released-compose-multiplatform-for-ios-is-stable-and-production-ready/)). For a fan app where iOS users expect native Settings/share/calendar feel, native SwiftUI is safer. *Pragmatic middle path:* native SwiftUI by default, drop CMP in for one complex shared screen (e.g. stats) if duplication hurts. |
| **Fully-separate native** (independent Kotlin + Swift, no KMP) | If you reject the Kotlin-on-iOS toolchain entirely | Doubles the domain-logic maintenance — the exact tax we're avoiding |

**Reference architectures to study:**
- **[Kotlin/kmp-production-sample](https://github.com/Kotlin/kmp-production-sample)** — official; ships on both stores with native SwiftUI + Compose UI on a shared core. Closest blueprint.
- **[android/kotlin-multiplatform-samples](https://github.com/android/kotlin-multiplatform-samples)** — Google's official samples (KMP ViewModel, Room, DataStore, Ktor).
- **[dbaroncelli/D-KMP-sample](https://github.com/dbaroncelli/D-KMP-sample)** — shared KMP ViewModel driving SwiftUI + Compose.
- **[terrakok/kmp-awesome](https://github.com/terrakok/kmp-awesome)** — curated library index.

---

## 3. System Context

```
                         ┌──────────────────────── Shared Backend (UNCHANGED) ───────────────────────┐
                         │                                                                            │
                         │  Back4App (Parse Server)                  Cloudflare Worker                │
                         │   • PushSubscription (web push)            • /api/telegram-webhook (POST)   │
                         │   • DeviceToken  (NEW: apns/fcm)           • (NEW) /api/register-token?     │
                         │   • NotifPreference (shared schema)        • SPA asset fallback             │
                         │   • TelegramSubscriber                                                      │
                         │   • ReminderLog (dedup)                   GitHub Actions cron (*/30 * * * *)│
                         │   • events.ts (scraper-generated)          • find matches in 25h window     │
                         │                                            • send: WebPush + Telegram        │
                         │                                            •   (NEW) + FCM + APNs            │
                         └───────────────────────────────▲──────────────────────────────────────────┘
                                                          │ HTTPS (Parse REST / Worker REST)
                  ┌───────────────────────────────────────┼───────────────────────────────────────┐
                  │                                        │                                       │
        ┌─────────▼─────────┐                   ┌──────────▼──────────┐                 ┌──────────▼──────────┐
        │   Web App (PWA)   │                   │   Android App       │                 │      iOS App        │
        │  React / SW       │                   │  Compose UI         │                 │   SwiftUI UI        │
        │  Web Push (VAPID) │                   │  + KMP :shared      │                 │   + :shared (XCFw)  │
        │                   │                   │  FCM token          │                 │   APNs token        │
        └───────────────────┘                   └─────────────────────┘                 └─────────────────────┘
```

**One backend, three clients.** The native apps add native push transports and a device-token record; everything else (preference schema, reminder logic, Telegram, scraper) is reused.

---

## 4. Technology Stack

| Layer | Android | iOS | Shared (`:shared`, Kotlin) |
|---|---|---|---|
| Language | Kotlin | Swift | Kotlin (commonMain) |
| UI | Jetpack Compose + Material 3 | SwiftUI | — |
| Navigation | Navigation-Compose | SwiftUI NavigationStack / TabView | — |
| Networking | — | — | **Ktor client** + kotlinx-serialization |
| Local persistence | DataStore (prefs) | UserDefaults | **SQLDelight** (cached events/stats) |
| Async/interop | Coroutines/Flow | async/await via **SKIE** | Coroutines/Flow |
| DI | Koin (or manual) | — | Koin (multiplatform) |
| Push | Firebase Cloud Messaging | APNs (UserNotifications + APNsToken) | token registration logic |
| Charts | Vico | Swift Charts (iOS 16+) | stat aggregates only |
| Calendar UI | [kizitonwose/Calendar](https://github.com/kizitonwose/Calendar) v2.9.0 | [airbnb/HorizonCalendar](https://github.com/airbnb/HorizonCalendar) | — |
| Widgets | Jetpack **Glance** | **WidgetKit** | shared "next match" provider logic |
| Build | Gradle (KMP plugin) | Xcode + Gradle (shared) | Gradle |

---

## 5. Shared Core Module (`:shared`) Specification

The shared module is where the solo-maintainer leverage comes from. Port these from the web `lib/`, which the audit confirmed are **pure** (no browser APIs):

| Shared component | Ported from | Responsibility |
|---|---|---|
| **Domain models** | `app/src/types/events.ts` | `SportEvent`, `CalendarEvent`, `Scorer`, `Booking`, `VolleyballSet`, stat types → Kotlin `data class` + kotlinx-serialization |
| **Stats engine** | `app/src/lib/stats.ts` | Football: results, form, streaks, H2H, clean sheets, splits |
| **Volleyball stats** | `app/src/lib/volleyball-stats.ts` | Sets, breakdowns, records, streaks, scorers |
| **ICS generation** | `app/src/lib/ics-core.ts` (pure) | Generate `.ics` strings for calendar export/subscribe |
| **Name translation** | `app/src/lib/translate.ts` (lookup tables) | Greek-uppercase → English key mapping (`GREEK_TO_TEAM_KEY`) |
| **Reminder logic** | `.github/scripts/send-reminders.js` (windowing) | 25h window, tiers `[24,12,2,1]`, `eventKey` derivation — for client-side preview/validation parity |
| **FotMob DTOs** | `app/src/lib/fotmob.ts` | Types for league table/scorers/rankings |
| **Backend client** | new | Ktor-based Parse REST + Worker REST client (§6) |
| **Season config** | `app/src/data/constants.ts`, `month-config.ts`, `sport-config.ts` | `SEASON_START_YEAR/END_YEAR`, month order/start-day, sport emoji/labels |

**Stays platform-specific (browser-coupled today, native-equivalent tomorrow):**

| Web (browser-coupled) | Native equivalent |
|---|---|
| `push.ts` (serviceWorker/PushManager) | FCM SDK (Android) / APNs registration (iOS) |
| `ics-export.ts` (Blob/download) | EventKit (iOS) / CalendarContract (Android) |
| `parse.ts` (UMD bundle) | Ktor REST client in `:shared` |
| `analytics.ts` (gtag/clarity) | Firebase Analytics / native SDK |

**Test strategy for the core:** port the web app's stat fixtures (sample `events` → expected stats) into `commonTest` so the shared engine is verified against the same expectations as the web app — guaranteeing numeric parity.

---

## 6. Backend Integration & Data Layer

### 6.1 Decision: Parse REST via Ktor (not the native Parse SDKs)

The audit and reference research converge on **avoiding the native Parse SDKs**:

- **iOS Parse-Swift is dormant.** `parse-community/Parse-Swift` is stalled at **v4.14.2 (Oct 2022)**. The actively maintained fork is **[netreconlab/Parse-Swift](https://github.com/netreconlab/Parse-Swift)** (v6.1.0, Feb 2026). Even so, an iOS-only SDK can't live in the shared `commonMain` module.
- **Parse-SDK-Android is healthy** (v4.4.0, Mar 2026) but is Android/Java-only — also incompatible with the shared core.

**Therefore:** implement **one Ktor client in `:shared`** that speaks the **Parse REST API** (Back4App fully supports it) using `X-Parse-Application-Id` + the appropriate key headers. This is the KMP "shared networking" pattern (Ktor is what the official Google samples use). It removes the iOS-fork dependency from the critical path and is unit-testable.

> If a native Parse Swift SDK is ever genuinely needed (e.g., LiveQuery), target **netreconlab/Parse-Swift**, never the dormant community repo.

### 6.2 What the apps read/write

| Parse class | App access | Auth | Notes |
|---|---|---|---|
| `events` data | **Read** (via Worker endpoint or bundled+refreshed) | n/a | Apps consume data; never generate `events.ts` |
| `NotifPreference` | **Read/Write** | JS/REST key (ACL public-read) | Same schema: `reminderHours`, `enabledSports`, `notifyNewEvents/TimeChanges/ScoreUpdates`, `disabled` (`app/src/lib/preferences.ts:3-19`) |
| `DeviceToken` (**NEW**) | **Write** (register), delete on logout | REST key via Worker | `{ platform: 'apns'\|'fcm', token, prefs pointer }` — the native analogue of `PushSubscription` |
| `TelegramSubscriber` | indirect (deep-link to bot) | n/a | Backend CRUD unchanged (`_worker.ts:60-115`) |
| `ReminderLog` | none (server-only) | master key (cron) | Dedup stays server-side |

### 6.3 Secrets posture (critical)

- **Never** ship the Parse **master key** or `BACK4APP_REST_API_KEY` in an app binary. The master key is GitHub-Actions-only today (`BACK4APP_MASTER_KEY`) and must stay there.
- Apps use only the **public-grade** App ID + JS/Client key (ACL-restricted), exactly as the web client does (`VITE_BACK4APP_APP_ID`, `VITE_BACK4APP_JS_KEY`).
- Any privileged write (e.g., registering a device token if you want REST-key protection) should go **through the Cloudflare Worker** (add an `/api/register-token` route that holds the REST key server-side), mirroring how the Worker already fronts Telegram CRUD with `BACK4APP_REST_API_KEY`.
- On-device, store nothing sensitive; use Keychain (iOS) / EncryptedSharedPreferences (Android) only if needed.

### 6.4 Event data delivery

The web app bundles `events.ts` at build time. For native, choose one (recommended: **B**):
- **A. Bundle a JSON snapshot** at app build + refresh from an endpoint. Simple, offline-first, but ties data freshness to app releases.
- **B. Fetch `events` JSON from a Worker endpoint** (expose the generated data as `/api/events.json` from the Worker's static assets — the `.ics` files are already served statically) and cache locally via SQLDelight. **Recommended:** decouples data freshness from app-store releases (important — store review latency must not gate fixture updates).

> **Constraint:** `events.ts` must remain plain-JS-parseable (the cron does `new Function()` on it — `send-reminders.js:59-65`). Native apps must **not** influence the data pipeline; they are read-only consumers.

---

## 7. Push Notification Architecture (the core technical migration)

Web Push/VAPID does not exist on native. iOS uses **APNs**, Android uses **FCM**. The strategy is to **reuse the existing reminders cron** and add two transports.

### 7.1 Device registration

- **Android:** Firebase SDK obtains an **FCM registration token** on launch; app POSTs `{platform:'fcm', token}` + preferences to the backend (via Worker route).
- **iOS:** App registers with APNs (`UNUserNotificationCenter` + `registerForRemoteNotifications`), obtains an **APNs device token**, POSTs `{platform:'apns', token}` to the backend.
- Both link to a `NotifPreference` row (same schema as web), so the cron's preference filtering "just works."

### 7.2 Server send: extend the existing cron (recommended)

The cron (`.github/scripts/send-reminders.js`) already computes "matches in next 25h," dedups via `ReminderLog`, and fans out to Web Push + Telegram. **Add two senders** in the same loop:

- **FCM** — use **FCM HTTP v1** (legacy API decommissioned June 2024). Easiest from Node is the **Firebase Admin SDK** (`admin.messaging().sendEachForMulticast()`); auth via a **service-account JSON** ([FCM v1 docs](https://firebase.google.com/docs/cloud-messaging/send/v1-api), [migration guide](https://firebase.google.com/docs/cloud-messaging/migrate-v1)).
- **APNs** — **token-based auth** with a **.p8 signing key** + Key ID + Team ID (ES256 JWT, ≤1h lifetime), POST over HTTP/2 to `api.push.apple.com` ([Apple: token-based APNs](https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns)). From Node, use the maintained **[@parse/node-apn](https://github.com/parse-community/node-apn)** fork.

This **reuses the entire reminder windowing, dedup, and scheduling** — only the transport changes, and `ReminderLog.channel` gains `'fcm'` / `'apns'` values alongside `'web-push'` / `'telegram'`.

**New GitHub Actions secrets** (mirroring the existing `VAPID_*` / `TELEGRAM_BOT_TOKEN` pattern):
`FCM_SERVICE_ACCOUNT_JSON`, `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`.

### 7.3 Alternatives

- **Parse Push** — `parse-server-push-adapter` is current (v8.5.0, Apr 2026) and supports FCM v1 + APNs .p8 via the Parse `_Installation` class. Viable, but couples sends to Back4App's dashboard/Cloud Code and the `_Installation` lifecycle; the cron-direct approach keeps a single source of truth.
- **Cloudflare Worker sender** — Workers can sign ES256 JWTs (Web Crypto) and call FCM v1 / APNs; works in production (note a known `wrangler dev`-only APNs HTTP/2 quirk on macOS, [workerd#4841](https://github.com/cloudflare/workerd/issues/4841)). Reasonable if you'd rather not extend the cron, but the cron already owns scheduling.

**Recommendation:** extend the cron (least new infra). Migrate transport-by-transport: **FCM first** (simpler), then **APNs**.

### 7.4 Payload consistency

Keep the existing payload shape (`{title, body, icon, tag, url}` from `lib/message-builder.js:21-32`) and a shared message builder so web, Android, and iOS render identical notifications. `url`/`tag` become the deep-link + dedup key on native.

---

## 8. Feature → Native Implementation Map

| Feature area | Android | iOS | Shared core |
|---|---|---|---|
| Calendar grid | kizitonwose/Calendar (Compose) | airbnb/HorizonCalendar | event→day mapping, month config |
| List/cards views | LazyColumn | List/LazyVStack | grouping/sorting |
| Event detail sheet | ModalBottomSheet | `.sheet` | event model |
| Countdown | Compose `produceState` timer | SwiftUI `TimelineView` | kickoff math |
| Stats tables | Compose + Vico charts | SwiftUI + Swift Charts | **all stat computation** |
| Squad | LazyColumn + sections | List sections | roster grouping (men's football filter) |
| Player photos | Coil | AsyncImage | asset path resolution |
| Settings toggles | Material switches | SwiftUI `Toggle` | preference model + sync |
| Language toggle | per-locale resources | `.xcstrings` | team-name mapping only |
| Theme/dark | Material 3 dynamic + manual | `.preferredColorScheme` | — |
| Share | `ACTION_SEND` | `ShareLink` | share text builder |
| Add to calendar | CalendarContract intent | EventKit `EKEventStore` | ICS/event serialization |

---

## 9. Native-Only Features (technical feasibility)

| Feature | iOS | Android | Notes |
|---|---|---|---|
| **Widgets** (next match / countdown) | WidgetKit (SwiftUI, timeline) | Jetpack **Glance** | First-party sports widgets shipped 2025-26 (Apple Sports, Pixel At-a-Glance) — mainstream pattern. Shared "next match" provider in `:shared`. |
| **iOS Live Activities** (live score) | ActivityKit; APNs `apns-push-type: liveactivity`; iOS 18 **broadcast push** (channel-based, no per-device tokens — ideal for "everyone follows the same match") ([Apple docs](https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications), [WWDC24 broadcast](https://developer.apple.com/videos/play/wwdc2024/10069/)) | closest: ongoing/Live-Updates notification | Headline iOS differentiator; reuses the same APNs .p8 from §7 |
| **App shortcuts / quick actions** | `UIApplicationShortcutItem` + App Intents | dynamic App Shortcuts | "Next match", "Settings" |
| **Add-to-calendar** | EventKit | CalendarContract | Prefer system flow (privacy, Guideline 5.1.1) |

---

## 10. Internationalization (EN/EL)

- **Android:** `res/values/strings.xml` (EN) + `res/values-el/strings.xml` (EL); `stringResource(R.string.x)` recomposes on locale change.
- **iOS:** **String Catalogs (`.xcstrings`)** (Xcode 15+, format 1.1 in Xcode 26) — single catalog, compile-time-checked, `Text("key")` auto-resolves.
- **Reuse existing translations via a build-time generator** (mirrors the repo's existing `generate-calendar.ts` pattern): a small script converts `app/src/i18n/{en,el}.json` → `strings.xml` (×2) and `.xcstrings`. **Convert verbatim** — the Greek copy is tone-sensitive and flagged "don't rewrite without asking" in `CLAUDE.md`.
- **Team-name maps** (`i18n/*.json#fotmob.teams.*`) are *data*, not UI strings → they belong in the **shared core's** translation logic, not platform string files.

---

## 11. Analytics (optional, privacy-sensitive)

The web app uses GA4 + Microsoft Clarity (both optional). For native, either reuse GA4 via the Firebase Analytics SDK (already pulling Firebase for FCM) or adopt a privacy-lighter analytics. **Whatever is chosen must be declared** in Apple privacy labels + Google Data Safety (§16) and may trigger iOS ATT prompts. Recommend deferring analytics to post-MVP to keep the first store submission's privacy surface minimal.

---

## 12. Offline & Persistence

- **SQLDelight** in `:shared` for a typed, multiplatform local cache of fixtures and computed stats.
- Strategy: on launch/foreground, fetch latest `events` JSON (§6.4) → upsert to SQLDelight → UI reads from the local store (offline-first). Show a "last updated" indicator and a stale badge if a refresh fails.
- Preferences (language, theme, view mode) in DataStore (Android) / UserDefaults (iOS); notification preferences live in `NotifPreference` (backend) so they survive reinstalls and are honored by the cron.

---

## 13. Build, CI/CD & Release

| Concern | Android | iOS |
|---|---|---|
| Build system | Gradle (KMP + AGP) | Xcode project consuming the shared XCFramework via Gradle task / SPM |
| Signing | Upload keystore (Play App Signing) | Apple distribution cert + provisioning profile |
| Automation | **Fastlane** (`supply`) or Gradle Play Publisher | **Fastlane** (`deliver`, `pilot` for TestFlight) |
| CI | GitHub Actions: build + unit test `:shared` + lint on PR | GitHub Actions (macOS runner): build + test |
| Beta tracks | Play Internal Testing | TestFlight |

- Keep the **shared core tests** in CI as the parity guard (same fixtures as the web app).
- Store credentials (keystore, .p8, App Store Connect API key, service-account JSON) live in GitHub Actions secrets, never in the repo.
- **Decouple data from releases:** because fixtures change mid-season, app data must refresh from the backend (§6.4-B), not via store updates.

---

## 14. Security Requirements

- **No master/REST keys in app binaries** (§6.3). Privileged writes go through the Worker.
- Device tokens are not secrets but are PII-adjacent — store server-side under appropriate ACLs; clean up invalid tokens (mirror the existing 410/404 web-push cleanup, `send-reminders.js:199-212`).
- APNs `.p8`, FCM service-account JSON, and store-signing material are **high-sensitivity** — GitHub Actions secrets only, with a documented rotation path (extend the existing rotation table in the backend audit).
- TLS-only to Back4App/Worker/APNs/FCM. Validate deep-link URLs before navigation (the SW already validates same-origin in `sw.ts:48-68`; replicate that intent natively).
- Request the **minimum** OS permissions (notifications, optionally calendar) and only at the point of use (Guideline 5.1.1).

---

## 15. Testing Strategy

| Level | What |
|---|---|
| **Shared core unit tests** (`commonTest`) | Stats engine, volleyball stats, ICS generation, name mapping, reminder windowing — using ported web fixtures for numeric parity |
| **Backend contract tests** | Ktor client against Parse REST / Worker routes (mock + a staging Back4App) |
| **Android UI** | Compose UI tests for calendar/settings critical paths |
| **iOS UI** | XCUITest for calendar/settings critical paths |
| **Push E2E** | Manual + scripted: register token → trigger cron in a test window → assert delivery on a device; verify `ReminderLog` dedup |
| **Localization** | Snapshot both locales; verify Greek strings don't clip |

---

## 16. App Store & Play Store Compliance (2026)

| Item | Apple App Store | Google Play |
|---|---|---|
| Account fee | **$99/year** | **$25 one-time** |
| Privacy disclosure | **App Privacy "nutrition labels"** + **privacy manifest** (`PrivacyInfo.xcprivacy`) + third-party SDK signatures | **Data Safety form** + privacy-policy URL |
| Key rejection risk | **Guideline 4.2 (Minimum Functionality)** — wrappers/repackaged websites rejected. *Mitigated* by truly-native UI + push + widgets/Live Activities + offline (no WebView). | Target-API currency, accurate Data Safety, reachable privacy policy |
| Metadata | Guideline 2.3 — real screenshots of calendar/stats in use; unique name; no trademark stuffing | Accurate listing |
| Localization | App Store Connect supports Greek localized metadata (name/subtitle/description/keywords/screenshots) | Play Console "Manage translations" → Greek |
| Permissions | System pickers/share/EventKit to minimize scope (5.1.1); in-app + metadata privacy policy | Runtime permission rationale |

**Action:** keep the first submission's data surface minimal (push token + preferences = "functionality"); defer analytics to reduce label complexity; prepare EN + EL store listings with genuine in-use screenshots.

---

## 17. Effort & Phasing (engineering estimate)

Estimates are **ideal engineering effort** for a competent Kotlin/Swift developer; as a part-time solo effort, calendar time is a multiple of these.

| Phase | Work | Rough effort |
|---|---|---|
| **P0 Foundation** | KMP repo, `:shared` (models, Ktor client, stats/ICS/translate port + tests), CI, device-token store + Worker route | 2–3 weeks |
| **P1 Android MVP** | Compose shell, calendar (grid+list), event sheet, FCM push, settings (notif+lang+dark) | 3–4 weeks |
| **P2 iOS MVP** | SwiftUI shell (reusing `:shared`), calendar, event sheet, APNs push, settings | 2–3 weeks (core reused) |
| **P3 Parity** | Stats + charts, squad, cards view, filters, calendar-add, full settings, themes | 3–5 weeks |
| **P4 Native extras** | Widget(s), EventKit/CalendarContract, shortcuts, (opt.) iOS Live Activities | 2–4 weeks |
| **P5 Store launch** | Listings (EN+EL), privacy labels/data-safety, screenshots, beta, review iterations, Fastlane | 1–2 weeks + review latency |

The **shared core front-loads cost in P0** but makes P2 and every later feature cheaper — the central reason this architecture suits a solo maintainer.

---

## 18. Open Technical Questions

1. **Event data delivery (§6.4):** confirm exposing generated `events` JSON via a Worker/static endpoint is acceptable (recommended) vs bundling per release.
2. **Token registration path:** direct Parse REST from the app (JS key, ACL-guarded) vs through a new Worker `/api/register-token` (REST key server-side)? (Recommend Worker route for parity with Telegram CRUD.)
3. **Live Activities (§9):** prioritize for v1 (sponsor "wow") or defer to P4+?
4. **Analytics (§11):** carry GA/Clarity or defer/replace? Affects privacy labels.
5. **Push send location (§7.3):** extend the GitHub Actions cron (recommended) vs Parse Push vs Cloudflare Worker sender?
6. **Bundle/app IDs & account ownership:** confirm `com.redrebels.*` convention and that the club entity owns both developer accounts.

---

## 19. Decision Log

| # | Decision | Rationale | Alternatives |
|---|---|---|---|
| D1 | KMP shared core + native SwiftUI/Compose UI | "Truly native" UI, write logic once, solo-sustainable, no 4.2 risk | Fully-separate native; Compose Multiplatform UI |
| D2 | SKIE for Swift interop | Lower friction for suspend/Flow→Swift | KMP-NativeCoroutines |
| D3 | Parse REST via shared Ktor client | iOS Parse SDK dormant; SDKs can't live in commonMain | netreconlab Parse-Swift; Android Parse SDK |
| D4 | Extend the existing reminders cron with FCM+APNs | Reuses windowing/dedup/scheduling; one source of truth | Parse Push; Worker sender |
| D5 | Event data fetched from backend, not bundled | Fixtures change mid-season; store review must not gate data | Bundle JSON per release |
| D6 | Generate native i18n from existing `i18n/*.json` | Single translation source; preserves tone-sensitive Greek | Hand-author native strings |
| D7 | No WebView, no user accounts, no IAP (v1) | Compliance + scope discipline | — |

---

## 20. Appendix — Key References

**Codebase anchors:** `app/src/lib/parse.ts`, `push.ts:45-107`, `preferences.ts:3-19`, `sw.ts:27-68`, `_worker.ts:60-115`, `.github/scripts/send-reminders.js:59-274`, `lib/message-builder.js:21-32`, `app/src/types/events.ts`, `app/src/data/constants.ts`, `app/src/lib/{stats,volleyball-stats,ics-core,translate,fotmob}.ts`, `app/wrangler.jsonc`, `app/index.html` (CSP).

**External (cited inline above):** KMP (kotlinlang.org), Compose Multiplatform 1.8.0 (JetBrains), SKIE (Touchlab), Kotlin/kmp-production-sample, android/kotlin-multiplatform-samples, D-KMP-sample, FCM HTTP v1 (Firebase), APNs token-based auth + ActivityKit (Apple), parse-server-push-adapter, netreconlab/Parse-Swift, Parse-SDK-Android, kizitonwose/Calendar, airbnb/HorizonCalendar, Vico, Swift Charts, App Store Review Guidelines (4.2 / 5.1.1 / 2.3), Apple App Privacy + privacy manifests, Google Play Data Safety.
