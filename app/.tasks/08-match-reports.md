# Task 08: Match Reports / Post-Match Summary

## Status: Not Started
## Priority: Low
## Effort: Medium
## Impact: Medium
## Category: Content & Media

## Description
Auto-generate or manually add brief match recaps for played games. Could be AI-assisted using the score data and event context.

## Requirements
- Short match recap text for played matches (2-3 paragraphs)
- Display in EventPopover below the score
- Could be AI-generated from available data (score, competition, teams, date)
- Manual override for admin-curated content
- Support for both English and Greek (i18n)

## Technical Approach
1. **Data Storage:**
   - Add `report` field to event data (or separate Parse class `MatchReport`)
   - Fields: `matchId`, `reportEN`, `reportEL`, `createdAt`
2. **AI Generation (optional):**
   - Cloud Function that uses OpenAI/Claude API to generate recap from match data
   - Triggered after score is updated (post-match scraper run)
3. **Components:**
   - `MatchReport.tsx` — formatted report display with expandable sections
4. **Integration:**
   - Add report section to `EventPopover` for played matches
   - "Read more" expand/collapse for longer reports

## Relevant Files
- `src/components/calendar/EventPopover.tsx`
- `src/types/events.ts` — would need `report` field

## Dependencies
- AI API (optional, for auto-generation)
- Back4App for report storage

## Acceptance Criteria
- [ ] Match reports displayed for played matches
- [ ] Bilingual support (EN/EL)
- [ ] Expandable/collapsible in EventPopover
- [ ] Admin can manually add/edit reports
