// Language Labels - English
// English language labels for the application

(function() {
    const labels = {
    // Common
    common: {
        appName: 'Red Rebels',
        year: '2025',
        brandText: 'Red Rebels 25/26',
        altLogo: 'Red Rebels',
        toggleNavigation: 'Toggle navigation'
    },

    // Page Titles
    titles: {
        calendar: 'Red Rebels Event Schedule 2025',
        stats: 'Nea Salamina Stats 25/26',
        teamStats: 'Team Statistics'
    },

    // Meta Descriptions
    meta: {
        calendarDescription: 'Event schedule calendar for Red Rebels Limassol - Football and Volleyball matches',
        statsDescription: 'Team statistics for Red Rebels Limassol - Football and Volleyball'
    },

    // Navigation
    nav: {
        calendar: 'Calendar',
        stats: 'Statistics',
        options: 'Tools',
        toggleDarkMode: 'Toggle Dark Mode'
    },

    // Navigation Options Menu
    navOptions: {
        export: 'Export (.ics)',
        print: 'Print'
    },

    // Month Navigation
    monthNav: {
        previous: 'Previous',
        next: 'Next',
        jumpToToday: 'Today',
    },

    // Day Names
    days: {
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday'
    },

    // Month Names
    months: {
        september: 'September',
        october: 'October',
        november: 'November',
        december: 'December',
        january: 'January',
        february: 'February',
        march: 'March',
        april: 'April',
        may: 'May',
        june: 'June',
        july: 'July',
        august: 'August'
    },

    // Filters
    filters: {
        title: 'Event Filters',
        addFilter: '+ Filter',
        column: 'Column',
        search: 'Search',
        value: 'Value',
        sport: 'Sport',
        location: 'Location',
        status: 'Status',
        searchOpponent: 'Search Opponent',
        searchPlaceholder: 'Search...',
        clear: 'Clear',
        all: 'All',
        allLocations: 'All',
        allStatuses: 'All',
        addMore: 'Add More',
        clearAll: 'Clear All',
        apply: 'Apply',
        pleaseSelect: 'Please select',
        selectColumnFirst: 'Select column first'
    },

    // Sports
    sports: {
        footballMen: 'Men\'s Football',
        volleyballMen: 'Men\'s Volleyball',
        volleyballWomen: 'Women\'s Volleyball',
        meeting: 'Meetings'
    },

    // Locations
    locations: {
        home: 'Home',
        away: 'Away'
    },

    // Status
    status: {
        upcoming: 'Upcoming',
        played: 'Completed'
    },

    // Footer Legend
    legend: {
        title: 'Legend'
    },

    // Statistics
    stats: {
        // Overall Stats
        matches: 'Matches',
        wins: 'Wins',
        draws: 'Draws',
        losses: 'Losses',
        goalsFor: 'Goals For',
        goalsAgainst: 'Goals Against',
        goalDifference: 'Goal Difference',
        points: 'Points',

        // Sections
        overallStats: 'Overall Statistics',
        homeVsAway: 'Home vs Away',
        home: 'Home',
        away: 'Away',
        recentForm: 'Recent Form (Last 5 Matches)',
        headToHead: 'Head-to-Head (Top 10 Opponents)',

        // Form labels
        win: 'W',
        draw: 'D',
        loss: 'L',
        noRecentMatches: 'No recent matches',

        // Head to head
        opponent: 'Opponent',
        record: 'Record',
        noOpponents: 'No opponent data available'
    },

    // Buttons
    buttons: {
        show: 'Show',
        hide: 'Hide',
        viewStats: 'View Statistics',
        backToCalendar: 'Back to Calendar',
        exportCalendar: 'Export (.ics)',
        print: 'Print',
        clearFilters: 'Clear'
    },

    // Error Messages
    errors: {
        calendarDataNotLoaded: 'Error: Calendar data not loaded',
        calendarComponentsNotLoaded: 'Error: Calendar components not loaded',
        statsDisplayNotFound: 'createStatisticsDisplay function not found',
        failedToLoad: 'Failed to load'
    },

    // Icons (kept as-is for consistency)
    icons: {
        calendar: '📅',
        stats: '📊',
        search: '🔍',
        home: '🏠',
        away: '✈️',
        upcoming: '📅',
        completed: '✅',
        refresh: '🔄',
        export: '📥',
        print: '🖨️',
        settings: '⚙️',
        moon: '🌙',
        fire: '🔥',
        footballMen: '👨⚽',
        volleyballMen: '👨🏐',
        volleyballWomen: '👩🏻🏐',
        meeting: '📅'
    }
    };

    // Export for use in other scripts
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = labels;
    }

    // Make labels available globally for dynamic language switching
    if (typeof window !== 'undefined') {
        window.labels = labels;
    }
})();
