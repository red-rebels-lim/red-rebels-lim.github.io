// Component Loader - Loads shared components like navbar and footer
(function() {
    'use strict';

    // Configuration for each page (uses labels)
    const pageConfig = {
        calendar: {
            name: 'calendar',
            options: [
                { labelPath: 'navOptions.jumpToToday', icon: 'icons.calendar', action: 'jumpToToday()' },
                { divider: true },
                { labelPath: 'navOptions.export', icon: 'icons.export', action: 'exportToCalendar()' },
                { labelPath: 'navOptions.print', icon: 'icons.print', action: 'window.print()' }
            ]
        },
        stats: {
            name: 'stats',
            options: [
                { labelPath: 'navOptions.print', icon: 'icons.print', action: 'window.print()' }
            ]
        }
    };

    // Get current page name from the filename
    function getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('stats.html')) return 'stats';
        return 'calendar';
    }

    // Load a component from file
    async function loadComponent(componentName) {
        try {
            const response = await fetch(`assets/components/${componentName}.html`);
            if (!response.ok) throw new Error(`Failed to load ${componentName}`);
            return await response.text();
        } catch (error) {
            console.error(`Error loading ${componentName}:`, error);
            return '';
        }
    }

    // Set active nav link based on current page
    function setActiveNavLink(currentPage) {
        const navLinks = document.querySelectorAll('.nav-link[data-page]');
        navLinks.forEach(link => {
            if (link.getAttribute('data-page') === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Populate options menu based on current page
    function populateOptionsMenu(currentPage) {
        const optionsMenu = document.getElementById('navbar-options-menu');
        if (!optionsMenu) return;

        const config = pageConfig[currentPage];
        if (!config) return;

        optionsMenu.innerHTML = '';

        config.options.forEach(option => {
            if (option.divider) {
                const divider = document.createElement('li');
                divider.innerHTML = '<hr class="dropdown-divider">';
                optionsMenu.appendChild(divider);
            } else {
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.className = 'dropdown-item';
                link.href = '#';

                // Get label and icon from labels system
                const icon = window.getLabel ? window.getLabel(option.icon, '') : '';
                const label = window.getLabel ? window.getLabel(option.labelPath, '') : '';
                link.textContent = icon ? `${icon} ${label}` : label;

                link.onclick = function(e) {
                    e.preventDefault();
                    eval(option.action);
                    return false;
                };
                li.appendChild(link);
                optionsMenu.appendChild(li);
            }
        });
    }

    // Initialize components
    async function initComponents() {
        const currentPage = getCurrentPage();

        // Load navbar
        const navbarContainer = document.getElementById('navbar-container');
        if (navbarContainer) {
            const navbarHTML = await loadComponent('navbar');
            navbarContainer.innerHTML = navbarHTML;

            // Set active nav link after navbar is loaded
            setActiveNavLink(currentPage);

            // Populate options menu
            populateOptionsMenu(currentPage);

            // Apply labels to navbar
            if (window.applyLabels) {
                window.applyLabels();
            }

            // Show filter button only on calendar page
            const filterBtn = document.getElementById('navbar-filter-btn');
            if (filterBtn && currentPage === 'calendar') {
                filterBtn.style.display = 'flex';
            } else if (filterBtn) {
                filterBtn.style.display = 'none';
            }
        }

        // Load footer
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            const footerHTML = await loadComponent('footer');
            footerContainer.innerHTML = footerHTML;

            // Apply labels to footer
            if (window.applyLabels) {
                window.applyLabels();
            }
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initComponents);
    } else {
        initComponents();
    }
})();
