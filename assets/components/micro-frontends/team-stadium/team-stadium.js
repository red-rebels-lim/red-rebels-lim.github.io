/**
 * Team Stadium Component
 * Displays stadium information
 * 
 * Usage:
 * <team-stadium team-id="8590"></team-stadium>
 * 
 * Attributes:
 * - team-id: Team ID (required)
 * - api-url: API endpoint URL (optional, has default)
 * - country-code: Country code (optional, default: CYP)
 * 
 * Events:
 * - stadium-data-loaded: Fired when stadium data is loaded
 */

import { BaseTeamComponent } from '../base-component.js';
import { TeamEventBus } from '../event-bus.js';
import { TeamDataService } from '../data-service.js';

class TeamStadiumComponent extends BaseTeamComponent {
  constructor() {
    super();
    this.teamId = null;
    this.apiUrl = null;
  }

  static get observedAttributes() {
    return ['team-id', 'api-url', 'country-code'];
  }

  connectedCallback() {
    this.teamId = this.getAttribute('team-id');
    this.apiUrl = this.getAttribute('api-url') || this.getDefaultApiUrl();
    
    this.render();
    if (this.teamId) {
      this.fetchData();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      const propName = this.attributeToProperty(name);
      this[propName] = newValue;
      
      if (name === 'api-url' && !newValue) {
        this.apiUrl = this.getDefaultApiUrl();
      }
      
      if (this.isConnected && this.teamId) {
        this.render();
        this.fetchData();
      }
    }
  }

  getDefaultApiUrl() {
    const teamId = this.teamId || this.getAttribute('team-id') || '8590';
    const countryCode = this.getAttribute('country-code') || 'CYP';
    return `https://www.fotmob.com/api/data/teams?id=${teamId}&ccode3=${countryCode}`;
  }

  async fetchData() {
    if (!this.teamId) {
      this.renderError('Team ID is required');
      return;
    }

    try {
      const data = await TeamDataService.getTeamData(this.teamId, this.apiUrl);
      this.setData(data);
      this.render();
      
      TeamEventBus.dispatch('stadium-data-loaded', { 
        teamId: this.teamId,
        data 
      });
    } catch (error) {
      this.renderError('Failed to load stadium data');
      console.error('Error fetching stadium data:', error);
    }
  }

  getStadiumInfo() {
    const data = this.getData();
    return data?.overview?.venue;
  }

  render() {
    const data = this.getData();
    const isLoading = this.isLoading();
    const hasError = this.hasError();
    const venue = this.getStadiumInfo();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .card {
          background-color: var(--color-bg-card, #1a1a1a);
          border-radius: var(--radius-lg, 0.75rem);
          padding: var(--spacing-lg, 1.5rem);
          border: 1px solid var(--color-border, #333333);
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text-primary, #ffffff);
          margin-bottom: var(--spacing-lg, 1.5rem);
          font-family: var(--font-family, 'Inter', sans-serif);
        }

        .stadium-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg, 1.5rem);
        }

        .stadium-name {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: var(--spacing-sm, 0.5rem);
        }

        .stadium-location {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm, 0.5rem);
          color: var(--color-text-secondary, #9f9f9f);
          font-size: 0.875rem;
        }

        .stadium-location svg {
          flex-shrink: 0;
        }

        .stadium-stats {
          display: flex;
          gap: var(--spacing-xl, 2rem);
          padding-top: var(--spacing-lg, 1.5rem);
          border-top: 1px solid var(--color-border, #333333);
        }

        .stadium-stat {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs, 0.25rem);
        }

        .stadium-stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stadium-stat-label {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #9f9f9f);
          text-transform: uppercase;
        }

        .loading,
        .error {
          padding: var(--spacing-lg, 1.5rem);
          text-align: center;
          color: var(--color-text-secondary, #9f9f9f);
          font-family: var(--font-family, 'Inter', sans-serif);
        }

        .error {
          color: var(--color-lose, #dd3636);
        }
      </style>

      <div class="card">
        <h3 class="card-title">Stadium</h3>
        ${isLoading ? this.renderLoading() : ''}
        ${hasError ? this.renderError() : ''}
        ${!isLoading && !hasError && venue ? this.renderContent(venue) : ''}
        ${!isLoading && !hasError && !venue && data ? this.renderNoData() : ''}
      </div>
    `;
  }

  renderLoading() {
    return `<div class="loading">Loading stadium information...</div>`;
  }

  renderError(message = 'Failed to load stadium data') {
    return `<div class="error">${this.escapeHtml(message)}</div>`;
  }

  renderNoData() {
    return `<div class="loading">No stadium information available</div>`;
  }

  renderContent(venue) {
    const widget = venue.widget || {};
    const name = widget.name || 'Stadium';
    const city = widget.city || 'Unknown';
    const capacity = widget.capacity?.toLocaleString() || 'N/A';
    const opened = widget.opened || 'N/A';
    const surface = widget.surface || 'N/A';

    return `
      <div class="stadium-info">
        <div>
          <div class="stadium-name">${this.escapeHtml(name)}</div>
          <div class="stadium-location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${this.escapeHtml(city)}
          </div>
        </div>
        <div class="stadium-stats">
          <div class="stadium-stat">
            <div class="stadium-stat-value">${this.escapeHtml(capacity)}</div>
            <div class="stadium-stat-label">Capacity</div>
          </div>
          <div class="stadium-stat">
            <div class="stadium-stat-value">${this.escapeHtml(opened)}</div>
            <div class="stadium-stat-label">Opened</div>
          </div>
          <div class="stadium-stat">
            <div class="stadium-stat-value">${this.escapeHtml(surface)}</div>
            <div class="stadium-stat-label">Surface</div>
          </div>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Auto-register component
if (!customElements.get('team-stadium')) {
  customElements.define('team-stadium', TeamStadiumComponent);
}

export default TeamStadiumComponent;

