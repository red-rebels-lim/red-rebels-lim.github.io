/**
 * Team Table Component
 * Displays league standings table
 * 
 * Usage:
 * <team-table team-id="8590" league-id="123" api-url="..."></team-table>
 * 
 * Attributes:
 * - team-id: Team ID (required)
 * - league-id: League ID (optional)
 * - api-url: API endpoint URL (optional, has default)
 * - country-code: Country code (optional, default: CYP)
 * - assets-base: Base path for team logos (optional)
 * 
 * Events:
 * - team-selected: Fired when a team row is clicked (detail: { teamId: number, teamName: string })
 * - table-loaded: Fired when table data is loaded
 */

import { BaseTeamComponent } from '../base-component.js';
import { TeamEventBus } from '../event-bus.js';
import { TeamDataService } from '../data-service.js';

class TeamTableComponent extends BaseTeamComponent {
  constructor() {
    super();
    this.teamId = null;
    this.leagueId = null;
    this.apiUrl = null;
  }

  static get observedAttributes() {
    return ['team-id', 'league-id', 'api-url', 'country-code', 'assets-base'];
  }

  connectedCallback() {
    this.teamId = this.getAttribute('team-id');
    this.leagueId = this.getAttribute('league-id');
    this.apiUrl = this.getAttribute('api-url') || this.getDefaultApiUrl();
    
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
      
      TeamEventBus.dispatch('table-loaded', { 
        teamId: this.teamId,
        data 
      });
    } catch (error) {
      this.renderError('Failed to load table data');
      console.error('Error fetching table data:', error);
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
          display: flex;
          align-items: center;
          gap: var(--spacing-sm, 0.5rem);
          font-family: var(--font-family, 'Inter', sans-serif);
        }

        .league-icon {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }

        .table-container {
          overflow-x: auto;
        }

        .league-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          font-family: var(--font-family, 'Inter', sans-serif);
        }

        .league-table thead tr {
          border-bottom: 1px solid var(--color-border, #333333);
        }

        .league-table th {
          padding: var(--spacing-md, 1rem) var(--spacing-sm, 0.5rem);
          text-align: center;
          color: var(--color-text-secondary, #9f9f9f);
          font-weight: 500;
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .league-table th.text-left {
          text-align: left;
        }

        .league-table tbody tr {
          border-bottom: 1px solid var(--color-border, #333333);
          transition: background-color 0.2s ease;
          cursor: pointer;
        }

        .league-table tbody tr:hover {
          background-color: var(--color-bg-card-hover, #252525);
        }

        .league-table tbody tr.featured {
          background-color: rgba(0, 152, 95, 0.05);
        }

        .league-table td {
          padding: var(--spacing-md, 1rem) var(--spacing-sm, 0.5rem);
          text-align: center;
        }

        .league-table td.text-left {
          text-align: left;
        }

        .table-position {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm, 0.5rem);
          color: var(--color-text-secondary, #9f9f9f);
          font-weight: 600;
        }

        .position-indicator {
          width: 4px;
          height: 24px;
          border-radius: var(--radius-sm, 0.25rem);
        }

        .team-cell {
          display: flex;
          align-items: center;
          gap: var(--spacing-md, 1rem);
        }

        .team-cell img {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        .team-cell span {
          color: var(--color-text-primary, #ffffff);
          font-weight: 500;
        }

        .form-badges {
          display: flex;
          gap: 2px;
        }

        .form-badge {
          width: 20px;
          height: 20px;
          border-radius: var(--radius-sm, 0.25rem);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.625rem;
          font-weight: 700;
        }

        .form-badge.W {
          background-color: var(--color-win, #00985f);
          color: white;
        }

        .form-badge.D {
          background-color: var(--color-draw, #596470);
          color: white;
        }

        .form-badge.L {
          background-color: var(--color-lose, #dd3636);
          color: white;
        }

        .table-legend {
          display: flex;
          gap: var(--spacing-lg, 1.5rem);
          margin-top: var(--spacing-lg, 1.5rem);
          padding-top: var(--spacing-lg, 1.5rem);
          border-top: 1px solid var(--color-border, #333333);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm, 0.5rem);
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: var(--radius-sm, 0.25rem);
        }

        .legend-text {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #9f9f9f);
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

      <div class="card league-table-card">
        ${isLoading ? this.renderLoading() : ''}
        ${hasError ? this.renderError() : ''}
        ${!isLoading && !hasError && data ? this.renderContent(data) : ''}
      </div>
    `;
  }

  renderLoading() {
    return `
      <div class="card-header">
        <h3 class="card-title">Loading...</h3>
      </div>
      <div class="loading">Loading table data...</div>
    `;
  }

  renderError(message = 'Failed to load table data') {
    return `
      <div class="card-header">
        <h3 class="card-title">Error</h3>
      </div>
      <div class="error">${this.escapeHtml(message)}</div>
    `;
  }

  renderContent(data) {
    if (!data.table || data.table.length === 0) {
      return `
        <div class="card-header">
          <h3 class="card-title">League Table</h3>
        </div>
        <div class="loading">No table data available</div>
      `;
    }

    const tableData = data.table[0].data;
    const leagueName = tableData.leagueName || 'League';
    const teams = tableData.table?.all || [];
    const displayTeams = teams; // Show all teams

    return `
      <div class="card-header">
        <h3 class="card-title">
          <img class="league-icon" src="" alt="League" onerror="this.style.display='none';">
          <span>${this.escapeHtml(leagueName)}</span>
        </h3>
      </div>
      <div class="table-container">
        <table class="league-table">
          <thead>
            <tr>
              <th class="text-left">#</th>
              <th class="text-left">Team</th>
              <th>PL</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>+/-</th>
              <th>GD</th>
              <th>PTS</th>
            </tr>
          </thead>
          <tbody>
            ${displayTeams.map(team => this.renderTeamRow(team)).join('')}
          </tbody>
        </table>
      </div>
      <div class="table-legend">
        <div class="legend-item">
          <span class="legend-color" style="background: var(--color-promotion, #FFD908);"></span>
          <span class="legend-text">Promotion qualification</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: var(--color-relegation, #FFA72F);"></span>
          <span class="legend-text">Relegation qualification</span>
        </div>
      </div>
    `;
  }

  renderTeamRow(team) {
    const isFeatured = team.id === parseInt(this.teamId);
    const form = team.form || [];
    const logoUrl = this.getTeamLogo(team.name, team.id);

    return `
      <tr class="${isFeatured ? 'featured' : ''}" data-team-id="${team.id}" data-team-name="${this.escapeHtml(team.name)}">
        <td class="text-left">
          <div class="table-position">
            ${team.qualColor ? `<span class="position-indicator" style="background-color: ${team.qualColor};"></span>` : ''}
            ${team.idx || team.rank || '-'}
          </div>
        </td>
        <td class="text-left">
          <div class="team-cell">
            <img src="${logoUrl}" alt="${this.escapeHtml(team.name)}" 
                 onerror="this.style.display='none';">
            <span>${this.escapeHtml(team.shortName || team.name)}</span>
          </div>
        </td>
        <td>${team.played || 0}</td>
        <td>${team.wins || 0}</td>
        <td>${team.draws || 0}</td>
        <td>${team.losses || 0}</td>
        <td>${team.scoresStr || '0-0'}</td>
        <td>${team.goalConDiff > 0 ? '+' : ''}${team.goalConDiff || 0}</td>
        <td style="font-weight: 700;">${team.pts || 0}</td>
      </tr>
    `;
  }

  attachEventListeners() {
    const rows = this.shadowRoot.querySelectorAll('tbody tr[data-team-id]');
    
    rows.forEach(row => {
      this.addEventListenerWithCleanup(row, 'click', (e) => {
        const teamId = parseInt(e.currentTarget.dataset.teamId);
        const teamName = e.currentTarget.dataset.teamName;
        
        TeamEventBus.dispatch(TeamEventBus.Events.TEAM_SELECTED, {
          teamId,
          teamName
        });

        this.dispatchEvent(new CustomEvent('team-selected', {
          detail: { teamId, teamName },
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
if (!customElements.get('team-table')) {
  customElements.define('team-table', TeamTableComponent);
}

export default TeamTableComponent;

