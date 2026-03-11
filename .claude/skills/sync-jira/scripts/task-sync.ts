#!/usr/bin/env npx tsx
/**
 * Bidirectional Task Sync Engine
 *
 * Syncs tasks between local files and Jira with conflict detection.
 *
 * Usage:
 *   npx tsx .claude/skills/sync-jira/scripts/task-sync.ts                # Preview
 *   npx tsx .claude/skills/sync-jira/scripts/task-sync.ts --apply        # Apply sync
 *   npx tsx .claude/skills/sync-jira/scripts/task-sync.ts --push         # Force local → Jira
 *   npx tsx .claude/skills/sync-jira/scripts/task-sync.ts --pull         # Force Jira → local
 *   npx tsx .claude/skills/sync-jira/scripts/task-sync.ts --task SEO-001 # Specific task
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __scriptDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__scriptDir, '../../../../.env.local') });

import * as readline from 'readline';
import { JiraClient, toJiraTask } from './lib/jira-api.js';
import {
  requireJiraConfig,
  getJiraStatus,
  getRepoStatus,
  getDeveloperAccountId,
  getDeveloperNameByAccountId,
  isTaskDone,
} from './lib/config.js';
import { getAllTasks, getTaskById, updateTaskFile } from './lib/task-parser.js';
import {
  determineSyncDirection,
  recordSyncComplete,
  initializeTaskTimestamp,
  resolveConflictByNewer,
  getTaskTimestamp,
} from './lib/timestamp-tracker.js';
import type {
  LocalTask,
  JiraTask,
  SyncResult,
  SyncOptions,
  ConflictResolution,
  ConflictInfo,
  SyncDirection,
} from './lib/types.js';

// =============================================================================
// Sync Engine
// =============================================================================

interface SyncState {
  local: LocalTask;
  remote: JiraTask;
  direction: SyncDirection;
  conflictInfo?: ConflictInfo;
}

async function fetchRemoteTasks(
  client: JiraClient,
  localTasks: LocalTask[]
): Promise<Map<string, JiraTask>> {
  const remoteMap = new Map<string, JiraTask>();

  // Batch fetch for efficiency
  const jiraKeys = localTasks
    .filter(t => t.jiraKey)
    .map(t => t.jiraKey!);

  if (jiraKeys.length === 0) return remoteMap;

  // Fetch in batches of 50
  for (let i = 0; i < jiraKeys.length; i += 50) {
    const batch = jiraKeys.slice(i, i + 50);
    const jql = `key in (${batch.join(',')})`;

    try {
      const issues = await client.searchIssues(jql, [
        'summary', 'status', 'assignee', 'labels', 'updated', 'parent'
      ]);

      for (const issue of issues) {
        remoteMap.set(issue.key, toJiraTask(issue));
      }
    } catch (e) {
      console.error(`Failed to fetch batch: ${e}`);
    }
  }

  return remoteMap;
}

function detectChanges(local: LocalTask, remote: JiraTask): string[] {
  const changes: string[] = [];

  // Status
  const localJiraStatus = getJiraStatus(local.status);
  if (localJiraStatus.toLowerCase() !== remote.status.toLowerCase()) {
    changes.push(`status: ${local.status} ↔ ${remote.status}`);
  }

  // Assignee
  const localAccountId = local.assignee ? getDeveloperAccountId(local.assignee) : null;
  const remoteAccountId = remote.assignee?.accountId || null;
  if (localAccountId !== remoteAccountId) {
    const localName = local.assignee || 'unassigned';
    const remoteName = remote.assignee?.displayName || 'unassigned';
    changes.push(`assignee: ${localName} ↔ ${remoteName}`);
  }

  return changes;
}

function buildConflictInfo(
  local: LocalTask,
  remote: JiraTask,
  changes: string[]
): ConflictInfo {
  const fields = changes.map(change => {
    const [field] = change.split(':');
    return {
      field: field.trim(),
      localValue: field === 'status' ? local.status : local.assignee,
      remoteValue: field === 'status' ? remote.status : remote.assignee?.displayName,
    };
  });

  const stored = getTaskTimestamp(local.id);

  return {
    fields,
    localUpdated: local.fileLastModified || new Date().toISOString(),
    remoteUpdated: remote.updated,
    lastSynced: stored?.lastSynced,
  };
}

async function pushToJira(
  client: JiraClient,
  local: LocalTask,
  remote: JiraTask
): Promise<string[]> {
  const changes: string[] = [];

  // Skip "done" status - use verify-done instead
  if (!isTaskDone(local.id)) {
    // Transition status
    const localJiraStatus = getJiraStatus(local.status);
    if (localJiraStatus.toLowerCase() !== remote.status.toLowerCase()) {
      const transitioned = await client.transitionTo(remote.key, localJiraStatus);
      if (transitioned) {
        changes.push(`status → ${localJiraStatus}`);
      }
    }
  }

  // Update assignee
  const localAccountId = local.assignee ? getDeveloperAccountId(local.assignee) : null;
  const remoteAccountId = remote.assignee?.accountId || null;
  if (localAccountId !== remoteAccountId) {
    await client.assignIssue(remote.key, localAccountId);
    changes.push(`assignee → ${local.assignee || 'unassigned'}`);
  }

  // Update labels for blocked status
  if (local.status === 'blocked') {
    await client.updateLabels(remote.key, ['Blocked'], []);
    changes.push('+label: Blocked');
  } else if (remote.labels.includes('Blocked')) {
    await client.updateLabels(remote.key, [], ['Blocked']);
    changes.push('-label: Blocked');
  }

  return changes;
}

async function pullToLocal(
  remote: JiraTask,
  taskId: string
): Promise<string[]> {
  const changes: string[] = [];

  // Update status
  const localStatus = getRepoStatus(remote.status);
  updateTaskFile(taskId, { status: localStatus as LocalTask['status'] });
  changes.push(`status → ${localStatus}`);

  // Update assignee
  if (remote.assignee) {
    const localName = getDeveloperNameByAccountId(remote.assignee.accountId);
    if (localName) {
      updateTaskFile(taskId, { assignee: localName });
      changes.push(`assignee → ${localName}`);
    }
  } else {
    updateTaskFile(taskId, { assignee: 'unassigned' });
    changes.push('assignee → unassigned');
  }

  return changes;
}

// =============================================================================
// Main Sync Function
// =============================================================================

export async function syncTasks(options: SyncOptions): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  const jiraConfig = requireJiraConfig();
  const client = new JiraClient(jiraConfig);

  // Get local tasks
  let localTasks = Array.from(getAllTasks().values());

  // Filter by specific task
  if (options.taskId) {
    const task = getTaskById(options.taskId);
    if (!task) {
      console.error(`Task ${options.taskId} not found`);
      return results;
    }
    localTasks = [task];
  }

  // Filter to only tasks with Jira keys
  localTasks = localTasks.filter(t => t.jiraKey);

  if (localTasks.length === 0) {
    console.log('No tasks with Jira keys to sync');
    return results;
  }

  console.log(`\n🔄 Syncing ${localTasks.length} task(s)...\n`);

  // Fetch remote state
  const remoteMap = await fetchRemoteTasks(client, localTasks);

  // Analyze each task
  const syncStates: SyncState[] = [];
  const conflicts: SyncState[] = [];

  for (const local of localTasks) {
    const remote = remoteMap.get(local.jiraKey!);
    if (!remote) {
      console.warn(`  ⚠️ ${local.id}: Jira issue ${local.jiraKey} not found`);
      continue;
    }

    // Determine sync direction
    let direction: SyncDirection;
    if (options.direction === 'push') {
      direction = 'push';
    } else if (options.direction === 'pull') {
      direction = 'pull';
    } else {
      direction = determineSyncDirection(
        local.id,
        local.fileLastModified || new Date().toISOString(),
        remote.updated
      );
    }

    const changes = detectChanges(local, remote);

    // No changes needed
    if (changes.length === 0) {
      direction = 'none';
    }

    const state: SyncState = { local, remote, direction };

    if (direction === 'conflict') {
      state.conflictInfo = buildConflictInfo(local, remote, changes);
      conflicts.push(state);
    }

    syncStates.push(state);
  }

  // Handle conflicts
  if (conflicts.length > 0 && options.apply) {
    await handleConflicts(conflicts, options.resolveConflicts || 'prompt');
  }

  // Preview or apply
  for (const state of syncStates) {
    const { local, remote, direction, conflictInfo } = state;

    if (direction === 'none') {
      if (!options.taskId) continue; // Skip no-change in bulk mode
      results.push({
        taskId: local.id,
        jiraKey: local.jiraKey!,
        action: 'skipped',
        direction: 'none',
        changes: ['Already in sync'],
      });
      continue;
    }

    if (direction === 'conflict' && !options.apply) {
      console.log(`  ⚠️ [${local.id}] ${local.jiraKey}: CONFLICT`);
      if (conflictInfo) {
        for (const field of conflictInfo.fields) {
          console.log(`      ${field.field}: ${field.localValue} ↔ ${field.remoteValue}`);
        }
      }
      results.push({
        taskId: local.id,
        jiraKey: local.jiraKey!,
        action: 'conflict',
        direction: 'conflict',
        conflictInfo,
      });
      continue;
    }

    // Determine resolved direction for conflicts
    let resolvedDirection = direction;
    if (direction === 'conflict' && state.conflictInfo) {
      // Direction was resolved in handleConflicts
      resolvedDirection = state.direction;
    }

    if (!options.apply) {
      // Preview mode
      const arrow = resolvedDirection === 'push' ? '→' : '←';
      console.log(`  [${local.id}] ${local.jiraKey}: ${arrow} ${resolvedDirection.toUpperCase()}`);
      results.push({
        taskId: local.id,
        jiraKey: local.jiraKey!,
        action: 'skipped',
        direction: resolvedDirection,
        changes: detectChanges(local, remote),
      });
      continue;
    }

    // Apply sync
    try {
      let changes: string[] = [];

      if (resolvedDirection === 'push') {
        changes = await pushToJira(client, local, remote);
      } else if (resolvedDirection === 'pull') {
        changes = await pullToLocal(remote, local.id);
      }

      // Record sync completion
      const updatedRemote = await client.getIssue(local.jiraKey!, ['updated']);
      const updatedLocal = getTaskById(local.id);
      recordSyncComplete(
        local.id,
        updatedLocal?.fileLastModified || new Date().toISOString(),
        updatedRemote.fields.updated
      );

      if (changes.length > 0) {
        console.log(`  ✅ [${local.id}] ${local.jiraKey}: ${changes.join(', ')}`);
      }

      results.push({
        taskId: local.id,
        jiraKey: local.jiraKey!,
        action: changes.length > 0 ? 'updated' : 'skipped',
        direction: resolvedDirection,
        changes,
      });
    } catch (e) {
      console.error(`  ❌ [${local.id}] ${local.jiraKey}: ${e}`);
      results.push({
        taskId: local.id,
        jiraKey: local.jiraKey!,
        action: 'skipped',
        direction: resolvedDirection,
        error: `${e}`,
      });
    }
  }

  // Summary
  const updated = results.filter(r => r.action === 'updated').length;
  const skipped = results.filter(r => r.action === 'skipped').length;
  const conflicted = results.filter(r => r.action === 'conflict').length;

  console.log(`\n📊 Summary: ${updated} updated, ${skipped} skipped, ${conflicted} conflicts\n`);

  return results;
}

// =============================================================================
// Conflict Resolution
// =============================================================================

async function handleConflicts(
  conflicts: SyncState[],
  resolution: ConflictResolution
): Promise<void> {
  for (const state of conflicts) {
    if (resolution === 'skip') {
      state.direction = 'none';
      continue;
    }

    if (resolution === 'local') {
      state.direction = 'push';
      continue;
    }

    if (resolution === 'remote') {
      state.direction = 'pull';
      continue;
    }

    if (resolution === 'newer') {
      state.direction = resolveConflictByNewer(
        state.conflictInfo!.localUpdated,
        state.conflictInfo!.remoteUpdated
      );
      continue;
    }

    if (resolution === 'prompt') {
      state.direction = await promptForResolution(state);
    }
  }
}

async function promptForResolution(state: SyncState): Promise<SyncDirection> {
  const { local, conflictInfo } = state;

  console.log(`\n⚠️ Conflict for ${local.id} (${local.jiraKey}):`);
  console.log('┌────────────┬────────────────────┬────────────────────┐');
  console.log('│ Field      │ Local              │ Remote             │');
  console.log('├────────────┼────────────────────┼────────────────────┤');

  for (const field of conflictInfo!.fields) {
    const localVal = String(field.localValue || '').slice(0, 18).padEnd(18);
    const remoteVal = String(field.remoteValue || '').slice(0, 18).padEnd(18);
    console.log(`│ ${field.field.padEnd(10)} │ ${localVal} │ ${remoteVal} │`);
  }

  console.log('└────────────┴────────────────────┴────────────────────┘');
  console.log(`  Local updated:  ${conflictInfo!.localUpdated}`);
  console.log(`  Remote updated: ${conflictInfo!.remoteUpdated}`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question('\n[L]ocal / [R]emote / [S]kip ? ', answer => {
      rl.close();
      const choice = answer.toLowerCase().trim();
      if (choice === 'l' || choice === 'local') {
        resolve('push');
      } else if (choice === 'r' || choice === 'remote') {
        resolve('pull');
      } else {
        resolve('none');
      }
    });
  });
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  const options: SyncOptions = {
    apply: args.includes('--apply'),
    direction: args.includes('--push') ? 'push' : args.includes('--pull') ? 'pull' : 'auto',
    resolveConflicts: 'prompt',
  };

  // Task filter
  const taskArg = args.find(a => a.startsWith('--task=') || a.startsWith('--task '));
  if (taskArg) {
    options.taskId = taskArg.split('=')[1] || args[args.indexOf('--task') + 1];
  } else {
    const taskIdx = args.indexOf('--task');
    if (taskIdx !== -1 && args[taskIdx + 1]) {
      options.taskId = args[taskIdx + 1];
    }
  }

  // Conflict resolution
  const resolveArg = args.find(a => a.startsWith('--resolve='));
  if (resolveArg) {
    options.resolveConflicts = resolveArg.split('=')[1] as ConflictResolution;
  }

  if (args.includes('--force')) {
    options.resolveConflicts = options.direction === 'push' ? 'local' : 'remote';
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  npx tsx task-sync.ts [options]

Options:
  --apply              Apply changes (default is preview mode)
  --push               Force sync local → Jira
  --pull               Force sync Jira → local
  --task <id>          Sync specific task only
  --resolve=<mode>     Conflict resolution: local, remote, prompt, newer, skip
  --force              Same as --resolve=local for push, --resolve=remote for pull

Examples:
  npx tsx task-sync.ts                          # Preview bidirectional sync
  npx tsx task-sync.ts --apply                  # Apply bidirectional sync
  npx tsx task-sync.ts --push --apply           # Force push all to Jira
  npx tsx task-sync.ts --pull --apply           # Force pull all from Jira
  npx tsx task-sync.ts --task SEO-001 --apply   # Sync specific task
  npx tsx task-sync.ts --apply --resolve=newer  # Auto-resolve conflicts by timestamp
`);
    process.exit(0);
  }

  await syncTasks(options);

  if (!options.apply) {
    console.log('💡 Use --apply to apply these changes\n');
  }
}

// Only run if executed directly (not imported)
const isMainModule = process.argv[1]?.includes('task-sync');
if (isMainModule) {
  main().catch(console.error);
}
