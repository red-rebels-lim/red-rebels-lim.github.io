# Task 04: Match Ratings

## Status: Not Started
## Priority: Low
## Effort: Small
## Impact: Medium
## Category: Fan Engagement & Community

## Description
After a played match, let fans rate the team's performance (1-5 stars). Show aggregate ratings on each match card.

## Requirements
- Star rating widget (1-5) on played match EventPopover
- One rating per device per match
- Aggregate average displayed on EventCard for played matches
- Rating count shown alongside average

## Technical Approach
1. **Parse Classes:**
   - `MatchRating` class: `matchId`, `deviceId`, `rating` (1-5), `createdAt`
2. **Components:**
   - `StarRating.tsx` — interactive 1-5 star input component
   - `RatingBadge.tsx` — small badge showing average rating (e.g., "4.2 / 142 votes")
3. **Logic:**
   - `deviceId` from localStorage (shared with predictions)
   - Only show rating widget for `status === 'played'` matches
   - Cache ratings locally to avoid re-fetching
   - Parse Cloud Function to compute aggregate (or use Parse aggregation queries)
4. **Integration:**
   - `EventPopover.tsx` — add StarRating below score for played matches
   - `EventCard.tsx` — add small RatingBadge on played match cards

## Relevant Files
- `src/components/calendar/EventPopover.tsx`
- `src/components/calendar/EventCard.tsx`
- `src/types/events.ts`

## Dependencies
- Back4App Parse SDK

## Acceptance Criteria
- [ ] Star rating widget appears on played matches
- [ ] One rating per device enforced
- [ ] Aggregate average shown on match cards
- [ ] Rating count displayed
- [ ] Mobile-friendly touch interaction
