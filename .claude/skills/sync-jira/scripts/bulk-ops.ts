#!/usr/bin/env npx tsx
/**
 * Bulk Operations
 *
 * Batch operations for tasks: create all, verify done, export.
 *
 * Usage:
 *   npx tsx .claude/skills/sync-jira/scripts/bulk-ops.ts create-all-tasks
 *   npx tsx .claude/skills/sync-jira/scripts/bulk-ops.ts verify-done
 *   npx tsx .claude/skills/sync-jira/scripts/bulk-ops.ts export-csv
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __scriptDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__scriptDir, '../../../../.env.local') });

import * as fs from 'fs';
import { JiraClient, toJiraTask } from './lib/jira-api.js';
import {
  requireJiraConfig,
  getProjectKey,
  getDeveloperAccountId,
  getJiraKeyForTask,
  updateTaskMapping,
  getEpicForRepoCode,
  getDoneTasks,
  getTaskMappings,
  loadConfig,
} from './lib/config.js';
import { getAllTasks, updateTaskFile, getAllEpics } from './lib/task-parser.js';
import { taskToAdf } from './lib/adf-converter.js';
import { recordSyncComplete, initializeAllTimestamps } from './lib/timestamp-tracker.js';
import type { LocalTask, SyncResult } from './lib/types.js';

// =============================================================================
// Create All Missing Tasks
// =============================================================================

export async function createAllMissingTasks(apply: boolean): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  const allTasks = getAllTasks();

  // Find tasks without Jira keys
  const tasksToCreate: LocalTask[] = [];
  for (const task of allTasks.values()) {
    if (!task.jiraKey && !getJiraKeyForTask(task.id)) {
      tasksToCreate.push(task);
    }
  }

  if (tasksToCreate.length === 0) {
    console.log('\n📋 All tasks already have Jira keys\n');
    return results;
  }

  // Group by epic
  const byEpic = new Map<string, LocalTask[]>();
  for (const task of tasksToCreate) {
    const epicMapping = getEpicForRepoCode(task.epicCode);
    if (!epicMapping) {
      console.warn(`  ⚠️ No epic mapping for ${task.epicCode}, skipping ${task.id}`);
      continue;
    }

    const key = epicMapping.jiraKey;
    if (!byEpic.has(key)) {
      byEpic.set(key, []);
    }
    byEpic.get(key)!.push(task);
  }

  console.log(`\n📋 Found ${tasksToCreate.length} task(s) without Jira keys\n`);

  if (!apply) {
    for (const [epicKey, tasks] of byEpic) {
      const epicMapping = loadConfig().mapping.find(m => m.jiraKey === epicKey);
      console.log(`\n  ${epicKey} (${epicMapping?.jiraName || 'Unknown'}):`);
      for (const task of tasks) {
        console.log(`    • [${task.id}] ${task.title.slice(0, 50)}`);
      }
    }
    console.log('\n💡 Use --apply to create these in Jira\n');
    return results;
  }

  const jiraConfig = requireJiraConfig();
  const client = new JiraClient(jiraConfig);
  const projectKey = getProjectKey();

  for (const [epicKey, tasks] of byEpic) {
    const epicMapping = loadConfig().mapping.find(m => m.jiraKey === epicKey);
    console.log(`\n  ${epicKey} (${epicMapping?.jiraName || 'Unknown'}):`);

    for (const task of tasks) {
      process.stdout.write(`    Creating [${task.id}]... `);

      try {
        const description = taskToAdf(task);
        const accountId = task.assignee ? getDeveloperAccountId(task.assignee) : null;

        const result = await client.createIssue({
          project: { key: projectKey },
          summary: `[${task.id}] ${task.title}`,
          issuetype: { name: 'Story' },
          description,
          parent: { key: epicKey },
          assignee: accountId ? { accountId } : undefined,
          customfield_10016: task.estimate,
        });

        updateTaskFile(task.id, { jiraKey: result.key });
        updateTaskMapping(task.id, result.key);

        console.log(`✅ ${result.key}`);
        results.push({
          taskId: task.id,
          jiraKey: result.key,
          action: 'created',
          direction: 'push',
        });
      } catch (e) {
        console.log(`❌ ${e}`);
        results.push({
          taskId: task.id,
          action: 'skipped',
          direction: 'none',
          error: `${e}`,
        });
      }
    }
  }

  const created = results.filter(r => r.action === 'created').length;
  const failed = results.filter(r => r.action === 'skipped').length;
  console.log(`\n📊 Summary: ${created} created, ${failed} failed\n`);

  return results;
}

// =============================================================================
// Verify Done Consistency
// =============================================================================

export async function verifyDoneConsistency(): Promise<void> {
  console.log('\n🔍 Verifying "done" status consistency...\n');

  const jiraConfig = requireJiraConfig();
  const client = new JiraClient(jiraConfig);
  const doneTasks = getDoneTasks();
  const taskMappings = getTaskMappings();
  const allTasks = getAllTasks();

  // Get tasks with Jira keys
  const tasksWithJira: Array<{ id: string; jiraKey: string }> = [];
  for (const task of allTasks.values()) {
    const jiraKey = task.jiraKey || taskMappings[task.id];
    if (jiraKey) {
      tasksWithJira.push({ id: task.id, jiraKey });
    }
  }

  if (tasksWithJira.length === 0) {
    console.log('No tasks with Jira keys to verify\n');
    return;
  }

  console.log(`Checking ${tasksWithJira.length} task(s)...\n`);

  const doneInRepoNotJira: typeof tasksWithJira = [];
  const doneInJiraNotRepo: Array<{ id: string; jiraKey: string; status: string }> = [];
  let consistent = 0;
  let errors = 0;

  // Batch fetch with pagination to get all results
  const jiraKeys = tasksWithJira.map(t => t.jiraKey);
  const jql = `key in (${jiraKeys.join(',')})`;
  const statusMap = new Map<string, string>();
  let nextPageToken: string | undefined;
  do {
    const page = await client.searchIssuesPaginated(jql, ['status'], 100, nextPageToken);
    for (const issue of page.issues) {
      statusMap.set(issue.key, issue.fields.status.name);
    }
    nextPageToken = page.isLast ? undefined : page.nextPageToken;
  } while (nextPageToken);

  for (const { id, jiraKey } of tasksWithJira) {
    const isRepoDone = doneTasks.has(id);
    const jiraStatus = statusMap.get(jiraKey);

    if (!jiraStatus) {
      errors++;
      continue;
    }

    const isJiraDone = jiraStatus.toLowerCase() === 'done';

    if (isRepoDone && !isJiraDone) {
      doneInRepoNotJira.push({ id, jiraKey });
    } else if (!isRepoDone && isJiraDone) {
      doneInJiraNotRepo.push({ id, jiraKey, status: jiraStatus });
    } else {
      consistent++;
    }
  }

  // Report
  if (doneInRepoNotJira.length > 0) {
    console.log('⚠️  Done in repo (.done) but NOT Done in Jira:');
    console.log('   Transition these to "Done" in Jira:\n');
    for (const { id, jiraKey } of doneInRepoNotJira) {
      console.log(`   • [${id}] ${jiraKey}`);
    }
    console.log();
  }

  if (doneInJiraNotRepo.length > 0) {
    console.log('⚠️  Done in Jira but NOT in repo (.done):');
    console.log('   Add these to .tasks/.done:\n');
    for (const { id, jiraKey, status } of doneInJiraNotRepo) {
      console.log(`   • [${id}] ${jiraKey} (${status})`);
    }
    console.log();
  }

  console.log('─'.repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ Consistent: ${consistent}`);
  console.log(`   ⚠️  Done in repo, not Jira: ${doneInRepoNotJira.length}`);
  console.log(`   ⚠️  Done in Jira, not repo: ${doneInJiraNotRepo.length}`);
  if (errors > 0) {
    console.log(`   ❌ Errors: ${errors}`);
  }

  if (doneInRepoNotJira.length === 0 && doneInJiraNotRepo.length === 0) {
    console.log('\n✅ All tasks are consistent!\n');
  } else {
    console.log('\n💡 Actions:');
    if (doneInRepoNotJira.length > 0) {
      console.log('   1. Transition listed Jira issues to "Done"');
    }
    if (doneInJiraNotRepo.length > 0) {
      console.log('   2. Add listed task IDs to .tasks/.done');
    }
    console.log();
  }
}

// =============================================================================
// Initialize Timestamps
// =============================================================================

export async function initTimestamps(): Promise<void> {
  console.log('\n🕐 Initializing timestamp tracking...\n');

  const jiraConfig = requireJiraConfig();
  const client = new JiraClient(jiraConfig);
  const allTasks = getAllTasks();
  const taskMappings = getTaskMappings();

  const tasksToInit: Array<{ taskId: string; localUpdated: string; remoteUpdated: string }> = [];

  // Get tasks with Jira keys
  const tasksWithJira: LocalTask[] = [];
  for (const task of allTasks.values()) {
    if (task.jiraKey || taskMappings[task.id]) {
      tasksWithJira.push(task);
    }
  }

  if (tasksWithJira.length === 0) {
    console.log('No tasks with Jira keys to initialize\n');
    return;
  }

  // Batch fetch remote timestamps with pagination
  const jiraKeys = tasksWithJira.map(t => t.jiraKey || taskMappings[t.id]);
  const jql = `key in (${jiraKeys.join(',')})`;
  const remoteMap = new Map<string, string>();
  let nextPageToken: string | undefined;
  do {
    const page = await client.searchIssuesPaginated(jql, ['updated'], 100, nextPageToken);
    for (const issue of page.issues) {
      remoteMap.set(issue.key, issue.fields.updated);
    }
    nextPageToken = page.isLast ? undefined : page.nextPageToken;
  } while (nextPageToken);

  for (const task of tasksWithJira) {
    const jiraKey = task.jiraKey || taskMappings[task.id];
    const remoteUpdated = remoteMap.get(jiraKey);
    if (remoteUpdated) {
      tasksToInit.push({
        taskId: task.id,
        localUpdated: task.fileLastModified || new Date().toISOString(),
        remoteUpdated,
      });
    }
  }

  initializeAllTimestamps(tasksToInit);
  console.log(`✅ Initialized timestamps for ${tasksToInit.length} task(s)\n`);
}

// =============================================================================
// Export to CSV
// =============================================================================

export async function exportToCsv(outputPath: string): Promise<void> {
  const allTasks = getAllTasks();
  const taskMappings = getTaskMappings();

  const rows: string[] = [
    'Task ID,Title,Status,Assignee,Estimate,Epic,Jira Key',
  ];

  for (const task of allTasks.values()) {
    const jiraKey = task.jiraKey || taskMappings[task.id] || '';
    const row = [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      task.status,
      task.assignee || '',
      task.estimate?.toString() || '',
      task.epicCode,
      jiraKey,
    ].join(',');
    rows.push(row);
  }

  fs.writeFileSync(outputPath, rows.join('\n'));
  console.log(`\n✅ Exported ${allTasks.size} tasks to ${outputPath}\n`);
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const apply = args.includes('--apply');

  if (!command) {
    console.log(`
Usage:
  npx tsx bulk-ops.ts <command> [options]

Commands:
  create-all-tasks     Create Jira stories for all tasks without Jira keys
  verify-done          Check "done" status consistency between repo and Jira
  init-timestamps      Initialize timestamp tracking for bidirectional sync
  export-csv <file>    Export all tasks to CSV

Options:
  --apply              Apply changes (for create-all-tasks)

Examples:
  npx tsx bulk-ops.ts create-all-tasks           # Preview
  npx tsx bulk-ops.ts create-all-tasks --apply   # Create in Jira
  npx tsx bulk-ops.ts verify-done
  npx tsx bulk-ops.ts init-timestamps
  npx tsx bulk-ops.ts export-csv tasks.csv
`);
    process.exit(1);
  }

  switch (command) {
    case 'create-all-tasks':
      await createAllMissingTasks(apply);
      break;

    case 'verify-done':
      await verifyDoneConsistency();
      break;

    case 'init-timestamps':
      await initTimestamps();
      break;

    case 'export-csv':
      const outputPath = args[1] || 'tasks.csv';
      await exportToCsv(outputPath);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

// Only run if executed directly (not imported)
const isMainModule = process.argv[1]?.includes('bulk-ops');
if (isMainModule) {
  main().catch(console.error);
}
