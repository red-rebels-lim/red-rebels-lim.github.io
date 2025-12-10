/**
 * Team Fixtures Component
 * Displays upcoming or finished fixtures
 * 
 * Usage:
 * <team-fixtures team-id="8590" limit="5" status="upcoming"></team-fixtures>
 * 
 * Attributes:
 * - team-id: Team ID (required)
 * - api-url: API endpoint URL (optional, has default)
 * - limit: Number of fixtures to show (optional, default: 5)
 * - status: Filter by status - "upcoming" or "finished" (optional, default: "upcoming")
 * - country-code: Country code (optional, default: CYP)
 * 
 * Events:
 * - fixture-selected: Fired when a fixture is clicked (detail: { fixtureId: number, fixture: object })
 * - fixtures-loaded: Fired when fixtures are loaded
 */

import { BaseTeamComponent } from '../base-component.js';
import { TeamEventBus } from '../event-bus.js';
import { TeamDataService } from '../data-service.js';

class TeamFixturesComponent extends BaseTeamComponent {
  constructor() {
    super();
    this.teamId = null;
    this.apiUrl = null;
    this.limit = 5;
    this.status = 'upcoming';
    this.currentPage = 0;
  }

  static get observedAttributes() {
    return ['team-id', 'api-url', 'limit', 'status', 'country-code', 'assets-base'];
  }

  connectedCallback() {
    this.teamId = this.getAttribute('team-id');
    this.apiUrl = this.getAttribute('api-url') || this.getDefaultApiUrl();
    this.limit = parseInt(this.getAttribute('limit') || '5', 10);
    this.status = this.getAttribute('status') || 'upcoming';
    
    this.render();
    if (this.teamId) {
      this.fetchData();
    }
    this.attachEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      const propName = this.attributeToProperty(name);
      if (name === 'limit') {
        this.limit = parseInt(newValue || '5', 10);
      } else {
        this[propName] = newValue;
      }
      
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
      
      TeamEventBus.dispatch('fixtures-loaded', { 
        teamId: this.teamId,
        data 
      });
    } catch (error) {
      this.renderError('Failed to load fixtures');
      console.error('Error fetching fixtures:', error);
    }
  }

  getFixtures() {
    const data = this.getData();
    if (!data?.fixtures?.allFixtures?.fixtures) {
      return [];
    }

    const allFixtures = data.fixtures.allFixtures.fixtures;
    const filtered = this.status === 'upcoming' 
      ? allFixtures.filter(f => !f.status?.finished)
      : allFixtures.filter(f => f.status?.finished);

    // Apply pagination
    const start = this.currentPage * this.limit;
    return filtered.slice(start, start + this.limit);
  }

  render() {
    const data = this.getData();
    const isLoading = this.isLoading();
    const hasError = this.hasError();

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

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg, 1.5rem);
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text-primary, #ffffff);
          font-family: var(--font-family, 'Inter', sans-serif);
        }

        .nav-arrow {
          background: none;
          border: none;
          color: var(--color-text-secondary, #9f9f9f);
          cursor: pointer;
          padding: var(--spacing-xs, 0.25rem);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
        }

        .nav-arrow:hover {
          color: var(--color-text-primary, #ffffff);
        }

        .nav-arrow:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .fixtures-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md, 1rem);
        }

        .fixture-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md, 1rem);
          background-color: var(--color-bg-secondary, #222222);
          border-radius: var(--radius-md, 0.5rem);
          transition: background-color 0.2s ease;
          cursor: pointer;
        }

        .fixture-item:hover {
          background-color: var(--color-bg-card-hover, #252525);
        }

        .fixture-date {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs, 0.25rem);
          min-width: 80px;
        }

        .fixture-date-day {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #9f9f9f);
        }

        .fixture-date-time {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .fixture-teams {
          display: flex;
          align-items: center;
          gap: var(--spacing-md, 1rem);
          flex: 1;
        }

        .fixture-team {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm, 0.5rem);
          flex: 1;
        }

        .fixture-team img {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        .fixture-team-name {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .fixture-league-badge {
          padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
          background-color: var(--color-bg-input, #333333);
          color: var(--color-text-secondary, #9f9f9f);
          border-radius: var(--radius-sm, 0.25rem);
          font-size: 0.75rem;
        }

        .loading,
        .error {
          padding: var(--spacing-xl, 2rem);
          text-align: center;
          color: var(--color-text-secondary, #9f9f9f);
          font-family: var(--font-family, 'Inter', sans-serif);
        }

        .error {
          color: var(--color-lose, #dd3636);
        }
      </style>

      <div class="card">
        ${isLoading ? this.renderLoading() : ''}
        ${hasError ? this.renderError() : ''}
        ${!isLoading && !hasError && data ? this.renderContent(data) : ''}
      </div>
    `;
  }

  renderLoading() {
    return `
      <div class="card-header">
        <h3 class="card-title">Fixtures</h3>
      </div>
      <div class="loading">Loading fixtures...</div>
    `;
  }

  renderError(message = 'Failed to load fixtures') {
    return `
      <div class="card-header">
        <h3 class="card-title">Fixtures</h3>
      </div>
      <div class="error">${this.escapeHtml(message)}</div>
    `;
  }

  renderContent(data) {
    const fixtures = this.getFixtures();

    if (fixtures.length === 0) {
      return `
        <div class="card-header">
          <h3 class="card-title">Fixtures</h3>
        </div>
        <div class="loading">No ${this.status} fixtures available</div>
      `;
    }

    const canGoBack = this.currentPage > 0;
    const canGoForward = this.hasMoreFixtures();

    return `
      <div class="card-header">
        <button class="nav-arrow" ${!canGoBack ? 'disabled' : ''} aria-label="Previous">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h3 class="card-title">Fixtures</h3>
        <button class="nav-arrow" ${!canGoForward ? 'disabled' : ''} aria-label="Next">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      <div class="fixtures-list">
        ${fixtures.map(fixture => this.renderFixture(fixture)).join('')}
      </div>
    `;
  }

  renderFixture(match) {
    const matchDate = new Date(match.status.utcTime);
    const dateOptions = { day: 'numeric', month: 'short' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    const homeLogo = this.getTeamLogo(match.home.name, match.home.id);
    const awayLogo = this.getTeamLogo(match.away.name, match.away.id);

    return `
      <div class="fixture-item" data-fixture-id="${match.id}">
        <div class="fixture-date">
          <div class="fixture-date-day">${matchDate.toLocaleDateString('en-GB', dateOptions)}</div>
          <div class="fixture-date-time">${matchDate.toLocaleTimeString('en-GB', timeOptions)}</div>
        </div>
        <div class="fixture-teams">
          <div class="fixture-team">
            <img src="${homeLogo}" alt="${this.escapeHtml(match.home.name)}" 
                 onerror="this.style.display='none';">
            <span class="fixture-team-name">${this.escapeHtml(match.home.name)}</span>
          </div>
          <div class="fixture-team">
            <img src="${awayLogo}" alt="${this.escapeHtml(match.away.name)}" 
                 onerror="this.style.display='none';">
            <span class="fixture-team-name">${this.escapeHtml(match.away.name)}</span>
          </div>
        </div>
        <div class="fixture-league-badge">${this.escapeHtml(match.tournament?.name || 'Match')}</div>
      </div>
    `;
  }

  hasMoreFixtures() {
    const data = this.getData();
    if (!data?.fixtures?.allFixtures?.fixtures) {
      return false;
    }

    const allFixtures = data.fixtures.allFixtures.fixtures;
    const filtered = this.status === 'upcoming' 
      ? allFixtures.filter(f => !f.status?.finished)
      : allFixtures.filter(f => f.status?.finished);

    const start = (this.currentPage + 1) * this.limit;
    return start < filtered.length;
  }

  attachEventListeners() {
    const prevBtn = this.shadowRoot.querySelector('.nav-arrow[aria-label="Previous"]');
    const nextBtn = this.shadowRoot.querySelector('.nav-arrow[aria-label="Next"]');
    const fixtureItems = this.shadowRoot.querySelectorAll('.fixture-item');

    if (prevBtn) {
      this.addEventListenerWithCleanup(prevBtn, 'click', () => {
        if (this.currentPage > 0) {
          this.currentPage--;
          this.render();
          this.attachEventListeners();
        }
      });
    }

    if (nextBtn) {
      this.addEventListenerWithCleanup(nextBtn, 'click', () => {
        if (this.hasMoreFixtures()) {
          this.currentPage++;
          this.render();
          this.attachEventListeners();
        }
      });
    }

    fixtureItems.forEach(item => {
      this.addEventListenerWithCleanup(item, 'click', (e) => {
        const fixtureId = parseInt(e.currentTarget.dataset.fixtureId);
        const data = this.getData();
        const fixture = data?.fixtures?.allFixtures?.fixtures?.find(f => f.id === fixtureId);

        TeamEventBus.dispatch(TeamEventBus.Events.FIXTURE_SELECTED, {
          fixtureId,
          fixture
        });

        this.dispatchEvent(new CustomEvent('fixture-selected', {
          detail: { fixtureId, fixture },
          bubbles: true,
          cancelable: true
        }));
      });
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Auto-register component
if (!customElements.get('team-fixtures')) {
  customElements.define('team-fixtures', TeamFixturesComponent);
}

export default TeamFixturesComponent;

