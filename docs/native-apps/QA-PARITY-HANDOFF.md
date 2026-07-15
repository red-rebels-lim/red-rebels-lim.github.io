# PWA-Parity QA — Handoff Instructions

> **Audience:** the model/agent session that picks up this work. This document is
> self-contained: read it top to bottom before touching anything.

| Field | Value |
|---|---|
| **Mission** | Make the Flutter app (`flutter/`) an **exact copy** of the web PWA's mobile experience — functionality *and* design |
| **Acceptance criteria** | Stakeholder statement, 2026-07-14: *"the target is to have the exact copy of the PWA developed in Flutter."* A finding is closed only when the two render/behave identically on the same emulator, or the stakeholder explicitly accepts the difference. |
| **Ground truth** | The **installed PWA** running on the same Android emulator as the Flutter app (identical viewport/DPI/conditions). Web sources: `app/src/**`, tokens in `app/src/index.css`. |
| **Status at handoff** | Phases 1–7 of [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) merged (through PR #82). Stakeholder tested the release APK on a real phone and reports **many remaining differences, functional and visual — too many to list**. Spot-fixes so far: calendar dark parity, Greek fonts, switch visibility. A systematic sweep is required. |

## Critical scope change

Earlier phases tolerated "documented deliberate deviations." **The exact-copy criterion
supersedes them.** Every previously-accepted deviation is now an open finding that must be
either fixed or re-approved by the stakeholder. Known list (from PR notes — re-verify, may
be incomplete):

- Women's volleyball accents: app uses purple `#9C27B0` (own sport palette); web `UpcomingEventCard` tints all volleyball blue
- Cinema theme body font: web specifies Inter for body+headings; app uses platform default (Inter **is now bundled** for Greek fallback — switching cinema to it is trivial)
- Cinema ambient animated blobs: skipped in app
- Neon scanlines: static in app vs animated-feel CSS
- Brutalism 2px header/nav border widths: only colors ported
- First-run intro: app has a 3-page dialog vs web's 7-step anchored tour (PRD CAL-10 said "re-imagine" — stakeholder may still accept this; ASK)
- Month-nav: app disables chevrons at season boundaries; web wraps
- Event-card border colors (web `border-slate-200 dark:border-slate-800`, blue tint for volleyball): omitted in app
- Greek uppercase keeps tonos accents (Dart `toUpperCase()`); web browsers with `lang=el` drop them
- "Γλώσσα" label wraps mid-word in Greek settings; neon Orbitron truncates the header brand text
- Stats tab labels truncate at phone width (web uses pill-shaped wrapping buttons — never restyled, still Material TabBar in app)
- Below-grid behavior, sport colors, anything else the sweep finds

Also **functional** gaps the stakeholder's "functionality" remark may include (check against
the PRD §7 matrix and plan Phases 8–10): FotMob league table/rankings/football top scorers/next-match
(Phase 8), opponent-scout section in event sheet, global sports filter in settings, notification
preview, volleyball streaks card, goal-distribution chart, webcal subscription (Phase 10),
keyboard/swipe details, share-format differences.

## The plan (agreed with stakeholder)

### Phase 0 — Setup
1. Boot the emulator (see *Emulator mechanics* below).
2. Install the PWA: Chrome → `https://red-rebels.com` → ⋮ menu → *Add to Home screen / Install app*. It runs standalone (manifest + SW). Confirm the icon lands on the home screen.
3. Build + install the Flutter app from `main`:
   `cd flutter && flutter build apk --debug --dart-define=BACK4APP_APP_ID=$(grep VITE_BACK4APP_APP_ID ../app/.env.local | cut -d= -f2) --dart-define=BACK4APP_JS_KEY=$(grep VITE_BACK4APP_JS_KEY ../app/.env.local | cut -d= -f2)`
4. Baseline both: English, light mode, onboarding dismissed (`adb shell pm clear com.redrebels.red_rebels_calendar` resets the app; Chrome site-settings clear resets the PWA).
5. Reference month: **April 2026** (football + volleyball + cups + all result types). July 2026 = empty-month case.

### Phase 1 — Capture matrix (~35–40 pairs: PWA screenshot, then app screenshot, same state)
- Calendar grid: light+dark × EN+EL; July (empty) + April (full); day selected
- List view + cards view: light+dark
- Event sheet: played football (Goalscorers/Bookings/Lineups/Subs tabs), played volleyball (Sets/Top Scorers), cup match with penalties
- Filters sheet: open + applied
- Stats: 3 sport tabs × light+dark, section by section (FotMob blocks will differ — classify as Phase-8 gap, not new finding)
- Squad: roster; player sheets (starter / sub-heavy / zero-apps keeper)
- Settings: full page × EN+EL
- Visual themes: calendar+settings under brutalism/cinema/neon on both apps
- Behaviors: month swipe, view/theme/language persistence across restart, share output, today highlight
- Untestable while season is over (equal on both): upcoming events, countdowns, reminders

### Phase 2 — Findings register
Create `docs/native-apps/QA-COMPARISON.md`. One row per difference:
`ID | area | state | severity (P1 breaks design/function · P2 clearly visible · P3 nit) | classification (BUG / NEEDS-STAKEHOLDER-DECISION / WEB-BUG) | status`.
Under the exact-copy criterion, default classification is **BUG**; use NEEDS-STAKEHOLDER-DECISION
only where copying the web is impossible or clearly wrong (e.g. tonos-on-uppercase, platform share sheets).

### Phase 3 — Fix batches
One branch/PR per area batch (calendar / stats / squad / settings / themes / functional-gaps).
Per batch: fix → re-capture affected pairs → update register → gates → PR referencing the register rows.

### Phase 4 — Exit
All findings fixed or stakeholder-accepted; final full re-capture attached to the closing PR;
register 100% resolved.

## Emulator & tooling mechanics (hard-won; follow these)

- **adb**: `~/Library/Android/sdk/platform-tools/adb` (not on PATH). Screen 1080×2400; screenshots display at 0.833× — multiply displayed coords ×1.2 for `input tap`.
- **Boot**: the emulator dies if launched with `&` from a tool shell. Use a detached script: `nohup ~/Library/Android/sdk/emulator/emulator -avd pixel_7 -no-snapshot-load -no-boot-anim -no-audio &` inside a `run_in_background` script polling `adb shell getprop sys.boot_completed`. Cold boot fixes "offline" wedges.
- **Storage**: the emulator runs out of /data periodically — `adb shell pm uninstall com.redrebels.red_rebels_calendar` + `pm trim-caches 999G` before reinstalling.
- **Screenshots**: `adb exec-out screencap -p > file.png`; notification shade: `cmd statusbar expand-notifications`; app-data files (debug builds): `run-as com.redrebels.red_rebels_calendar`.
- **Launcher gotchas** (do NOT re-debug these): the hotseat *suggestion slot* draws a dynamic-color ring around any app in it — not an icon bug; Settings→App Info is the unstyled icon ground truth. SystemUI caches per-package icons across reinstalls (reboot flushes). Force-stopped apps receive **no** FCM (OS policy).
- **PWA driving**: it's a standalone window — no URL bar; the web onboarding tour will appear on first run (7 steps, Skip at bottom-left).
- **Dart MCP server** is configured in `.mcp.json` (hot reload, widget inspection) — connects on session start; useful for faster iterate-verify loops than APK reinstalls.

## Repo rules (non-negotiable; full detail in CLAUDE.md files)

- **Never push to main; always PR.** Pre-push hook runs the web app's lint+test+build — don't `--no-verify`.
- Commit style `type(scope): description`; PR bodies end with the Claude Code attribution line.
- **i18n**: never add entries or new Greek copy without stakeholder sign-off; the Flutter JSONs are byte-copies of `app/src/i18n/{en,el}.json`. All UI strings via `app.t()` with existing keys.
- **Theming**: everything token-driven through `AppColors` (a `ThemeExtension`, 8 palettes in `flutter/lib/theme.dart`, values ported from `index.css`). No hardcoded palette values in widgets. `condensed()` is the heading-style helper. Greek requires the bundled fallbacks (Inter body / Roboto Condensed headings) — Barlow/Space Grotesk/Orbitron have **no Greek glyphs**.
- **Tests**: 221 currently, all green (`cd flutter && flutter analyze && flutter test`). Conventions: real assets loaded in `setUpAll` outside fake-async; unmount before pending-timer checks; injectable bridges for plugins (`addEventToDeviceCalendar`, `openExternalUrl`, `PushTokenProvider`, mocked `http.Client`). Every fix batch keeps them green and adds coverage for what it changes.
- **Don't touch**: `app/src/data/events.ts` (generated + externally parsed), scraper URL constants, `index.html` CSP, `wrangler.jsonc` store ids, manifest/favicons. The web app is the reference — QA fixes belong in `flutter/` (a WEB-BUG finding needs stakeholder sign-off before touching `app/`).
- **Web-side context**: live feeds `red-rebels.com/{events,players}.json` are generated at web build; the app syncs on launch/resume with cache fallback.

## Useful commands

```bash
# gates
cd flutter && flutter analyze && flutter test
# credentialed debug build (push/live-data work)
flutter build apk --debug --dart-define=BACK4APP_APP_ID=… --dart-define=BACK4APP_JS_KEY=…   # values: grep VITE_ app/.env.local
# release APK for the stakeholder's phone
flutter build apk --release --dart-define=…  # debug-signed until a release keystore exists
# FCM test send (service-account JSON in ~/Downloads/red-rebels-calendar-firebase-adminsdk-*.json)
cd .github/scripts && FIREBASE_SERVICE_ACCOUNT="$(cat …json)" TEST_FCM_TOKEN=… node send-test-push.js
```

## Out of scope for this QA effort (tracked elsewhere)

- iOS push (Phase 5 PR 2) — blocked on Apple Developer membership + APNs key upload
- FotMob stats / widget / small-gaps batches (plan Phases 8–10) — however, any of these the
  stakeholder's "functional differences" complaint covers should be folded into the register
  as findings referencing those phases
- Store launch (keystore, listings, privacy labels)
