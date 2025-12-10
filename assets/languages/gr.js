// Language Labels - Greek (Current Language)
// Note: This file is named en.js but contains Greek labels (the current language of the app)
// To add English or other languages, create additional files like el.js, en-us.js, etc.

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
        teamStats: 'Στατιστικά Ομάδας'
    },

    // Meta Descriptions
    meta: {
        calendarDescription: 'Event schedule calendar for Red Rebels Limassol - Football and Volleyball matches',
        statsDescription: 'Team statistics for Red Rebels Limassol - Football and Volleyball'
    },

    // Navigation
    nav: {
        calendar: 'Ημερολόγιο',
        stats: 'Στατιστικά',
        options: 'Εργαλεία',
        toggleDarkMode: 'Toggle Dark Mode'
    },

    // Navigation Options Menu
    navOptions: {
        export: 'Εξαγωγή (.ics)',
        print: 'Εκτύπωση'
    },

    // Month Navigation
    monthNav: {
        previous: 'Προηγούμενος',
        next: 'Επόμενος',
        jumpToToday: 'Σήμερα',
    },

    // Day Names (Greek)
    days:{
        monday: 'Δευτέρα',
        tuesday: 'Τρίτη',
        wednesday: 'Τετάρτη',
        thursday: 'Πέμπτη',
        friday: 'Παρασκευή',
        saturday: 'Σαββάτο',
        sunday: 'Κυριακή',
    },

    // Month Names (Greek)
    months: {
        september: 'Σεπτέμβριος',
        october: 'Οκτώβριος',
        november: 'Νοέμβριος',
        december: 'Δεκέμβριος',
        january: 'Ιανουάριος',
        february: 'Φεβρουάριος',
        march: 'Μάρτιος',
        april: 'Απρίλιος',
        may: 'Μάιος',
        june: 'Ιούνιος',
        july: 'Ιούλιος',
        august: 'Αύγουστος'
    },

    // Filters
    filters: {
        title: 'Φίλτρα Εκδηλώσεων',
        addFilter: '+ Φίλτρο',
        column: 'Στήλη',
        search: 'Αναζήτηση',
        value: 'Τιμή',
        sport: 'Άθλημα',
        location: 'Τοποθεσία',
        status: 'Κατάσταση',
        searchOpponent: 'Αναζήτηση Αντιπάλου',
        searchPlaceholder: 'Αναζήτηση...',
        clear: 'Καθαρισμός',
        all: 'Όλα',
        allLocations: 'Όλες',
        allStatuses: 'Όλες',
        addMore: 'Προσθήκη Περισσότερων',
        clearAll: 'Καθαρισμός Όλων',
        apply: 'Εφαρμογή',
        pleaseSelect: 'Παρακαλώ επιλέξτε',
        selectColumnFirst: 'Επιλέξτε πρώτα στήλη'
    },

    // Sports
    sports: {
        footballMen: 'Ανδρικό Ποδόσφαιρο',
        volleyballMen: 'Ανδρικό Βόλεϊ',
        volleyballWomen: 'Γυναικείο Βόλεϊ',
        meeting: 'Συνεδρίες'
    },

    // Locations
    locations: {
        home: 'Εντός Έδρας',
        away: 'Εκτός Έδρας'
    },

    // Status
    status: {
        upcoming: 'Επερχόμενες',
        played: 'Ολοκληρωμένες'
    },

    // Footer Legend
    legend: {
        title: 'Υπόμνημα'
    },

    // Statistics
    stats: {
        // Overall Stats
        matches: 'Αγώνες',
        wins: 'Νίκες',
        draws: 'Ισοπαλίες',
        losses: 'Ήττες',
        goalsFor: 'Γκολ Υπέρ',
        goalsAgainst: 'Γκολ Κατά',
        goalDifference: 'Διαφορά Γκολ',
        points: 'Βαθμοί',

        // Sections
        overallStats: 'Συνολικά Στατιστικά',
        homeVsAway: 'Εντός vs Εκτός Έδρας',
        home: 'Εντός Έδρας',
        away: 'Εκτός Έδρας',
        recentForm: 'Πρόσφατη Φόρμα (Τελευταίοι 5 Αγώνες)',
        headToHead: 'Head-to-Head (Top 10 Αντίπαλοι)',

        // Form labels
        win: 'Ν',
        draw: 'Ι',
        loss: 'Η',
        noRecentMatches: 'Δεν υπάρχουν πρόσφατοι αγώνες',

        // Head to head
        opponent: 'Αντίπαλος',
        record: 'Ρεκόρ',
        noOpponents: 'Δεν υπάρχουν δεδομένα αντιπάλων'
    },

    // Buttons
    buttons: {
        show: 'Εμφάνιση',
        hide: 'Απόκρυψη',
        viewStats: 'Προβολή Στατιστικών',
        backToCalendar: 'Πίσω στο Ημερολόγιο',
        exportCalendar: 'Εξαγωγή (.ics)',
        print: 'Εκτύπωση',
        clearFilters: 'Καθαρισμός'
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
