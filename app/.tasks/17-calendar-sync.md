# Task 17: Google Calendar / Apple Calendar Sync

## Status: Partially Implemented
## Priority: High
## Effort: Medium
## Impact: High
## Category: UX & Personalization

## Description
Beyond the existing ICS export, add a subscribable calendar URL (`.ics` feed) that auto-updates as new events are added by the scraper.

## What Already Exists
- `src/lib/ics-export.ts` — generates and downloads a one-time `.ics` file with all events
- Export button in Navbar dropdown menu and mobile sheet

## What's Missing
- Subscribable `.ics` feed URL that auto-updates
- Hosted `.ics` file that regenerates when events change
- Instructions for users on how to subscribe in Google Calendar / Apple Calendar

## Technical Approach
1. **Static ICS Feed:**
   - Generate `calendar.ics` as part of the build/deploy pipeline
   - Host at `https://red-rebels-lim.github.io/calendar.ics`
   - Regenerate whenever the scraper updates event data
2. **Build Integration:**
   - Add a build script that generates `calendar.ics` from event data
   - Include in GitHub Actions deploy workflow
3. **User-Facing:**
   - Add "Subscribe" button alongside "Export" in the Navbar
   - Show instructions modal: "Copy this URL and paste in Google Calendar > Add by URL"
   - Provide direct links: `webcal://red-rebels-lim.github.io/calendar.ics`
4. **Per-Sport Feeds (optional):**
   - `calendar-football.ics`, `calendar-volleyball-men.ics`, `calendar-volleyball-women.ics`

## Relevant Files
- `src/lib/ics-export.ts` — existing ICS generation logic (reuse for feed generation)
- `src/components/layout/Navbar.tsx` — add Subscribe button
- `.github/workflows/deploy.yml` — add ICS generation step
- `scripts/` — new build script for ICS generation

## Dependencies
- GitHub Pages hosting (already in place)
- Scraper pipeline (to trigger ICS regeneration)

## Acceptance Criteria
- [ ] Hosted `.ics` file at a stable URL
- [ ] File auto-updates when events change (via deploy pipeline)
- [ ] "Subscribe" button with user instructions
- [ ] `webcal://` link for one-click calendar subscription
- [ ] Works with Google Calendar, Apple Calendar, Outlook
