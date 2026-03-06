# Task 16: Favorite Sport Filter

## Status: Not Started
## Priority: Medium
## Effort: Small
## Impact: Medium
## Category: UX & Personalization

## Description
Let users set a default sport filter (e.g., "only show me volleyball-women events") that persists across sessions via localStorage.

## What Already Exists
- `src/components/filters/FilterPanel.tsx` — sport filter UI with checkboxes
- `src/hooks/useCalendar.ts` — manages filter state including `sports` array
- Sport filtering works correctly during a session

## What's Missing
- Filter state is not persisted to localStorage — resets on page reload
- No "default filter" preference in Settings page

## Technical Approach
1. **localStorage Persistence:**
   - In `useCalendar.ts`, save filter state to localStorage on change
   - On mount, read saved filters from localStorage as initial state
   - Key: `calendar-filters` with JSON value `{ sports: [...], ... }`
2. **Settings Integration (optional):**
   - Add "Default Sport" preference to SettingsPage
   - Let users pick their primary sport interest

## Relevant Files
- `src/hooks/useCalendar.ts` — filter state management (add localStorage read/write)
- `src/components/filters/FilterPanel.tsx` — filter UI (no changes needed)
- `src/pages/SettingsPage.tsx` — optional settings integration

## Dependencies
- None — self-contained change

## Acceptance Criteria
- [ ] Sport filter state persists across page reloads
- [ ] Persisted via localStorage
- [ ] Clear/reset option available
- [ ] Does not break existing filter behavior
