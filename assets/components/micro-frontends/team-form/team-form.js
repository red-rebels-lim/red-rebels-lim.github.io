/**
 * Team Form Component
 * Displays recent match results (W/D/L indicators)
 * 
 * Usage:
 * <team-form team-id="8590" matches-count="5"></team-form>
 * 
 * Attributes:
 * - team-id: Team ID (required)
 * - api-url: API endpoint URL (optional, has default)
 * - matches-count: Number of recent matches to show (optional, default: 5)
 * - country-code: Country code (optional, default: CYP)
 * 
 * Events:
 * - match-selected: Fired when a match result is clicked (detail: { matchId: number, match: object })
 */

import { BaseTeamComponent } from '../base-component.js';
import { TeamEventBus } from '../event-bus.js';
import { TeamDataService } from '../data-service.js';

class TeamFormComponent extends BaseTeamComponent {
  constructor() {
    super();
    this.teamId = null;
    this.apiUrl = null;
    this.matchesCount = 5;
  }

  static get observedAttributes() {
    return ['team-id', 'api-url', 'matches-count', 'country-code', 'assets-base'];
  }

  connectedCallback() {
    this.teamId = this.getAttribute('team-id');
    this.apiUrl = this.getAttribute('api-url') || this.getDefaultApiUrl();
    this.matchesCount = parseInt(this.getAttribute('matches-count') || '5', 10);
    
    this.render();
    this.attachEventListeners();
    if (this.teamId) {
      this.fetchData();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      const propName = this.attributeToProperty(name);
      if (name === 'matches-count') {
        this.matchesCount = parseInt(newValue || '5', 10);
      } else {
        this[propName] = newValue;
      }
      
      if (name === 'api-url' && !newValue) {
        this.apiUrl = this.getDefaultApiUrl();
      }
      
      if (this.isConnected && this.teamId) {
        this.render();
        this.attachEventListeners();
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
      this.attachEventListeners();
    } catch (error) {
      this.renderError('Failed to load form data');
      console.error('Error fetching form data:', error);
    }
  }

  getRecentMatches() {
    const data = this.getData();
    if (!data?.fixtures?.allFixtures?.fixtures) {
      return [];
    }

    // Get finished matches, reverse to get newest first, then take the last N matches
    const finishedMatches = data.fixtures.allFixtures.fixtures
      .filter(f => f.status?.finished)
      .reverse();
    
    // Take the last matchesCount matches (most recent)
    const recentMatches = finishedMatches.slice(0, this.matchesCount);

    return recentMatches;
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

        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text-primary, #ffffff);
          margin-bottom: var(--spacing-lg, 1.5rem);
          font-family: var(--font-family, 'Inter', sans-serif);
        }

        .team-form {
          display: flex;
          gap: var(--spacing-md, 1rem);
          align-items: flex-start;
        }

        .form-match {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm, 0.5rem);
          cursor: pointer;
          transition: transform 0.2s ease;
          position: relative;
        }

        .form-match:hover {
          transform: translateY(-2px);
        }

        .score-box {
          border-radius: var(--radius-md, 0.5rem);
          padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
          color: var(--color-text-primary, #ffffff);
          font-weight: 600;
          font-size: 0.875rem;
          white-space: nowrap;
          position: relative;
        }

        .score-box.win {
          background-color: #4CAF50;
        }

        .score-box.draw {
          background-color: #FFC107;
        }

        .score-box.lose {
          background-color: #F44336;
        }

        .team-logo {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: contain;
          background-color: var(--color-bg-secondary, #222222);
          padding: 4px;
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
        <h3 class="card-title">Team form</h3>
        ${isLoading ? this.renderLoading() : ''}
        ${hasError ? this.renderError() : ''}
        ${!isLoading && !hasError && data ? this.renderContent(data) : ''}
      </div>
    `;
  }

  renderLoading() {
    return `<div class="loading">Loading form...</div>`;
  }

  renderError(message = 'Failed to load form data') {
    return `<div class="error">${this.escapeHtml(message)}</div>`;
  }

  renderContent(data) {
    const matches = this.getRecentMatches();

    if (matches.length === 0) {
      return `<div class="loading">No recent matches</div>`;
    }

    return `
      <div class="team-form">
        ${matches.map(match => this.renderMatchResult(match)).join('')}
      </div>
    `;
  }

  renderMatchResult(match) {
    const teamId = parseInt(this.teamId);
    // Check if team is home or away (handle both string and number IDs)
    const isHome = parseInt(match.home.id) === teamId || match.home.id === teamId;
    const opponent = isHome ? match.away : match.home;
    
    // Get the score from the match
    // scoreStr format is typically "homeScore - awayScore"
    const scoreStr = match.status.scoreStr || '0 - 0';
    const scores = scoreStr.split('-').map(s => s.trim());
    const homeScore = parseInt(scores[0]) || 0;
    const awayScore = parseInt(scores[1]) || 0;
    
    // Get team's score and opponent's score based on home/away status
    const teamScore = isHome ? homeScore : awayScore;
    const opponentScore = isHome ? awayScore : homeScore;
    
    // Determine result (W/D/L)
    let resultClass = 'draw';
    if (teamScore > opponentScore) {
      resultClass = 'win';
    } else if (teamScore < opponentScore) {
      resultClass = 'lose';
    }
    
    // Always display as "teamScore - opponentScore" (team's perspective)
    const displayScore = `${scoreStr}`;
    const opponentLogo = this.getTeamLogo(opponent.name, opponent.id);
    const title = `${match.home.name} ${match.status.scoreStr} ${match.away.name}`;

    return `
      <div class="form-match" 
           data-match-id="${match.id}"
           title="${this.escapeHtml(title)}">
        <div class="score-box ${resultClass}">${displayScore}</div>
        <img src="${opponentLogo}" 
             alt="${this.escapeHtml(opponent.name)}" 
             class="team-logo"
             onerror="this.style.display='none';">
      </div>
    `;
  }

  attachEventListeners() {
    // Re-attach listeners after render
    setTimeout(() => {
      const formMatches = this.shadowRoot.querySelectorAll('.form-match[data-match-id]');
      
      formMatches.forEach(match => {
        this.addEventListenerWithCleanup(match, 'click', (e) => {
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
      });
    }, 0);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Auto-register component
if (!customElements.get('team-form')) {
  customElements.define('team-form', TeamFormComponent);
}

export default TeamFormComponent;

