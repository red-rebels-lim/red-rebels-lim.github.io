# TASK-11: Redesign Settings Page with Full Functionality

**Status:** done
**Depends on:** TASK-10
**Estimated scope:** Large

## Objective

Redesign the Settings page to match the new mockup in `mockups/red_rebels_settings_screen/` and consolidate all app settings and tools into this single page. The current Settings page only handles push notification preferences. The new design adds Display settings, Sports Filters, and an About section - absorbing functionality that currently lives in the Navbar (language toggle, theme toggle, export, print, install PWA).

## Design Reference

- **Mockup screenshot:** `mockups/red_rebels_settings_screen/screen.png`
- **Mockup HTML:** `mockups/red_rebels_settings_screen/code.html`
- **Additional reference:** `mockups/settings-bottom-nav.png`, `mockups/settings-bottom-nav.html`

## Design Specifications (from mockup)

### Color Palette
- **Primary red:** `#dc2828`
- **Dark background:** `#0f172a`
- **Card dark:** `#1e293b`
- **Light mode:** White cards on `#f8f6f6` background

### Header
- **Back arrow** (left): `arrow_back` icon, navigates back to previous page (Calendar)
- **Title** (center): "Red Rebels Calendar" - `text-lg font-bold` centered
- **Theme toggle** (right): `light_mode` / `dark_mode` icon in a circular button (`h-10 w-10 rounded-full bg-card-dark`)
- Bottom border: `border-card-dark`

### Section Layout Pattern
Each section follows a consistent pattern:
- **Section header:** `text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 ml-1`
- **Card container:** `bg-white dark:bg-card-dark rounded-xl overflow-hidden shadow-sm dark:shadow-none border border-slate-200 dark:border-transparent`
- **Row items:** `flex items-center gap-4 px-4 min-h-[56px] justify-between`
- **Row dividers:** `border-b border-slate-100 dark:border-slate-700/50` (between rows within a card, not on last row)
- **Icon container:** `size-10 rounded-lg flex items-center justify-center` with contextual backgrounds
- **Toggle switches:** Custom CSS toggle `h-[31px] w-[51px] rounded-full` with `bg-primary` when checked

### Section 1: NOTIFICATIONS

Preserves ALL existing push notification functionality from the current SettingsPage, but with the new visual design.

**Row 1 - Match Reminders (toggle):**
- Icon: `notifications` in `bg-primary/10 text-primary` container
- Label: "Match Reminders"
- Toggle switch (maps to existing subscribe/unsubscribe flow)
- When toggled ON: triggers `subscribeToPush()` flow (permission request, service worker registration, Parse subscription)
- When toggled OFF: triggers `unsubscribeFromPush()` with confirmation dialog

**Row 2 - Reminder Time (selector):**
- Icon: `schedule` in `bg-slate-100 dark:bg-slate-800 text-slate-500` container
- Label: "Reminder Time"
- Value display: "30 mins before" (right side, with chevron)
- Tapping opens a selector/sheet to choose from: 1 hour, 30 mins, 15 mins, or custom options
- Maps to existing `reminderHours` preference in NotifPrefs
- Only visible/enabled when Match Reminders is ON

**Existing notification preferences to preserve (may be hidden in an expanded/advanced section or integrated):**
- `disabled` - Master pause toggle (currently "Pause All Notifications")
- `notifyNewEvents` - New match notifications toggle
- `notifyTimeChanges` - Time change notifications toggle
- `notifyScoreUpdates` - Score update notifications toggle
- `enabledSports` - Per-sport notification filter (football-men, volleyball-men, volleyball-women)
- `reminderHours` - Multiple reminder time selection (24h, 12h, 2h, 1h before)

**Implementation note:** The mockup simplifies the notification UI compared to the current implementation. Either:
- (A) Show the simplified view by default with an "Advanced" expandable section for the full preferences, OR
- (B) Map the mockup's single "Match Reminders" toggle to the subscribe/unsubscribe flow, and "Reminder Time" to the primary reminder hour selection, keeping the advanced prefs accessible via a sub-page or expandable section

### Section 2: DISPLAY

**Row 1 - Language (selector):**
- Icon: `language` in `bg-slate-100 dark:bg-slate-800` container
- Label: "Language"
- Value display: "English" or "Greek" (right side, with chevron)
- Tapping opens a selector to switch between EN and EL
- **Migrates from:** Navbar language toggle button (EN/GR button)
- Uses existing `i18next.changeLanguage()` and `localStorage.setItem('language', ...)`
- Tracks `toggle_language` analytics event

**Row 2 - Dark Theme (toggle):**
- Icon: `dark_mode` in `bg-slate-100 dark:bg-slate-800` container
- Label: "Dark Theme"
- Toggle switch reflecting current theme state
- **Migrates from:** Navbar theme toggle (moon/sun emoji button)
- Uses existing `useTheme()` hook: `{ isDark, toggle }`
- Tracks `toggle_theme` analytics event
- The header also has a theme toggle icon for quick access (both should stay in sync)

### Section 3: SPORTS FILTER

**Row 1 - Football (toggle):**
- Icon: `sports_soccer` in `bg-primary/10 text-primary` container
- Label: "Football"
- Toggle switch (default: ON)
- When toggled, filters the calendar to show/hide football events

**Row 2 - Volleyball (toggle):**
- Icon: `sports_volleyball` in `bg-primary/10 text-primary` container
- Label: "Volleyball"
- Toggle switch (default: ON)
- When toggled, filters the calendar to show/hide volleyball events

**Implementation:**
- This is a **global sport filter** that persists across sessions (stored in localStorage)
- Different from the CalendarPage's FilterPanel which is session-based and more granular (sport, location, status, search)
- The global sport filter should be applied as a base filter in `useCalendar` hook, so events for disabled sports never appear
- When both are disabled, show a warning or keep at least one enabled
- Also affects which sports appear in the Stats page tabs
- Persist to localStorage key (e.g., `enabledSports` or `sportFilter`)
- Consider also syncing with the notification `enabledSports` preference if push is subscribed

### Section 4: ABOUT

**Row 1 - App Version (info):**
- Icon: `info` in `bg-slate-100 dark:bg-slate-800` container
- Label: "App Version"
- Value: version string from `package.json` (e.g., "v2.5.0") - use `import.meta.env` or a build-time constant
- Non-interactive (no chevron, no click action)

**Row 2 - View on GitHub (link):**
- Icon: `code` in `bg-slate-100 dark:bg-slate-800` container
- Label: "View on GitHub" in `text-primary`
- Right icon: `open_in_new`
- Links to the GitHub repository URL: `https://github.com/red-rebels-lim/red-rebels-lim.github.io`
- Opens in new tab (`target="_blank" rel="noopener noreferrer"`)

### Footer
- "Made with heart for Nea Salamina" - `text-xs text-slate-500` centered
- Below the About section with padding

### Tools Migration (from Navbar)

The following tools currently live in the Navbar's dropdown/hamburger menu and should be accessible from the Settings page:

**Export Calendar (.ics):**
- Add a row in a new "TOOLS" section or integrate into existing sections
- Icon: `download` or `calendar_month`
- Label: "Export Calendar"
- Triggers existing `exportToCalendar()` from `lib/ics-export.ts`
- Tracks `export_calendar` analytics event

**Print Calendar:**
- Icon: `print`
- Label: "Print Calendar"
- Triggers `window.print()`
- Tracks `print_calendar` analytics event

**Install App (PWA):**
- Icon: `install_mobile` or `download`
- Label: "Install App"
- Only shown when PWA install is available (`beforeinstallprompt` event captured)
- Triggers the PWA install prompt
- Tracks `install_app` analytics event

**Suggested layout:** Add a "TOOLS" section between "SPORTS FILTER" and "ABOUT" sections:
```
TOOLS
├── Export Calendar (.ics)     [download icon]
├── Print Calendar             [print icon]
└── Install App                [install icon, conditional]
```

## Implementation Steps

### Step 1: Create Reusable Settings Components

Create shared building blocks for the settings UI:

**File:** `app/src/components/settings/SettingsSection.tsx`
- Props: `{ title: string; children: ReactNode }`
- Renders the section header + card container pattern

**File:** `app/src/components/settings/SettingsRow.tsx`
- Props: `{ icon: string; iconBg?: string; label: string; value?: string; hasChevron?: boolean; onClick?: () => void; trailing?: ReactNode }`
- Renders a single row within a settings card
- Supports: toggle switch, value + chevron, plain info display, link

**File:** `app/src/components/settings/SettingsToggle.tsx`
- Props: `{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }`
- The custom iOS-style toggle switch from the mockup: `h-[31px] w-[51px] rounded-full`
- Uses CSS `has-[:checked]` for styling (as in the mockup HTML)

### Step 2: Create Settings Header
**File:** `app/src/components/settings/SettingsHeader.tsx`
- Back button (navigates to `/` using `useNavigate()`)
- Centered title "Red Rebels Calendar"
- Theme toggle button (right side, circular)
- Uses `useTheme()` hook

### Step 3: Rewrite SettingsPage
**File:** `app/src/pages/SettingsPage.tsx`

Complete rewrite organized into sections:

```tsx
<SettingsHeader />
<main>
  <NotificationsSection />    // Match Reminders + Reminder Time
  <DisplaySection />          // Language + Dark Theme
  <SportsFilterSection />     // Football + Volleyball toggles
  <ToolsSection />            // Export + Print + Install
  <AboutSection />            // Version + GitHub link
  <Footer />                  // "Made with heart..."
</main>
```

Each section can be a separate component or inline within SettingsPage.

### Step 4: Implement Notifications Section
- Reuse existing push subscription logic from current SettingsPage
- `subscribeToPush()`, `unsubscribeFromPush()`, `getSubscriptionStatus()` from `lib/push.ts`
- `getPreferences()`, `updatePreferences()` from `lib/preferences.ts`
- Match Reminders toggle: maps to subscribe/unsubscribe (with confirmation on unsubscribe)
- Reminder Time: maps to `reminderHours` in NotifPrefs
- Show status indicators (denied, unsupported) as subtle badges or disabled states
- Keep iOS tip for users who need to add to home screen
- Preserve the debounced save (800ms) for preference changes

### Step 5: Implement Display Section
- **Language selector:**
  - Use a Radix Select or a bottom sheet on mobile to pick EN/EL
  - Call `i18n.changeLanguage()` and `localStorage.setItem('language', ...)`
  - Display current language name (not code): "English" or "Greek"
- **Dark Theme toggle:**
  - Use `useTheme()` hook
  - Toggle syncs with the header theme button (both reflect same state)

### Step 6: Implement Sports Filter Section
- Create a new hook or utility for global sport filter:
  **File:** `app/src/hooks/useSportFilter.ts` (or add to existing preferences)
  ```typescript
  interface SportFilter {
    football: boolean;
    volleyball: boolean;
  }
  ```
- Store in localStorage (key: `sportFilter`)
- Default: both enabled
- Expose via React context or a shared hook so CalendarPage and StatsPage can read it
- Update `useCalendar` hook to respect the global sport filter as a base filter layer
- Prevent disabling both sports simultaneously (show toast/warning, keep last one enabled)

### Step 7: Implement Tools Section
- **Export Calendar:** Call `exportToCalendar()` from `lib/ics-export.ts`
- **Print Calendar:** Call `window.print()`
- **Install App:** Listen for `beforeinstallprompt` event (same logic currently in Navbar)
  - Move the PWA install prompt capture to a shared hook: `app/src/hooks/usePwaInstall.ts`
  - Expose `{ canInstall: boolean; promptInstall: () => void }`
  - Use in both Settings page and optionally keep in desktop Navbar
- Track all actions with existing analytics (`trackEvent()`)

### Step 8: Implement About Section
- **App Version:** Import version from `package.json` or define as a constant
  - Option: `import { version } from '../../../package.json'` or use Vite's `define` config
  - Display as "v{version}"
- **View on GitHub:** External link to repo with `target="_blank"`

### Step 9: i18n Keys
Add translation keys to both `en.json` and `el.json`:

```json
{
  "settings": {
    "notifications": "Notifications",
    "matchReminders": "Match Reminders",
    "reminderTime": "Reminder Time",
    "minutesBefore": "{{count}} mins before",
    "display": "Display",
    "language": "Language",
    "languageEnglish": "English",
    "languageGreek": "Greek",
    "darkTheme": "Dark Theme",
    "sportsFilter": "Sports Filter",
    "football": "Football",
    "volleyball": "Volleyball",
    "tools": "Tools",
    "exportCalendar": "Export Calendar",
    "printCalendar": "Print Calendar",
    "installApp": "Install App",
    "about": "About",
    "appVersion": "App Version",
    "viewOnGithub": "View on GitHub",
    "madeWith": "Made with love for Nea Salamina"
  }
}
```

Note: Some of these keys may already exist under different paths - check existing translations first and reuse where possible.

### Step 10: Clean Up Navbar
After TASK-10 removes mobile nav links and this task moves tools to Settings:
- Remove language toggle from Navbar (now in Settings Display section)
- Remove tools dropdown items that moved to Settings (export, print, install)
- Keep the desktop Navbar functional with: brand, nav links (Calendar/Stats/Settings), theme toggle, filters button (calendar only)
- The Navbar's filter toggle button on desktop should remain

### Step 11: Accessibility
- All toggles: proper `role="switch"` with `aria-checked`
- All clickable rows: `role="button"` or use actual `<button>` elements
- Section headers: use semantic heading elements or `role="heading"`
- Back button: `aria-label="Go back"`
- Theme toggle: `aria-label="Toggle dark mode"`
- Language selector: proper ARIA for select/combobox pattern
- External links: `aria-label` indicating new window
- All interactive elements: minimum 44px touch target
- Keyboard navigation: Tab through all controls, Enter/Space to activate

### Step 12: Light/Dark Theme Support
- All new components must support both themes using the established pattern
- Card backgrounds: `bg-white dark:bg-card-dark`
- Text colors: `text-slate-900 dark:text-slate-100`
- Muted text: `text-slate-500 dark:text-slate-400`
- Borders: `border-slate-200 dark:border-transparent` (cards), `border-slate-100 dark:border-slate-700/50` (dividers)
- Icon backgrounds: `bg-slate-100 dark:bg-slate-800`
- Toggle track: `bg-slate-200 dark:bg-slate-700` (off), `bg-primary` (on)
- Test both themes visually after implementation

### Step 13: Testing
- Test all toggle interactions (theme, notifications, sport filters)
- Test language switching updates the entire page
- Test push notification subscribe/unsubscribe flow
- Test sport filter persistence across page navigations
- Test that export/print/install buttons trigger correct actions
- Test back button navigation
- Test that the SettingsPage renders correctly in both themes
- Mock push notification APIs and Parse backend as in existing tests

## Edge Cases

- **Push notifications unsupported:** Hide or disable the Match Reminders toggle with an explanation
- **Push permission denied:** Show denied state, link to browser settings
- **iOS without home screen:** Show iOS-specific tip for push notification limitations
- **PWA already installed:** Hide the Install App option
- **PWA not available:** Hide the Install App row entirely
- **Both sport filters disabled:** Prevent this state - when user tries to disable the last one, show a toast "At least one sport must be enabled" and keep the toggle on
- **Offline state:** Settings that require Parse (notifications) should show graceful error; localStorage-based settings (theme, language, sport filter) should always work
- **Theme toggle in header vs Display section:** Both must stay in sync - they use the same `useTheme()` hook so this should be automatic

## Acceptance Criteria

- [ ] Settings page matches mockup design with all four sections (Notifications, Display, Sports Filter, About)
- [ ] Plus a Tools section for Export/Print/Install
- [ ] Header has back button, centered title, and theme toggle
- [ ] Match Reminders toggle subscribes/unsubscribes to push notifications
- [ ] Reminder Time selector allows choosing notification timing
- [ ] All existing notification preferences are preserved and accessible
- [ ] Language selector switches between English and Greek
- [ ] Dark Theme toggle switches theme (synced with header toggle)
- [ ] Football and Volleyball sport filter toggles work and persist
- [ ] Sport filter affects calendar event display globally
- [ ] Export Calendar triggers .ics download
- [ ] Print Calendar triggers browser print
- [ ] Install App shows only when PWA install is available
- [ ] App Version displays correct version number
- [ ] View on GitHub opens repo in new tab
- [ ] "Made with heart for Nea Salamina" footer renders
- [ ] Light and dark themes both render correctly
- [ ] All text is translated (EN/EL)
- [ ] All interactive elements are accessible (ARIA, keyboard, touch targets)
- [ ] Navbar is cleaned up: language toggle and tools removed (moved here)
- [ ] Existing tests pass, new tests added
- [ ] Build passes (`npm run lint && npm test && npm run build`)

## Files to Create
- `app/src/components/settings/SettingsSection.tsx`
- `app/src/components/settings/SettingsRow.tsx`
- `app/src/components/settings/SettingsToggle.tsx`
- `app/src/components/settings/SettingsHeader.tsx`
- `app/src/hooks/useSportFilter.ts`
- `app/src/hooks/usePwaInstall.ts`

## Files to Modify
- `app/src/pages/SettingsPage.tsx` - Complete rewrite
- `app/src/components/layout/Navbar.tsx` - Remove migrated controls
- `app/src/hooks/useCalendar.ts` - Integrate global sport filter
- `app/src/i18n/en.json` - New translation keys
- `app/src/i18n/el.json` - New translation keys
- `app/src/App.tsx` - Potentially add SportFilter context provider
- `app/src/__tests__/` - New and updated tests
