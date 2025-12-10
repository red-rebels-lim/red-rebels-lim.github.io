/**
 * Base Component Class
 * Provides common functionality for all team components
 */
export class BaseTeamComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._data = null;
    this._loading = false;
    this._error = null;
    this._eventListeners = [];
  }

  /**
   * Get component attributes as object
   */
  getAttributes() {
    const attrs = {};
    for (const attr of this.attributes) {
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }

  /**
   * Get attribute value with default
   */
  getAttributeOrDefault(name, defaultValue = null) {
    return this.getAttribute(name) || defaultValue;
  }

  /**
   * Convert kebab-case attribute to camelCase property
   */
  attributeToProperty(attrName) {
    return attrName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    this._loading = loading;
    this.dispatchEvent(new CustomEvent('loading-changed', { 
      detail: { loading },
      bubbles: true 
    }));
  }

  /**
   * Set error state
   */
  setError(error) {
    this._error = error;
    this.dispatchEvent(new CustomEvent('error', { 
      detail: { error },
      bubbles: true 
    }));
  }

  /**
   * Set data and dispatch event
   */
  setData(data) {
    this._data = data;
    this.dispatchEvent(new CustomEvent('data-loaded', { 
      detail: { data },
      bubbles: true 
    }));
  }

  /**
   * Get data
   */
  getData() {
    return this._data;
  }

  /**
   * Check if component is loading
   */
  isLoading() {
    return this._loading;
  }

  /**
   * Check if component has error
   */
  hasError() {
    return this._error !== null;
  }

  /**
   * Get error
   */
  getError() {
    return this._error;
  }

  /**
   * Fetch data from API
   * Override in child classes
   */
  async fetchData() {
    throw new Error('fetchData() must be implemented in child class');
  }

  /**
   * Render component
   * Override in child classes
   */
  render() {
    throw new Error('render() must be implemented in child class');
  }

  /**
   * Attach event listeners
   * Override in child classes
   */
  attachEventListeners() {
    // Override in child classes
  }

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    this._eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this._eventListeners = [];
  }

  /**
   * Add event listener with automatic cleanup
   */
  addEventListenerWithCleanup(element, event, handler) {
    element.addEventListener(event, handler);
    this._eventListeners.push({ element, event, handler });
  }

  /**
   * Get default API URL
   * Override in child classes if needed
   */
  getDefaultApiUrl() {
    const teamId = this.getAttribute('team-id') || '8590';
    const countryCode = this.getAttribute('country-code') || 'CYP';
    return `https://www.fotmob.com/api/data/teams?id=${teamId}&ccode3=${countryCode}`;
  }

  /**
   * Fetch JSON from URL with error handling
   */
  async fetchJson(url, options = {}) {
    try {
      this.setLoading(true);
      this.setError(null);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        // If it looks like HTML, it's probably a CORS error or redirect
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          throw new Error('API returned HTML instead of JSON (likely CORS issue)');
        }
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      const data = await response.json();
      this.setLoading(false);
      return data;
    } catch (error) {
      this.setLoading(false);
      this.setError(error.message);
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  /**
   * Get team logo path
   */
  getTeamLogo(teamName, teamId) {
    const TEAM_LOGOS = {
      'Nea Salamis': 'ΝΕΑ_ΣΑΛΑΜΙΝΑ_ΑΜΜΟΧΩΣΤΟΥ.png',
      'Doxa Katokopia': 'ΔΟΞΑ_ΚΑΤΩΚΟΠΙΑΣ.png',
      'Karmiotissa Pano Polemidion': 'ΚΑΡΜΙΩΤΙΣΣΑ_ΠΟΛΕΜΙΔΙΩΝ.png',
      'Omonia 29 Maiou': 'ΑΛΣ_ΟΜΟΝΟΙΑ_29_Μ.png',
      'Ayia Napa': 'ΑΟΑΝ_ΑΓΙΑΣ_ΝΑΠΑΣ.png',
      'Digenis Morphou': 'ΔΙΓΕΝΗΣ_ΑΚΡΙΤΑΣ_ΜΟΡΦΟΥ.png',
      'PAEEK': 'ΠΑΕΕΚ_ΚΕΡΥΝΕΙΑΣ.png',
      'MEAP Nisou': 'ΜΕΑΠ_ΠΕΡΑ_ΧΩΡΙΟΥ_ΝΗΣΟΥ.png',
      'ASIL Lysi': 'ΑΣΙΛ_ΛΥΣΗΣ.png',
      'Chalkanoras Idaliou': 'ΧΑΛΚΑΝΟΡΑΣ_ΙΔΑΛΙΟΥ.png',
      'Ethnikos Latsion': 'ΕΘΝΙΚΟΣ_ΛΑΤΣΙΩΝ.png',
      'APEA Akrotiri': 'ΑΠΕΑ_ΑΚΡΩΤΗΡΙΟΥ.png',
      'Spartakos Kitiou': 'ΣΠΑΡΤΑΚΟΣ_ΚΙΤΙΟΥ.png',
      'Iraklis Gerolakkou': 'ΗΡΑΚΛΗΣ_ΓΕΡΟΛΑΚΚΟΥ.png',
      'AEZ Zakakiou': 'ΑΕΖ_ΖΑΚΑΚΙΟΥ.png',
      'PO Achyronas-Onisilos': 'ΠΟ_ΑΧΥΡΩΝΑΣ_ΟΝΗΣΙΛΟΣ.png'
    };

    const logoFilename = TEAM_LOGOS[teamName];
    if (logoFilename) {
      // Try to resolve relative to component location
      const basePath = this.getAttribute('assets-base') || 'assets/images/team_logos';
      return `${basePath}/${logoFilename}`;
    }
    // Fallback to FotMob URL
    return `https://images.fotmob.com/image_resources/logo/teamlogo/${teamId}.png`;
  }

  /**
   * Lifecycle: Component connected to DOM
   */
  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  /**
   * Lifecycle: Component disconnected from DOM
   */
  disconnectedCallback() {
    this.removeEventListeners();
  }

  /**
   * Lifecycle: Attribute changed
   * Override in child classes with observedAttributes
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.isConnected) {
      // Re-render and fetch data if needed
      this.render();
      if (this.getAttribute('team-id')) {
        this.fetchData();
      }
    }
  }
}

