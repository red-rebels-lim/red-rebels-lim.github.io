// Labels Manager - Handles internationalization and label retrieval
(function() {
    'use strict';

    // Global labels object (will be populated from language file)
    window.labels = window.labels || {};

    // Language configuration
    const LANGUAGES = {
        en: { code: 'EN', file: 'assets/languages/en.js' },
        gr: { code: 'GR', file: 'assets/languages/gr.js' }
    };
    const DEFAULT_LANGUAGE = 'en';

    // Get current language from localStorage or default
    function getCurrentLanguage() {
        return localStorage.getItem('language') || DEFAULT_LANGUAGE;
    }

    // Set current language in localStorage
    function setCurrentLanguage(lang) {
        localStorage.setItem('language', lang);
    }

    // Update language code display in navbar
    function updateLanguageDisplay() {
        const langCode = document.getElementById('language-code');
        if (langCode) {
            const currentLang = getCurrentLanguage();
            langCode.textContent = LANGUAGES[currentLang].code;
        }
    }

    // Load language file dynamically
    function loadLanguageFile(lang, callback) {
        // Remove existing language script if present
        const existingScript = document.querySelector('script[data-language-file]');
        if (existingScript) {
            existingScript.remove();
        }

        // Create and load new language script
        const script = document.createElement('script');
        script.src = `${LANGUAGES[lang].file}?v=${Date.now()}`;
        script.setAttribute('data-language-file', 'true');
        script.onload = function() {
            // Reassign the loaded labels to window.labels
            if (typeof labels !== 'undefined') {
                window.labels = labels;
            }
            if (callback) callback();
        };
        script.onerror = function() {
            console.error(`Failed to load language file: ${lang}`);
        };
        document.head.appendChild(script);
    }

    // Toggle between languages
    window.toggleLanguage = function() {
        const currentLang = getCurrentLanguage();
        const newLang = currentLang === 'en' ? 'gr' : 'en';

        setCurrentLanguage(newLang);
        loadLanguageFile(newLang, function() {
            applyLabels();
            updateLanguageDisplay();

            // Trigger custom event for other components that might need to update
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: newLang } }));
        });
    };

    // Helper function to get nested label value
    // Usage: getLabel('nav.calendar') or getLabel('months.september')
    window.getLabel = function(path, defaultValue = '') {
        const keys = path.split('.');
        let value = window.labels;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                console.warn(`Label not found: ${path}`);
                return defaultValue;
            }
        }

        return value || defaultValue;
    };

    // Helper function to get label with icon
    // Usage: getLabelWithIcon('icons.calendar', 'nav.calendar')
    window.getLabelWithIcon = function(iconPath, labelPath) {
        const icon = getLabel(iconPath, '');
        const label = getLabel(labelPath, '');
        return icon ? `${icon} ${label}` : label;
    };

    // Replace all data-label attributes in the DOM with actual labels
    window.applyLabels = function() {
        // Replace elements with data-label attribute
        document.querySelectorAll('[data-label]').forEach(element => {
            const labelPath = element.getAttribute('data-label');
            const label = getLabel(labelPath);
            if (label) {
                element.textContent = label;
            }
        });

        // Replace elements with data-label-html attribute (for HTML content)
        document.querySelectorAll('[data-label-html]').forEach(element => {
            const labelPath = element.getAttribute('data-label-html');
            const label = getLabel(labelPath);
            if (label) {
                element.innerHTML = label;
            }
        });

        // Replace placeholders in attributes (title, alt, placeholder)
        document.querySelectorAll('[data-label-title]').forEach(element => {
            const labelPath = element.getAttribute('data-label-title');
            const label = getLabel(labelPath);
            if (label) {
                element.setAttribute('title', label);
            }
        });

        document.querySelectorAll('[data-label-placeholder]').forEach(element => {
            const labelPath = element.getAttribute('data-label-placeholder');
            const label = getLabel(labelPath);
            if (label) {
                element.setAttribute('placeholder', label);
            }
        });

        document.querySelectorAll('[data-label-alt]').forEach(element => {
            const labelPath = element.getAttribute('data-label-alt');
            const label = getLabel(labelPath);
            if (label) {
                element.setAttribute('alt', label);
            }
        });

        // Replace aria-label attributes
        document.querySelectorAll('[data-label-aria]').forEach(element => {
            const labelPath = element.getAttribute('data-label-aria');
            const label = getLabel(labelPath);
            if (label) {
                element.setAttribute('aria-label', label);
            }
        });
    };

    // Load labels and apply them to the DOM
    window.initLabels = function() {
        // Update language display when navbar loads
        updateLanguageDisplay();

        // Apply labels to any existing elements
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                applyLabels();
                updateLanguageDisplay();
            });
        } else {
            applyLabels();
            updateLanguageDisplay();
        }
    };

    // Initialize language on page load
    window.initLanguage = function() {
        const savedLang = getCurrentLanguage();
        // If saved language is different from default, load it
        if (savedLang !== DEFAULT_LANGUAGE) {
            loadLanguageFile(savedLang, function() {
                applyLabels();
                updateLanguageDisplay();
            });
        } else {
            updateLanguageDisplay();
        }
    };

    // Auto-initialize
    initLabels();

    // Check and load saved language preference after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLanguage);
    } else {
        initLanguage();
    }
})();
