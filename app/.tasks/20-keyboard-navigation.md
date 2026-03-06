# Task 20: Keyboard Navigation

## Status: DONE
## Priority: Low
## Effort: Small
## Impact: Medium
## Category: Accessibility & UX Polish

## Description
Add keyboard shortcuts for month navigation (left/right arrows), jump to today (T key), and toggle filters (F key).

## Requirements
- Left/Right arrow keys: navigate between months
- `T` key: jump to today
- `F` key: toggle filter panel
- `Escape`: close any open popover/modal
- Shortcuts should not interfere with text input fields
- Visual hint showing available shortcuts (optional)

## Technical Approach
1. **Hook:**
   - Create `useKeyboardShortcuts.ts` hook
   - Register `keydown` event listener on `window`
   - Ignore shortcuts when focus is on input/textarea elements
   - Clean up listener on unmount
2. **Implementation:**
   ```typescript
   useEffect(() => {
     const handler = (e: KeyboardEvent) => {
       if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
       switch (e.key) {
         case 'ArrowLeft': onPrevious?.(); break;
         case 'ArrowRight': onNext?.(); break;
         case 't': case 'T': onToday?.(); break;
         case 'f': case 'F': onToggleFilters?.(); break;
       }
     };
     window.addEventListener('keydown', handler);
     return () => window.removeEventListener('keydown', handler);
   }, [onPrevious, onNext, onToday, onToggleFilters]);
   ```
3. **Integration:**
   - Use hook in `CalendarPage.tsx` with existing callback props

## Relevant Files
- `src/pages/CalendarPage.tsx` — integrate keyboard shortcuts
- `src/hooks/` — new `useKeyboardShortcuts.ts` hook

## Dependencies
- None

## Acceptance Criteria
- [x] Arrow keys navigate months on calendar page
- [x] `T` jumps to today
- [x] `F` toggles filters
- [x] Shortcuts disabled when typing in input fields
- [x] No conflict with browser default shortcuts
