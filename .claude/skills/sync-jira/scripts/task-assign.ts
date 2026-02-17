#!/usr/bin/env npx tsx
/**
 * Task Assignment Operations
 *
 * Assign or unassign tasks in Jira.
 *
 * Usage:
 *   npx tsx .claude/skills/sync-jira/scripts/task-assign.ts SEO-001 "Dev A"
 *   npx tsx .claude/skills/sync-jira/scripts/task-assign.ts SEO-001 --unassign
 *   npx tsx .claude/skills/sync-jira/scripts/task-assign.ts SEO-001 --github crak-pfotiou
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
  getDeveloperAccountId,
  getDeveloperInfo,
  getDeveloperNameByGithub,
  getDeveloperNameByAccountId,
  loadConfig,
} from './lib/config.js';
import { getTaskById, updateTaskFile } from './lib/task-parser.js';
import { recordSyncComplete } from './lib/timestamp-tracker.js';
import type { DeveloperInfo } from './lib/types.js';

// =============================================================================
// Assignment Functions
// =============================================================================

/**
 * Assign a task to a developer
 */
export async function assignTask(
  identifier: string,
  assignee: string | null,
  options?: { updateLocal?: boolean; byGithub?: boolean }
): Promise<boolean> {
  // Resolve Jira key
  const isJiraKey = identifier.startsWith('CC-');
  const jiraKey = isJiraKey ? identifier : getJiraKeyForTask(identifier);
  const taskId = isJiraKey ? undefined : identifier;

  if (!jiraKey) {
    console.error(`No Jira key found for ${identifier}`);
    return false;
  }

  // Resolve assignee
  let developerName: string | null = assignee;
  let accountId: string | null = null;

  if (assignee) {
    if (options?.byGithub) {
      developerName = getDeveloperNameByGithub(assignee);
      if (!developerName) {
        console.error(`No developer found with GitHub username: ${assignee}`);
        return false;
      }
    }

    accountId = getDeveloperAccountId(developerName!);
    if (!accountId) {
      console.error(`No Jira account ID found for: ${developerName}`);
      return false;
    }
  }

  const jiraConfig = requireJiraConfig();
  const client = new JiraClient(jiraConfig);

  try {
    await client.assignIssue(jiraKey, accountId);
    console.log(`✅ ${jiraKey} assigned to ${developerName || 'unassigned'}`);

    // Update local file if requested
    if (options?.updateLocal && taskId) {
      const task = getTaskById(taskId);
      if (task) {
        updateTaskFile(taskId, { assignee: developerName || 'unassigned' });
        console.log(`   Local file updated: assignee → ${developerName || 'unassigned'}`);

        // Record sync
        const response = await client.getIssue(jiraKey, ['updated']);
        recordSyncComplete(taskId, task.fileLastModified || new Date().toISOString(), response.fields.updated);
      }
    }

    return true;
  } catch (e) {
    console.error(`❌ Failed to assign ${jiraKey}: ${e}`);
    return false;
  }
}

/**
 * Look up developer info by various identifiers
 */
export function lookupDeveloper(identifier: string): DeveloperInfo | null {
  // Try direct name lookup
  let info = getDeveloperInfo(identifier);
  if (info) return info;

  // Try by GitHub username
  const nameByGithub = getDeveloperNameByGithub(identifier);
  if (nameByGithub) {
    return getDeveloperInfo(nameByGithub);
  }

  // Try by account ID
  const nameByAccount = getDeveloperNameByAccountId(identifier);
  if (nameByAccount) {
    return getDeveloperInfo(nameByAccount);
  }

  return null;
}

/**
 * List all configured developers
 */
export function listDevelopers(): void {
  const config = loadConfig();
  const developers = config.developers || {};

  console.log('\n👥 Configured Developers\n');

  for (const [name, mapping] of Object.entries(developers)) {
    if (mapping === null) {
      console.log(`  ${name}: (unassigned marker)`);
      continue;
    }

    if (typeof mapping === 'string') {
      // Old format
      console.log(`  ${name}:`);
      console.log(`    Jira: ${mapping}`);
    } else {
      // New format
      console.log(`  ${name}:`);
      console.log(`    Jira: ${mapping.jiraAccountId}`);
      if (mapping.githubUsername) {
        console.log(`    GitHub: ${mapping.githubUsername}`);
      }
      if (mapping.aliases && mapping.aliases.length > 0) {
        console.log(`    Aliases: ${mapping.aliases.join(', ')}`);
      }
    }
    console.log();
  }
}

/**
 * Bulk assign multiple tasks
 */
export async function bulkAssign(
  identifiers: string[],
  assignee: string | null,
  options?: { updateLocal?: boolean }
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;

  for (const identifier of identifiers) {
    const result = await assignTask(identifier, assignee, options);
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

  // Special commands
  if (identifier === '--list' || identifier === '-l') {
    listDevelopers();
    return;
  }

  if (!identifier) {
    console.log(`
Usage:
  npx tsx task-assign.ts <task-id|jira-key> <assignee> [options]
  npx tsx task-assign.ts <task-id|jira-key> --unassign
  npx tsx task-assign.ts --list

Options:
  --unassign      Remove assignee
  --github        Assign by GitHub username
  --local-too     Also update local task file
  --list          List all configured developers

Examples:
  npx tsx task-assign.ts SEO-001 "Dev A"
  npx tsx task-assign.ts SEO-001 "Panagiotis Fotiou" --local-too
  npx tsx task-assign.ts SEO-001 --github crak-pfotiou
  npx tsx task-assign.ts SEO-001 --unassign
  npx tsx task-assign.ts --list
`);
    process.exit(1);
  }

  const unassign = args.includes('--unassign');
  const byGithub = args.includes('--github');
  const updateLocal = args.includes('--local-too') || args.includes('--local');

  let assignee: string | null = null;

  if (!unassign) {
    // Find assignee argument (first arg after identifier that doesn't start with --)
    for (let i = 1; i < args.length; i++) {
      if (!args[i].startsWith('--')) {
        assignee = args[i];
        break;
      }
    }

    if (!assignee) {
      console.error('Please specify an assignee or use --unassign');
      process.exit(1);
    }
  }

  await assignTask(identifier, assignee, { updateLocal, byGithub });
}

main().catch(console.error);
