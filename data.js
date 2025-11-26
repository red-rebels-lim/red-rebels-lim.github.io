// Simple event data format
// Format: "day sport location opponent time"
// sport: football-men, volleyball-men, volleyball-women, meeting
// location: home, away
// Example: "12 football-men home Καρμιώτισσα 19:00"

const eventData = {
    october: [
        "1 football-men away ΕΝΥ Υψωνας 19:00",
        "5 football-men home ΠΟ Αχυρώνας Ονήσιλος 16:00",
        "7 meeting home Συνεδρία Συνδέσμου Λεμεσού 19:30",
        "17 volleyball-men home Παφιακός 20:30",
        "18 football-men away ΜΕΑΠ 15:30",
        "25 football-men home Χαλκάνορας Ιδαλίου 15:00",
        "25 volleyball-women home Ανόρθωσης 18:00"
    ],
    november: [
        "1 football-men away ΑΣΙΛ Λύσης 14:30",
        "7 volleyball-men home Ανόρθωσης 20:00",
        "8 football-men home ΑΕΖ 14:30",
        "15 volleyball-women home Απόλλων 18:00",
        "21 volleyball-men home Αναγέννηση Δερύνειας 20:00",
        "22 football-men away Ομόνοια 29ης Μαϊου 17:00",
        "28 football-men home ΠΑΕΕΚ Κερύνειας 19:00",
        "29 volleyball-women home Λεμεσός 18:00"
    ],
    december: [
        "6 football-men away Σπάρτακος Κιτίου 14:30",
        "6 volleyball-women home RoboMarkets ΑΕΛ 18:00",
        "12 football-men home Καρμιώτισσα 19:00",
        "17 football-men home Διγενής Μόρφου 19:00",
        "19 volleyball-men home Ομόνοια 20:00",
        "20 volleyball-women home ΑΕΚ Λάρνακας 18:00",
        "30 volleyball-women home Κούρης Ερήμης 18:00"
    ]
};

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

// Parse a simple event string and create event object
function parseEvent(eventString) {
    const parts = eventString.split(' ');
    const day = parseInt(parts[0]);
    const sport = parts[1];
    const location = parts[2];
    const time = parts[parts.length - 1];
    const opponent = parts.slice(3, -1).join(' ');

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
        subtitle
    };
}

// Build calendar data from simple event strings
function buildCalendarData() {
    const monthMap = {
        'october': { monthIndex: 9, daysInMonth: 31, startDay: 2 }, // Oct 2025 starts on Wednesday (day 2)
        'november': { monthIndex: 10, daysInMonth: 30, startDay: 5 }, // Nov 2025 starts on Saturday (day 5)
        'december': { monthIndex: 11, daysInMonth: 31, startDay: 0 } // Dec 2025 starts on Monday (day 0)
    };

    const calendar = {};

    for (const [monthName, events] of Object.entries(eventData)) {
        const monthInfo = monthMap[monthName];
        const days = [];

        // Add empty days at the start
        for (let i = 0; i < monthInfo.startDay; i++) {
            days.push({ empty: true });
        }

        // Parse events and group by day
        const eventsByDay = {};
        events.forEach(eventString => {
            const event = parseEvent(eventString);
            if (!eventsByDay[event.day]) {
                eventsByDay[event.day] = [];
            }
            eventsByDay[event.day].push({
                title: event.title,
                subtitle: event.subtitle
            });
        });

        // Add all days in the month
        for (let day = 1; day <= monthInfo.daysInMonth; day++) {
            const dayData = { number: day };

            // Add events if any
            if (eventsByDay[day]) {
                dayData.events = eventsByDay[day];
                // Add day name for days with events
                dayData.name = getDayName(2025, monthInfo.monthIndex, day);
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

// Generate the full calendar data
const calendarData = buildCalendarData();