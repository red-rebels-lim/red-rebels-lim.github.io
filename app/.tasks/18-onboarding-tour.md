# Task 18: Onboarding Tour

## Status: DONE
## Priority: Low
## Effort: Small
## Impact: Medium
## Category: UX & Personalization

## Description
A first-visit guided tour highlighting key features: swipe navigation, filters, stats page, push notifications. Improve feature discovery.

## Requirements
- Triggered on first visit (check localStorage flag)
- Step-by-step tooltips highlighting key UI elements
- Steps: swipe to change months, open filters, view stats, enable notifications
- Skip/dismiss option
- Does not show again after completion or dismissal

## Technical Approach
1. **Library Options:**
   - `react-joyride` — popular React tour library
   - `driver.js` — lightweight, no-dependency tour library
   - Custom implementation with portals and CSS highlights
2. **Tour Steps:**
   - Step 1: "Swipe left/right to navigate months" (highlight calendar grid)
   - Step 2: "Filter by sport" (highlight filter button)
   - Step 3: "View team statistics" (highlight stats nav link)
   - Step 4: "Enable push notifications" (highlight settings nav link)
   - Step 5: "Export to your calendar" (highlight export button)
3. **State Management:**
   - `localStorage.getItem('onboarding-completed')` — check on mount
   - Set flag after tour completion or skip
4. **Components:**
   - `OnboardingTour.tsx` — wrapper component with tour configuration
   - Render in `App.tsx` or `CalendarPage.tsx`

## Relevant Files
- `src/App.tsx` or `src/pages/CalendarPage.tsx` — mount point
- `src/components/layout/Navbar.tsx` — highlight targets

## Dependencies
- Tour library (react-joyride or driver.js) — new dependency

## Acceptance Criteria
- [x] Tour triggers on first visit
- [x] 5 steps highlighting key features (swipe, filters, stats, settings, export)
- [x] Skip/dismiss option
- [x] Does not show again after completion
- [x] Mobile-friendly tooltips (centered modal, 90vw max)
- [x] Bilingual support (EN/EL)
