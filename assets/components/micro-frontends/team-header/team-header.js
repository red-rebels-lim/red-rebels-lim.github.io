/**
 * Team Header Component
 * Displays team logo, name, country, and action buttons
 * 
 * Usage:
 * <team-header team-id="8590" api-url="..." country-code="CYP"></team-header>
 * 
 * Attributes:
 * - team-id: Team ID (required)
 * - api-url: API endpoint URL (optional, has default)
 * - country-code: Country code (optional, default: CYP)
 * - assets-base: Base path for team logos (optional, default: assets/images/team_logos)
 * 
 * Events:
 * - team-data-loaded: Fired when team data is loaded (detail: { data })
 * - sync-clicked: Fired when sync button is clicked
 * - follow-clicked: Fired when follow button is clicked
 */

import { BaseTeamComponent } from '../base-component.js';
import { TeamEventBus } from '../event-bus.js';
import { TeamDataService } from '../data-service.js';

class TeamHeaderComponent extends BaseTeamComponent {
  constructor() {
    super();
    this.teamId = null;
    this.apiUrl = null;
    this.countryCode = 'CYP';
  }

  static get observedAttributes() {
    return ['team-id', 'api-url', 'country-code', 'assets-base'];
  }

  connectedCallback() {
    this.teamId = this.getAttribute('team-id');
    this.apiUrl = this.getAttribute('api-url') || this.getDefaultApiUrl();
    this.countryCode = this.getAttribute('country-code') || 'CYP';
    
    this.render();
    if (this.teamId) {
      this.fetchData();
    }
    this.attachEventListeners();
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
    const countryCode = this.countryCode || this.getAttribute('country-code') || 'CYP';
    return `https://www.fotmob.com/api/data/teams?id=${teamId}&ccode3=${countryCode}`;
  }

  async fetchData() {
    if (!this.teamId) {
      this.renderError('Team ID is required');
      return;
    }

    try {
      // Use data service for caching
      const data = await TeamDataService.getTeamData(this.teamId, this.apiUrl);
      this.setData(data);
      this.render();
      
      // Dispatch event
      TeamEventBus.dispatch(TeamEventBus.Events.TEAM_DATA_LOADED, { 
        teamId: this.teamId,
        data 
      });
    } catch (error) {
      this.renderError('Failed to load team data');
      console.error('Error fetching team data:', error);
    }
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

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xl, 2rem);
          padding-bottom: var(--spacing-lg, 1.5rem);
          border-bottom: 1px solid var(--color-border, #333333);
        }

        .team-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg, 1.5rem);
        }

        .team-logo-container {
          width: 80px;
          height: 80px;
          background-color: var(--color-bg-card, #1a1a1a);
          border-radius: var(--radius-lg, 0.75rem);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-md, 1rem);
        }

        .team-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .team-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs, 0.25rem);
        }

        .team-name {
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-text-primary, #ffffff);
          font-family: var(--font-family, 'Inter', sans-serif);
          margin: 0;
        }

        .team-country {
          font-size: 1rem;
          color: var(--color-text-secondary, #9f9f9f);
          font-family: var(--font-family, 'Inter', sans-serif);
          margin: 0;
        }

        .team-actions {
          display: flex;
          gap: var(--spacing-md, 1rem);
        }

        .btn-sync,
        .btn-follow {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm, 0.5rem);
          padding: var(--spacing-sm, 0.5rem) var(--spacing-lg, 1.5rem);
          background-color: var(--color-bg-input, #333333);
          color: var(--color-text-primary, #ffffff);
          border: 1px solid var(--color-border-light, #464646);
          border-radius: var(--radius-md, 0.5rem);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font-family, 'Inter', sans-serif);
        }

        .btn-sync:hover,
        .btn-follow:hover {
          background-color: var(--color-border-light, #464646);
        }

        .btn-follow {
          background-color: var(--color-accent, #00985f);
          border-color: var(--color-accent, #00985f);
        }

        .btn-follow:hover {
          background-color: var(--color-accent-hover, #00774a);
        }

        .btn-sync svg,
        .btn-follow svg {
          flex-shrink: 0;
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

        @media (max-width: 768px) {
          .team-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-lg, 1.5rem);
          }

          .team-actions {
            width: 100%;
            justify-content: stretch;
          }

          .btn-sync,
          .btn-follow {
            flex: 1;
            justify-content: center;
          }

          .team-name {
            font-size: 1.5rem;
          }
        }
      </style>

      ${isLoading ? this.renderLoading() : ''}
      ${hasError ? this.renderError() : ''}
      ${!isLoading && !hasError && data ? this.renderContent(data) : ''}
      ${!isLoading && !hasError && !data ? this.renderPlaceholder() : ''}
    `;
  }

  renderLoading() {
    return `
      <div class="team-header">
        <div class="team-info">
          <div class="team-logo-container">
            <div class="loading">Loading...</div>
          </div>
          <div class="team-details">
            <h1 class="team-name">Loading...</h1>
            <p class="team-country">Loading...</p>
          </div>
        </div>
      </div>
    `;
  }

  renderError(message = 'Failed to load team data') {
    return `
      <div class="team-header">
        <div class="team-info">
          <div class="team-details">
            <h1 class="team-name">Error</h1>
            <p class="team-country error">${message}</p>
          </div>
        </div>
      </div>
    `;
  }

  renderPlaceholder() {
    return `
      <div class="team-header">
        <div class="team-info">
          <div class="team-logo-container">
            <div class="loading">No data</div>
          </div>
          <div class="team-details">
            <h1 class="team-name">Team</h1>
            <p class="team-country">Country</p>
          </div>
        </div>
        <div class="team-actions">
          <button class="btn-sync">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Sync to calendar
          </button>
          <button class="btn-follow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            Following
          </button>
        </div>
      </div>
    `;
  }

  renderContent(data) {
    const { details } = data;
    const logoUrl = this.getTeamLogo(details.name, details.id);

    return `
      <header class="team-header">
        <div class="team-info">
          <div class="team-logo-container">
            <img class="team-logo" src="${logoUrl}" alt="${details.name}" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div style="display: none; color: var(--color-text-secondary);">Logo</div>
          </div>
          <div class="team-details">
            <h1 class="team-name">${this.escapeHtml(details.name)}</h1>
            <p class="team-country">${this.escapeHtml(details.country || this.countryCode)}</p>
          </div>
        </div>
        <div class="team-actions">
          <button class="btn-sync" aria-label="Sync to calendar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Sync to calendar
          </button>
          <button class="btn-follow" aria-label="Follow team">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            Following
          </button>
        </div>
      </header>
    `;
  }

  attachEventListeners() {
    // Re-attach listeners after render
    const syncBtn = this.shadowRoot.querySelector('.btn-sync');
    const followBtn = this.shadowRoot.querySelector('.btn-follow');

    if (syncBtn) {
      this.addEventListenerWithCleanup(syncBtn, 'click', () => {
        this.handleSyncClick();
      });
    }

    if (followBtn) {
      this.addEventListenerWithCleanup(followBtn, 'click', () => {
        this.handleFollowClick();
      });
    }
  }

  handleSyncClick() {
    const data = this.getData();
    TeamEventBus.dispatch(TeamEventBus.Events.SYNC_CLICKED, {
      teamId: this.teamId,
      data
    });

    // Dispatch custom event on component
    this.dispatchEvent(new CustomEvent('sync-clicked', {
      detail: { teamId: this.teamId, data },
      bubbles: true,
      cancelable: true
    }));

    // Generate calendar file if data is available
    if (data && data.fixtures) {
      this.generateCalendarFile(data);
    }
  }

  handleFollowClick() {
    const data = this.getData();
    TeamEventBus.dispatch(TeamEventBus.Events.FOLLOW_CLICKED, {
      teamId: this.teamId,
      data
    });

    // Dispatch custom event on component
    this.dispatchEvent(new CustomEvent('follow-clicked', {
      detail: { teamId: this.teamId, data },
      bubbles: true,
      cancelable: true
    }));

    // Toggle follow state (could be enhanced with localStorage)
    const followBtn = this.shadowRoot.querySelector('.btn-follow');
    if (followBtn) {
      const isFollowing = followBtn.classList.toggle('active');
      followBtn.textContent = isFollowing ? 'Following' : 'Follow';
    }
  }

  generateCalendarFile(data) {
    if (!data.fixtures || !data.fixtures.allFixtures) {
      console.warn('No fixtures available to sync');
      return;
    }

    const fixtures = data.fixtures.allFixtures.fixtures.filter(f => !f.status?.finished);
    const teamName = data.details?.name || 'Team';

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Calendar App//Team Fixtures//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${teamName} Fixtures`,
      'X-WR-TIMEZONE:UTC'
    ];

    fixtures.forEach(match => {
      const startDate = new Date(match.status.utcTime);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

      const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${match.id}@fotmob.com`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(startDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${match.home.name} vs ${match.away.name}`,
        `DESCRIPTION:${match.tournament?.name || 'Match'} - ${match.home.name} vs ${match.away.name}`,
        `LOCATION:${match.venue || 'TBD'}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    // Create and download file
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${teamName.toLowerCase().replace(/\s+/g, '-')}-fixtures.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Auto-register component
if (!customElements.get('team-header')) {
  customElements.define('team-header', TeamHeaderComponent);
}

export default TeamHeaderComponent;

