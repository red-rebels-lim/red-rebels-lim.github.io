/**
 * Data Service
 * Provides caching and shared data management for team components
 */
export class TeamDataService {
  static cache = new Map();
  static cacheTimeout = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get team data with caching
   * @param {string|number} teamId - Team ID
   * @param {string} apiUrl - API URL
   * @param {object} options - Options (forceRefresh, timeout)
   * @returns {Promise<object>} Team data
   */
  static async getTeamData(teamId, apiUrl, options = {}) {
    const cacheKey = `team-${teamId}`;
    const { forceRefresh = false, timeout = this.cacheTimeout } = options;

    // Check cache first
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      const age = Date.now() - cached.timestamp;
      
      if (age < timeout) {
        return cached.data;
      } else {
        // Cache expired, remove it
        this.cache.delete(cacheKey);
      }
    }

    // Fetch fresh data
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get response text first to check if it's actually JSON
      const responseText = await response.text();
      
      // Check if it looks like HTML (CORS error page, redirect, etc.)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.warn('API returned HTML instead of JSON (likely CORS issue)');
        throw new Error('API returned HTML instead of JSON (likely CORS issue)');
      }
      
      // Check content-type header
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.warn(`API returned non-JSON response. Content-Type: ${contentType}`);
        throw new Error(`API returned non-JSON response. Content-Type: ${contentType}`);
      }

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        // If JSON parsing fails, log the first 200 chars for debugging
        console.warn('JSON parsing failed. Response preview:', responseText.substring(0, 200));
        throw new Error('Failed to parse response as JSON');
      }
      
      // Cache the data
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      // Check if it's a JSON parsing error (from old code path or network issue)
      const isJsonError = error instanceof SyntaxError && error.message.includes('JSON');
      const isHtmlError = error.message && error.message.includes('HTML');
      
      if (isJsonError || isHtmlError) {
        console.warn(`API request failed (${isJsonError ? 'JSON parse error' : 'HTML response'}), trying local data fallback...`);
      } else {
        console.error(`Error fetching team data for ${teamId}:`, error);
      }
      
      // Try to load from local file as fallback (always try this first)
      try {
        const localData = await this.loadLocalData(teamId);
        if (localData) {
          console.log('✅ Using local team-data.json as fallback');
          return localData;
        } else {
          console.warn('⚠️ Local team-data.json not found or empty');
        }
      } catch (localError) {
        console.warn('⚠️ Failed to load local data:', localError.message || localError);
      }
      
      // Return cached data even if expired, as last resort fallback
      if (this.cache.has(cacheKey)) {
        console.warn('⚠️ Using expired cache as last resort fallback');
        return this.cache.get(cacheKey).data;
      }
      
      // If all else fails, throw a more user-friendly error
      throw new Error(`Failed to load team data. API error: ${error.message}`);
    }
  }

  /**
   * Clear cache for a specific team
   * @param {string|number} teamId - Team ID
   */
  static clearCache(teamId) {
    const cacheKey = `team-${teamId}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Clear all cache
   */
  static clearAllCache() {
    this.cache.clear();
  }

  /**
   * Get cache size
   * @returns {number} Number of cached items
   */
  static getCacheSize() {
    return this.cache.size;
  }

  /**
   * Set cache timeout
   * @param {number} timeout - Timeout in milliseconds
   */
  static setCacheTimeout(timeout) {
    this.cacheTimeout = timeout;
  }

  /**
   * Clean expired cache entries
   */
  static cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      const age = now - value.timestamp;
      if (age >= this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Load data from local JSON file
   * @param {string|number} teamId - Team ID
   * @returns {Promise<object|null>} Team data or null if not found
   */
  static async loadLocalData(teamId) {
    try {
      // Try multiple possible paths
      const paths = ['./team-data.json', '/team-data.json', 'team-data.json'];
      
      for (const path of paths) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const data = await response.json();
              
              // Cache it
              const cacheKey = `team-${teamId}`;
              this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
              });
              
              console.log(`✅ Loaded local data from ${path}`);
              return data;
            }
          }
        } catch (pathError) {
          // Try next path
          continue;
        }
      }
      
      console.warn('⚠️ team-data.json not found in any of the expected paths');
      return null;
    } catch (error) {
      console.warn('⚠️ Failed to load local team data:', error.message || error);
      return null;
    }
  }

  /**
   * Prefetch team data
   * @param {string|number} teamId - Team ID
   * @param {string} apiUrl - API URL
   */
  static async prefetch(teamId, apiUrl) {
    return this.getTeamData(teamId, apiUrl);
  }
}

// Auto-clean expired cache every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    TeamDataService.cleanExpiredCache();
  }, 10 * 60 * 1000);
}

export default TeamDataService;

