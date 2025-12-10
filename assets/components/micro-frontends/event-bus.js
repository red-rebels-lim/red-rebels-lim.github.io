/**
 * Event Bus Utility
 * Provides centralized event communication between components
 */
export class TeamEventBus {
  /**
   * Dispatch a custom event
   * @param {string} eventName - Name of the event
   * @param {object} detail - Event data
   * @param {boolean} bubbles - Whether event bubbles (default: true)
   */
  static dispatch(eventName, detail = {}, bubbles = true) {
    const event = new CustomEvent(eventName, { 
      detail,
      bubbles,
      cancelable: true
    });
    window.dispatchEvent(event);
    return event;
  }

  /**
   * Listen to an event
   * @param {string} eventName - Name of the event
   * @param {function} callback - Callback function
   * @param {object} options - Event listener options
   * @returns {function} Unsubscribe function
   */
  static listen(eventName, callback, options = {}) {
    window.addEventListener(eventName, callback, options);
    
    // Return unsubscribe function
    return () => {
      window.removeEventListener(eventName, callback, options);
    };
  }

  /**
   * Remove event listener
   * @param {string} eventName - Name of the event
   * @param {function} callback - Callback function
   */
  static remove(eventName, callback) {
    window.removeEventListener(eventName, callback);
  }

  /**
   * Listen to event once
   * @param {string} eventName - Name of the event
   * @param {function} callback - Callback function
   * @returns {Promise} Promise that resolves with event detail
   */
  static once(eventName, callback) {
    return new Promise((resolve) => {
      const handler = (event) => {
        if (callback) {
          callback(event);
        }
        resolve(event.detail);
        window.removeEventListener(eventName, handler);
      };
      window.addEventListener(eventName, handler);
    });
  }

  /**
   * Common event names
   */
  static Events = {
    TEAM_DATA_LOADED: 'team-data-loaded',
    TAB_CHANGED: 'tab-changed',
    TEAM_SELECTED: 'team-selected',
    FIXTURE_SELECTED: 'fixture-selected',
    MATCH_SELECTED: 'match-selected',
    SYNC_CLICKED: 'sync-clicked',
    FOLLOW_CLICKED: 'follow-clicked',
    DATA_LOADED: 'data-loaded',
    LOADING_CHANGED: 'loading-changed',
    ERROR: 'error'
  };
}

// Export default for convenience
export default TeamEventBus;

