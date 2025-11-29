// Event data - loaded from events-data.js
// Event format: { day, sport, location, opponent, time, venue, logo, status, score }
// sport: football-men, volleyball-men, volleyball-women, meeting
// location: home, away
// status: upcoming, played (for results)

// eventData will be assigned from eventsData (loaded via script tag)
let eventData = {};
window.eventData = eventData;

// Configuration for sports and emojis
const sportConfig = {
    'football-men': { emoji: '👨⚽', name: 'Ανδρικό Ποδόσφαιρο' },
    'volleyball-men': { emoji: '👨🏐', name: 'Ανδρικό Βόλεϊ' },
    'volleyball-women': { emoji: '👩🏻🏐', name: 'Γυναικείο Βόλεϊ' },
    'meeting': { emoji: '', name: 'Meeting' }
};

// Get day name in Greek for a specific date
function getDayName(year, month, day) {
    const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    const date = new Date(year, month, day);
    return dayNames[date.getDay()];
}

// Load events from events-data.js
function loadEvents() {
    // eventsData is loaded from events-data.js via script tag
    if (typeof eventsData !== 'undefined') {
        eventData = eventsData;
        window.eventData = eventsData; // Expose to window
        console.log('✓ Events loaded successfully');
    } else {
        console.error('Error: eventsData not found. Make sure events-data.js is loaded.');
        eventData = { october: [], november: [], december: [] };
        window.eventData = eventData; // Expose to window
    }

    // Build calendar data after loading events
    calendarData = buildCalendarData();
    window.calendarData = calendarData; // Expose to window
    console.log('✓ Calendar data built successfully');

    return eventData;
}

// Parse event (supports both string and object format)
function parseEvent(eventData) {
    let day, sport, location, time, opponent, venue, logo, status, score;

    // Handle both string and object formats
    if (typeof eventData === 'string') {
        // Legacy string format
        const parts = eventData.split(' ');
        day = parseInt(parts[0]);
        sport = parts[1];
        location = parts[2];
        time = parts[parts.length - 1];
        opponent = parts.slice(3, -1).join(' ');
    } else {
        // Enhanced object format
        day = eventData.day;
        sport = eventData.sport;
        location = eventData.location;
        time = eventData.time;
        opponent = eventData.opponent;
        venue = eventData.venue;
        logo = eventData.logo;
        status = eventData.status;
        score = eventData.score;
    }

    const sportInfo = sportConfig[sport];
    const teamName = 'Νέα Σαλαμίνα';

    let title;
    if (sport === 'meeting') {
        title = opponent;
    } else if (location === 'home') {
        title = `${teamName} vs ${opponent}`;
    } else {
        title = `${opponent} vs ${teamName}`;
    }

    const subtitle = sportInfo.emoji ? `${sportInfo.emoji} - ${time}` : `${sportInfo.name} - ${time}`;

    return {
        day,
        title,
        subtitle,
        venue,
        logo,
        status,
        score,
        location,
        sport
    };
}

// Build calendar data from simple event strings
function buildCalendarData() {
    const monthMap = {
        // 2025-2026 Season
        'september': { monthIndex: 8, year: 2025, daysInMonth: 30, startDay: 0 }, // Sept 2025 starts on Monday
        'october': { monthIndex: 9, year: 2025, daysInMonth: 31, startDay: 2 }, // Oct 2025 starts on Wednesday
        'november': { monthIndex: 10, year: 2025, daysInMonth: 30, startDay: 5 }, // Nov 2025 starts on Saturday
        'december': { monthIndex: 11, year: 2025, daysInMonth: 31, startDay: 0 }, // Dec 2025 starts on Monday
        'january': { monthIndex: 0, year: 2026, daysInMonth: 31, startDay: 3 }, // Jan 2026 starts on Thursday
        'february': { monthIndex: 1, year: 2026, daysInMonth: 28, startDay: 6 }, // Feb 2026 starts on Sunday
        'march': { monthIndex: 2, year: 2026, daysInMonth: 31, startDay: 6 }, // March 2026 starts on Sunday
        'april': { monthIndex: 3, year: 2026, daysInMonth: 30, startDay: 2 }, // April 2026 starts on Wednesday
        'may': { monthIndex: 4, year: 2026, daysInMonth: 31, startDay: 4 }, // May 2026 starts on Friday
        'june': { monthIndex: 5, year: 2026, daysInMonth: 30, startDay: 0 }, // June 2026 starts on Monday
        'july': { monthIndex: 6, year: 2026, daysInMonth: 31, startDay: 2 }, // July 2026 starts on Wednesday
        'august': { monthIndex: 7, year: 2026, daysInMonth: 31, startDay: 5 } // Aug 2026 starts on Saturday
    };

    const calendar = {};

    for (const [monthName, events] of Object.entries(eventData)) {
        const monthInfo = monthMap[monthName];

        // Skip months not in our map
        if (!monthInfo) {
            console.warn(`Month '${monthName}' not found in monthMap, skipping...`);
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

            // Add events if any
            if (eventsByDay[day]) {
                dayData.events = eventsByDay[day];
                // Add day name for days with events
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

// Calendar data will be generated after events are loaded
let calendarData = {};