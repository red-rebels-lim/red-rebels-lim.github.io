#!/usr/bin/env npx tsx
/**
 * Rich Description Sync
 *
 * Syncs rich task descriptions (Summary, Requirements, Acceptance Criteria,
 * Technical Notes) from local markdown files to Jira.
 *
 * Usage:
 *   npx tsx .claude/skills/sync-jira/scripts/description-sync.ts --preview
 *   npx tsx .claude/skills/sync-jira/scripts/description-sync.ts --apply
 *   npx tsx .claude/skills/sync-jira/scripts/description-sync.ts --task SEO-001 --apply
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __scriptDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__scriptDir, '../../../../.env.local') });

import { JiraClient } from './lib/jira-api.js';
import { requireJiraConfig } from './lib/config.js';
import { getAllTasks, getTaskById } from './lib/task-parser.js';
import { taskToAdf } from './lib/adf-converter.js';
import { recordSyncComplete } from './lib/timestamp-tracker.js';
import type { LocalTask, SyncResult } from './lib/types.js';

// =============================================================================
// Description Sync
// =============================================================================

interface DescSyncOptions {
  apply: boolean;
  taskId?: string;
  epicCode?: string;
}

export async function syncDescriptions(options: DescSyncOptions): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  const jiraConfig = requireJiraConfig();
  const client = new JiraClient(jiraConfig);

  // Get tasks to sync
  let tasks: LocalTask[];

  if (options.taskId) {
    const task = getTaskById(options.taskId);
    if (!task) {
      console.error(`Task ${options.taskId} not found`);
      return results;
    }
    tasks = [task];
  } else {
    tasks = Array.from(getAllTasks().values());
  }

  // Filter by epic if specified
  if (options.epicCode) {
    tasks = tasks.filter(t => t.epicCode === options.epicCode);
  }

  // Filter to tasks with Jira keys and rich content
  tasks = tasks.filter(t =>
    t.jiraKey &&
    (t.summary || t.requirements?.length || t.acceptanceCriteria?.length || t.technicalNotes)
  );

  if (tasks.length === 0) {
    console.log('No tasks with rich descriptions to sync');
    return results;
  }

  console.log(`\n📝 Syncing descriptions for ${tasks.length} task(s)...\n`);

  for (const task of tasks) {
    const hasContent = {
      summary: !!task.summary,
      requirements: (task.requirements?.length || 0) > 0,
      acceptance: (task.acceptanceCriteria?.length || 0) > 0,
      technical: !!task.technicalNotes,
    };

    const sections = [
      hasContent.summary && 'Summary',
      hasContent.requirements && 'Requirements',
      hasContent.acceptance && 'Acceptance Criteria',
      hasContent.technical && 'Technical Notes',
    ].filter(Boolean);

    if (!options.apply) {
      console.log(`  [${task.id}] ${task.jiraKey}: ${sections.join(', ')}`);
      results.push({
        taskId: task.id,
        jiraKey: task.jiraKey!,
        action: 'skipped',
        direction: 'push',
        changes: sections.map(s => `Would sync: ${s}`),
      });
      continue;
    }

    try {
      const description = taskToAdf(task);
      await client.updateIssue(task.jiraKey!, {
        fields: { description },
      });

      // Record sync
      const response = await client.getIssue(task.jiraKey!, ['updated']);
      recordSyncComplete(task.id, task.fileLastModified || new Date().toISOString(), response.fields.updated);

      console.log(`  ✅ [${task.id}] ${task.jiraKey}: ${sections.join(', ')}`);
      results.push({
        taskId: task.id,
        jiraKey: task.jiraKey!,
        action: 'updated',
        direction: 'push',
        changes: sections.map(s => `Synced: ${s}`),
      });
    } catch (e) {
      console.error(`  ❌ [${task.id}] ${task.jiraKey}: ${e}`);
      results.push({
        taskId: task.id,
        jiraKey: task.jiraKey!,
        action: 'skipped',
        direction: 'push',
        error: `${e}`,
      });
    }
  }

  // Summary
  const updated = results.filter(r => r.action === 'updated').length;
  const failed = results.filter(r => r.error).length;

  console.log(`\n📊 Summary: ${updated} updated, ${failed} failed\n`);

  return results;
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  const options: DescSyncOptions = {
    apply: args.includes('--apply'),
  };

  // Task filter
  const taskArg = args.find(a => a.startsWith('--task='));
  if (taskArg) {
    options.taskId = taskArg.split('=')[1];
  } else {
    const taskIdx = args.indexOf('--task');
    if (taskIdx !== -1 && args[taskIdx + 1]) {
      options.taskId = args[taskIdx + 1];
    }
  }

  // Epic filter
  const epicArg = args.find(a => a.startsWith('--epic='));
  if (epicArg) {
    options.epicCode = epicArg.split('=')[1];
  } else {
    const epicIdx = args.indexOf('--epic');
    if (epicIdx !== -1 && args[epicIdx + 1]) {
      options.epicCode = args[epicIdx + 1];
    }
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  npx tsx description-sync.ts [options]

Options:
  --apply           Apply changes (default is preview mode)
  --task <id>       Sync specific task only
  --epic <code>     Sync tasks in specific epic only

What gets synced:
  - Summary section → First paragraph
  - Requirements → Bullet list
  - Acceptance Criteria → Task list (checkboxes)
  - Technical Notes → Code blocks preserved

Examples:
  npx tsx description-sync.ts                    # Preview all
  npx tsx description-sync.ts --apply            # Sync all descriptions
  npx tsx description-sync.ts --task SEO-001 --apply  # Sync specific task
  npx tsx description-sync.ts --epic SEO --apply      # Sync all SEO tasks
`);
    process.exit(0);
  }

  await syncDescriptions(options);

  if (!options.apply) {
    console.log('💡 Use --apply to sync these descriptions\n');
  }
}

// Only run if executed directly (not imported)
const isMainModule = process.argv[1]?.includes('description-sync');
if (isMainModule) {
  main().catch(console.error);
}
