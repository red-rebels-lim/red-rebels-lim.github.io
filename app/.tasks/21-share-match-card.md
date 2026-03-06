# Task 21: Share Match Card

## Status: Not Started
## Priority: Medium
## Effort: Small
## Impact: Medium
## Category: Accessibility & UX Polish

## Description
A share button on EventPopover to share a match card image or link via Web Share API (native share sheet on mobile).

## Requirements
- Share button on EventPopover for each match
- Uses Web Share API for native share sheet on mobile
- Fallback: copy link to clipboard on desktop
- Share content: match title, score (if played), date, and link to app

## Technical Approach
1. **Web Share API:**
   ```typescript
   const shareMatch = async (event: CalendarEvent) => {
     const title = `${event.homeTeam} vs ${event.awayTeam}`;
     const text = event.status === 'played'
       ? `${title} - ${event.homeScore}-${event.awayScore}`
       : `${title} - ${event.date}`;
     const url = `https://red-rebels-lim.github.io/#/?match=${event.id}`;

     if (navigator.share) {
       await navigator.share({ title, text, url });
     } else {
       await navigator.clipboard.writeText(`${text}\n${url}`);
     }
   };
   ```
2. **Components:**
   - Add share icon button to `EventPopover.tsx`
   - Show "Copied!" toast on clipboard fallback
3. **Deep Linking (optional):**
   - Add URL parameter support to auto-open a specific match popover
   - `/#/?match=<eventId>` opens the match directly

## Relevant Files
- `src/components/calendar/EventPopover.tsx` — add share button
- `src/types/events.ts` — event type for share data

## Dependencies
- None — Web Share API is built into modern browsers

## Acceptance Criteria
- [ ] Share button visible on EventPopover
- [ ] Native share sheet on mobile (iOS/Android)
- [ ] Clipboard fallback on desktop
- [ ] Share includes match title, score, and app link
- [ ] Analytics event tracked (`trackEvent('share_match')`)
