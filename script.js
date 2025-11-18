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

    // Generate calendar HTML using components
    document.getElementById('calendar-display').innerHTML = createCalendar(monthData);

    // After loading, highlight today's date for the current month only
    highlightToday(month);
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

// Highlight today's date
function highlightToday(displayedMonth) {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth(); // 0-11 (0 = January, 9 = October, 10 = November, 11 = December)
    const currentYear = today.getFullYear();

    // Only highlight if we're in 2025 (the calendar year)
    if (currentYear !== 2025) return;

    // Map month names to month numbers
    const monthMap = {
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
                todayLabel.textContent = ' - Σήμερα';
                todayLabel.style.color = '#ff4444';
                todayLabel.style.fontWeight = 'bold';
                todayLabel.style.fontSize = '0.9rem';
                dayNumberElement.appendChild(todayLabel);
            }
        }
    });
}

// Load November calendar on page load (default)
window.addEventListener('DOMContentLoaded', () => {
    loadMonth('november');
});