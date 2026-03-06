# Task 15: Theme Switcher (Light/Dark/Auto)

## Status: DONE
## Priority: N/A
## Effort: Small
## Impact: High
## Category: UX & Personalization

## Description
The app has light mode CSS already defined but defaults to dark. Add a toggle in Settings to let users choose light mode, dark mode, or system preference.

## Implementation
- `src/hooks/useTheme.ts` — implements light/dark toggle with localStorage persistence
- Theme toggle button in Navbar (desktop icon button + mobile sheet button)
- Applies `dark` class to document root element
- Persisted to localStorage across sessions

## Remaining Enhancement (Optional)
- "Auto" mode that follows system preference via `prefers-color-scheme` media query
- Currently only manual light/dark toggle, no "follow system" option

## Relevant Files
- `src/hooks/useTheme.ts`
- `src/components/layout/Navbar.tsx` (lines 181-189 desktop, 221-229 mobile)
