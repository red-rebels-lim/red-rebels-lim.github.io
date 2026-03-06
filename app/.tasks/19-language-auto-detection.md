# Task 19: Language Auto-Detection

## Status: DONE
## Priority: Medium
## Effort: Small
## Impact: Medium
## Category: UX & Personalization

## Description
Detect browser language and auto-set Greek or English on first visit (currently defaults to English).

## What Already Exists
- `src/i18n/index.ts` — i18next configuration with EN and EL translations
- Language toggle in Navbar (EN/GR button)
- Language persisted to localStorage as `language` key

## What's Missing
- No `navigator.language` detection on first visit
- Falls back to English regardless of browser settings

## Technical Approach
1. **In `src/i18n/index.ts`:**
   - Check if `localStorage.getItem('language')` exists
   - If not (first visit): check `navigator.language` or `navigator.languages`
   - If browser language starts with `el`, set language to `el`
   - Otherwise default to `en`
   - Save detected language to localStorage
2. **Implementation (approximately 5-10 lines):**
   ```typescript
   const savedLang = localStorage.getItem('language');
   let initialLang = 'en';
   if (savedLang) {
     initialLang = savedLang === 'gr' ? 'el' : savedLang;
   } else {
     const browserLang = navigator.language || navigator.languages?.[0] || 'en';
     initialLang = browserLang.startsWith('el') ? 'el' : 'en';
   }
   ```

## Relevant Files
- `src/i18n/index.ts` — single file change

## Dependencies
- None

## Acceptance Criteria
- [x] Greek browser users see Greek on first visit
- [x] English browser users see English on first visit
- [x] Manual language toggle still works and persists
- [x] Existing users with saved preference are unaffected
- [x] No breaking changes to i18n behavior
