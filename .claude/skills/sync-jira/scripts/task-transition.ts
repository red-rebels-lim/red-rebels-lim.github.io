#!/usr/bin/env npx tsx
/**
 * Task Status Transitions
 *
 * Transition tasks to different statuses in Jira.
 *
 * Usage:
 *   npx tsx .claude/skills/sync-jira/scripts/task-transition.ts SEO-001 "In Progress"
 *   npx tsx .claude/skills/sync-jira/scripts/task-transition.ts SEO-001 Done --local-too
 *   npx tsx .claude/skills/sync-jira/scripts/task-transition.ts CC-106 "To Do"
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __scriptDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__scriptDir, '../../../../.env.local') });

import { JiraClient } from './lib/jira-api.js';
import {
  requireJiraConfig,
  getJiraKeyForTask,
  getRepoStatus,
} from './lib/config.js';
import { getTaskById, updateTaskFile } from './lib/task-parser.js';
import { recordSyncComplete } from './lib/timestamp-tracker.js';

// =============================================================================
// Transition Functions
// =============================================================================

/**
 * Get available transitions for a task
 */
export async function getAvailableTransitions(identifier: string): Promise<string[]> {
  const jiraKey = identifier.startsWith('CC-') ? identifier : getJiraKeyForTask(identifier);
  if (!jiraKey) {
    console.error(`No Jira key found for ${identifier}`);
    return [];
  }

  const jiraConfig = requireJiraConfig();
  const client = new JiraClient(jiraConfig);

  const transitions = await client.getTransitions(jiraKey);
  return transitions.map(t => t.to.name);
}

/**
 * Transition a task to a target status
 */
export async function transitionTask(
  identifier: string,
  targetStatus: string,
  options?: { updateLocal?: boolean }
): Promise<boolean> {
  // Resolve Jira key
  const isJiraKey = identifier.startsWith('CC-');
  const jiraKey = isJiraKey ? identifier : getJiraKeyForTask(identifier);
  const taskId = isJiraKey ? undefined : identifier;

  if (!jiraKey) {
    console.error(`No Jira key found for ${identifier}`);
    return false;
  }

  const jiraConfig = requireJiraConfig();
  const client = new JiraClient(jiraConfig);

  try {
    const transitioned = await client.transitionTo(jiraKey, targetStatus);

    if (transitioned) {
      console.log(`✅ ${jiraKey} → ${targetStatus}`);

      // Update local file if requested
      if (options?.updateLocal && taskId) {
        const task = getTaskById(taskId);
        if (task) {
          const localStatus = getRepoStatus(targetStatus);
          updateTaskFile(taskId, { status: localStatus as any });
          console.log(`   Local file updated: status → ${localStatus}`);

          // Record sync
          const response = await client.getIssue(jiraKey, ['updated']);
          recordSyncComplete(taskId, task.fileLastModified || new Date().toISOString(), response.fields.updated);
        }
      }

      return true;
    } else {
      console.log(`ℹ️ ${jiraKey} is already at ${targetStatus} (or transition not available)`);
      return true;
    }
  } catch (e) {
    console.error(`❌ Failed to transition ${jiraKey}: ${e}`);
    return false;
  }
}

/**
 * Bulk transition multiple tasks
 */
export async function bulkTransition(
  identifiers: string[],
  targetStatus: string,
  options?: { updateLocal?: boolean }
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;

  for (const identifier of identifiers) {
    const result = await transitionTask(identifier, targetStatus, options);
    if (result) {
      succeeded++;
    } else {
      failed++;
    }
  }

  return { succeeded, failed };
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const identifier = args[0];
  const targetStatus = args[1];
  const updateLocal = args.includes('--local-too') || args.includes('--local');

  if (!identifier) {
    console.log(`
Usage:
  npx tsx task-transition.ts <task-id|jira-key> <status> [options]
  npx tsx task-transition.ts <task-id|jira-key> --list

Options:
  --local-too   Also update local task file status
  --list        List available transitions

Examples:
  npx tsx task-transition.ts SEO-001 "In Progress"
  npx tsx task-transition.ts SEO-001 Done --local-too
  npx tsx task-transition.ts CC-106 "To Do"
  npx tsx task-transition.ts SEO-001 --list
`);
    process.exit(1);
  }

  // List available transitions
  if (args.includes('--list') || !targetStatus) {
    const transitions = await getAvailableTransitions(identifier);
    console.log(`\nAvailable transitions for ${identifier}:`);
    for (const t of transitions) {
      console.log(`  • ${t}`);
    }
    return;
  }

  // Perform transition
  await transitionTask(identifier, targetStatus, { updateLocal });
}

main().catch(console.error);
