/**
 * Team Tabs Component
 * Navigation tabs for team page sections
 * 
 * Usage:
 * <team-tabs tabs='["overview", "table", "fixtures"]' active-tab="overview"></team-tabs>
 * 
 * Attributes:
 * - tabs: JSON array of tab names (optional, has defaults)
 * - active-tab: Currently active tab name (optional)
 * 
 * Events:
 * - tab-changed: Fired when tab is clicked (detail: { tab: string })
 */

import { BaseTeamComponent } from '../base-component.js';
import { TeamEventBus } from '../event-bus.js';

class TeamTabsComponent extends BaseTeamComponent {
  constructor() {
    super();
    this.tabs = ['overview', 'table', 'fixtures', 'stats', 'transfers', 'history'];
    this.activeTab = 'overview';
  }

  static get observedAttributes() {
    return ['tabs', 'active-tab'];
  }

  connectedCallback() {
    // Parse tabs attribute
    const tabsAttr = this.getAttribute('tabs');
    if (tabsAttr) {
      try {
        this.tabs = JSON.parse(tabsAttr);
      } catch (e) {
        console.warn('Invalid tabs JSON, using defaults');
      }
    }

    // Get active tab
    this.activeTab = this.getAttribute('active-tab') || this.tabs[0] || 'overview';

    this.render();
    this.attachEventListeners();

    // Listen for external tab change requests
    this.listenToTabChanges();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === 'tabs' && newValue) {
        try {
          this.tabs = JSON.parse(newValue);
        } catch (e) {
          console.warn('Invalid tabs JSON');
        }
      } else if (name === 'active-tab') {
        this.activeTab = newValue || this.tabs[0] || 'overview';
      }

      if (this.isConnected) {
        this.render();
        this.attachEventListeners();
      }
    }
  }

  listenToTabChanges() {
    // Listen for programmatic tab changes
    TeamEventBus.listen(TeamEventBus.Events.TAB_CHANGED, (event) => {
      const { tab } = event.detail;
      if (this.tabs.includes(tab)) {
        this.setActiveTab(tab);
      }
    });
  }

  setActiveTab(tab) {
    if (!this.tabs.includes(tab)) {
      console.warn(`Tab "${tab}" not found in tabs list`);
      return;
    }

    this.activeTab = tab;
    this.setAttribute('active-tab', tab);
    this.render();
    this.attachEventListeners();

    // Dispatch event
    TeamEventBus.dispatch(TeamEventBus.Events.TAB_CHANGED, { tab });
    this.dispatchEvent(new CustomEvent('tab-changed', {
      detail: { tab },
      bubbles: true,
      cancelable: true
    }));
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .tabs-nav {
          display: flex;
          gap: var(--spacing-md, 1rem);
          margin-bottom: var(--spacing-xl, 2rem);
          border-bottom: 2px solid var(--color-border, #333333);
          overflow-x: auto;
        }

        .tab-btn {
          padding: var(--spacing-md, 1rem) var(--spacing-lg, 1.5rem);
          background: none;
          border: none;
          color: var(--color-text-secondary, #9f9f9f);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          position: relative;
          transition: color 0.2s ease;
          white-space: nowrap;
          font-family: var(--font-family, 'Inter', sans-serif);
        }

        .tab-btn:hover {
          color: var(--color-text-primary, #ffffff);
        }

        .tab-btn.active {
          color: var(--color-text-primary, #ffffff);
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: var(--color-accent, #00985f);
        }

        @media (max-width: 768px) {
          .tabs-nav {
            gap: var(--spacing-sm, 0.5rem);
          }

          .tab-btn {
            padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
            font-size: 0.875rem;
          }
        }
      </style>

      <nav class="tabs-nav" role="tablist">
        ${this.tabs.map(tab => this.renderTab(tab)).join('')}
      </nav>
    `;
  }

  renderTab(tab) {
    const isActive = tab === this.activeTab;
    const label = this.capitalizeFirst(tab);
    
    return `
      <button 
        class="tab-btn ${isActive ? 'active' : ''}" 
        data-tab="${tab}"
        role="tab"
        aria-selected="${isActive}"
        aria-controls="tabpanel-${tab}"
        id="tab-${tab}">
        ${this.escapeHtml(label)}
      </button>
    `;
  }

  attachEventListeners() {
    const tabButtons = this.shadowRoot.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
      this.addEventListenerWithCleanup(btn, 'click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.setActiveTab(tab);
      });
    });
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Auto-register component
if (!customElements.get('team-tabs')) {
  customElements.define('team-tabs', TeamTabsComponent);
}

export default TeamTabsComponent;

