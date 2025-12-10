/**
 * Components Loader
 * Convenience utility to load all team components at once
 * 
 * Usage:
 * <script type="module" src="assets/components/micro-frontends/components-loader.js"></script>
 * 
 * This will register all components and make them available for use.
 * 
 * Individual components can also be loaded separately:
 * <script type="module" src="assets/components/micro-frontends/team-header.js"></script>
 */

// Import all components to register them
import './team-header/team-header.js';
import './team-tabs/team-tabs.js';
import './team-table/team-table.js';
import './team-fixtures/team-fixtures.js';
import './team-form/team-form.js';
import './team-next-match/team-next-match.js';
import './team-stadium/team-stadium.js';
import './calendar/calendar.js';

// Export a function to check if all components are loaded
export function areComponentsLoaded() {
  const components = [
    'team-header',
    'team-tabs',
    'team-table',
    'team-fixtures',
    'team-form',
    'team-next-match',
    'team-stadium',
    'team-calendar'
  ];

  return components.every(name => customElements.get(name) !== undefined);
}

// Log when all components are loaded
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (areComponentsLoaded()) {
        console.log('✅ All team components loaded successfully');
      } else {
        console.warn('⚠️ Some team components failed to load');
      }
    });
  } else {
    if (areComponentsLoaded()) {
      console.log('✅ All team components loaded successfully');
    } else {
      console.warn('⚠️ Some team components failed to load');
    }
  }
}

export default {
  areComponentsLoaded
};

