# Red Rebels Native Apps — PRD & TRD

Investigation and planning artifacts for building **truly-native Android + iOS apps** from the existing Red Rebels Calendar web PWA.

| Doc | Purpose |
|---|---|
| [PRD.md](./PRD.md) | **Product** requirements — goals, drivers, personas, feature parity matrix, phasing, risks, success metrics |
| [TRD.md](./TRD.md) | **Technical** requirements — architecture, shared core, backend integration, push migration, build/release, compliance, effort estimate |

## TL;DR

- **Decision:** build native apps (sponsor/club mandate), reaching **web parity + native extras**, maintained **solo/volunteer**.
- **Architecture:** **Kotlin Multiplatform shared core + native SwiftUI (iOS) / Jetpack Compose (Android) UI** — "truly native" UI, domain logic written once, no WebView (avoids App Store Guideline 4.2). Fully-separate native is documented as the fallback.
- **Backend:** unchanged. One backend, three clients. Native push (APNs + FCM) is added by **extending the existing GitHub Actions reminders cron**, not by building new infra.
- **Plan:** P0 shared core → P1 Android MVP → P2 iOS MVP → P3 parity → P4 native extras → P5 store launch.

## Status

Draft v1 — generated from a three-track investigation (web feature inventory, backend/infra map, cited native-architecture reference research) on 2026-06-11. See the **Open Questions** sections in both docs for decisions still needed from the stakeholder.
