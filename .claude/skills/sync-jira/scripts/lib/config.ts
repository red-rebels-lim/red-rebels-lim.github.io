/**
 * Configuration loader for sync-jira skill
 *
 * Handles loading and saving .jira-mapping.json with backward compatibility
 * for both old (string) and new (object) developer formats.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type {
  MappingFile,
  StatusMapping,
  DeveloperInfo,
  DeveloperMapping,
  EpicMapping,
  JiraConfig,
} from './types.js';

// =============================================================================
// Constants
// =============================================================================

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const TASKS_DIR = path.join(PROJECT_ROOT, '.tasks');
const MAPPING_PATH = path.join(TASKS_DIR, '.jira-mapping.json');

const DEFAULT_STATUS_MAPPING: StatusMapping = {
  ready: 'To Do',
  pending: 'To Do',
  in_progress: 'In Progress',
  blocked: 'To Do',
  done: 'Done',
};

// =============================================================================
// File Operations
// =============================================================================

let cachedConfig: MappingFile | null = null;

export function loadConfig(): MappingFile {
  if (cachedConfig) return cachedConfig;

  try {
    const content = fs.readFileSync(MAPPING_PATH, 'utf-8');
    cachedConfig = JSON.parse(content);
    return cachedConfig!;
  } catch (e) {
    console.error(`Failed to load ${MAPPING_PATH}:`, e);
    cachedConfig = { mapping: [] };
    return cachedConfig;
  }
}

export function saveConfig(config: MappingFile): void {
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(config, null, 2) + '\n');
  cachedConfig = config;
}

export function clearConfigCache(): void {
  cachedConfig = null;
}

// =============================================================================
// Jira Credentials
// =============================================================================

export function getJiraConfig(): JiraConfig | null {
  const baseUrl = process.env.JIRA_URL;
  const email = process.env.JIRA_USERNAME;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !apiToken) {
    return null;
  }

  return { baseUrl, email, apiToken };
}

export function requireJiraConfig(): JiraConfig {
  const config = getJiraConfig();
  if (!config) {
    console.error('\n❌ Missing Jira credentials. Add to .env.local:');
    console.error('   JIRA_URL=https://your-org.atlassian.net');
    console.error('   JIRA_USERNAME=you@company.com');
    console.error('   JIRA_API_TOKEN=your-api-token');
    console.error('\n   Get token: https://id.atlassian.com/manage-profile/security/api-tokens');
    process.exit(1);
  }
  return config;
}

// =============================================================================
// Project Configuration
// =============================================================================

export function getProjectKey(): string {
  const config = loadConfig();
  return config._project || 'CC';
}

// =============================================================================
// Status Mapping
// =============================================================================

export function getStatusMapping(): StatusMapping {
  const config = loadConfig();
  return config.statusMapping || DEFAULT_STATUS_MAPPING;
}

export function getJiraStatus(repoStatus: string): string {
  const mapping = getStatusMapping();
  return mapping[repoStatus as keyof StatusMapping] || 'To Do';
}

export function getRepoStatus(jiraStatus: string): string {
  const mapping = getStatusMapping();
  const lowerStatus = jiraStatus.toLowerCase();

  // Reverse lookup
  for (const [repo, jira] of Object.entries(mapping)) {
    if (jira.toLowerCase() === lowerStatus) {
      return repo;
    }
  }

  // Default mappings
  if (lowerStatus === 'done') return 'done';
  if (lowerStatus === 'in progress') return 'in_progress';
  return 'ready';
}

// =============================================================================
// Developer Mapping (with backward compatibility)
// =============================================================================

/**
 * Get developer info, supporting both old (string) and new (object) formats.
 */
export function getDeveloperInfo(assignee: string): DeveloperInfo | null {
  if (!assignee || assignee.toLowerCase() === 'unassigned') return null;

  const config = loadConfig();
  const developers = config.developers || {};

  // Direct lookup
  const mapping = developers[assignee];
  if (mapping === null) return null;

  if (typeof mapping === 'string') {
    // Old format: string is the Jira account ID
    return { jiraAccountId: mapping };
  }

  if (typeof mapping === 'object' && mapping.jiraAccountId) {
    return mapping;
  }

  // Check aliases
  for (const [, dev] of Object.entries(developers)) {
    if (dev && typeof dev === 'object' && 'aliases' in dev) {
      if (dev.aliases?.includes(assignee)) {
        return dev;
      }
    }
  }

  return null;
}

export function getDeveloperAccountId(assignee: string): string | null {
  const info = getDeveloperInfo(assignee);
  return info?.jiraAccountId || null;
}

export function getDeveloperGithubUsername(assignee: string): string | null {
  const info = getDeveloperInfo(assignee);
  return info?.githubUsername || null;
}

/**
 * Find developer name by Jira account ID
 */
export function getDeveloperNameByAccountId(accountId: string): string | null {
  const config = loadConfig();
  const developers = config.developers || {};

  for (const [name, mapping] of Object.entries(developers)) {
    if (mapping === null) continue;

    const jiraId = typeof mapping === 'string'
      ? mapping
      : mapping.jiraAccountId;

    if (jiraId === accountId) {
      return name;
    }
  }

  return null;
}

/**
 * Find developer name by GitHub username
 */
export function getDeveloperNameByGithub(githubUsername: string): string | null {
  const config = loadConfig();
  const developers = config.developers || {};

  for (const [name, mapping] of Object.entries(developers)) {
    if (mapping && typeof mapping === 'object' && mapping.githubUsername === githubUsername) {
      return name;
    }
  }

  return null;
}

// =============================================================================
// Task Mapping
// =============================================================================

export function getTaskMappings(): Record<string, string> {
  const config = loadConfig();
  return config.taskMappings || {};
}

export function getJiraKeyForTask(taskId: string): string | undefined {
  const mappings = getTaskMappings();
  return mappings[taskId];
}

export function getTaskIdForJiraKey(jiraKey: string): string | undefined {
  const mappings = getTaskMappings();
  for (const [taskId, key] of Object.entries(mappings)) {
    if (key === jiraKey) return taskId;
  }
  return undefined;
}

export function updateTaskMapping(taskId: string, jiraKey: string): void {
  const config = loadConfig();
  if (!config.taskMappings) {
    config.taskMappings = {};
  }
  config.taskMappings[taskId] = jiraKey;
  saveConfig(config);
}

// =============================================================================
// Epic Mapping
// =============================================================================

export function getEpicMappings(): EpicMapping[] {
  const config = loadConfig();
  return config.mapping || [];
}

export function getEpicMapping(jiraKey: string): EpicMapping | undefined {
  return getEpicMappings().find(m => m.jiraKey === jiraKey);
}

export function getEpicForRepoCode(repoCode: string): EpicMapping | undefined {
  return getEpicMappings().find(m => m.repoEpics.includes(repoCode));
}

// =============================================================================
// Done Tasks
// =============================================================================

let doneTasksCache: Set<string> | null = null;

export function getDoneTasks(): Set<string> {
  if (doneTasksCache) return doneTasksCache;

  const donePath = path.join(TASKS_DIR, '.done');
  doneTasksCache = new Set<string>();

  try {
    const content = fs.readFileSync(donePath, 'utf-8');
    const matches = content.matchAll(/^([A-Z]+-\d+)/gm);
    for (const match of matches) {
      doneTasksCache.add(match[1]);
    }
  } catch {
    // .done file doesn't exist
  }

  return doneTasksCache;
}

export function isTaskDone(taskId: string): boolean {
  return getDoneTasks().has(taskId);
}

export function clearDoneCache(): void {
  doneTasksCache = null;
}

// =============================================================================
// Paths
// =============================================================================

export function getTasksDir(): string {
  return TASKS_DIR;
}

export function getEpicsDir(): string {
  return path.join(TASKS_DIR, 'epics');
}

export function getMappingPath(): string {
  return MAPPING_PATH;
}
