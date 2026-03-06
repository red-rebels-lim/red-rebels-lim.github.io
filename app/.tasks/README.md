# Red Rebels Calendar - Task Board

## Summary

| Status | Count |
|--------|-------|
| Done | 5 |
| Partially Implemented | 6 |
| Not Started | 17 |
| **Total** | **28** |

## All Tasks

| # | Task | Status | Priority | Effort | Category |
|---|------|--------|----------|--------|----------|
| 01 | [Fan Wall / Match Day Chat](./01-fan-wall-match-day-chat.md) | Not Started | Low | Large | Fan Engagement |
| 02 | [Match Polls & Predictions](./02-match-polls-predictions.md) | Not Started | Low | Large | Fan Engagement |
| 03 | [Fan of the Month Leaderboard](./03-fan-of-the-month-leaderboard.md) | Not Started | Low | Large | Fan Engagement |
| 04 | [Match Ratings](./04-match-ratings.md) | Not Started | Low | Small | Fan Engagement |
| 05 | [Live Score Updates](./05-live-score-updates.md) | Partial | Medium | Medium | Live & Real-Time |
| 06 | [Live Match Timeline](./06-live-match-timeline.md) | Not Started | Low | Large | Live & Real-Time |
| 07 | [Countdown Widget](./07-countdown-widget.md) | **Done** | - | - | Live & Real-Time |
| 08 | [Match Reports](./08-match-reports.md) | Not Started | Low | Medium | Content & Media |
| 09 | [Photo Gallery](./09-photo-gallery.md) | Not Started | Low | Large | Content & Media |
| 10 | [Club News Feed](./10-club-news-feed.md) | Not Started | Low | Medium | Content & Media |
| 11 | [Historical Season Archive](./11-historical-season-archive.md) | Not Started | Low | Medium | Content & Media |
| 12 | [Volleyball Statistics](./12-volleyball-statistics.md) | Partial | High | Medium | Multi-Sport |
| 13 | [Sport-Specific Standings](./13-sport-specific-standings.md) | Partial | Medium | Medium | Multi-Sport |
| 14 | [Unified Season Dashboard](./14-unified-season-dashboard.md) | Not Started | Low | Medium | Multi-Sport |
| 15 | [Theme Switcher](./15-theme-switcher.md) | **Done** | - | - | UX & Personalization |
| 16 | [Favorite Sport Filter](./16-favorite-sport-filter.md) | Not Started | Medium | Small | UX & Personalization |
| 17 | [Calendar Sync](./17-calendar-sync.md) | Partial | High | Medium | UX & Personalization |
| 18 | [Onboarding Tour](./18-onboarding-tour.md) | **Done** | - | - | UX & Personalization |
| 19 | [Language Auto-Detection](./19-language-auto-detection.md) | **Done** | - | - | UX & Personalization |
| 20 | [Keyboard Navigation](./20-keyboard-navigation.md) | **Done** | - | - | Accessibility |
| 21 | [Share Match Card](./21-share-match-card.md) | Not Started | Medium | Small | Accessibility |
| 22 | [Offline Match Data](./22-offline-match-data.md) | Partial | Medium | Medium | Accessibility |
| 23 | [Attendance Tracker](./23-attendance-tracker.md) | Not Started | Low | Medium | Analytics |
| 24 | [Season Prediction Game](./24-season-prediction-game.md) | Not Started | Low | Large | Analytics |
| 25 | [Win Probability Indicator](./25-win-probability-indicator.md) | Not Started | Low | Medium | Analytics |
| 26 | [Server-Side Rendering](./26-server-side-rendering.md) | Not Started | Low | Large | Infrastructure |
| 27 | [Background Sync](./27-background-sync.md) | Not Started | Low | Medium | Infrastructure |
| 28 | [Match Reminder Notifications](./28-match-reminder-notifications.md) | Partial | High | Medium | Infrastructure |

## Suggested Implementation Order (Quick Wins First)

1. **Task 19** — Language Auto-Detection (Small, ~10 lines of code)
2. **Task 16** — Favorite Sport Filter persistence (Small, localStorage addition)
3. **Task 21** — Share Match Card (Small, Web Share API)
4. **Task 20** — Keyboard Navigation (Small, new hook)
5. **Task 12** — Volleyball Statistics (Medium, extend existing stats engine)
6. **Task 17** — Calendar Sync feed (Medium, build pipeline addition)
7. **Task 28** — Match Reminder backend (Medium, Back4App Cloud Function)
8. **Task 22** — Offline Match Data (Medium, Workbox runtime caching)
9. **Task 05** — Live Score Updates (Medium, polling + live badge)
