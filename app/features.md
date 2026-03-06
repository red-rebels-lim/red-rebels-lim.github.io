# Red Rebels Calendar - Feature Ideas

## Fan Engagement & Community

### 1. Fan Wall / Match Day Chat
A simple per-match comment section where fans can post reactions before, during, and after games. Store in Back4App (Parse already integrated). Could start as anonymous with optional nicknames.

### 2. Match Polls & Predictions
Before each upcoming match, let fans vote on predicted score or result (Win/Draw/Loss). Show prediction stats after the match. Gamification element that drives repeat visits.

### 3. Fan of the Month Leaderboard
Track engagement (predictions accuracy, poll participation, app visits) and show a leaderboard. Reward the most active fans.

### 4. Match Ratings
After a played match, let fans rate the team's performance (1-5 stars). Show aggregate ratings on each match card.

---

## Live & Real-Time Features

### 5. Live Score Updates [PARTIALLY IMPLEMENTED]
Use FotMob or another API to show live scores during matches, with auto-refresh. Push notifications for goals scored.

> **Status:** `src/lib/fotmob.ts` fetches data from the FotMob API, but there is no auto-refresh or real-time polling during live matches.

### 6. Live Match Timeline
Show key events (goals, cards, substitutions) in real-time during a match, pulled from FotMob data.

### 7. ~~Countdown Widget on Home Screen~~ [IMPLEMENTED]
~~For the next upcoming match, show a prominent countdown card on the Calendar page (not just within the event card).~~

> **Status:** `src/components/calendar/CountdownTimer.tsx` displays a countdown to kickoff on each upcoming event card.

---

## Content & Media

### 8. Match Reports / Post-Match Summary
Auto-generate or manually add brief match recaps for played games. Could be AI-assisted using the score data and event context.

### 9. Photo Gallery
Allow uploading or linking match-day photos. Back4App supports file storage. Fans love reliving match-day atmosphere.

### 10. Club News Feed
Scrape or integrate news from Nea Salamina's social media or website, showing the latest club updates in-app.

### 11. Historical Season Archive
Store past seasons' data (24/25 and earlier). Let fans browse previous seasons and compare stats year-over-year.

---

## Multi-Sport Enhancements

### 12. Volleyball Statistics Page [PARTIALLY IMPLEMENTED]
Currently stats only cover Men's Football. Extend the stats engine to also calculate and display Men's Volleyball and Women's Volleyball statistics (W/D/L, set ratios, form, streaks).

> **Status:** `src/data/sport-config.ts` defines volleyball sports and the filter panel supports them, but `src/lib/stats.ts` only calculates statistics for `football-men`.

### 13. Sport-Specific Standings [PARTIALLY IMPLEMENTED]
Fetch and show volleyball league standings alongside football standings on the Stats page.

> **Status:** FotMob standings are fetched for football only. No volleyball league standings integration.

### 14. Unified Season Dashboard
A landing page that shows a snapshot of all three teams at once: next match, current form, and league position for each sport.

---

## UX & Personalization

### 15. ~~Theme Switcher (Light/Dark/Auto)~~ [IMPLEMENTED]
~~The app has light mode CSS already defined but defaults to dark. Add a toggle in Settings to let users choose light mode, dark mode, or system preference.~~

> **Status:** `src/hooks/useTheme.ts` implements a light/dark toggle persisted to localStorage. Toggle button is in the Navbar (desktop and mobile).

### 16. Favorite Sport Filter
Let users set a default sport filter (e.g., "only show me volleyball-women events") that persists across sessions via localStorage.

> **Note:** Filter panel exists (`src/components/filters/FilterPanel.tsx`) but filter state is not persisted to localStorage — it resets on page reload.

### 17. Google Calendar / Apple Calendar Sync [PARTIALLY IMPLEMENTED]
Beyond the existing ICS export, add a subscribable calendar URL (`.ics` feed) that auto-updates as new events are added by the scraper.

> **Status:** `src/lib/ics-export.ts` provides a one-time `.ics` file download. A subscribable auto-updating feed URL is not yet available.

### 18. ~~Onboarding Tour~~ [IMPLEMENTED]
~~A first-visit guided tour highlighting key features: swipe navigation, filters, stats page, push notifications. Improve feature discovery.~~

> **Status:** Custom lightweight implementation with `src/hooks/useOnboarding.ts` hook and `src/components/OnboardingTour.tsx`. 5-step tour with localStorage persistence, skip/dismiss, bilingual EN/EL support. No external library needed.

### 19. Language Auto-Detection
Detect browser language and auto-set Greek or English on first visit (currently likely defaults to one).

> **Note:** `src/i18n/index.ts` reads a saved language from localStorage but does not detect browser language via `navigator.language` on first visit. Falls back to English.

---

## Accessibility & UX Polish

### 20. Keyboard Navigation
Add keyboard shortcuts for month navigation (left/right arrows), jump to today (T key), and toggle filters (F key).

### 21. Share Match Card
A share button on EventPopover to share a match card image or link via Web Share API (native share sheet on mobile).

### 22. Offline Match Data [PARTIALLY IMPLEMENTED]
Cache event data in the service worker so the calendar works fully offline (currently only precaches assets, not the data layer).

> **Status:** `src/sw.ts` uses Workbox to precache static assets. Event/calendar data is not cached — the calendar is blank when offline.

---

## Analytics & Insights

### 23. Personal Match Attendance Tracker
Let fans mark which matches they attended. Show stats at end of season ("You attended 12 out of 20 home matches").

### 24. Season Prediction Game
At the start of the season, let fans predict final league position, top scorer, etc. Reveal accuracy at season end.

### 25. Win Probability Indicator
Based on head-to-head record and current form, show a simple predicted outcome percentage for upcoming matches.

---

## Technical / Infrastructure

### 26. Server-Side Rendering or Static Generation
Migrate to a framework like Astro or Next.js for better SEO, faster initial load, and social media link previews (Open Graph tags for match sharing).

### 27. Background Sync for Scores
Use the Background Sync API in the service worker to automatically update scores when the user comes back online after being offline during a match.

### 28. Automated Match Reminder Notifications [PARTIALLY IMPLEMENTED]
The Settings page already has reminder hour preferences (1h, 2h, 12h, 24h before). Implement the backend Cloud Function in Back4App to actually send these reminders based on the stored preferences and event times.

> **Status:** Settings UI stores `reminderHours` preferences and push subscription infrastructure is in place (`src/lib/push.ts`, `src/lib/preferences.ts`). The backend Cloud Function to trigger reminders is not yet implemented.

---

## Prioritized Quick Wins

| # | Feature | Effort | Impact | Status |
|---|---------|--------|--------|--------|
| 15 | ~~Theme Switcher~~ | ~~Small~~ | ~~High~~ | DONE |
| 7 | ~~Countdown Widget~~ | ~~Small~~ | ~~Medium~~ | DONE |
| 12 | Volleyball Stats | Medium — reuse existing stats engine | High | Partial — stats engine is football-only |
| 16 | Favorite Sport Filter | Small — localStorage + existing filter system | Medium | Filter exists, persistence missing |
| 21 | Share Match Card | Small — Web Share API is ~20 lines | Medium | Not started |
| 17 | Calendar Sync URL | Medium — generate a hosted .ics feed | High | Partial — one-time export exists |
| 28 | Match Reminder Backend | Medium — Cloud Function on Back4App | High | Partial — UI/prefs done, backend missing |

---

## Sources

- [Digital Fan Engagement in Sports - PwC](https://www.pwc.com/us/en/industries/tmt/library/digital-fan-engagement-sports.html)
- [2026 Sports Fan Engagement & AI Trends - Stats Perform](https://www.statsperform.com/2026-sports-fan-engagement-monetisation-ai-trends-survey/)
- [Top 8 Sports Streaming & Fan Engagement Trends 2026 - Red5](https://www.red5.net/blog/sports-broadcasting-and-fan-engagement-trends-2026/)
- [Sports Technology Trends & Innovations 2026 - MobiDev](https://mobidev.biz/blog/sports-technology-trends-innovations-to-adopt-in-sports-apps)
- [Sports Fan Apps: Enhancing Fan Engagement - Anadea](https://anadea.info/blog/sports-fan-apps/)
- [How Club Mobile Apps Increase Fan Engagement - FBIN](https://www.footballbusinessinside.com/how-club-mobile-apps-can-increase-fan-engagement/)
- [PWA Capabilities in 2026 - Progressier](https://progressier.com/pwa-capabilities)
- [Nea Salamis Famagusta FC - Wikipedia](https://en.wikipedia.org/wiki/Nea_Salamis_Famagusta_FC)
