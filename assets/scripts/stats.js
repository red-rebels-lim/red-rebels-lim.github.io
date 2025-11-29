// Team Statistics Module
// Calculates various statistics from match data

// Calculate team statistics from event data
function calculateTeamStatistics() {
    if (!eventData || typeof eventData !== 'object') {
        return null;
    }

    const stats = {
        overall: {
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0
        },
        home: {
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0
        },
        away: {
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0
        },
        recentForm: [], // Last 5 matches
        headToHead: {}, // Head-to-head records by opponent
        allMatches: [] // All matches for detailed analysis
    };

    // Collect all football matches
    const footballMatches = [];

    for (const [monthName, events] of Object.entries(eventData)) {
        events.forEach(event => {
            // Only process football-men matches that have been played
            if (event.sport === 'football-men' && event.status === 'played' && event.score) {
                footballMatches.push({
                    month: monthName,
                    day: event.day,
                    opponent: event.opponent,
                    location: event.location,
                    score: event.score,
                    venue: event.venue
                });
            }
        });
    }

    // Sort matches by month and day (chronologically)
    const monthOrder = ['september', 'october', 'november', 'december', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august'];
    footballMatches.sort((a, b) => {
        const monthDiff = monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
        if (monthDiff !== 0) return monthDiff;
        return a.day - b.day;
    });

    // Process each match
    footballMatches.forEach(match => {
        const [goalsFor, goalsAgainst] = parseScore(match.score, match.location);

        if (goalsFor === null || goalsAgainst === null) {
            return; // Skip invalid scores
        }

        // Determine result
        let result;
        if (goalsFor > goalsAgainst) {
            result = 'W';
            stats.overall.wins++;
            stats[match.location].wins++;
        } else if (goalsFor < goalsAgainst) {
            result = 'L';
            stats.overall.losses++;
            stats[match.location].losses++;
        } else {
            result = 'D';
            stats.overall.draws++;
            stats[match.location].draws++;
        }

        // Update played count
        stats.overall.played++;
        stats[match.location].played++;

        // Update goals
        stats.overall.goalsFor += goalsFor;
        stats.overall.goalsAgainst += goalsAgainst;
        stats[match.location].goalsFor += goalsFor;
        stats[match.location].goalsAgainst += goalsAgainst;

        // Add to recent form (we'll take last 5 later)
        stats.recentForm.push({
            result: result,
            opponent: match.opponent,
            score: match.score,
            location: match.location,
            month: match.month,
            day: match.day
        });

        // Update head-to-head
        if (!stats.headToHead[match.opponent]) {
            stats.headToHead[match.opponent] = {
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0
            };
        }
        const h2h = stats.headToHead[match.opponent];
        h2h.played++;
        h2h.goalsFor += goalsFor;
        h2h.goalsAgainst += goalsAgainst;
        if (result === 'W') h2h.wins++;
        else if (result === 'D') h2h.draws++;
        else h2h.losses++;

        // Store all matches
        stats.allMatches.push({
            ...match,
            result: result,
            goalsFor: goalsFor,
            goalsAgainst: goalsAgainst
        });
    });

    // Calculate goal difference
    stats.overall.goalDifference = stats.overall.goalsFor - stats.overall.goalsAgainst;
    stats.home.goalDifference = stats.home.goalsFor - stats.home.goalsAgainst;
    stats.away.goalDifference = stats.away.goalsFor - stats.away.goalsAgainst;

    // Keep only last 5 matches for recent form
    stats.recentForm = stats.recentForm.slice(-5);

    return stats;
}

// Parse score based on location (home/away)
function parseScore(scoreStr, location) {
    if (!scoreStr || !scoreStr.includes('-')) {
        return [null, null];
    }

    const parts = scoreStr.split('-').map(s => parseInt(s.trim()));

    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        return [null, null];
    }

    // If home match, score is "our goals - their goals"
    // If away match, score is "their goals - our goals"
    if (location === 'home') {
        return [parts[0], parts[1]]; // [goalsFor, goalsAgainst]
    } else {
        return [parts[1], parts[0]]; // [goalsFor, goalsAgainst]
    }
}

// Get win percentage
function getWinPercentage(wins, played) {
    if (played === 0) return 0;
    return Math.round((wins / played) * 100);
}

// Get points (3 for win, 1 for draw, 0 for loss)
function getPoints(wins, draws) {
    return (wins * 3) + draws;
}

// Format statistics for display
function formatStatistics() {
    const stats = calculateTeamStatistics();

    if (!stats) {
        return {
            error: 'Δεν υπάρχουν διαθέσιμα στατιστικά'
        };
    }

    // Calculate additional metrics
    const overallWinPct = getWinPercentage(stats.overall.wins, stats.overall.played);
    const homeWinPct = getWinPercentage(stats.home.wins, stats.home.played);
    const awayWinPct = getWinPercentage(stats.away.wins, stats.away.played);
    const totalPoints = getPoints(stats.overall.wins, stats.overall.draws);

    // Format head-to-head as sorted array
    const headToHeadArray = Object.entries(stats.headToHead)
        .map(([opponent, record]) => ({
            opponent,
            ...record
        }))
        .sort((a, b) => b.played - a.played); // Sort by number of matches

    return {
        overall: {
            ...stats.overall,
            winPercentage: overallWinPct,
            points: totalPoints
        },
        home: {
            ...stats.home,
            winPercentage: homeWinPct
        },
        away: {
            ...stats.away,
            winPercentage: awayWinPct
        },
        recentForm: stats.recentForm,
        headToHead: headToHeadArray,
        allMatches: stats.allMatches
    };
}

// Get form guide as a string (e.g., "WWDLW")
function getFormString(recentForm) {
    return recentForm.map(match => match.result).join('');
}

// Get form guide color for a result
function getFormColor(result) {
    switch(result) {
        case 'W': return '#4CAF50'; // Green
        case 'D': return '#FFC107'; // Yellow
        case 'L': return '#F44336'; // Red
        default: return '#999';
    }
}