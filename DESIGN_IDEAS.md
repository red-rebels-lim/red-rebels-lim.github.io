# Design Ideas - Red Rebels Calendar PWA

> Generated: 2026-04-11 | Based on UI/UX Pro Max analysis (Sports Team/Club product type)
> Recommended styles: Vibrant Block-based + Motion-Driven, Modern Dark Cinema
> Recommended typography: Barlow Condensed / Barlow (sports, athletic, energetic)

---

## 1. Match Day Live Experience

**Concept**: Transform the calendar into a "match day mode" that activates on game days with an immersive, energetic feel.

**Features**:
- **Countdown hero**: Full-width countdown card at top of calendar on match days with pulsing team logo, opponent info, and animated time digits
- **Live score ticker**: When a match is in progress, show a sticky floating pill at top with live score (via FotMob), tapping opens full match details
- **Match day gradient**: Subtle background shift from the standard dark green to a deeper red-tinted atmosphere on game days

**Style reference**: Motion-Driven + Vibrant Block-based

**Technical notes**:
- FotMob API already integrated (`lib/fotmob.ts`) — extend for live score polling
- `useCountdown` hook exists — can be expanded for the hero countdown
- Background gradient can be toggled via a CSS class on match days
- Respect `prefers-reduced-motion` for pulsing animations

**Effort**: High | **Impact**: Very High (flagship feature)

---

## 2. Season Progress Dashboard

**Concept**: A new section in the Stats page showing a visual season journey.

**Features**:
- **Heatmap calendar**: A GitHub-style contribution heatmap showing match results across the season — green for wins, yellow for draws, red for losses, empty for no match. Gives an instant visual sense of form streaks
- **Bullet chart KPIs**: Compact bullet charts for key targets (points vs target, goals scored vs last season, clean sheets)
- **Win probability gauge**: A gauge showing the team's current league win rate trending up/down

**Chart types**: Heatmap (calendar), Bullet Chart, Gauge

**Technical notes**:
- All match result data is already available in `events.ts`
- Recharts is already a dependency — can render heatmaps with custom cells
- `calculateStatistics()` in `lib/stats.ts` provides the data needed for KPIs
- Accessible: use patterns/shapes alongside color for the heatmap, include `aria-label` summaries

**Effort**: Medium | **Impact**: Medium (visual delight)

---

## 3. Typography Refresh — Athletic Identity

**Concept**: Switch from Montserrat to **Barlow Condensed** (headings) + **Barlow** (body) for a sports feel.

**Details**:
- Condensed headings save horizontal space while feeling bold and action-oriented
- Scores displayed in Barlow Condensed Black for maximum visual impact
- Uppercase tracking on section titles reinforces the athletic brand
- Works perfectly with the existing red/dark color scheme

**Font pairing**: Barlow Condensed 600-700 (headings, scores, labels) / Barlow 400-500 (body, descriptions)

**Google Fonts**: `https://fonts.google.com/share?selection.family=Barlow+Condensed:wght@400;500;600;700|Barlow:wght@300;400;500;600;700`

**Implementation**:
1. Update `app/index.html` `<link>` to load Barlow + Barlow Condensed
2. Update `app/src/index.css` body `font-family` to `'Barlow', 'Inter', sans-serif`
3. Add a heading font utility or Tailwind config for `font-['Barlow_Condensed']`
4. Apply condensed font to: scores, stat numbers, section titles, match headings
5. Keep body text in regular Barlow for readability
6. Test all pages for line-height and spacing adjustments

**Effort**: Low | **Impact**: High (instant brand elevation)

---

## 4. Fan Engagement Features

**Concept**: Social/community features that make the app feel like more than a schedule.

### 4a. Match Predictions
- Before each game, let users tap WIN/DRAW/LOSS to predict the result
- Store predictions in localStorage (or Parse backend)
- After the match, show whether the user was correct + community prediction distribution
- Track prediction accuracy over the season as a "fan score"

### 4b. Form Streak Badges
- Visual badges earned for consecutive wins ("3-match streak", "5-match streak")
- Displayed in a trophy cabinet section on the stats page
- Animated reveal when a new badge is earned
- SVG badge icons matching the team's identity

### 4c. Share Cards
- Beautifully designed match result cards (team logos, score, key stats)
- Generated client-side using HTML Canvas or a pre-styled template
- Share via Web Share API (already used in `EventPopover.tsx`)
- Include match details: score, scorers, venue, date, Nea Salamina branding

### 4d. Season Summary Stories
- End-of-month auto-generated visual summaries (Instagram story-style cards)
- Swipeable deck: "This month: 4W 1D 0L", "Top scorer: ...", "Next: vs ..."
- Share individual story cards to social media

**Technical notes**:
- Parse/Back4App already integrated for storing user data
- Web Share API already implemented
- Could use `html2canvas` or similar for share card generation

**Effort**: High | **Impact**: High (engagement + viral growth)

---

## 5. Immersive Dark Mode Redesign

**Concept**: Evolve from the current dark mode to a cinematic "Modern Dark Cinema" style.

**Features**:
- **Ambient light blobs**: Subtle, slow-moving red-tinted gradient blobs behind the main content using CSS animations, giving depth and atmosphere
- **Glassmorphism header**: Frosted glass effect on the header and bottom nav with `backdrop-filter: blur(20px)` for depth layering
- **Glow accents**: Primary red elements (selected day, active tab, brand accents) get a subtle CSS glow (`box-shadow: 0 0 20px var(--primary-glow)`)
- **Elevated cards**: Cards use a subtle top-edge highlight (`border-top: 1px solid rgba(255,255,255,0.08)`) for material depth

**Style reference**: Modern Dark Cinema + Glassmorphism accents

**Design tokens to add**:
```css
.dark {
  --bg-deep: #020203;
  --bg-base: #050506;
  --bg-elevated: #0a0a0c;
  --surface: rgba(255, 255, 255, 0.05);
  --accent-glow: rgba(224, 37, 32, 0.2);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --glass-blur: 20px;
}
```

**Implementation**:
1. Update dark mode CSS variables in `index.css`
2. Add ambient blob component (2-3 absolutely positioned divs with CSS animation)
3. Apply `backdrop-filter: blur()` to `MobileHeader` and `BottomNav`
4. Add `border-top: 1px solid var(--border-subtle)` to card components
5. Add glow to selected calendar day and active nav item
6. Ensure `prefers-reduced-motion` disables blob animations

**Effort**: Medium | **Impact**: High (premium feel)

---

## 6. Match Timeline View

**Concept**: An alternative to the monthly calendar grid — a vertical timeline showing upcoming and recent matches in chronological order.

**Features**:
- **Swipeable toggle**: Tab or gesture to switch between "Calendar Grid" and "Timeline" views
- **Timeline cards**: Larger, richer cards showing team logos, date, time, venue, and for played matches — score + key moments
- **"Today" anchor**: Timeline automatically scrolls to today's position with a prominent marker line
- **Infinite scroll**: Scroll up for past matches, down for upcoming, with month separator headers
- **Sport filter pills**: Horizontal chip row at top to filter by sport (same as existing filter but more prominent)

**Technical notes**:
- All event data is already available from `events.ts` via `useCalendar` hook
- Could reuse `UpcomingEventCard` as the timeline card base
- `useSwipeNavigation` hook exists — could be used for view toggle
- Consider virtualized list for performance with full season data (~80 events)

**Effort**: Medium | **Impact**: High (alternative UX for different user preferences)

---

## 7. Notification Preferences Overhaul

**Concept**: More granular and visual notification controls.

**Features**:
- **Per-match toggle**: On the match popover, a bell icon to subscribe/unsubscribe from reminders for that specific match
- **Visual time selector**: Instead of fixed "24h & 2h before", a horizontal chip selector where users pick their preferred reminder times (1h, 2h, 6h, 24h, 1 week)
- **Sport-specific notifications**: Separate notification toggles per sport (football, volleyball men, volleyball women) rather than all-or-nothing
- **Notification preview**: Show a mock notification card so users know exactly what they'll receive

**Technical notes**:
- Push subscription managed via `lib/push.ts` and Parse backend
- `preferences.ts` already handles user settings persistence
- Sport filter state already exists in `SettingsPage` — extend for notification granularity
- Reminder hours currently hardcoded in the backend cron — would need backend changes for custom times

**Effort**: Medium (frontend) + Medium (backend) | **Impact**: Medium

---

## 8. Opponent Scouting Cards

**Concept**: When viewing an upcoming match, show a mini scouting report of the opponent.

**Features**:
- **Head-to-head record**: Visual W/D/L bar showing historical results against this opponent
- **Last meeting**: Score and date of the most recent match against them
- **League position badge**: If available via FotMob, show the opponent's current league standing
- **Form comparison**: Side-by-side recent form dots (W/D/L) for both teams

**Technical notes**:
- Head-to-head data already calculated in `lib/stats.ts` (`headToHead` in `FormattedStats`)
- `HeadToHead` component already exists in `components/stats/`
- FotMob league table data available — can extract opponent position
- For upcoming matches, filter `events.ts` for historical matches vs the same opponent
- Display as an additional tab in `EventPopover` for upcoming matches

**Effort**: Medium | **Impact**: High (data already exists, just needs presentation)

---

## Priority Matrix

| Priority | Idea | Effort | Fan Impact | Quick Win? |
|----------|------|--------|------------|------------|
| 1 | Typography refresh (#3) | Low | High | Yes |
| 2 | Immersive dark mode (#5) | Medium | High | Partial |
| 3 | Opponent scouting cards (#8) | Medium | High | No |
| 4 | Season heatmap (from #2) | Low | Medium | Yes |
| 5 | Match timeline view (#6) | Medium | High | No |
| 6 | Share cards (from #4c) | Medium | High | No |
| 7 | Match day live (#1) | High | Very High | No |
| 8 | Fan predictions (from #4a) | High | High | No |

**Recommended approach**: Start with #3 (typography) and #5 (dark mode) as they're style-only changes with no new features to maintain. Then #8 (scouting cards) leverages existing data. #6 (timeline) and #1 (match day) are larger features for future sprints.
