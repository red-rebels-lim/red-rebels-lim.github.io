// Calendar data for each month

const calendarData = {
    october: {
        days: [
            { empty: true },
            { empty: true },
            { number: 1, name: 'Τετάρτη', events: [
                { title: 'ΕΝΥ Υψωνας vs Νεα Σαλαμίνα', subtitle: '👨⚽ - 19:00' }
            ]},
            { number: 2 },
            { number: 3 },
            { number: 4 },
            { number: 5, name: 'Κυριακή', events: [
                { title: 'Νεα Σαλαμίνα vs ΠΟ Αχυρώνας Ονήσιλος', subtitle: '👨⚽ - 16:00' }
            ]},
            { number: 6 },
            { number: 7, name: 'Τρίτη', events: [
                { title: 'Συνεδρία Συνδέσμου Λεμεσού', subtitle: 'Meeting - 19:30' }
            ]},
            { number: 8 },
            { number: 9 },
            { number: 10 },
            { number: 11 },
            { number: 12 },
            { number: 13 },
            { number: 14 },
            { number: 15 },
            { number: 16 },
            { number: 17, name: 'Παρασκευή', events: [
                { title: 'Νεα Σαλαμίνα vs Παφιακός', subtitle: '👨🏐 - 20:30' }
            ]},
            { number: 18, name: 'Σάββατο', events: [
                { title: 'ΜΕΑΠ vs Νεα Σαλαμίνα', subtitle: '👨⚽ - 15:30' }
            ]},
            { number: 19 },
            { number: 20 },
            { number: 21 },
            { number: 22 },
            { number: 23 },
            { number: 24 },
            { number: 25, name: 'Σάββατο', events: [
                { title: 'Νεα Σαλαμίνα vs Χαλκάνορας Ιδαλίου', subtitle: '👨⚽ - 15:00' },
                { title: 'Νεα Σαλαμίνα vs Ανόρθωσης', subtitle: '👩🏻🏐 - 18:00' }
            ]},
            { number: 26 },
            { number: 27 },
            { number: 28 },
            { number: 29 },
            { number: 30 },
            { number: 31 }
        ]
    },
    november: {
        days: [
            { empty: true },
            { empty: true },
            { empty: true },
            { empty: true },
            { empty: true },
            { number: 1, name: 'Σάββατο', events: [
                { title: 'ΑΣΙΛ Λύσης vs Νέα Σαλαμίνα', subtitle: '👨⚽ - 14:30' }
            ]},
            { number: 2 },
            { number: 3 },
            { number: 4 },
            { number: 5 },
            { number: 6 },
            { number: 7, name: 'Παρασκευή', events: [
                { title: 'Νέα Σαλαμίνα vs Ανόρθωσης', subtitle: '👨🏐 - 20:00' }
            ]},
            { number: 8, name: 'Σάββατο', events: [
                { title: 'Νέα Σαλαμίνα vs ΑΕΖ', subtitle: '👨⚽ - 14:30' }
            ]},
            { number: 9 },
            { number: 10 },
            { number: 11 },
            { number: 12 },
            { number: 13 },
            { number: 14 },
            { number: 15, name: 'Σάββατο', events: [
                { title: 'Νέα Σαλαμίνα vs Απόλλων', subtitle: '👩🏻🏐 - 18:00' }
            ]},
            { number: 16 },
            { number: 17 },
            { number: 18 },
            { number: 19 },
            { number: 20 },
            { number: 21, name: 'Παρασκευή', events: [
                { title: 'Νέα Σαλαμίνα vs Αναγέννηση Δερύνειας', subtitle: '👨🏐 - 20:00' }
            ]},
            { number: 22, name: 'Σάββατο', events: [
                { title: 'Ομόνοια 29ης Μαϊου vs Νέα Σαλαμίνα', subtitle: '👨⚽ - 17:00' }
            ]},
            { number: 23 },
            { number: 24 },
            { number: 25 },
            { number: 26 },
            { number: 27 },
            { number: 28, name: 'Παρασκευή', events: [
                { title: 'Νέα Σαλαμίνα vs ΠΑΕΕΚ Κερύνειας', subtitle: '👨⚽ - 19:00' }
            ]},
            { number: 29, name: 'Σάββατο', events: [
                { title: 'Νέα Σαλαμίνα vs Λεμεσός', subtitle: '👩🏻🏐 - 18:00' }
            ]},
            { number: 30 }
        ]
    },
    december: {
        days: [
            { number: 1 },
            { number: 2 },
            { number: 3 },
            { number: 4 },
            { number: 5 },
            { number: 6, name: 'Σάββατο', events: [
                { title: 'Σπάρτακος Κιτίου vs Νέα Σαλαμίνα', subtitle: '👨⚽ - 14:30' },
                { title: 'Νέα Σαλαμίνα vs RoboMarkets ΑΕΛ', subtitle: '👩🏻🏐 - 18:00' }
            ]},
            { number: 7 },
            { number: 8 },
            { number: 9 },
            { number: 10 },
            { number: 11 },
            { number: 12, name: 'Παρασκευή', events: [
                { title: 'Νέα Σαλαμίνα vs Καρμιώτισσα', subtitle: '👨⚽ - 19:00' }
            ]},
            { number: 13 },
            { number: 14 },
            { number: 15 },
            { number: 16 },
            { number: 17 },
            { number: 18 },
            { number: 19, name: 'Παρασκευή', events: [
                { title: 'Νέα Σαλαμίνα vs Ομόνοια', subtitle: '👨🏐 - 20:00' }
            ]},
            { number: 20, name: 'Σάββατο', events: [
                { title: 'Νέα Σαλαμίνα vs ΑΕΚ Λάρνακας', subtitle: '👩🏻🏐 - 18:00' }
            ]},
            { number: 21 },
            { number: 22 },
            { number: 23 },
            { number: 24 },
            { number: 25 },
            { number: 26 },
            { number: 27 },
            { number: 28 },
            { number: 29 },
            { number: 30, name: 'Τρίτη', events: [
                { title: 'Νέα Σαλαμίνα vs Κούρης Ερήμης', subtitle: '👩🏻🏐 - 18:00' }
            ]},
            { empty: true },
            { empty: true },
            { empty: true },
            { empty: true },
            { empty: true }
        ]
    }
};