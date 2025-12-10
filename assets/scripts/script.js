// Track current month being displayed
let months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
let date = new Date();
let currentMonth = months[date.getMonth()];

// Dark Mode Functionality
function initializeDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        updateThemeIcon();
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    const isLightMode = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        const isLightMode = document.body.classList.contains('light-mode');
        themeIcon.textContent = isLightMode ? '☀️' : '🌙';
    }
}

// Initialize dark mode on load
initializeDarkMode();

// Month order for navigation
const monthOrder = ['september', 'october', 'november', 'december', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august'];

// Update the month label display (uses labels from labels system)
function updateMonthLabel(month) {
    // Get current language from localStorage (fallback to 'en')
    const currentLanguage = localStorage.getItem('language') || 'en';

    // Use the labels system to get the month name in the selected language
    const monthName = window.getLabel ? window.getLabel(`months.${month}`, month) : month;
    
    const monthLabel = document.getElementById('month-label');
    if (monthLabel) {
        monthLabel.textContent = monthName;
    }
    
    const monthLabelDesktop = document.getElementById('month-label-desktop');
    if (monthLabelDesktop) {
        monthLabelDesktop.textContent = monthName;
    }
}

// Load and display a month's calendar
function loadMonth(month) {
    // Check if dependencies are loaded
    if (typeof calendarData === 'undefined') {
        console.error('calendarData is not defined. Make sure data.js is loaded.');
        document.getElementById('calendar-display').innerHTML = '<p style="color: white;">Error: Calendar data not loaded</p>';
        return;
    }

    if (typeof createCalendar === 'undefined') {
        console.error('createCalendar is not defined. Make sure components.js is loaded.');
        document.getElementById('calendar-display').innerHTML = '<p style="color: white;">Error: Calendar components not loaded</p>';
        return;
    }

    const monthData = calendarData[month];

    if (!monthData) {
        console.error('Month data not found:', month);
        document.getElementById('calendar-display').innerHTML = '<p style="color: white;">Error loading calendar</p>';
        return;
    }

    // Update current month
    currentMonth = month;

    // Update the month label
    updateMonthLabel(month);

    // Generate calendar HTML using components
    document.getElementById('calendar-display').innerHTML = createCalendar(monthData);

    // After loading, highlight today's date for the current month only
    highlightToday(month);

    // Restart countdown timers for the new month
    startCountdownTimer();
}

function showMonth(month) {
    // Remove active class from all buttons
    document.querySelectorAll('.btn-month').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add active class to clicked button
    event.target.classList.add('active');

    // Load the selected month
    loadMonth(month);
}

// Navigate to previous month
function navigatePrevious() {
    const currentIndex = monthOrder.indexOf(currentMonth);
    if (currentIndex > 0) {
        const previousMonth = monthOrder[currentIndex - 1];
        loadMonth(previousMonth);
    }
}

// Navigate to next month
function navigateNext() {
    const currentIndex = monthOrder.indexOf(currentMonth);
    if (currentIndex < monthOrder.length - 1) {
        const nextMonth = monthOrder[currentIndex + 1];
        loadMonth(nextMonth);
    }
}

// Jump to today's month
function jumpToToday() {
    const today = new Date();
    const currentMonthNum = today.getMonth(); // 0-11 (0=Jan, 1=Feb, ..., 11=Dec)

    // Map month numbers to month names
    const monthMap = {
        0: 'january',
        1: 'february',
        2: 'march',
        3: 'april',
        4: 'may',
        5: 'june',
        6: 'july',
        7: 'august',
        8: 'september',
        9: 'october',
        10: 'november',
        11: 'december'
    };

    const todayMonth = monthMap[currentMonthNum];

    if (todayMonth && monthOrder.includes(todayMonth)) {
        loadMonth(todayMonth);
    } else {
        // If current month is not in the calendar, default to November
        loadMonth('november');
    }
}

// Helper function to update the active month button
function updateActiveMonthButton(month) {
    // Remove active class from all buttons
    document.querySelectorAll('.btn-month').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add active class to the corresponding button
    const buttons = document.querySelectorAll('.btn-month');
    const monthNames = ['september', 'october', 'november', 'december', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august'];
    const monthIndex = monthNames.indexOf(month);

    if (monthIndex >= 0 && buttons[monthIndex]) {
        buttons[monthIndex].classList.add('active');
    }
}

// Highlight today's date
function highlightToday(displayedMonth) {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth(); // 0-11 (0 = January, 11 = December)
    const currentYear = today.getFullYear();

    // Only highlight if we're in 2025 or 2026 (the calendar years)
    if (currentYear !== 2025 && currentYear !== 2026) return;

    // Map month names to month numbers
    const monthMap = {
        'january': 0,
        'february': 1,
        'march': 2,
        'april': 3,
        'may': 4,
        'june': 5,
        'july': 6,
        'august': 7,
        'september': 8,
        'october': 9,
        'november': 10,
        'december': 11
    };

    // Only highlight if the displayed month matches the current month
    if (monthMap[displayedMonth] !== currentMonth) return;

    // Find and highlight the current day
    const days = document.querySelectorAll('.calendar-day:not(.empty)');
    days.forEach(day => {
        const dayNumberElement = day.querySelector('.day-number');
        if (dayNumberElement) {
            const dayText = dayNumberElement.textContent.trim().split(' ')[0];
            const dayNumber = parseInt(dayText);
            if (dayNumber === currentDay) {
                day.classList.add('today');
                // Add "Σήμερα" next to the date
                const todayLabel = document.createElement('span');
                // todayLabel.textContent = ' - Σήμερα';
                todayLabel.style.color = '#ff4444';
                todayLabel.style.fontWeight = 'bold';
                todayLabel.style.fontSize = '0.9rem';
                dayNumberElement.appendChild(todayLabel);
            }
        }
    });
}

// Countdown Timer Functionality
function updateCountdowns() {
    const countdownElements = document.querySelectorAll('.event-countdown');
    const now = new Date().getTime();

    countdownElements.forEach(element => {
        const eventTimestamp = parseInt(element.getAttribute('data-timestamp'));
        const distance = eventTimestamp - now;

        if (distance < 0) {
            element.textContent = '';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            element.textContent = `⏱ ${days}d ${hours}h`;
        } else if (hours > 0) {
            element.textContent = `⏱ ${hours}h ${minutes}m`;
        } else {
            element.textContent = `⏱ ${minutes}m`;
        }
    });
}

// Update countdowns every minute
let countdownInterval;
function startCountdownTimer() {
    if (countdownInterval) clearInterval(countdownInterval);
    updateCountdowns();
    countdownInterval = setInterval(updateCountdowns, 60000); // Update every minute
}

// Touch Gestures for Month Navigation
let touchStartX = 0;
let touchEndX = 0;

function handleGesture() {
    const swipeThreshold = 50; // Minimum swipe distance in pixels

    if (touchEndX < touchStartX - swipeThreshold) {
        // Swiped left - go to next month
        navigateNext();
    }

    if (touchEndX > touchStartX + swipeThreshold) {
        // Swiped right - go to previous month
        navigatePrevious();
    }
}

function initTouchGestures() {
    const calendarDisplay = document.getElementById('calendar-display');
    if (!calendarDisplay) return;

    calendarDisplay.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    calendarDisplay.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleGesture();
    }, { passive: true });
}

// Service Worker disabled - unregister any existing service workers
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
            registration.unregister();
            console.log('Service Worker unregistered');
        }
    });
}

// Load events and calendar after components are loaded
document.addEventListener('componentsLoaded', () => {
    // Load events from events-data.js
    loadEvents();
    // Then load the calendar
    loadMonth(currentMonth);
    // Start countdown timers
    startCountdownTimer();
    // Initialize touch gestures for mobile
    initTouchGestures();
});

// Statistics toggle functionality
let statisticsVisible = false;

function toggleStatistics() {
    const statsDisplay = document.getElementById('statistics-display');
    const toggleText = document.getElementById('stats-toggle-text');

    if (!statsDisplay) {
        console.error('Statistics display element not found');
        return;
    }

    statisticsVisible = !statisticsVisible;

    if (statisticsVisible) {
        // Show statistics
        statsDisplay.style.display = 'block';
        toggleText.textContent = 'Απόκρυψη';

        // Generate and display statistics
        if (typeof createStatisticsDisplay === 'function') {
            statsDisplay.innerHTML = createStatisticsDisplay();
        } else {
            statsDisplay.innerHTML = '<div class="stats-error">Σφάλμα φόρτωσης στατιστικών</div>';
            console.error('createStatisticsDisplay function not found');
        }
    } else {
        // Hide statistics
        statsDisplay.style.display = 'none';
        toggleText.textContent = 'Εμφάνιση';
    }
}

// Helper function to determine match result from score and location
function getPopoverMatchResult(score, location) {
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

// Event Popover Functionality
function openEventPopover(element) {
    const eventData = JSON.parse(element.getAttribute('data-event'));
    const popover = document.getElementById('event-popover');
    const popoverBody = document.getElementById('event-popover-body');

    if (!popover || !popoverBody) {
        console.error('Popover elements not found');
        return;
    }

    // Build popover content based on event type
    let content = '';

    if (eventData.isMeeting) {
        // Meeting layout
        const time = eventData.subtitle.split(' - ')[1];
        content = `
            <div class="event-popover-meeting">
                <div class="event-popover-meeting-emoji">📅</div>
                <div class="event-popover-meeting-title">${eventData.title}</div>
                <div class="event-popover-info-grid">
                    <div class="event-popover-info-item">
                        <div class="event-popover-info-label">Ώρα</div>
                        <div class="event-popover-info-value">⏰ ${time}</div>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Sports event layout
        const opponent = eventData.title.replace('Νέα Σαλαμίνα vs ', '').replace(/ vs Νέα Σαλαμίνα/, '');
        const emoji = eventData.subtitle.split(' - ')[0];
        const time = eventData.subtitle.split(' - ')[1];
        const isHome = eventData.title.startsWith('Νέα Σαλαμίνα vs');
        const locationText = isHome ? '🏠 Εντός Έδρας' : '✈️ Εκτός Έδρας';

        // Logo HTML
        const logoHTML = eventData.logo
            ? `<img src="${eventData.logo}" alt="${opponent}" class="event-popover-logo">`
            : '';

        // Status badge - show result for played games
        let statusBadge;
        if (eventData.status === 'played') {
            const result = getPopoverMatchResult(eventData.score, eventData.location);
            if (result === 'win') {
                statusBadge = '<span class="event-popover-status-badge win">✅ Νίκη</span>';
            } else if (result === 'draw') {
                statusBadge = '<span class="event-popover-status-badge draw">🤝 Ισοπαλία</span>';
            } else if (result === 'loss') {
                statusBadge = '<span class="event-popover-status-badge loss">❌ Ήττα</span>';
            } else {
                // Fallback if we can't determine result
                statusBadge = '<span class="event-popover-status-badge played">✅ Ολοκληρωμένο</span>';
            }
        } else {
            statusBadge = '<span class="event-popover-status-badge upcoming">📅 Επερχόμενο</span>';
        }

        // Score section
        const scoreSection = eventData.status === 'played' && eventData.score
            ? `<div class="event-popover-score">⚽ ${eventData.score}</div>`
            : '';

        content = `
            <div class="event-popover-header">
                <span class="event-popover-emoji">${emoji}</span>
                ${logoHTML}
                <div class="event-popover-title-group">
                    <div class="event-popover-title">${eventData.title}</div>
                    ${statusBadge}
                </div>
            </div>
            ${scoreSection}
            <div class="event-popover-info-grid">
                <div class="event-popover-info-item">
                    <div class="event-popover-info-label">Ώρα</div>
                    <div class="event-popover-info-value">⏰ ${time}</div>
                </div>
                <div class="event-popover-info-item">
                    <div class="event-popover-info-label">Τοποθεσία</div>
                    <div class="event-popover-info-value">${locationText}</div>
                </div>
                ${eventData.venue ? `
                    <div class="event-popover-info-item">
                        <div class="event-popover-info-label">Γήπεδο</div>
                        <div class="event-popover-info-value">📍 ${eventData.venue}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    popoverBody.innerHTML = content;
    popover.classList.add('active');

    // Close on background click
    popover.onclick = function(e) {
        if (e.target === popover) {
            closeEventPopover();
        }
    };
}

function closeEventPopover() {
    const popover = document.getElementById('event-popover');
    if (popover) {
        popover.classList.remove('active');
    }
}

// Close popover on ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeEventPopover();
    }
});

// Export to Calendar (.ics) Functionality
function exportToCalendar() {
    if (typeof eventData === 'undefined') {
        alert('Δεν υπάρχουν δεδομένα εκδηλώσεων για εξαγωγή');
        return;
    }

    // Create ICS file content
    let icsContent = 'BEGIN:VCALENDAR\r\n';
    icsContent += 'VERSION:2.0\r\n';
    icsContent += 'PRODID:-//Red Rebels Calendar//EN\r\n';
    icsContent += 'CALSCALE:GREGORIAN\r\n';
    icsContent += 'METHOD:PUBLISH\r\n';
    icsContent += 'X-WR-CALNAME:Red Rebels Events 2025\r\n';
    icsContent += 'X-WR-TIMEZONE:Europe/Athens\r\n';

    // Month mapping
    const monthMap = {
        'september': { monthIndex: 8, year: 2025 },
        'october': { monthIndex: 9, year: 2025 },
        'november': { monthIndex: 10, year: 2025 },
        'december': { monthIndex: 11, year: 2025 },
        'january': { monthIndex: 0, year: 2026 },
        'february': { monthIndex: 1, year: 2026 },
        'march': { monthIndex: 2, year: 2026 },
        'april': { monthIndex: 3, year: 2026 },
        'may': { monthIndex: 4, year: 2026 },
        'june': { monthIndex: 5, year: 2026 },
        'july': { monthIndex: 6, year: 2026 },
        'august': { monthIndex: 7, year: 2026 }
    };

    // Process all events
    for (const [monthName, events] of Object.entries(eventData)) {
        const monthInfo = monthMap[monthName];
        if (!monthInfo) continue;

        events.forEach(eventItem => {
            const event = parseEvent(eventItem);

            // Extract time from subtitle (format: "emoji - HH:MM")
            const timePart = event.subtitle.split(' - ')[1];
            if (!timePart) return;

            const [hours, minutes] = timePart.split(':').map(num => parseInt(num, 10));

            // Create event start date
            const startDate = new Date(monthInfo.year, monthInfo.monthIndex, event.day, hours, minutes);

            // Event duration: 2 hours for sports, 1 hour for meetings
            const isMeeting = !event.title.includes(' vs ');
            const durationHours = isMeeting ? 1 : 2;
            const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

            // Format dates for ICS (YYYYMMDDTHHMMSS)
            const formatICSDate = (date) => {
                const pad = (n) => n.toString().padStart(2, '0');
                return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
            };

            // Create unique ID
            const uid = `${startDate.getTime()}-${event.title.replace(/\s/g, '-')}@redrebels.cy`;

            // Add event to ICS
            icsContent += 'BEGIN:VEVENT\r\n';
            icsContent += `UID:${uid}\r\n`;
            icsContent += `DTSTAMP:${formatICSDate(new Date())}\r\n`;
            icsContent += `DTSTART:${formatICSDate(startDate)}\r\n`;
            icsContent += `DTEND:${formatICSDate(endDate)}\r\n`;
            icsContent += `SUMMARY:${event.title}\r\n`;

            // Add description with details
            let description = event.title;
            if (event.venue) {
                description += `\\nΓήπεδο: ${event.venue}`;
                icsContent += `LOCATION:${event.venue}\r\n`;
            }
            if (event.status === 'played' && event.score) {
                description += `\\nΑποτέλεσμα: ${event.score}`;
            }
            icsContent += `DESCRIPTION:${description}\r\n`;

            // Add status
            if (event.status === 'played') {
                icsContent += 'STATUS:CONFIRMED\r\n';
            } else {
                icsContent += 'STATUS:TENTATIVE\r\n';
            }

            // Add categories based on sport
            if (event.sport) {
                const sportNames = {
                    'football-men': 'Ανδρικό Ποδόσφαιρο',
                    'volleyball-men': 'Ανδρικό Βόλεϊ',
                    'volleyball-women': 'Γυναικείο Βόλεϊ',
                    'meeting': 'Συνάντηση'
                };
                icsContent += `CATEGORIES:${sportNames[event.sport] || 'Εκδήλωση'}\r\n`;
            }

            icsContent += 'END:VEVENT\r\n';
        });
    }

    icsContent += 'END:VCALENDAR\r\n';

    // Create and download file
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'red-rebels-calendar-2025.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success message
    alert('Το ημερολόγιο εξήχθη επιτυχώς! Μπορείτε να το εισάγετε στο Google Calendar, Apple Calendar ή άλλες εφαρμογές ημερολογίου.');
}