/**
 * Jira REST API client
 *
 * Centralized HTTP client for all Jira API interactions with:
 * - Automatic retry with exponential backoff
 * - Rate limiting awareness (429 handling)
 * - Type-safe responses
 */

import type {
  JiraConfig,
  JiraTask,
  JiraUser,
  JiraTransition,
  CreateIssueFields,
  IssueUpdate,
  AdfDocument,
} from './types.js';

// =============================================================================
// Client Class
// =============================================================================

export class JiraClient {
  private config: JiraConfig;
  private authHeader: string;

  constructor(config: JiraConfig) {
    this.config = config;
    this.authHeader = `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')}`;
  }

  // ===========================================================================
  // HTTP Helpers
  // ===========================================================================

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    retries = 3
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        // Rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
          console.warn(`Rate limited, waiting ${retryAfter}s...`);
          await this.sleep(retryAfter * 1000);
          continue;
        }

        // Success with no content
        if (response.status === 204) {
          return undefined as T;
        }

        // Error response
        if (!response.ok) {
          const errorText = await response.text();
          throw new JiraApiError(
            `Jira API error: ${response.status} ${response.statusText}`,
            response.status,
            errorText
          );
        }

        // Success with content
        const text = await response.text();
        return text ? JSON.parse(text) : undefined;
      } catch (e) {
        if (e instanceof JiraApiError) throw e;

        // Network error, retry
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`Request failed, retrying in ${delay / 1000}s...`);
          await this.sleep(delay);
          continue;
        }
        throw e;
      }
    }

    throw new Error('Max retries exceeded');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===========================================================================
  // Issue Operations
  // ===========================================================================

  async getIssue(key: string, fields?: string[]): Promise<JiraIssueResponse> {
    const fieldsParam = fields?.join(',') || 'summary,status,assignee,labels,description,updated,parent';
    return this.request<JiraIssueResponse>(
      'GET',
      `/rest/api/3/issue/${key}?fields=${fieldsParam}`
    );
  }

  async createIssue(fields: CreateIssueFields): Promise<{ key: string; id: string }> {
    return this.request<{ key: string; id: string }>(
      'POST',
      '/rest/api/3/issue',
      { fields }
    );
  }

  async updateIssue(key: string, update: IssueUpdate): Promise<void> {
    await this.request<void>('PUT', `/rest/api/3/issue/${key}`, update);
  }

  async deleteIssue(key: string): Promise<void> {
    await this.request<void>('DELETE', `/rest/api/3/issue/${key}`);
  }

  // ===========================================================================
  // Transitions
  // ===========================================================================

  async getTransitions(key: string): Promise<JiraTransition[]> {
    const response = await this.request<{ transitions: JiraTransition[] }>(
      'GET',
      `/rest/api/3/issue/${key}/transitions`
    );
    return response.transitions || [];
  }

  async transitionIssue(key: string, transitionId: string): Promise<void> {
    await this.request<void>(
      'POST',
      `/rest/api/3/issue/${key}/transitions`,
      { transition: { id: transitionId } }
    );
  }

  /**
   * Transition issue to a target status by name
   * Returns true if transitioned, false if already at target status
   */
  async transitionTo(key: string, targetStatus: string): Promise<boolean> {
    const transitions = await this.getTransitions(key);
    const target = transitions.find(
      t => t.to.name.toLowerCase() === targetStatus.toLowerCase() ||
           t.name.toLowerCase() === targetStatus.toLowerCase()
    );

    if (!target) {
      // Already at target status or transition not available
      return false;
    }

    await this.transitionIssue(key, target.id);
    return true;
  }

  // ===========================================================================
  // Assignee
  // ===========================================================================

  async assignIssue(key: string, accountId: string | null): Promise<void> {
    await this.request<void>('PUT', `/rest/api/3/issue/${key}`, {
      fields: {
        assignee: accountId ? { accountId } : null,
      },
    });
  }

  // ===========================================================================
  // Labels
  // ===========================================================================

  async updateLabels(key: string, add: string[], remove: string[]): Promise<void> {
    if (add.length === 0 && remove.length === 0) return;

    const labels: Array<{ add?: string; remove?: string }> = [];
    for (const label of add) {
      labels.push({ add: label });
    }
    for (const label of remove) {
      labels.push({ remove: label });
    }

    await this.request<void>('PUT', `/rest/api/3/issue/${key}`, {
      update: { labels },
    });
  }

  // ===========================================================================
  // Search
  // ===========================================================================

  async searchIssues(jql: string, fields?: string[], maxResults = 100): Promise<JiraIssueResponse[]> {
    // Use the new /search/jql endpoint (the old /search was removed in 2024)
    const response = await this.request<{ issues: JiraIssueResponse[] }>(
      'POST',
      '/rest/api/3/search/jql',
      {
        jql,
        fields: fields || ['summary', 'status', 'assignee', 'labels', 'updated', 'parent'],
        maxResults,
      }
    );
    return response.issues || [];
  }

  /**
   * Search with cursor-based pagination (new Jira API)
   */
  async searchIssuesPaginated(
    jql: string,
    fields?: string[],
    maxResults = 100,
    nextPageToken?: string
  ): Promise<{ issues: JiraIssueResponse[]; nextPageToken?: string; isLast: boolean }> {
    const body: Record<string, unknown> = {
      jql,
      fields: fields || ['summary', 'status', 'assignee', 'labels', 'updated', 'parent'],
      maxResults,
    };

    if (nextPageToken) {
      body.nextPageToken = nextPageToken;
    }

    const response = await this.request<{
      issues: JiraIssueResponse[];
      nextPageToken?: string;
      isLast: boolean;
    }>('POST', '/rest/api/3/search/jql', body);

    return {
      issues: response.issues || [],
      nextPageToken: response.nextPageToken,
      isLast: response.isLast ?? true,
    };
  }

  // ===========================================================================
  // Changelog
  // ===========================================================================

  async getIssueChangelog(key: string): Promise<ChangelogEntry[]> {
    const response = await this.request<{ values: ChangelogEntry[] }>(
      'GET',
      `/rest/api/3/issue/${key}/changelog`
    );
    return response.values || [];
  }

  // ===========================================================================
  // User
  // ===========================================================================

  async getMyself(): Promise<JiraUser> {
    return this.request<JiraUser>('GET', '/rest/api/3/myself');
  }

  async searchUsers(query: string): Promise<JiraUser[]> {
    return this.request<JiraUser[]>(
      'GET',
      `/rest/api/3/user/search?query=${encodeURIComponent(query)}`
    );
  }

  // ===========================================================================
  // Project Metadata
  // ===========================================================================

  async getCreateMeta(projectKey: string, issueTypeName: string): Promise<unknown> {
    return this.request<unknown>(
      'GET',
      `/rest/api/3/issue/createmeta?projectKeys=${projectKey}&issuetypeNames=${issueTypeName}&expand=projects.issuetypes.fields`
    );
  }
}

// =============================================================================
// Response Types
// =============================================================================

export interface JiraIssueResponse {
  key: string;
  id: string;
  fields: {
    summary: string;
    status: { name: string };
    assignee?: JiraUser;
    labels: string[];
    description?: AdfDocument;
    updated: string;
    parent?: { key: string };
    issuetype?: { name: string };
    // Story points - common custom field
    customfield_10016?: number;
  };
}

export interface ChangelogEntry {
  id: string;
  created: string;
  author: JiraUser;
  items: ChangelogItem[];
}

export interface ChangelogItem {
  field: string;
  fieldtype: string;
  from: string | null;
  fromString: string | null;
  to: string | null;
  toString: string | null;
}

// =============================================================================
// Error Class
// =============================================================================

export class JiraApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body: string
  ) {
    super(message);
    this.name = 'JiraApiError';
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert Jira API response to our JiraTask type
 */
export function toJiraTask(response: JiraIssueResponse): JiraTask {
  return {
    key: response.key,
    summary: response.fields.summary,
    status: response.fields.status.name,
    assignee: response.fields.assignee,
    storyPoints: response.fields.customfield_10016,
    labels: response.fields.labels || [],
    description: response.fields.description,
    updated: response.fields.updated,
    parentKey: response.fields.parent?.key,
  };
}
