// Reusable component functions

// Truncate team name for compact display
function truncateTeamName(name, maxLength = 15) {
    if (!name) return '';

    // Remove common prefixes/words to shorten names
    const shortened = name
        .replace(/^(ΑΕ|ΑΟ|ΑΣ|ΠΟ|ΠΑΕ|ΠΑΕΕΚ|ΑΛΣ|ΜΕΑΠ|ΑΟΑΝ|ΑΠΕΑ)\s+/g, '')
        .trim();

    if (shortened.length <= maxLength) {
        return shortened;
    }

    // If still too long, truncate and add ellipsis
    return shortened.substring(0, maxLength - 1) + '…';
}

function createCalendarHeader() {
    return `
        <div class="calendar-header">
            <div data-label="days.monday">Δευτέρα</div>
            <div data-label="days.tuesday">Τρίτη</div>
            <div data-label="days.wednesday">Τετάρτη</div>
            <div data-label="days.thursday">Πέμπτη</div>
            <div data-label="days.friday">Παρασκευή</div>
            <div data-label="days.saturday">Σάββατο</div>
            <div data-label="days.sunday">Κυριακή</div>
        </div>
    `;
}

// Helper function to determine match result from score and location
function getMatchResult(score, location) {
    if (!score || !score.includes('-')) {
        return null;
    }

    const parts = score.split('-').map(s => parseInt(s.trim()));
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        return null;
    }

    let goalsFor, goalsAgainst;
    
    // Parse score based on location
    if (location === 'home') {
        // Home match: score is "our goals - their goals"
        goalsFor = parts[0];
        goalsAgainst = parts[1];
    } else {
        // Away match: score is "their goals - our goals"
        goalsFor = parts[1];
        goalsAgainst = parts[0];
    }

    // Determine result
    if (goalsFor > goalsAgainst) {
        return 'win';
    } else if (goalsFor < goalsAgainst) {
        return 'loss';
    } else {
        return 'draw';
    }
}

function createEventDetail(event, dayNumber, monthInfo) {
    // Support both old format (title, subtitle) and new format (event object)
    let title, subtitle, venue, logo, status, score, location, sport;

    if (typeof event === 'object' && event.title) {
        // New enhanced format
        title = event.title;
        subtitle = event.subtitle;
        venue = event.venue;
        logo = event.logo;
        status = event.status;
        score = event.score;
        location = event.location;
        sport = event.sport;
    } else {
        // Legacy format (backwards compatibility)
        title = arguments[0];
        subtitle = arguments[1];
    }

    // Check if it's a meeting (no "vs" in title)
    const isMeeting = !title.includes(' vs ');

    // Create a JSON string for the event data to pass to the popover
    const eventDataJson = JSON.stringify({
        title,
        subtitle,
        venue,
        logo,
        status,
        score,
        location,
        sport,
        isMeeting,
        dayNumber,
        monthInfo
    }).replace(/"/g, '&quot;');

    // Calculate countdown for upcoming events
    let countdownHTML = '';
    if (status !== 'played' && monthInfo && dayNumber) {
        const timePart = subtitle.split(' - ')[1];
        if (timePart) {
            const [hours, minutes] = timePart.split(':').map(num => parseInt(num, 10));
            const eventDate = new Date(monthInfo.year, monthInfo.monthIndex, dayNumber, hours, minutes);
            const eventTimestamp = eventDate.getTime();
            countdownHTML = `<div class="event-countdown" data-timestamp="${eventTimestamp}"></div>`;
        }
    }

    if (isMeeting) {
        // For meetings, use the title as is
        return `
            <div class="event-details" onclick="openEventPopover(this)" data-event='${eventDataJson}'>
                <div class="event-compact">
                    <span class="event-emoji">📅</span>
                    <span class="event-opponent">${title}</span>
                </div>
                ${countdownHTML}
            </div>
        `;
    }

    // For sports events
    // Extract opponent name (remove "Νέα Σαλαμίνα vs " or "... vs Νέα Σαλαμίνα")
    const opponent = title.replace('Νέα Σαλαμίνα vs ', '').replace(/ vs Νέα Σαλαμίνα/, '');

    // Extract emoji and time from subtitle
    const emoji = subtitle.split(' - ')[0];

    // Build logo HTML
    const logoHTML = logo ? `<img src="${logo}" alt="${opponent}" class="opponent-logo">` : '';

    // Build score/status HTML
    let scoreHTML = '';
    if (status === 'played' && score) {
        scoreHTML = `<span class="event-score">${score}</span>`;
    }

    // Determine event status class based on result
    let eventStatusClass = '';
    if (status === 'played') {
        const result = getMatchResult(score, location);
        if (result === 'win') {
            eventStatusClass = 'event-win';
        } else if (result === 'draw') {
            eventStatusClass = 'event-draw';
        } else if (result === 'loss') {
            eventStatusClass = 'event-loss';
        } else {
            eventStatusClass = 'played'; // fallback for invalid scores
        }
    } else {
        eventStatusClass = 'event-not-played';
    }

    return `
        <div class="event-details ${eventStatusClass}" onclick="openEventPopover(this)" data-event='${eventDataJson}'>
            <div class="event-compact">
                <span class="event-emoji">${emoji}</span>
                ${logoHTML}
                <span class="event-opponent">${truncateTeamName(opponent, 12)}</span>
                ${scoreHTML}
            </div>
            ${countdownHTML}
        </div>
    `;
}

function createCalendarDay(dayNumber, dayName = '', events = [], isEmpty = false) {
    if (isEmpty) {
        return '<div class="calendar-day empty"></div>';
    }

    const hasEvents = events.length > 0;
    const eventClass = hasEvents ? 'event' : '';
    const dayNameSpan = dayName ? `<div class="day-name">${dayName}</div>` : '';

    const eventsHTML = events.map(event =>
        createEventDetail(event)
    ).join('');

    return `
        <div class="calendar-day ${eventClass}">
            <div class="day-number">${dayNumber}${dayNameSpan}</div>
            ${eventsHTML}
        </div>
    `;
}

function createCalendarGrid(days) {
    const daysHTML = days.map(day => {
        if (day.empty) {
            return createCalendarDay(0, '', [], true);
        }
        return createCalendarDay(day.number, day.name, day.events || []);
    }).join('');

    return `
        <div class="calendar-grid">
            ${daysHTML}
        </div>
    `;
}

function createCalendar(monthData) {
    return `
        <div class="calendar-wrapper">
            ${createCalendarHeader()}
            ${createCalendarGrid(monthData.days)}
        </div>
    `;
}

// Statistics Components

function createStatCard(title, value, subtitle = '') {
    return `
        <div class="stat-card">
            <div class="stat-value">${value}</div>
            <div class="stat-title">${title}</div>
            ${subtitle ? `<div class="stat-subtitle">${subtitle}</div>` : ''}
        </div>
    `;
}

function createFormBadge(result, opponent, score, location) {
    const color = getFormColor(result);
    const locationIcon = location === 'home' ? '🏠' : '✈️';
    return `
        <div class="form-badge" style="background-color: ${color};" title="${opponent} ${score} ${locationIcon}">
            ${result}
        </div>
    `;
}

function createHeadToHeadRow(h2h) {
    const winPct = h2h.played > 0 ? Math.round((h2h.wins / h2h.played) * 100) : 0;
    return `
        <tr>
            <td class="h2h-opponent">${h2h.opponent}</td>
            <td>${h2h.played}</td>
            <td class="stat-wins">${h2h.wins}</td>
            <td class="stat-draws">${h2h.draws}</td>
            <td class="stat-losses">${h2h.losses}</td>
            <td>${h2h.goalsFor}-${h2h.goalsAgainst}</td>
            <td>${winPct}%</td>
        </tr>
    `;
}

function createStatisticsDisplay() {
    const stats = formatStatistics();

    if (stats.error) {
        return `<div class="stats-error">${stats.error}</div>`;
    }

    const { overall, home, away, recentForm, headToHead } = stats;

    // Recent form HTML
    const formHTML = recentForm.length > 0
        ? recentForm.map(match => createFormBadge(match.result, match.opponent, match.score, match.location)).join('')
        : '<div class="no-data">Δεν υπάρχουν δεδομένα</div>';

    // Head-to-head HTML
    const h2hHTML = headToHead.length > 0
        ? headToHead.slice(0, 10).map(h2h => createHeadToHeadRow(h2h)).join('')
        : '<tr><td colspan="7" class="no-data">Δεν υπάρχουν δεδομένα</td></tr>';

    return `
        <div class="statistics-content">
            <!-- Overall Statistics -->
            <div class="stats-section">
                <h4 class="stats-section-title">📈 Συνολική Απόδοση</h4>
                <div class="stats-grid">
                    ${createStatCard('Αγώνες', overall.played)}
                    ${createStatCard('Νίκες', overall.wins, `${overall.winPercentage}%`)}
                    ${createStatCard('Ισοπαλίες', overall.draws)}
                    ${createStatCard('Ήττες', overall.losses)}
                    ${createStatCard('Βαθμοί', overall.points)}
                    ${createStatCard('Γκολ', `${overall.goalsFor}-${overall.goalsAgainst}`, `Διαφορά: ${overall.goalDifference > 0 ? '+' : ''}${overall.goalDifference}`)}
                </div>
            </div>

            <!-- Home vs Away -->
            <div class="stats-section">
                <h4 class="stats-section-title">🏠 Εντός vs ✈️ Εκτός Έδρας</h4>
                <div class="stats-comparison">
                    <div class="stats-column">
                        <div class="stats-column-header">🏠 Εντός Έδρας</div>
                        <div class="stats-grid">
                            ${createStatCard('Αγώνες', home.played)}
                            ${createStatCard('Νίκες', home.wins, `${home.winPercentage}%`)}
                            ${createStatCard('Ισοπαλίες', home.draws)}
                            ${createStatCard('Ήττες', home.losses)}
                            ${createStatCard('Γκολ', `${home.goalsFor}-${home.goalsAgainst}`, `Διαφορά: ${home.goalDifference > 0 ? '+' : ''}${home.goalDifference}`)}
                        </div>
                    </div>
                    <div class="stats-column">
                        <div class="stats-column-header">✈️ Εκτός Έδρας</div>
                        <div class="stats-grid">
                            ${createStatCard('Αγώνες', away.played)}
                            ${createStatCard('Νίκες', away.wins, `${away.winPercentage}%`)}
                            ${createStatCard('Ισοπαλίες', away.draws)}
                            ${createStatCard('Ήττες', away.losses)}
                            ${createStatCard('Γκολ', `${away.goalsFor}-${away.goalsAgainst}`, `Διαφορά: ${away.goalDifference > 0 ? '+' : ''}${away.goalDifference}`)}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Form -->
            <div class="stats-section">
                <h4 class="stats-section-title">🔥 Πρόσφατη Φόρμα (Τελευταίοι 5 Αγώνες)</h4>
                <div class="form-guide">
                    ${formHTML}
                </div>
                <div class="form-legend">
                    <span class="form-legend-item"><span class="form-badge" style="background-color: #4CAF50;">W</span> Νίκη</span>
                    <span class="form-legend-item"><span class="form-badge" style="background-color: #FFC107;">D</span> Ισοπαλία</span>
                    <span class="form-legend-item"><span class="form-badge" style="background-color: #F44336;">L</span> Ήττα</span>
                </div>
            </div>

            <!-- Head-to-Head -->
            <div class="stats-section">
                <h4 class="stats-section-title">⚔️ Κόντρα με Κόντρα (Top 10)</h4>
                <div class="h2h-table-container">
                    <table class="h2h-table">
                        <thead>
                            <tr>
                                <th>Αντίπαλος</th>
                                <th>Αγ.</th>
                                <th>Ν</th>
                                <th>Ι</th>
                                <th>Η</th>
                                <th>Γκολ</th>
                                <th>Ν%</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${h2hHTML}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}