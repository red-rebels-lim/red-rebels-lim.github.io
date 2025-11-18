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
    return `
        <div class="event-details">
            <div class="event-title">${title}</div>
            <div class="event-subtitle">${subtitle}</div>
        </div>
    `;
}

function createCalendarDay(dayNumber, dayName = '', events = [], isEmpty = false) {
    if (isEmpty) {
        return '<div class="calendar-day empty"></div>';
    }

    const hasEvents = events.length > 0;
    const eventClass = hasEvents ? 'event' : '';
    const dayNameSpan = dayName ? `<span class="day-name">${dayName}</span>` : '';

    const eventsHTML = events.map(event =>
        createEventDetail(event.title, event.subtitle)
    ).join('');

    return `
        <div class="calendar-day ${eventClass}">
            <div class="day-number">${dayNumber} ${dayNameSpan}</div>
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