#!/usr/bin/env npx tsx
/**
 * Jira Sync CLI Entry Point
 *
 * Unified interface for all sync-jira skill operations.
 *
 * Usage:
 *   npx tsx .claude/skills/sync-jira/scripts/index.ts [command] [options]
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __scriptDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__scriptDir, '../../../../.env.local') });

import { syncTasks } from './task-sync.js';
import { syncDescriptions } from './description-sync.js';
import { syncEpics } from './epic-sync.js';
import { createAllMissingTasks, verifyDoneConsistency, initTimestamps } from './bulk-ops.js';
import { auditDescriptions, printAuditReport } from './audit.js';
import type { SyncOptions, ConflictResolution } from './lib/types.js';

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Handle help first
  if (command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return;
  }

  // Default command is bidirectional sync (no command or options only)
  if (!command || command.startsWith('--')) {
    const options = parseOptions(args);
    await syncTasks(options);
    if (!options.apply) {
      console.log('💡 Use --apply to apply these changes\n');
    }
    return;
  }

  // Dispatch to specific commands
  switch (command) {
    case 'sync':
      await syncTasks(parseOptions(args.slice(1)));
      break;

    case 'push':
      await syncTasks({ ...parseOptions(args.slice(1)), direction: 'push' });
      break;

    case 'pull':
      await syncTasks({ ...parseOptions(args.slice(1)), direction: 'pull' });
      break;

    case 'descriptions':
    case 'desc':
      await syncDescriptions({
        apply: args.includes('--apply'),
        taskId: getArgValue(args, '--task'),
        epicCode: getArgValue(args, '--epic'),
      });
      break;

    case 'epics':
    case 'sync-epics':
      await syncEpics({
        apply: args.includes('--apply'),
        epicCode: getArgValue(args, '--epic'),
      });
      break;

    case 'create':
    case 'create-tasks':
      await createAllMissingTasks(args.includes('--apply'));
      break;

    case 'verify-done':
    case 'verify':
      await verifyDoneConsistency();
      break;

    case 'init':
    case 'init-timestamps':
      await initTimestamps();
      break;

    case 'audit':
      const auditResults = await auditDescriptions({ verbose: args.includes('--verbose') || args.includes('-v') });
      printAuditReport(auditResults, args.includes('--verbose') || args.includes('-v'));
      break;

    case 'audit-tasks':
      // Delegate to audit-tasks.ts script
      const { execSync } = await import('child_process');
      const auditArgs = args.slice(1).join(' ');
      execSync(`npx tsx ${import.meta.dirname}/audit-tasks.ts ${auditArgs}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run with --help for usage information');
      process.exit(1);
  }
}

function parseOptions(args: string[]): SyncOptions {
  const options: SyncOptions = {
    apply: args.includes('--apply'),
    direction: 'auto',
    resolveConflicts: 'prompt',
  };

  if (args.includes('--push')) options.direction = 'push';
  if (args.includes('--pull')) options.direction = 'pull';

  const taskId = getArgValue(args, '--task');
  if (taskId) options.taskId = taskId;

  const resolve = getArgValue(args, '--resolve');
  if (resolve) options.resolveConflicts = resolve as ConflictResolution;

  if (args.includes('--force')) {
    options.resolveConflicts = options.direction === 'push' ? 'local' : 'remote';
  }

  return options;
}

function getArgValue(args: string[], flag: string): string | undefined {
  // Check for --flag=value
  const eqArg = args.find(a => a.startsWith(`${flag}=`));
  if (eqArg) return eqArg.split('=')[1];

  // Check for --flag value
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
    return args[idx + 1];
  }

  return undefined;
}

function printHelp() {
  console.log(`
Jira Sync - Bidirectional Task Synchronization

Usage:
  npx tsx index.ts [command] [options]

Commands:
  (none)              Bidirectional sync (default)
  sync                Same as default
  push                Force sync local → Jira
  pull                Force sync Jira → local
  descriptions        Sync rich descriptions to Jira
  epics               Sync epic descriptions with progress to Jira
  audit               Compare local vs Jira descriptions
  audit-tasks         Audit task status/assignee vs git history
  create-tasks        Create Jira stories for unmapped tasks
  verify-done         Check "done" status consistency
  init-timestamps     Initialize timestamp tracking

Options:
  --apply             Apply changes (default is preview mode)
  --task <id>         Sync specific task only (e.g., --task SEO-001)
  --epic <code>       Filter by epic (for descriptions)
  --resolve=<mode>    Conflict resolution: local, remote, prompt, newer, skip
  --force             Auto-resolve conflicts (local for push, remote for pull)

Examples:
  # Preview bidirectional sync
  npx tsx index.ts

  # Apply bidirectional sync with interactive conflict resolution
  npx tsx index.ts --apply

  # Force push local changes to Jira
  npx tsx index.ts push --apply

  # Force pull Jira changes to local
  npx tsx index.ts pull --apply

  # Sync specific task
  npx tsx index.ts --task SEO-001 --apply

  # Sync all descriptions to Jira
  npx tsx index.ts descriptions --apply

  # Create Jira stories for all unmapped tasks
  npx tsx index.ts create-tasks --apply

  # Sync epic descriptions with progress to Jira
  npx tsx index.ts epics --apply

  # Sync specific epic
  npx tsx index.ts epics --epic=INFRA --apply

  # Check done status consistency
  npx tsx index.ts verify-done

  # Initialize timestamps for existing tasks
  npx tsx index.ts init-timestamps

  # Audit task status/assignee against git history
  npx tsx index.ts audit-tasks

  # Apply audit fixes to local files and Jira
  npx tsx index.ts audit-tasks --apply

  # Audit specific task
  npx tsx index.ts audit-tasks --task=SEO-001

Conflict Resolution:
  When both local and Jira have changes since last sync, a conflict is detected.
  Resolution modes:
    prompt  - Ask interactively for each conflict (default)
    local   - Local always wins
    remote  - Remote always wins
    newer   - Most recently updated wins
    skip    - Skip conflicting tasks

Configuration:
  .tasks/.jira-mapping.json    Developer IDs, task mappings, epic mappings
  .tasks/.jira-timestamps.json Sync timestamps (created automatically)
  .env.local                   JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN
`);
}

main().catch(console.error);
