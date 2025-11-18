// Reusable component functions

function createCalendarHeader() {
    return `
        <div class="calendar-header">
            <div>Δευτέρα</div>
            <div>Τρίτη</div>
            <div>Τετάρτη</div>
            <div>Πέμπτη</div>
            <div>Παρασκευή</div>
            <div>Σάββατο</div>
            <div>Κυριακή</div>
        </div>
    `;
}

function createEventDetail(title, subtitle) {
    // Check if it's a meeting (no "vs" in title)
    const isMeeting = !title.includes(' vs ');

    if (isMeeting) {
        // For meetings, use the title as is
        const time = subtitle.split(' - ')[1];

        return `
            <div class="event-details">
                <div class="event-compact">
                    <span class="event-emoji">📅</span>
                    <span class="event-opponent">${title}</span>
                </div>
                <div class="event-expanded">
                    <div class="event-full-title">${title}</div>
                    <div class="event-info">
                        <span class="event-time">⏰ ${time}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // For sports events
    // Extract opponent name (remove "Νέα Σαλαμίνα vs " or "... vs Νέα Σαλαμίνα")
    const opponent = title.replace('Νέα Σαλαμίνα vs ', '').replace(/ vs Νέα Σαλαμίνα/, '');

    // Extract emoji and time from subtitle
    const emoji = subtitle.split(' - ')[0];
    const time = subtitle.split(' - ')[1];

    // Determine if home or away
    const isHome = title.startsWith('Νέα Σαλαμίνα vs');
    const location = isHome ? '🏠 Home' : '✈️ Away';

    return `
        <div class="event-details">
            <div class="event-compact">
                <span class="event-emoji">${emoji}</span>
                <span class="event-opponent">${opponent}</span>
            </div>
            <div class="event-expanded">
                <div class="event-full-title">${title}</div>
                <div class="event-info">
                    <span class="event-time">⏰ ${time}</span>
                    <span class="event-location">${location}</span>
                </div>
            </div>
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
        createEventDetail(event.title, event.subtitle)
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
