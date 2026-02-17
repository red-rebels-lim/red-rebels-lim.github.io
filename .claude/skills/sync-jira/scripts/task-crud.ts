#!/usr/bin/env npx tsx
/**
 * Task CRUD Operations
 *
 * Create, Read, Update, Delete tasks in Jira.
 *
 * Usage:
 *   npx tsx .claude/skills/sync-jira/scripts/task-crud.ts create SEO-006
 *   npx tsx .claude/skills/sync-jira/scripts/task-crud.ts read SEO-001
 *   npx tsx .claude/skills/sync-jira/scripts/task-crud.ts read CC-106
 *   npx tsx .claude/skills/sync-jira/scripts/task-crud.ts update SEO-001 --status in_progress
 *   npx tsx .claude/skills/sync-jira/scripts/task-crud.ts delete CC-999
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __scriptDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__scriptDir, '../../../../.env.local') });

import { JiraClient, toJiraTask } from './lib/jira-api.js';
import {
  requireJiraConfig,
  getProjectKey,
  getDeveloperAccountId,
  getJiraKeyForTask,
  updateTaskMapping,
  getEpicForRepoCode,
} from './lib/config.js';
import { getTaskById, updateTaskFile } from './lib/task-parser.js';
import { taskToAdf } from './lib/adf-converter.js';
import { recordSyncComplete } from './lib/timestamp-tracker.js';
import type { LocalTask, SyncResult } from './lib/types.js';

// =============================================================================
// CREATE
// =============================================================================

export async function createTask(taskId: string): Promise<SyncResult> {
  const task = getTaskById(taskId);
  if (!task) {
    return {
      taskId,
      action: 'skipped',
      direction: 'none',
      error: `Task ${taskId} not found in repo`,
    };
  }

  if (task.jiraKey) {
    return {
      taskId,
      jiraKey: task.jiraKey,
      action: 'skipped',
      direction: 'none',
      error: `Task ${taskId} already has Jira key ${task.jiraKey}`,
    };
  }

  const jiraConfig = requireJiraConfig();
  const client = new JiraClient(jiraConfig);
  const projectKey = getProjectKey();

  // Find parent epic
  const epicMapping = getEpicForRepoCode(task.epicCode);
  if (!epicMapping) {
    return {
      taskId,
      action: 'skipped',
      direction: 'none',
      error: `No Jira epic mapping found for ${task.epicCode}`,
    };
  }

  try {
    // Build description
    const description = taskToAdf(task);

    // Create the issue
    const result = await client.createIssue({
      project: { key: projectKey },
      summary: `[${task.id}] ${task.title}`,
      issuetype: { name: 'Story' },
      description,
      parent: { key: epicMapping.jiraKey },
      assignee: task.assignee ? { accountId: getDeveloperAccountId(task.assignee) || '' } : undefined,
      customfield_10016: task.estimate, // Story points
    });

    // Update local task file
    updateTaskFile(taskId, { jiraKey: result.key });

    // Update mapping
    updateTaskMapping(taskId, result.key);

    // Record sync timestamp
    const now = new Date().toISOString();
    recordSyncComplete(taskId, task.fileLastModified || now, now);

    return {
      taskId,
      jiraKey: result.key,
      action: 'created',
      direction: 'push',
      changes: ['Created Jira Story'],
    };
  } catch (e) {
    return {
      taskId,
      action: 'skipped',
      direction: 'none',
      error: `Failed to create: ${e}`,
    };
  }
}

// =============================================================================
// READ
// =============================================================================

export async function readTask(identifier: string): Promise<{ local?: LocalTask; remote?: unknown }> {
  // Check if it's a Jira key or task ID
  const isJiraKey = identifier.match(/^[A-Z]+-\d+$/) && identifier.startsWith('CC-');

  let jiraKey: string | undefined;
  let taskId: string | undefined;

  if (isJiraKey) {
    jiraKey = identifier;
  } else {
    taskId = identifier;
    jiraKey = getJiraKeyForTask(identifier);
  }

  const result: { local?: LocalTask; remote?: unknown } = {};

  // Get local task
  if (taskId) {
    const local = getTaskById(taskId);
    if (local) {
      result.local = local;
    }
  }

  // Get remote task
  if (jiraKey) {
    try {
      const jiraConfig = requireJiraConfig();
      const client = new JiraClient(jiraConfig);
      const response = await client.getIssue(jiraKey);
      result.remote = toJiraTask(response);
    } catch (e) {
      console.error(`Failed to fetch Jira issue ${jiraKey}:`, e);
    }
  }

  return result;
}

// =============================================================================
// UPDATE
// =============================================================================

interface UpdateOptions {
  status?: string;
  assignee?: string;
  estimate?: number;
  syncDescription?: boolean;
}

export async function updateTask(taskId: string, options: UpdateOptions): Promise<SyncResult> {
  const task = getTaskById(taskId);
  if (!task) {
    return {
      taskId,
      action: 'skipped',
      direction: 'none',
      error: `Task ${taskId} not found in repo`,
    };
  }

  const jiraKey = task.jiraKey || getJiraKeyForTask(taskId);
  if (!jiraKey) {
    return {
      taskId,
      action: 'skipped',
      direction: 'none',
      error: `Task ${taskId} has no Jira key. Use 'create' first.`,
    };
  }

  const jiraConfig = requireJiraConfig();
  const client = new JiraClient(jiraConfig);
  const changes: string[] = [];

  try {
    // Update status via transition
    if (options.status) {
      const transitioned = await client.transitionTo(jiraKey, options.status);
      if (transitioned) {
        changes.push(`Status → ${options.status}`);
      }
    }

    // Update assignee
    if (options.assignee !== undefined) {
      const accountId = options.assignee ? getDeveloperAccountId(options.assignee) : null;
      await client.assignIssue(jiraKey, accountId);
      changes.push(`Assignee → ${options.assignee || 'unassigned'}`);
    }

    // Update description
    if (options.syncDescription) {
      const description = taskToAdf(task);
      await client.updateIssue(jiraKey, {
        fields: { description },
      });
      changes.push('Description synced');
    }

    // Update estimate
    if (options.estimate !== undefined) {
      await client.updateIssue(jiraKey, {
        fields: { customfield_10016: options.estimate },
      });
      changes.push(`Estimate → ${options.estimate}`);
    }

    // Record sync
    const response = await client.getIssue(jiraKey, ['updated']);
    recordSyncComplete(taskId, task.fileLastModified || new Date().toISOString(), response.fields.updated);

    return {
      taskId,
      jiraKey,
      action: changes.length > 0 ? 'updated' : 'skipped',
      direction: 'push',
      changes,
    };
  } catch (e) {
    return {
      taskId,
      jiraKey,
      action: 'skipped',
      direction: 'none',
      error: `Failed to update: ${e}`,
    };
  }
}

// =============================================================================
// DELETE
// =============================================================================

export async function deleteTask(jiraKey: string): Promise<SyncResult> {
  const jiraConfig = requireJiraConfig();
  const client = new JiraClient(jiraConfig);

  try {
    await client.deleteIssue(jiraKey);
    return {
      taskId: jiraKey,
      jiraKey,
      action: 'deleted',
      direction: 'push',
      changes: ['Deleted from Jira'],
    };
  } catch (e) {
    return {
      taskId: jiraKey,
      jiraKey,
      action: 'skipped',
      direction: 'none',
      error: `Failed to delete: ${e}`,
    };
  }
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const identifier = args[1];

  if (!command || !identifier) {
    console.log(`
Usage:
  npx tsx task-crud.ts create <task-id>           Create Jira story from local task
  npx tsx task-crud.ts read <task-id|jira-key>    Read task info (local + remote)
  npx tsx task-crud.ts update <task-id> [options] Update task in Jira
  npx tsx task-crud.ts delete <jira-key>          Delete Jira issue

Update options:
  --status <status>     Transition to status (e.g., "In Progress", "Done")
  --assignee <name>     Set assignee (use "" for unassigned)
  --estimate <points>   Set story points
  --description         Sync description from local file

Examples:
  npx tsx task-crud.ts create SEO-006
  npx tsx task-crud.ts read SEO-001
  npx tsx task-crud.ts update SEO-001 --status "In Progress"
  npx tsx task-crud.ts update SEO-001 --assignee "Dev A" --description
`);
    process.exit(1);
  }

  switch (command) {
    case 'create': {
      const result = await createTask(identifier);
      console.log(result.action === 'created'
        ? `✅ Created ${result.jiraKey}`
        : `⚠️ ${result.error}`
      );
      break;
    }

    case 'read': {
      const result = await readTask(identifier);
      console.log('\n📋 Task Info\n');
      if (result.local) {
        console.log('Local:', JSON.stringify(result.local, null, 2));
      }
      if (result.remote) {
        console.log('\nRemote:', JSON.stringify(result.remote, null, 2));
      }
      if (!result.local && !result.remote) {
        console.log('Task not found');
      }
      break;
    }

    case 'update': {
      const options: UpdateOptions = {};
      for (let i = 2; i < args.length; i++) {
        if (args[i] === '--status' && args[i + 1]) {
          options.status = args[++i];
        } else if (args[i] === '--assignee') {
          options.assignee = args[++i] || '';
        } else if (args[i] === '--estimate' && args[i + 1]) {
          options.estimate = parseInt(args[++i], 10);
        } else if (args[i] === '--description') {
          options.syncDescription = true;
        }
      }
      const result = await updateTask(identifier, options);
      console.log(result.action === 'updated'
        ? `✅ Updated ${result.jiraKey}: ${result.changes?.join(', ')}`
        : `⚠️ ${result.error || 'No changes'}`
      );
      break;
    }

    case 'delete': {
      const result = await deleteTask(identifier);
      console.log(result.action === 'deleted'
        ? `✅ Deleted ${result.jiraKey}`
        : `⚠️ ${result.error}`
      );
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(console.error);
