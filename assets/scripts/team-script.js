// Team Page Script - Fetches and displays FotMob team data

const TEAM_ID = 8590;
const COUNTRY_CODE = 'CYP';
const API_URL = `https://www.fotmob.com/api/data/teams?id=${TEAM_ID}&ccode3=${COUNTRY_CODE}`;

// Team data will be stored here after fetching
let teamData = null;

// Load team component from file
async function loadTeamComponent(componentName) {
    try {
        const response = await fetch(`assets/components/${componentName}.html`);
        if (!response.ok) throw new Error(`Failed to load ${componentName}`);
        return await response.text();
    } catch (error) {
        console.error(`Error loading ${componentName}:`, error);
        return '';
    }
}

// Load all team components
async function loadTeamComponents() {
    const components = [
        { name: 'team-header', container: 'team-header-container' },
        { name: 'team-tabs', container: 'team-tabs-container' },
        { name: 'team-form', container: 'team-form-container' },
        { name: 'team-table', container: 'team-table-container' },
        { name: 'team-next-match', container: 'team-next-match-container' },
        { name: 'team-fixtures', container: 'team-fixtures-container' },
        { name: 'team-stadium', container: 'team-stadium-container' }
    ];

    for (const component of components) {
        const html = await loadTeamComponent(component.name);
        const container = document.getElementById(component.container);
        if (container) {
            container.innerHTML = html;
        }
    }

    console.log('All team components loaded');
}

// Mapping of team names to local logo files
const TEAM_LOGOS = {
    'Nea Salamis': 'ΝΕΑ_ΣΑΛΑΜΙΝΑ_ΑΜΜΟΧΩΣΤΟΥ.png',
    'Doxa Katokopia': 'ΔΟΞΑ_ΚΑΤΩΚΟΠΙΑΣ.png',
    'Karmiotissa Pano Polemidion': 'ΚΑΡΜΙΩΤΙΣΣΑ_ΠΟΛΕΜΙΔΙΩΝ.png',
    'Omonia 29 Maiou': 'ΑΛΣ_ΟΜΟΝΟΙΑ_29_Μ.png',
    'Ayia Napa': 'ΑΟΑΝ_ΑΓΙΑΣ_ΝΑΠΑΣ.png',
    'Digenis Morphou': 'ΔΙΓΕΝΗΣ_ΑΚΡΙΤΑΣ_ΜΟΡΦΟΥ.png',
    'PAEEK': 'ΠΑΕΕΚ_ΚΕΡΥΝΕΙΑΣ.png',
    'MEAP Nisou': 'ΜΕΑΠ_ΠΕΡΑ_ΧΩΡΙΟΥ_ΝΗΣΟΥ.png',
    'ASIL Lysi': 'ΑΣΙΛ_ΛΥΣΗΣ.png',
    'Chalkanoras Idaliou': 'ΧΑΛΚΑΝΟΡΑΣ_ΙΔΑΛΙΟΥ.png',
    'Ethnikos Latsion': 'ΕΘΝΙΚΟΣ_ΛΑΤΣΙΩΝ.png',
    'APEA Akrotiri': 'ΑΠΕΑ_ΑΚΡΩΤΗΡΙΟΥ.png',
    'Spartakos Kitiou': 'ΣΠΑΡΤΑΚΟΣ_ΚΙΤΙΟΥ.png',
    'Iraklis Gerolakkou': 'ΗΡΑΚΛΗΣ_ΓΕΡΟΛΑΚΚΟΥ.png',
    'AEZ Zakakiou': 'ΑΕΖ_ΖΑΚΑΚΙΟΥ.png',
    'PO Achyronas-Onisilos': 'ΠΟ_ΑΧΥΡΩΝΑΣ_ΟΝΗΣΙΛΟΣ.png'
};

// Helper function to get local team logo path
function getTeamLogo(teamName, teamId) {
    const logoFilename = TEAM_LOGOS[teamName];
    if (logoFilename) {
        return `assets/images/team_logos/${logoFilename}`;
    }
    // Fallback to FotMob URL if local logo not found
    return `https://images.fotmob.com/image_resources/logo/teamlogo/${teamId}.png`;
}

// Fetch team data from API or use local data
async function fetchTeamData() {
    try {
        // For development, you can use the local team-data.json file
        // Uncomment the line below and comment the fetch line to use local data
        // const response = await fetch('./team-data.json');
        
        const response = await fetch(API_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        teamData = await response.json();
        console.log('Team data loaded:', teamData);
        
        // Populate the page with data
        populateTeamHeader();
        populateTeamForm();
        populateLeagueTable();
        populateNextMatch();
        populateFixtures();
        populateStadiumInfo();
        
    } catch (error) {
        console.error('Error fetching team data:', error);
        // Try to load from local file as fallback
        loadLocalData();
    }
}

// Load data from local JSON file
async function loadLocalData() {
    try {
        const response = await fetch('./team-data.json');
        teamData = await response.json();
        console.log('Local team data loaded:', teamData);
        
        populateTeamHeader();
        populateTeamForm();
        populateLeagueTable();
        populateNextMatch();
        populateFixtures();
        populateStadiumInfo();
    } catch (error) {
        console.error('Error loading local data:', error);
        document.getElementById('teamName').textContent = 'Error loading data';
    }
}

// Populate team header
function populateTeamHeader() {
    const { details } = teamData;
    
    document.getElementById('teamName').textContent = details.name;
    document.getElementById('teamCountry').textContent = details.country;
    
    // Set team logo
    const teamLogo = document.getElementById('teamLogo');
    teamLogo.src = getTeamLogo(details.name, details.id);
    teamLogo.alt = details.name;
}

// Populate team form
function populateTeamForm() {
    const formContainer = document.getElementById('teamForm');
    
    if (!teamData.fixtures || !teamData.fixtures.allFixtures) {
        formContainer.innerHTML = '<p style="color: var(--color-text-secondary);">No recent matches</p>';
        return;
    }
    
    // Get last 5 matches
    const recentMatches = teamData.fixtures.allFixtures.fixtures
        .filter(f => f.status?.finished)
        .slice(0, 5)
        .reverse();
    
    if (recentMatches.length === 0) {
        formContainer.innerHTML = '<p style="color: var(--color-text-secondary);">No recent matches</p>';
        return;
    }
    
    formContainer.innerHTML = recentMatches.map(match => {
        const isHome = match.home.id === TEAM_ID;
        const opponent = isHome ? match.away : match.home;
        const teamScore = isHome ? match.status.scoreStr.split('-')[0] : match.status.scoreStr.split('-')[1];
        const opponentScore = isHome ? match.status.scoreStr.split('-')[1] : match.status.scoreStr.split('-')[0];
        
        let result = 'draw';
        let resultText = 'D';
        
        if (parseInt(teamScore) > parseInt(opponentScore)) {
            result = 'win';
            resultText = 'W';
        } else if (parseInt(teamScore) < parseInt(opponentScore)) {
            result = 'lose';
            resultText = 'L';
        }
        
        const opponentLogo = getTeamLogo(opponent.name, opponent.id);
        
        return `
            <div class="form-result ${result}" title="${match.home.name} ${match.status.scoreStr} ${match.away.name}">
                <img src="${opponentLogo}" alt="${opponent.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <span style="display: none;">${resultText}</span>
            </div>
        `;
    }).join('');
}

// Populate league table
function populateLeagueTable() {
    const tableBody = document.getElementById('leagueTableBody');
    
    if (!teamData.table || teamData.table.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--color-text-secondary);">No table data available</td></tr>';
        return;
    }
    
    const tableData = teamData.table[0].data;
    const leagueName = tableData.leagueName;
    const teams = tableData.table.all;
    
    // Update league name
    document.getElementById('leagueName').textContent = leagueName;
    
    // Show only teams around the current team (positions 1-12)
    const displayTeams = teams.slice(0, 12);
    
    tableBody.innerHTML = displayTeams.map(team => {
        const isFeatured = team.id === TEAM_ID;
        const form = team.form || [];
        
        return `
            <tr class="${isFeatured ? 'featured' : ''}">
                <td class="text-left">
                    <div class="table-position">
                        ${team.qualColor ? `<span class="position-indicator" style="background-color: ${team.qualColor};"></span>` : ''}
                        ${team.idx}
                    </div>
                </td>
                <td class="text-left">
                    <div class="team-cell">
                        <img src="${getTeamLogo(team.name, team.id)}" 
                             alt="${team.name}"
                             onerror="this.style.display='none';">
                        <span>${team.shortName || team.name}</span>
                    </div>
                </td>
                <td>${team.played}</td>
                <td>${team.wins}</td>
                <td>${team.draws}</td>
                <td>${team.losses}</td>
                <td>${team.scoresStr}</td>
                <td>${team.goalConDiff > 0 ? '+' : ''}${team.goalConDiff}</td>
                <td style="font-weight: 700;">${team.pts}</td>
                <td>
                    <div class="form-badges">
                        ${form.slice(-5).map(f => `<div class="form-badge ${f.resultString}">${f.resultString}</div>`).join('')}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Populate next match
function populateNextMatch() {
    const nextMatchContainer = document.getElementById('nextMatch');
    
    if (!teamData.fixtures || !teamData.fixtures.allFixtures) {
        nextMatchContainer.innerHTML = '<p style="color: var(--color-text-secondary);">No upcoming matches</p>';
        return;
    }
    
    // Find next match (first non-finished match)
    const nextMatch = teamData.fixtures.allFixtures.fixtures
        .find(f => !f.status?.finished);
    
    if (!nextMatch) {
        nextMatchContainer.innerHTML = '<p style="color: var(--color-text-secondary);">No upcoming matches</p>';
        return;
    }
    
    const matchDate = new Date(nextMatch.status.utcTime);
    const dateOptions = { weekday: 'short', day: 'numeric', month: 'short' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    nextMatchContainer.innerHTML = `
        <div class="match-teams">
            <div class="match-team">
                <img src="${getTeamLogo(nextMatch.home.name, nextMatch.home.id)}" 
                     alt="${nextMatch.home.name}"
                     onerror="this.style.display='none';">
                <div class="match-team-name">${nextMatch.home.name}</div>
            </div>
            <div class="match-time">
                <div class="match-time-value">${matchDate.toLocaleTimeString('en-GB', timeOptions)}</div>
                <div class="match-date">${matchDate.toLocaleDateString('en-GB', dateOptions)}</div>
            </div>
            <div class="match-team">
                <img src="${getTeamLogo(nextMatch.away.name, nextMatch.away.id)}" 
                     alt="${nextMatch.away.name}"
                     onerror="this.style.display='none';">
                <div class="match-team-name">${nextMatch.away.name}</div>
            </div>
        </div>
    `;
    
    // Update next match league badge
    if (nextMatch.tournament) {
        document.getElementById('nextMatchLeague').textContent = nextMatch.tournament.name;
    }
}

// Populate fixtures list
function populateFixtures() {
    const fixturesContainer = document.getElementById('fixturesList');
    
    if (!teamData.fixtures || !teamData.fixtures.allFixtures) {
        fixturesContainer.innerHTML = '<p style="color: var(--color-text-secondary);">No fixtures available</p>';
        return;
    }
    
    // Get next 5 upcoming matches
    const upcomingMatches = teamData.fixtures.allFixtures.fixtures
        .filter(f => !f.status?.finished)
        .slice(0, 5);
    
    if (upcomingMatches.length === 0) {
        fixturesContainer.innerHTML = '<p style="color: var(--color-text-secondary);">No upcoming fixtures</p>';
        return;
    }
    
    fixturesContainer.innerHTML = upcomingMatches.map(match => {
        const matchDate = new Date(match.status.utcTime);
        const dateOptions = { day: 'numeric', month: 'short' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        
        return `
            <div class="fixture-item">
                <div class="fixture-date">
                    <div class="fixture-date-day">${matchDate.toLocaleDateString('en-GB', dateOptions)}</div>
                    <div class="fixture-date-time">${matchDate.toLocaleTimeString('en-GB', timeOptions)}</div>
                </div>
                <div class="fixture-teams">
                    <div class="fixture-team">
                        <img src="${getTeamLogo(match.home.name, match.home.id)}" 
                             alt="${match.home.name}"
                             onerror="this.style.display='none';">
                        <span class="fixture-team-name">${match.home.name}</span>
                    </div>
                    <div class="fixture-team">
                        <img src="${getTeamLogo(match.away.name, match.away.id)}" 
                             alt="${match.away.name}"
                             onerror="this.style.display='none';">
                        <span class="fixture-team-name">${match.away.name}</span>
                    </div>
                </div>
                <div class="fixture-league-badge">${match.tournament?.name || '2. Division'}</div>
            </div>
        `;
    }).join('');
}

// Populate stadium info
function populateStadiumInfo() {
    const stadiumContainer = document.getElementById('stadiumInfo');
    
    if (!teamData.overview || !teamData.overview.venue) {
        stadiumContainer.innerHTML = '<p style="color: var(--color-text-secondary);">No stadium information available</p>';
        return;
    }
    
    const venue = teamData.overview.venue;
    
    stadiumContainer.innerHTML = `
        <div class="stadium-name">${venue.widget?.name || 'Stadium'}</div>
        <div class="stadium-location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${venue.widget?.city || 'Lárnaka (Larnaca)'}
        </div>
        <div class="stadium-stats">
            <div class="stadium-stat">
                <div class="stadium-stat-value">${venue.widget?.capacity?.toLocaleString() || '5,500'}</div>
                <div class="stadium-stat-label">Capacity</div>
            </div>
            <div class="stadium-stat">
                <div class="stadium-stat-value">${venue.widget?.opened || '1991'}</div>
                <div class="stadium-stat-label">Opened</div>
            </div>
            <div class="stadium-stat">
                <div class="stadium-stat-value">${venue.widget?.surface || 'Grass'}</div>
                <div class="stadium-stat-label">Surface</div>
            </div>
        </div>
    `;
}

// Tab navigation
function initTabNavigation() {
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Get tab name
            const tabName = tab.dataset.tab;
            console.log('Switching to tab:', tabName);
            
            // Here you can add logic to show/hide different content sections
            // For now, all content is on the overview tab
        });
    });
}

// Sync to calendar button
function initSyncButton() {
    const syncBtn = document.querySelector('.btn-sync');
    
    syncBtn.addEventListener('click', () => {
        console.log('Sync to calendar clicked');
        
        // Generate ICS file for team fixtures
        if (teamData && teamData.fixtures) {
            generateCalendarFile();
        } else {
            alert('No fixtures data available');
        }
    });
}

// Generate calendar ICS file
function generateCalendarFile() {
    if (!teamData.fixtures || !teamData.fixtures.allFixtures) {
        alert('No fixtures available to sync');
        return;
    }
    
    const fixtures = teamData.fixtures.allFixtures.fixtures.filter(f => !f.status?.finished);
    
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Calendar App//Team Fixtures//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Nea Salamis Fixtures',
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
    link.download = 'nea-salamis-fixtures.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Team page initializing...');
    
    // Load all components first
    await loadTeamComponents();
    
    // Initialize tab navigation
    initTabNavigation();
    
    // Initialize sync button
    initSyncButton();
    
    // Fetch and display team data
    fetchTeamData();
});

