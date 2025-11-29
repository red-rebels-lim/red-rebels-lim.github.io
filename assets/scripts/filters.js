// Calendar Filters Module
// Handles all filtering functionality for the calendar

'use strict';

// Filter row counter
let filterRowCount = 0;

// Store active filter rows
let filterRows = [];

// Toggle filter panel visibility
function toggleFilters() {
    const panel = document.getElementById('filters-panel');
    const isActive = panel.classList.toggle('active');

    // Add initial filter row when opening
    if (isActive && filterRows.length === 0) {
        addFilterRow();
    }
}

// Create a new filter row
function addFilterRow() {
    filterRowCount++;
    const rowId = `filter-row-${filterRowCount}`;

    const container = document.getElementById('filter-rows-container');

    const rowDiv = document.createElement('div');
    rowDiv.className = 'filter-row';
    rowDiv.id = rowId;

    rowDiv.innerHTML = `
        <div class="filter-row-number">${filterRowCount}</div>
        <div class="filter-column-select">
            <label class="filter-small-label" data-label="filters.column">Column</label>
            <select class="filter-type-select filter-select-modern" data-row-id="${rowId}" onchange="updateFilterValue(this)">
                <option value="" data-label="filters.pleaseSelect">Please select</option>
                <option value="sport" data-label="filters.sport">Sport</option>
                <option value="location" data-label="filters.location">Location</option>
                <option value="status" data-label="filters.status">Status</option>
                <option value="search" data-label="filters.searchOpponent">Search Opponent</option>
            </select>
        </div>
        <div class="filter-value-container">
            <label class="filter-small-label" data-label="filters.value">Value</label>
            <div class="filter-value-input" id="${rowId}-value">
                <select class="filter-input-modern" disabled>
                    <option data-label="filters.selectColumnFirst">Select column first</option>
                </select>
            </div>
        </div>
        <button class="filter-remove-btn" onclick="removeFilterRow('${rowId}')" title="Remove filter">×</button>
    `;

    container.appendChild(rowDiv);
    filterRows.push(rowId);

    // Apply labels to the new row
    if (typeof window.applyLabels === 'function') {
        window.applyLabels();
    }
}

// Remove a filter row
function removeFilterRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
        filterRows = filterRows.filter(id => id !== rowId);
    }
}

// Update the value input based on selected filter type
function updateFilterValue(selectElement) {
    const rowId = selectElement.getAttribute('data-row-id');
    const filterType = selectElement.value;
    const valueContainer = document.getElementById(`${rowId}-value`);

    if (!filterType) {
        valueContainer.innerHTML = `
            <select class="filter-input-modern" disabled>
                <option data-label="filters.selectColumnFirst">Select column first</option>
            </select>
        `;
        if (typeof window.applyLabels === 'function') {
            window.applyLabels();
        }
        return;
    }

    let inputHTML = '';

    switch (filterType) {
        case 'sport':
            inputHTML = `
                <select class="filter-input-modern filter-value" data-filter-type="sport">
                    <option value="all" data-label="filters.all">All</option>
                    <option value="football-men" data-label="sports.footballMen">Men's Football</option>
                    <option value="volleyball-men" data-label="sports.volleyballMen">Men's Volleyball</option>
                    <option value="volleyball-women" data-label="sports.volleyballWomen">Women's Volleyball</option>
                    <option value="meeting" data-label="sports.meeting">Meetings</option>
                </select>
            `;
            break;
        case 'location':
            inputHTML = `
                <select class="filter-input-modern filter-value" data-filter-type="location">
                    <option value="all" data-label="filters.all">All</option>
                    <option value="home" data-label="locations.home">Home</option>
                    <option value="away" data-label="locations.away">Away</option>
                </select>
            `;
            break;
        case 'status':
            inputHTML = `
                <select class="filter-input-modern filter-value" data-filter-type="status">
                    <option value="all" data-label="filters.all">All</option>
                    <option value="upcoming" data-label="status.upcoming">Upcoming</option>
                    <option value="played" data-label="status.played">Completed</option>
                </select>
            `;
            break;
        case 'search':
            inputHTML = `
                <input type="text"
                       class="filter-input-modern filter-value"
                       data-filter-type="search"
                       data-label-placeholder="filters.searchPlaceholder"
                       placeholder="Search...">
            `;
            break;
    }

    valueContainer.innerHTML = inputHTML;

    // Apply labels to the new elements
    if (typeof window.applyLabels === 'function') {
        window.applyLabels();
    }
}

// Collect all active filters from the rows
function collectFilters() {
    const filters = {
        sport: 'all',
        location: 'all',
        status: 'all',
        search: ''
    };

    filterRows.forEach(rowId => {
        const row = document.getElementById(rowId);
        if (!row) return;

        const typeSelect = row.querySelector('.filter-type-select');
        const valueInput = row.querySelector('.filter-value');

        if (!typeSelect || !valueInput) return;

        const filterType = typeSelect.value;
        const filterValue = valueInput.value;

        if (filterType && filterValue) {
            filters[filterType] = filterValue;
        }
    });

    return filters;
}

// Apply filters to the calendar
function applyFilters() {
    const filters = collectFilters();

    console.log('Applying filters:', filters);

    // Build filtered calendar data
    calendarData = buildFilteredCalendarData(filters);

    // Reload the current month
    loadMonth(currentMonth);
}

// Apply filters and close panel
function applyFiltersAndClose() {
    applyFilters();
    const panel = document.getElementById('filters-panel');
    panel.classList.remove('active');
}

// Clear all filters
function clearFilters() {
    // Remove all filter rows
    const container = document.getElementById('filter-rows-container');
    container.innerHTML = '';
    filterRows = [];
    filterRowCount = 0;

    // Add one empty filter row
    addFilterRow();

    // Rebuild calendar data without filters
    calendarData = buildCalendarData();

    // Reload the current month
    loadMonth(currentMonth);

    console.log('Filters cleared');
}

// Build calendar data with filters applied
function buildFilteredCalendarData(filters) {
    // Filter the events based on active filters
    const filteredEventData = {};

    for (const [monthName, events] of Object.entries(eventData)) {
        const filteredEvents = events.filter(event => {
            // Sport filter
            if (filters.sport !== 'all' && event.sport !== filters.sport) {
                return false;
            }

            // Location filter
            if (filters.location !== 'all' && event.location !== filters.location) {
                return false;
            }

            // Status filter
            if (filters.status !== 'all') {
                const isPlayed = event.status === 'played';
                if (filters.status === 'played' && !isPlayed) {
                    return false;
                }
                if (filters.status === 'upcoming' && isPlayed) {
                    return false;
                }
            }

            // Search filter
            if (filters.search !== '') {
                const opponentName = event.opponent.toLowerCase();
                if (!opponentName.includes(filters.search.toLowerCase())) {
                    return false;
                }
            }

            return true;
        });

        filteredEventData[monthName] = filteredEvents;
    }

    // Build calendar data from filtered events
    const monthMap = {
        'september': { monthIndex: 8, year: 2025, daysInMonth: 30, startDay: 0 },
        'october': { monthIndex: 9, year: 2025, daysInMonth: 31, startDay: 2 },
        'november': { monthIndex: 10, year: 2025, daysInMonth: 30, startDay: 5 },
        'december': { monthIndex: 11, year: 2025, daysInMonth: 31, startDay: 0 },
        'january': { monthIndex: 0, year: 2026, daysInMonth: 31, startDay: 3 },
        'february': { monthIndex: 1, year: 2026, daysInMonth: 28, startDay: 6 },
        'march': { monthIndex: 2, year: 2026, daysInMonth: 31, startDay: 6 },
        'april': { monthIndex: 3, year: 2026, daysInMonth: 30, startDay: 2 },
        'may': { monthIndex: 4, year: 2026, daysInMonth: 31, startDay: 4 },
        'june': { monthIndex: 5, year: 2026, daysInMonth: 30, startDay: 0 },
        'july': { monthIndex: 6, year: 2026, daysInMonth: 31, startDay: 2 },
        'august': { monthIndex: 7, year: 2026, daysInMonth: 31, startDay: 5 }
    };

    const calendar = {};

    for (const [monthName, events] of Object.entries(filteredEventData)) {
        const monthInfo = monthMap[monthName];

        if (!monthInfo) {
            continue;
        }

        const days = [];

        // Add empty days at the start
        for (let i = 0; i < monthInfo.startDay; i++) {
            days.push({ empty: true });
        }

        // Parse events and group by day
        const eventsByDay = {};
        events.forEach(eventData => {
            const event = parseEvent(eventData);
            if (!eventsByDay[event.day]) {
                eventsByDay[event.day] = [];
            }
            eventsByDay[event.day].push({
                title: event.title,
                subtitle: event.subtitle,
                venue: event.venue,
                logo: event.logo,
                status: event.status,
                score: event.score,
                location: event.location,
                sport: event.sport
            });
        });

        // Add all days in the month
        for (let day = 1; day <= monthInfo.daysInMonth; day++) {
            const dayData = { number: day };

            if (eventsByDay[day]) {
                dayData.events = eventsByDay[day];
                dayData.name = getDayName(monthInfo.year, monthInfo.monthIndex, day);
            }

            days.push(dayData);
        }

        // Add empty days at the end for December
        if (monthName === 'december') {
            const totalCells = days.length;
            const cellsNeeded = Math.ceil(totalCells / 7) * 7;
            for (let i = totalCells; i < cellsNeeded; i++) {
                days.push({ empty: true });
            }
        }

        calendar[monthName] = { days };
    }

    return calendar;
}
