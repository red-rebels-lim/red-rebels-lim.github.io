/**
 * Team Next Match Component
 * Displays the next upcoming match
 * 
 * Usage:
 * <team-next-match team-id="8590"></team-next-match>
 * 
 * Attributes:
 * - team-id: Team ID (required)
 * - api-url: API endpoint URL (optional, has default)
 * - country-code: Country code (optional, default: CYP)
 * 
 * Events:
 * - match-selected: Fired when match is clicked (detail: { matchId: number, match: object })
 * - next-match-loaded: Fired when next match data is loaded
 */

import { BaseTeamComponent } from '../base-component.js';
import { TeamEventBus } from '../event-bus.js';
import { TeamDataService } from '../data-service.js';

class TeamNextMatchComponent extends BaseTeamComponent {
  constructor() {
    super();
    this.teamId = null;
    this.apiUrl = null;
    this.countdownInterval = null;
  }

  static get observedAttributes() {
    return ['team-id', 'api-url', 'country-code', 'assets-base'];
  }

  connectedCallback() {
    this.teamId = this.getAttribute('team-id');
    this.apiUrl = this.getAttribute('api-url') || this.getDefaultApiUrl();
    
    this.render();
    if (this.teamId) {
      this.fetchData();
    }
    this.startCountdown();
  }

  disconnectedCallback() {
    this.stopCountdown();
    super.disconnectedCallback();
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
      this.startCountdown();
      
      TeamEventBus.dispatch('next-match-loaded', { 
        teamId: this.teamId,
        data 
      });
    } catch (error) {
      this.renderError('Failed to load next match');
      console.error('Error fetching next match:', error);
    }
  }

  getNextMatch() {
    const data = this.getData();
    if (!data?.fixtures?.allFixtures?.fixtures) {
      return null;
    }

    return data.fixtures.allFixtures.fixtures.find(f => !f.status?.finished);
  }

  startCountdown() {
    this.stopCountdown();
    
    this.countdownInterval = setInterval(() => {
      const nextMatch = this.getNextMatch();
      if (nextMatch) {
        this.updateCountdown(nextMatch);
      }
    }, 1000);
  }

  stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  updateCountdown(match) {
    const countdownEl = this.shadowRoot.querySelector('.match-countdown');
    if (!countdownEl) return;

    const matchDate = new Date(match.status.utcTime);
    const now = new Date();
    const diff = matchDate - now;

    if (diff <= 0) {
      countdownEl.textContent = 'Match started';
      this.stopCountdown();
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      countdownEl.textContent = `${days}d ${hours}h`;
    } else if (hours > 0) {
      countdownEl.textContent = `${hours}h ${minutes}m`;
    } else {
      countdownEl.textContent = `${minutes}m`;
    }
  }

  render() {
    const data = this.getData();
    const isLoading = this.isLoading();
    const hasError = this.hasError();
    const nextMatch = this.getNextMatch();

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

        .badge {
          padding: var(--spacing-xs, 0.25rem) var(--spacing-md, 1rem);
          background-color: var(--color-bg-input, #333333);
          color: var(--color-text-secondary, #9f9f9f);
          border-radius: var(--radius-sm, 0.25rem);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .next-match {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg, 1.5rem);
        }

        .match-teams {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg, 1.5rem) 0;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .match-teams:hover {
          opacity: 0.8;
        }

        .match-team {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md, 1rem);
          flex: 1;
        }

        .match-team img {
          width: 56px;
          height: 56px;
          object-fit: contain;
        }

        .match-team-name {
          font-size: 0.875rem;
          font-weight: 600;
          text-align: center;
        }

        .match-time {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs, 0.25rem);
          padding: 0 var(--spacing-lg, 1.5rem);
        }

        .match-time-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .match-date {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #9f9f9f);
        }

        .match-countdown {
          font-size: 0.875rem;
          color: var(--color-accent, #00985f);
          font-weight: 600;
          margin-top: var(--spacing-xs, 0.25rem);
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
        ${!isLoading && !hasError && nextMatch ? this.renderContent(nextMatch) : ''}
        ${!isLoading && !hasError && !nextMatch && data ? this.renderNoMatch() : ''}
      </div>
    `;
  }

  renderLoading() {
    return `
      <div class="card-header">
        <h3 class="card-title">Next match</h3>
      </div>
      <div class="loading">Loading next match...</div>
    `;
  }

  renderError(message = 'Failed to load next match') {
    return `
      <div class="card-header">
        <h3 class="card-title">Next match</h3>
      </div>
      <div class="error">${this.escapeHtml(message)}</div>
    `;
  }

  renderNoMatch() {
    return `
      <div class="card-header">
        <h3 class="card-title">Next match</h3>
      </div>
      <div class="loading">No upcoming matches</div>
    `;
  }

  renderContent(match) {
    const matchDate = new Date(match.status.utcTime);
    const dateOptions = { weekday: 'short', day: 'numeric', month: 'short' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    const homeLogo = this.getTeamLogo(match.home.name, match.home.id);
    const awayLogo = this.getTeamLogo(match.away.name, match.away.id);

    return `
      <div class="card-header">
        <h3 class="card-title">Next match</h3>
        <span class="badge">${this.escapeHtml(match.tournament?.name || 'Match')}</span>
      </div>
      <div class="next-match">
        <div class="match-teams" data-match-id="${match.id}">
          <div class="match-team">
            <img src="${homeLogo}" alt="${this.escapeHtml(match.home.name)}" 
                 onerror="this.style.display='none';">
            <div class="match-team-name">${this.escapeHtml(match.home.name)}</div>
          </div>
          <div class="match-time">
            <div class="match-time-value">${matchDate.toLocaleTimeString('en-GB', timeOptions)}</div>
            <div class="match-date">${matchDate.toLocaleDateString('en-GB', dateOptions)}</div>
            <div class="match-countdown"></div>
          </div>
          <div class="match-team">
            <img src="${awayLogo}" alt="${this.escapeHtml(match.away.name)}" 
                 onerror="this.style.display='none';">
            <div class="match-team-name">${this.escapeHtml(match.away.name)}</div>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const matchTeams = this.shadowRoot.querySelector('.match-teams[data-match-id]');
    
    if (matchTeams) {
      this.addEventListenerWithCleanup(matchTeams, 'click', (e) => {
        const matchId = parseInt(e.currentTarget.dataset.matchId);
        const data = this.getData();
        const match = data?.fixtures?.allFixtures?.fixtures?.find(m => m.id === matchId);

        TeamEventBus.dispatch(TeamEventBus.Events.MATCH_SELECTED, {
          matchId,
          match
        });

        this.dispatchEvent(new CustomEvent('match-selected', {
          detail: { matchId, match },
          bubbles: true,
          cancelable: true
        }));
      });

      // Initial countdown update
      const nextMatch = this.getNextMatch();
      if (nextMatch) {
        this.updateCountdown(nextMatch);
      }
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Auto-register component
if (!customElements.get('team-next-match')) {
  customElements.define('team-next-match', TeamNextMatchComponent);
}

export default TeamNextMatchComponent;

