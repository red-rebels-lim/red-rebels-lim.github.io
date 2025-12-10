/**
 * Calendar Component
 * Displays a calendar with events, month navigation, and filters
 * 
 * Usage:
 * <team-calendar events-data-url="assets/scripts/events-data.js"></team-calendar>
 * 
 * Attributes:
 * - events-data-url: URL to events data file (optional, default: assets/scripts/events-data.js)
 * - initial-month: Initial month to display (optional, default: current month)
 * - show-filters: Show filter panel (optional, default: true)
 * 
 * Events:
 * - month-changed: Fired when month changes (detail: { month: string })
 * - event-selected: Fired when event is clicked (detail: { event: object })
 */

class TeamCalendarComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.eventsData = {};
    this.calendarData = {};
    this.currentMonth = null;
    this.monthOrder = ['september', 'october', 'november', 'december', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august'];
    this.filters = [];
    this.countdownInterval = null;
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  static get observedAttributes() {
    return ['events-data-url', 'initial-month', 'show-filters'];
  }

  connectedCallback() {
    this.render();
    this.loadEventsData();
    this.attachEventListeners();
  }

  disconnectedCallback() {
    this.removeEventListeners();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.isConnected) {
      if (name === 'events-data-url') {
        this.loadEventsData();
      } else if (name === 'initial-month') {
        this.currentMonth = newValue;
        this.render();
      }
    }
  }

  getEventsDataUrl() {
    return this.getAttribute('events-data-url') || 'assets/scripts/events-data.js';
  }

  async loadEventsData() {
    try {
      // Check if eventsData is already available (from global scope)
      if (typeof window.eventsData !== 'undefined' && window.eventsData) {
        this.eventsData = window.eventsData;
        this.buildCalendarData();
        this.initializeCalendar();
        return;
      }

      // Check if script is already in the document
      const existingScript = Array.from(document.querySelectorAll('script[src]')).find(
        s => s.src.includes('events-data.js')
      );
      
      if (existingScript) {
        // Script already exists, wait for it to be available
        const checkInterval = setInterval(() => {
          if (typeof window.eventsData !== 'undefined' && window.eventsData) {
            clearInterval(checkInterval);
            this.eventsData = window.eventsData;
            this.buildCalendarData();
            this.initializeCalendar();
          }
        }, 50);
        
        // Timeout after 5 seconds
        setTimeout(() => clearInterval(checkInterval), 5000);
        return;
      }

      // Load events data by fetching and evaluating
      const response = await fetch(this.getEventsDataUrl());
      const scriptText = await response.text();
      
      // Execute in a way that doesn't conflict with existing declarations
      try {
        // Try to extract just the data part
        const dataMatch = scriptText.match(/const eventsData = ({[\s\S]*});/);
        if (dataMatch) {
          this.eventsData = eval(`(${dataMatch[1]})`);
          window.eventsData = this.eventsData; // Store globally for other components
          this.buildCalendarData();
          this.initializeCalendar();
        } else {
          // Fallback: evaluate the whole script in a safe way
          const func = new Function(scriptText.replace('const eventsData', 'window.eventsData'));
          func();
          if (window.eventsData) {
            this.eventsData = window.eventsData;
            this.buildCalendarData();
            this.initializeCalendar();
          }
        }
      } catch (evalError) {
        console.error('Error parsing events data:', evalError);
        // Try loading as script tag as last resort
        const script = document.createElement('script');
        script.src = this.getEventsDataUrl();
        script.onload = () => {
          if (typeof window.eventsData !== 'undefined') {
            this.eventsData = window.eventsData;
            this.buildCalendarData();
            this.initializeCalendar();
          }
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error('Error loading events data:', error);
    }
  }

  buildCalendarData() {
    const monthMap = {
      'september': { monthIndex: 8, year: 2025, daysInMonth: 30, startDay: 0 },
      'october': { monthIndex: 9, year: 2025, daysInMonth: 31, startDay: 2 },
      'november': { monthIndex: 10, year: 2025, daysInMonth: 30, startDay: 5 },
      'december': { monthIndex: 11, year: 2025, daysInMonth: 31, startDay: 0 },
      'january': { monthIndex: 0, year: 2026, daysInMonth: 31, startDay: 3 },
      'february': { monthIndex: 1, year: 2026, daysInMonth: 28, startDay: 6 },
      'march': { monthIndex: 2, year: 2026, daysInMonth: 31, startDay: 6 },
      'april': { monthIndex: 3, year: 2026, daysInMonth: 30, startDay: 2 },
      'may': { monthIndex: 4, year: 2026, daysInMonth: 31, startDay: 4 },
      'june': { monthIndex: 5, year: 2026, daysInMonth: 30, startDay: 0 },
      'july': { monthIndex: 6, year: 2026, daysInMonth: 31, startDay: 2 },
      'august': { monthIndex: 7, year: 2026, daysInMonth: 31, startDay: 5 }
    };

    const sportConfig = {
      'football-men': { emoji: '👨⚽', name: 'Ανδρικό Ποδόσφαιρο' },
      'volleyball-men': { emoji: '👨🏐', name: 'Ανδρικό Βόλεϊ' },
      'volleyball-women': { emoji: '👩🏻🏐', name: 'Γυναικείο Βόλεϊ' },
      'meeting': { emoji: '', name: 'Meeting' }
    };

    const parseEvent = (eventData) => {
      let day, sport, location, time, opponent, venue, logo, status, score;

      if (typeof eventData === 'string') {
        const parts = eventData.split(' ');
        day = parseInt(parts[0]);
        sport = parts[1];
        location = parts[2];
        time = parts[parts.length - 1];
        opponent = parts.slice(3, -1).join(' ');
      } else {
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

      const sportInfo = sportConfig[sport] || { emoji: '', name: sport };
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
    };

    const getDayName = (year, month, day) => {
      const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
      const date = new Date(year, month, day);
      return dayNames[date.getDay()];
    };

    const calendar = {};

    for (const [monthName, events] of Object.entries(this.eventsData)) {
      const monthInfo = monthMap[monthName];
      if (!monthInfo) continue;

      const days = [];
      for (let i = 0; i < monthInfo.startDay; i++) {
        days.push({ empty: true });
      }

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

      for (let day = 1; day <= monthInfo.daysInMonth; day++) {
        const dayData = { number: day };
        if (eventsByDay[day]) {
          dayData.events = eventsByDay[day];
          dayData.name = getDayName(monthInfo.year, monthInfo.monthIndex, day);
        }
        days.push(dayData);
      }

      if (monthName === 'december') {
        const totalCells = days.length;
        const cellsNeeded = Math.ceil(totalCells / 7) * 7;
        for (let i = totalCells; i < cellsNeeded; i++) {
          days.push({ empty: true });
        }
      }

      calendar[monthName] = { days, monthInfo };
    }

    this.calendarData = calendar;
  }

  initializeCalendar() {
    const initialMonth = this.getAttribute('initial-month') || this.getCurrentMonth();
    this.currentMonth = initialMonth;
    this.loadMonth(initialMonth);
  }

  getCurrentMonth() {
    const today = new Date();
    const currentMonthNum = today.getMonth();
    const monthMap = {
      0: 'january', 1: 'february', 2: 'march', 3: 'april',
      4: 'may', 5: 'june', 6: 'july', 7: 'august',
      8: 'september', 9: 'october', 10: 'november', 11: 'december'
    };
    const todayMonth = monthMap[currentMonthNum];
    return this.monthOrder.includes(todayMonth) ? todayMonth : 'november';
  }

  loadMonth(month) {
    if (!this.calendarData[month]) {
      console.error('Month data not found:', month);
      return;
    }

    this.currentMonth = month;
    this.updateMonthLabel(month);
    this.renderCalendar(month);
    this.highlightToday(month);
    this.startCountdownTimer();

    this.dispatchEvent(new CustomEvent('month-changed', {
      detail: { month },
      bubbles: true
    }));
  }

  updateMonthLabel(month) {
    const monthLabel = this.shadowRoot.querySelector('#month-label');
    if (monthLabel) {
      const monthNames = {
        'january': 'Ιανουάριος', 'february': 'Φεβρουάριος',
        'march': 'Μάρτιος', 'april': 'Απρίλιος',
        'may': 'Μάιος', 'june': 'Ιούνιος',
        'july': 'Ιούλιος', 'august': 'Αύγουστος',
        'september': 'Σεπτέμβριος', 'october': 'Οκτώβριος',
        'november': 'Νοέμβριος', 'december': 'Δεκέμβριος'
      };
      monthLabel.textContent = monthNames[month] || month;
    }
  }

  navigatePrevious() {
    const currentIndex = this.monthOrder.indexOf(this.currentMonth);
    if (currentIndex > 0) {
      this.loadMonth(this.monthOrder[currentIndex - 1]);
    }
  }

  navigateNext() {
    const currentIndex = this.monthOrder.indexOf(this.currentMonth);
    if (currentIndex < this.monthOrder.length - 1) {
      this.loadMonth(this.monthOrder[currentIndex + 1]);
    }
  }

  jumpToToday() {
    this.loadMonth(this.getCurrentMonth());
  }

  render() {
    const showFilters = this.getAttribute('show-filters') !== 'false';
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .calendar-container {
          font-family: var(--font-family, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
          color: var(--color-text-primary, #ffffff);
          background-color: var(--color-bg-primary, #1d1d1d);
        }

        .navigation-controls {
          margin-bottom: 2rem;
        }

        .month-navigation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .btn {
          padding: 0.5rem 1rem;
          background-color: var(--color-bg-input, #333333);
          color: var(--color-text-primary, #ffffff);
          border: 1px solid var(--color-border-light, #464646);
          border-radius: var(--radius-md, 0.5rem);
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .btn:hover {
          background-color: var(--color-border-light, #464646);
        }

        .btn-arrow {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .month-label {
          font-size: 1.5rem;
          font-weight: 600;
          min-width: 150px;
          text-align: center;
        }

        .filters-container {
          margin-bottom: 1rem;
        }

        .filters-panel {
          display: none;
          background-color: var(--color-bg-card, #1a1a1a);
          border: 1px solid var(--color-border, #333333);
          border-radius: var(--radius-lg, 0.75rem);
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .filters-panel.active {
          display: block;
        }

        .calendar-display {
          background-color: var(--color-bg-card, #1a1a1a);
          border-radius: var(--radius-lg, 0.75rem);
          padding: 1.5rem;
        }

        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
          text-align: center;
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--color-text-secondary, #9f9f9f);
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
        }

        .calendar-day {
          min-height: 100px;
          padding: 0.5rem;
          background-color: var(--color-bg-secondary, #222222);
          border-radius: var(--radius-md, 0.5rem);
          border: 1px solid var(--color-border, #333333);
        }

        .calendar-day.empty {
          background-color: transparent;
          border: none;
        }

        .calendar-day.event {
          border-color: var(--color-accent, #00985f);
        }

        .calendar-day.today {
          background-color: rgba(0, 152, 95, 0.1);
          border-color: var(--color-accent, #00985f);
        }

        .day-number {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .day-name {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #9f9f9f);
          margin-bottom: 0.5rem;
        }

        .event-details {
          font-size: 0.75rem;
          margin-bottom: 0.25rem;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: var(--radius-sm, 0.25rem);
          transition: background-color 0.2s ease;
        }

        .event-details:hover {
          background-color: var(--color-bg-card-hover, #252525);
        }

        .event-compact {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .event-emoji {
          font-size: 0.875rem;
        }

        .opponent-logo {
          width: 16px;
          height: 16px;
          object-fit: contain;
        }

        .event-opponent {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .event-score {
          font-weight: 600;
          color: var(--color-accent, #00985f);
        }

        .event-countdown {
          font-size: 0.625rem;
          color: var(--color-accent, #00985f);
          margin-top: 0.25rem;
        }

        .event-popover {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 1000;
          align-items: center;
          justify-content: center;
        }

        .event-popover.active {
          display: flex;
        }

        .event-popover-content {
          background-color: var(--color-bg-card, #1a1a1a);
          border-radius: var(--radius-lg, 0.75rem);
          padding: 2rem;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        }

        .event-popover-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: var(--color-text-primary, #ffffff);
          font-size: 2rem;
          cursor: pointer;
          line-height: 1;
        }

        .loading {
          padding: 2rem;
          text-align: center;
          color: var(--color-text-secondary, #9f9f9f);
        }
      </style>

      <div class="calendar-container">
        <div class="navigation-controls">
          <div class="month-navigation">
            <button class="btn btn-arrow" data-action="previous">
              ◀ Προηγούμενος
            </button>
            <div class="month-label" id="month-label">Νοέμβριος</div>
            <button class="btn btn-arrow" data-action="next">
              Επόμενος ▶
            </button>
            <button class="btn btn-arrow" data-action="today">
              Σήμερα 📅
            </button>
          </div>
        </div>

        ${showFilters ? `
        <div class="filters-container">
          <div class="filters-panel" id="filters-panel">
            <p>Filters functionality can be added here</p>
          </div>
        </div>
        ` : ''}

        <div class="calendar-display" id="calendar-display">
          <div class="loading">Loading calendar...</div>
        </div>

        <div class="event-popover" id="event-popover">
          <div class="event-popover-content">
            <button class="event-popover-close" data-action="close-popover">&times;</button>
            <div id="event-popover-body"></div>
          </div>
        </div>
      </div>
    `;
  }

  renderCalendar(month) {
    const monthData = this.calendarData[month];
    if (!monthData) return;

    const calendarDisplay = this.shadowRoot.querySelector('#calendar-display');
    if (!calendarDisplay) return;

    const calendarHeader = `
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

    const daysHTML = monthData.days.map(day => {
      if (day.empty) {
        return '<div class="calendar-day empty"></div>';
      }

      const hasEvents = day.events && day.events.length > 0;
      const eventClass = hasEvents ? 'event' : '';
      const dayNameSpan = day.name ? `<div class="day-name">${day.name}</div>` : '';

      const eventsHTML = (day.events || []).map(event => this.renderEvent(event, day.number, monthData.monthInfo)).join('');

      return `
        <div class="calendar-day ${eventClass}">
          <div class="day-number">${day.number}${dayNameSpan}</div>
          ${eventsHTML}
        </div>
      `;
    }).join('');

    calendarDisplay.innerHTML = `
      ${calendarHeader}
      <div class="calendar-grid">
        ${daysHTML}
      </div>
    `;
  }

  renderEvent(event, dayNumber, monthInfo) {
    const isMeeting = !event.title.includes(' vs ');
    const eventDataJson = JSON.stringify({
      ...event,
      isMeeting,
      dayNumber,
      monthInfo
    }).replace(/"/g, '&quot;');

    let countdownHTML = '';
    if (event.status !== 'played' && monthInfo && dayNumber) {
      const timePart = event.subtitle.split(' - ')[1];
      if (timePart && timePart.includes(':')) {
        const [hours, minutes] = timePart.split(':').map(num => parseInt(num, 10));
        const eventDate = new Date(monthInfo.year, monthInfo.monthIndex, dayNumber, hours, minutes);
        const eventTimestamp = eventDate.getTime();
        countdownHTML = `<div class="event-countdown" data-timestamp="${eventTimestamp}"></div>`;
      }
    }

    if (isMeeting) {
      return `
        <div class="event-details" data-event='${eventDataJson}'>
          <div class="event-compact">
            <span class="event-emoji">📅</span>
            <span class="event-opponent">${this.escapeHtml(event.title)}</span>
          </div>
          ${countdownHTML}
        </div>
      `;
    }

    const opponent = event.title.replace('Νέα Σαλαμίνα vs ', '').replace(/ vs Νέα Σαλαμίνα/, '');
    const emoji = event.subtitle.split(' - ')[0];
    const logoHTML = event.logo ? `<img src="${event.logo}" alt="${this.escapeHtml(opponent)}" class="opponent-logo" onerror="this.style.display='none';">` : '';
    const scoreHTML = event.status === 'played' && event.score ? `<span class="event-score">${this.escapeHtml(event.score)}</span>` : '';

    const result = this.getMatchResult(event.score, event.location);
    const eventStatusClass = event.status === 'played' 
      ? (result ? `event-${result}` : 'played')
      : 'event-not-played';

    return `
      <div class="event-details ${eventStatusClass}" data-event='${eventDataJson}'>
        <div class="event-compact">
          <span class="event-emoji">${this.escapeHtml(emoji)}</span>
          ${logoHTML}
          <span class="event-opponent">${this.escapeHtml(opponent)}</span>
          ${scoreHTML}
        </div>
        ${countdownHTML}
      </div>
    `;
  }

  getMatchResult(score, location) {
    if (!score || !score.includes('-')) return null;
    const parts = score.split('-').map(s => parseInt(s.trim()));
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;

    const goalsFor = location === 'home' ? parts[0] : parts[1];
    const goalsAgainst = location === 'home' ? parts[1] : parts[0];

    if (goalsFor > goalsAgainst) return 'win';
    if (goalsFor < goalsAgainst) return 'loss';
    return 'draw';
  }

  highlightToday(displayedMonth) {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    if (currentYear !== 2025 && currentYear !== 2026) return;

    const monthMap = {
      'january': 0, 'february': 1, 'march': 2, 'april': 3,
      'may': 4, 'june': 5, 'july': 6, 'august': 7,
      'september': 8, 'october': 9, 'november': 10, 'december': 11
    };

    if (monthMap[displayedMonth] !== currentMonth) return;

    const days = this.shadowRoot.querySelectorAll('.calendar-day:not(.empty)');
    days.forEach(day => {
      const dayNumberElement = day.querySelector('.day-number');
      if (dayNumberElement) {
        const dayText = dayNumberElement.textContent.trim().split(' ')[0];
        const dayNumber = parseInt(dayText);
        if (dayNumber === currentDay) {
          day.classList.add('today');
        }
      }
    });
  }

  updateCountdowns() {
    const countdownElements = this.shadowRoot.querySelectorAll('.event-countdown');
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

  startCountdownTimer() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.updateCountdowns();
    this.countdownInterval = setInterval(() => this.updateCountdowns(), 60000);
  }

  openEventPopover(eventElement) {
    const eventDataJson = eventElement.getAttribute('data-event');
    if (!eventDataJson) return;

    try {
      const eventData = JSON.parse(eventDataJson.replace(/&quot;/g, '"'));
      const popover = this.shadowRoot.querySelector('#event-popover');
      const popoverBody = this.shadowRoot.querySelector('#event-popover-body');

      if (popover && popoverBody) {
        popoverBody.innerHTML = `
          <h3>${this.escapeHtml(eventData.title)}</h3>
          <p>${this.escapeHtml(eventData.subtitle)}</p>
          ${eventData.venue ? `<p>📍 ${this.escapeHtml(eventData.venue)}</p>` : ''}
          ${eventData.score ? `<p>Score: ${this.escapeHtml(eventData.score)}</p>` : ''}
        `;
        popover.classList.add('active');

        this.dispatchEvent(new CustomEvent('event-selected', {
          detail: { event: eventData },
          bubbles: true
        }));
      }
    } catch (error) {
      console.error('Error parsing event data:', error);
    }
  }

  closeEventPopover() {
    const popover = this.shadowRoot.querySelector('#event-popover');
    if (popover) {
      popover.classList.remove('active');
    }
  }

  attachEventListeners() {
    // Navigation buttons
    this.shadowRoot.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-action');
        if (action === 'previous') this.navigatePrevious();
        else if (action === 'next') this.navigateNext();
        else if (action === 'today') this.jumpToToday();
        else if (action === 'close-popover') this.closeEventPopover();
      });
    });

    // Event clicks
    this.shadowRoot.addEventListener('click', (e) => {
      const eventDetails = e.target.closest('.event-details');
      if (eventDetails) {
        this.openEventPopover(eventDetails);
      }
    });

    // Touch gestures
    const calendarDisplay = this.shadowRoot.querySelector('#calendar-display');
    if (calendarDisplay) {
      calendarDisplay.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      calendarDisplay.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        const swipeThreshold = 50;
        if (this.touchEndX < this.touchStartX - swipeThreshold) {
          this.navigateNext();
        } else if (this.touchEndX > this.touchStartX + swipeThreshold) {
          this.navigatePrevious();
        }
      }, { passive: true });
    }

    // Close popover on background click
    const popover = this.shadowRoot.querySelector('#event-popover');
    if (popover) {
      popover.addEventListener('click', (e) => {
        if (e.target === popover) {
          this.closeEventPopover();
        }
      });
    }
  }

  removeEventListeners() {
    // Event listeners are automatically cleaned up when component is removed
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Auto-register component
if (!customElements.get('team-calendar')) {
  customElements.define('team-calendar', TeamCalendarComponent);
}

export default TeamCalendarComponent;

