# Task 01: Fan Wall / Match Day Chat

## Status: Not Started
## Priority: Low
## Effort: Large
## Impact: High
## Category: Fan Engagement & Community

## Description
A simple per-match comment section where fans can post reactions before, during, and after games. Store in Back4App (Parse already integrated). Could start as anonymous with optional nicknames.

## Requirements
- Per-match comment/reaction feed accessible from EventPopover or a dedicated match detail view
- Real-time or near-real-time updates (Parse LiveQuery or polling)
- Anonymous posting with optional nickname support
- Basic moderation capabilities (report/flag inappropriate content)
- Chronological display of comments with timestamps
- Mobile-friendly scrollable chat interface

## Technical Approach
1. **Parse Classes:**
   - Create `MatchComment` class in Back4App with fields: `matchId`, `nickname`, `message`, `createdAt`, `flagged`
   - Set up ACLs for public read, public create, admin-only delete
2. **Components:**
   - `MatchChat.tsx` — main chat container with message list and input form
   - `ChatMessage.tsx` — individual message bubble component
   - `ChatInput.tsx` — text input with nickname field and submit button
3. **Integration:**
   - Add chat section to `EventPopover` or create a new match detail page
   - Use Parse LiveQuery for real-time updates (or poll every 10s as simpler alternative)
4. **Moderation:**
   - Client-side: basic profanity filter
   - Server-side: Cloud Function to flag/remove reported messages

## Relevant Files
- `src/components/calendar/EventPopover.tsx` — where chat would be integrated
- `src/components/calendar/EventCard.tsx` — entry point to match details
- Back4App dashboard for Parse class creation

## Dependencies
- Back4App Parse SDK (already integrated via push notifications)
- Parse LiveQuery setup on Back4App (optional, for real-time)

## Acceptance Criteria
- [ ] Users can post comments on any match
- [ ] Comments appear in real-time or near-real-time
- [ ] Anonymous posting works with optional nicknames
- [ ] Comments persist across sessions
- [ ] Mobile-friendly UI
- [ ] Basic content moderation in place
