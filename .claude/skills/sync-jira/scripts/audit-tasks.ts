#!/usr/bin/env npx tsx
/**
 * Task Audit Script
 *
 * Verifies task status and assignee consistency between:
 * - Local .tasks/epics/ files
 * - .tasks/.done file
 * - Jira tickets
 * - Git history (actual implementation)
 *
 * Usage:
 *   npx tsx audit-tasks.ts              # Preview discrepancies
 *   npx tsx audit-tasks.ts --apply      # Fix discrepancies
 *   npx tsx audit-tasks.ts --verbose    # Show all evidence
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import type {
  TaskEvidence,
  AuditReport,
  RecommendedFix,
  LocalTask,
} from './lib/types.js';
import {
  loadConfig,
  getJiraConfig,
  getTaskMappings,
  getJiraKeyForTask,
  getEpicsDir,
  getRepoStatus,
} from './lib/config.js';
import { getAllTasks, parseTaskFile } from './lib/task-parser.js';
import {
  findGitEvidenceForTask,
  getDoneFileTaskIds,
  resolveTaskAssignee,
  addToDoneFile,
} from './lib/git-utils.js';
import { JiraClient } from './lib/jira-api.js';

// Load .env.local
const __scriptDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__scriptDir, '../../../../.env.local') });

// =============================================================================
// CLI Arguments
// =============================================================================

const args = process.argv.slice(2);
const applyMode = args.includes('--apply');
const verboseMode = args.includes('--verbose');
const specificTask = args.find(a => a.startsWith('--task='))?.split('=')[1];

// =============================================================================
// Main Audit Logic
// =============================================================================

async function runAudit(): Promise<AuditReport> {
  console.log('\n\x1b[1m' + '═'.repeat(60) + '\x1b[0m');
  console.log('\x1b[1m TASK AUDIT REPORT\x1b[0m');
  console.log('\x1b[1m' + '═'.repeat(60) + '\x1b[0m\n');

  // Initialize
  const config = loadConfig();
  const jiraConfig = getJiraConfig();
  const jiraApi = jiraConfig ? new JiraClient(jiraConfig) : null;
  const taskMappings = getTaskMappings();
  const doneFileIds = getDoneFileTaskIds();

  // Get all local tasks
  const tasksMap = getAllTasks();
  let allTasks = Array.from(tasksMap.values());
  if (specificTask) {
    allTasks = allTasks.filter(t => t.id === specificTask);
    if (allTasks.length === 0) {
      console.error(`Task ${specificTask} not found`);
      process.exit(1);
    }
  }

  console.log(`Scanning ${allTasks.length} tasks...\n`);

  // Collect evidence for each task
  const evidenceList: TaskEvidence[] = [];

  for (const task of allTasks) {
    const taskContent = fs.readFileSync(task.filePath, 'utf-8');
    const evidence = await collectTaskEvidence(task, taskContent, jiraApi, doneFileIds);
    evidenceList.push(evidence);

    if (verboseMode && evidence.gitEvidence.source !== 'none') {
      console.log(`  ${task.id}: ${evidence.gitEvidence.source} evidence from ${evidence.gitEvidence.implementedBy || 'unknown'}`);
    }
  }

  // Separate consistent vs discrepant tasks
  const consistent = evidenceList.filter(e => e.discrepancies.length === 0);
  const discrepancies = evidenceList.filter(e => e.discrepancies.length > 0 && e.gitEvidence.confidence !== 'none');
  const missingEvidence = evidenceList.filter(e => e.gitEvidence.confidence === 'none' && e.localStatus === 'done');

  // Check .done file consistency
  const doneInEpics = new Set(allTasks.filter(t => t.status === 'done').map(t => t.id));
  const inDoneNotInEpics = Array.from(doneFileIds).filter(id => !doneInEpics.has(id));
  const inEpicsNotInDone = Array.from(doneInEpics).filter(id => !doneFileIds.has(id));

  // Build report
  const report: AuditReport = {
    totalTasks: allTasks.length,
    consistent: consistent.length,
    discrepancies,
    missingEvidence,
    doneFileMismatch: {
      inDoneNotInEpics,
      inEpicsNotInDone,
    },
  };

  return report;
}

async function collectTaskEvidence(
  task: LocalTask,
  taskContent: string,
  jiraApi: JiraClient | null,
  doneFileIds: Set<string>
): Promise<TaskEvidence> {
  const evidence: TaskEvidence = {
    taskId: task.id,
    localStatus: task.status,
    localAssignee: task.assignee,
    gitEvidence: findGitEvidenceForTask(task.id, taskContent),
    discrepancies: [],
    recommendedFixes: [],
  };

  // Get Jira info if available
  if (task.jiraKey && jiraApi) {
    try {
      const jiraTask = await jiraApi.getIssue(task.jiraKey);
      if (jiraTask) {
        evidence.jiraKey = task.jiraKey;
        evidence.jiraStatus = jiraTask.fields.status?.name;
        evidence.jiraAssignee = jiraTask.fields.assignee?.displayName;
      }
    } catch {
      // Jira not accessible
    }
  }

  // Resolve assignees to canonical names
  const canonicalLocalAssignee = resolveTaskAssignee(task.assignee || '');
  const canonicalJiraAssignee = evidence.jiraAssignee ? resolveTaskAssignee(evidence.jiraAssignee) : null;
  const canonicalGitAuthor = evidence.gitEvidence.implementedBy;

  // Detect discrepancies
  detectDiscrepancies(evidence, canonicalLocalAssignee, canonicalJiraAssignee, canonicalGitAuthor, doneFileIds);

  return evidence;
}

function detectDiscrepancies(
  evidence: TaskEvidence,
  localAssignee: string | null,
  jiraAssignee: string | null,
  gitAuthor: string | undefined,
  doneFileIds: Set<string>
): void {
  const { taskId, localStatus, jiraStatus, gitEvidence } = evidence;

  // Check 1: Git shows implementation but status not done
  if (gitEvidence.source !== 'none' && gitEvidence.confidence !== 'none') {
    if (localStatus !== 'done') {
      evidence.discrepancies.push(`Git shows implementation but local status is "${localStatus}"`);
      evidence.recommendedFixes.push({
        target: 'local',
        field: 'status',
        currentValue: localStatus,
        newValue: 'done',
        reason: `Commit ${gitEvidence.commitHash?.slice(0, 7)} by ${gitAuthor}`,
      });
    }

    // Check if in .done file
    if (!doneFileIds.has(taskId) && localStatus === 'done') {
      evidence.discrepancies.push('Task marked done in epic but missing from .done file');
      evidence.recommendedFixes.push({
        target: 'done-file',
        field: 'add',
        newValue: taskId,
        reason: 'Sync .done file with epic status',
      });
    }

    // Check assignee mismatch
    if (gitAuthor && localAssignee && localAssignee !== gitAuthor) {
      evidence.discrepancies.push(`Local assignee "${localAssignee}" differs from git author "${gitAuthor}"`);
      evidence.recommendedFixes.push({
        target: 'local',
        field: 'assignee',
        currentValue: localAssignee,
        newValue: gitAuthor,
        reason: `Git history shows ${gitAuthor} implemented this`,
      });
    }

    // Check if unassigned but has git author
    if (gitAuthor && !localAssignee) {
      evidence.discrepancies.push(`Task unassigned but git shows "${gitAuthor}" implemented it`);
      evidence.recommendedFixes.push({
        target: 'local',
        field: 'assignee',
        currentValue: '-',
        newValue: gitAuthor,
        reason: `Git history attribution`,
      });
    }
  }

  // Check 2: Jira status mismatch
  if (jiraStatus) {
    const jiraRepoStatus = getRepoStatus(jiraStatus);

    if (localStatus === 'done' && jiraRepoStatus !== 'done') {
      evidence.discrepancies.push(`Local status is "done" but Jira is "${jiraStatus}"`);
      evidence.recommendedFixes.push({
        target: 'jira',
        field: 'status',
        currentValue: jiraStatus,
        newValue: 'Done',
        reason: 'Sync Jira with local done status',
      });
    }

    // Check Jira assignee
    if (gitAuthor && jiraAssignee && jiraAssignee !== gitAuthor) {
      evidence.discrepancies.push(`Jira assignee "${jiraAssignee}" differs from git author "${gitAuthor}"`);
      evidence.recommendedFixes.push({
        target: 'jira',
        field: 'assignee',
        currentValue: jiraAssignee,
        newValue: gitAuthor,
        reason: 'Match Jira assignee to git author',
      });
    }

    if (gitAuthor && !jiraAssignee) {
      evidence.discrepancies.push(`Jira unassigned but git shows "${gitAuthor}"`);
      evidence.recommendedFixes.push({
        target: 'jira',
        field: 'assignee',
        currentValue: 'Unassigned',
        newValue: gitAuthor,
        reason: 'Set Jira assignee from git history',
      });
    }
  }
}

// =============================================================================
// Report Display
// =============================================================================

function displayReport(report: AuditReport): void {
  const { totalTasks, consistent, discrepancies, missingEvidence, doneFileMismatch } = report;

  // Summary
  console.log('\x1b[1mSummary:\x1b[0m');
  console.log(`  \x1b[32m\u2713 Consistent:\x1b[0m ${consistent} tasks`);
  console.log(`  \x1b[33m\u26a0 Discrepancies:\x1b[0m ${discrepancies.length} tasks`);
  console.log(`  \x1b[31m\u2717 Missing evidence:\x1b[0m ${missingEvidence.length} tasks`);
  console.log();

  // .done file mismatch
  if (doneFileMismatch.inDoneNotInEpics.length > 0 || doneFileMismatch.inEpicsNotInDone.length > 0) {
    console.log('\x1b[1m.done File Mismatch:\x1b[0m');
    if (doneFileMismatch.inDoneNotInEpics.length > 0) {
      console.log(`  In .done but not marked done in epics (${doneFileMismatch.inDoneNotInEpics.length}):`);
      for (const id of doneFileMismatch.inDoneNotInEpics.slice(0, 10)) {
        console.log(`    - ${id}`);
      }
      if (doneFileMismatch.inDoneNotInEpics.length > 10) {
        console.log(`    ... and ${doneFileMismatch.inDoneNotInEpics.length - 10} more`);
      }
    }
    if (doneFileMismatch.inEpicsNotInDone.length > 0) {
      console.log(`  Marked done in epics but not in .done (${doneFileMismatch.inEpicsNotInDone.length}):`);
      for (const id of doneFileMismatch.inEpicsNotInDone.slice(0, 10)) {
        console.log(`    - ${id}`);
      }
      if (doneFileMismatch.inEpicsNotInDone.length > 10) {
        console.log(`    ... and ${doneFileMismatch.inEpicsNotInDone.length - 10} more`);
      }
    }
    console.log();
  }

  // Discrepancies table
  if (discrepancies.length > 0) {
    console.log('\x1b[1mDiscrepancies:\x1b[0m');
    console.log('\u250c' + '\u2500'.repeat(12) + '\u252c' + '\u2500'.repeat(16) + '\u252c' + '\u2500'.repeat(16) + '\u252c' + '\u2500'.repeat(30) + '\u2510');
    console.log('\u2502 Task       \u2502 Local          \u2502 Jira           \u2502 Git Evidence                 \u2502');
    console.log('\u251c' + '\u2500'.repeat(12) + '\u253c' + '\u2500'.repeat(16) + '\u253c' + '\u2500'.repeat(16) + '\u253c' + '\u2500'.repeat(30) + '\u2524');

    for (const e of discrepancies.slice(0, 20)) {
      const task = e.taskId.padEnd(10);
      const local = `${e.localStatus}/${e.localAssignee || '-'}`.slice(0, 14).padEnd(14);
      const jira = e.jiraKey ? `${e.jiraStatus || '?'}/${e.jiraAssignee || '-'}`.slice(0, 14).padEnd(14) : 'No Jira'.padEnd(14);
      const git = e.gitEvidence.implementedBy
        ? `${e.gitEvidence.implementedBy} ${formatDate(e.gitEvidence.implementedAt)}`.slice(0, 28).padEnd(28)
        : 'No evidence'.padEnd(28);

      console.log(`\u2502 ${task} \u2502 ${local} \u2502 ${jira} \u2502 ${git} \u2502`);
    }

    console.log('\u2514' + '\u2500'.repeat(12) + '\u2534' + '\u2500'.repeat(16) + '\u2534' + '\u2500'.repeat(16) + '\u2534' + '\u2500'.repeat(30) + '\u2518');

    if (discrepancies.length > 20) {
      console.log(`  ... and ${discrepancies.length - 20} more`);
    }
    console.log();
  }

  // Recommended fixes
  const allFixes = discrepancies.flatMap(d => d.recommendedFixes);
  if (allFixes.length > 0) {
    console.log('\x1b[1mRecommended Fixes:\x1b[0m');

    const localFixes = allFixes.filter(f => f.target === 'local');
    const jiraFixes = allFixes.filter(f => f.target === 'jira');
    const doneFixes = allFixes.filter(f => f.target === 'done-file');

    if (localFixes.length > 0) {
      console.log(`  Local file updates: ${localFixes.length}`);
    }
    if (jiraFixes.length > 0) {
      console.log(`  Jira updates: ${jiraFixes.length}`);
    }
    if (doneFixes.length > 0) {
      console.log(`  .done file additions: ${doneFixes.length}`);
    }
    console.log();

    if (!applyMode) {
      console.log('\x1b[33mRun with --apply to fix discrepancies\x1b[0m\n');
    }
  }

  // Missing evidence
  if (missingEvidence.length > 0 && verboseMode) {
    console.log('\x1b[1mTasks marked done but no git evidence (may be planning/docs tasks):\x1b[0m');
    for (const e of missingEvidence.slice(0, 10)) {
      console.log(`  - ${e.taskId} (${e.localAssignee || 'unassigned'})`);
    }
    if (missingEvidence.length > 10) {
      console.log(`  ... and ${missingEvidence.length - 10} more`);
    }
    console.log();
  }
}

function formatDate(date: Date | undefined): string {
  if (!date) return '';
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear().toString().slice(2);
  return `${month}/${day}/${year}`;
}

// =============================================================================
// Apply Fixes
// =============================================================================

async function applyFixes(report: AuditReport): Promise<void> {
  const jiraConfig = getJiraConfig();
  const jiraApi = jiraConfig ? new JiraClient(jiraConfig) : null;

  console.log('\x1b[1mApplying fixes...\x1b[0m\n');

  let localUpdates = 0;
  let jiraUpdates = 0;
  let doneUpdates = 0;

  for (const evidence of report.discrepancies) {
    for (const fix of evidence.recommendedFixes) {
      try {
        if (fix.target === 'local') {
          await applyLocalFix(evidence, fix);
          localUpdates++;
        } else if (fix.target === 'jira' && jiraApi && evidence.jiraKey) {
          await applyJiraFix(jiraApi, evidence.jiraKey, fix);
          jiraUpdates++;
        } else if (fix.target === 'done-file') {
          addToDoneFile(evidence.taskId);
          doneUpdates++;
        }
      } catch (e) {
        console.error(`  \x1b[31m\u2717\x1b[0m Failed to apply fix for ${evidence.taskId}: ${e}`);
      }
    }
  }

  // Also sync .done file mismatches
  for (const taskId of report.doneFileMismatch.inEpicsNotInDone) {
    addToDoneFile(taskId);
    doneUpdates++;
  }

  console.log(`\n\x1b[32mApplied:\x1b[0m`);
  console.log(`  Local file updates: ${localUpdates}`);
  console.log(`  Jira updates: ${jiraUpdates}`);
  console.log(`  .done file additions: ${doneUpdates}`);
}

async function applyLocalFix(evidence: TaskEvidence, fix: RecommendedFix): Promise<void> {
  // Find the task file
  const tasksMap = getAllTasks();
  const task = tasksMap.get(evidence.taskId);
  if (!task) return;

  let content = fs.readFileSync(task.filePath, 'utf-8');

  if (fix.field === 'status') {
    // Handle both **Status:** and ## Status: formats
    if (content.match(/^\*\*Status:\*\*/m)) {
      content = content.replace(
        /^\*\*Status:\*\*\s*.+$/m,
        `**Status:** ${fix.newValue}`
      );
    } else if (content.match(/^## Status:/m)) {
      content = content.replace(
        /^## Status:\s*.+$/m,
        `## Status: ${fix.newValue}`
      );
    }
    console.log(`  \x1b[32m\u2713\x1b[0m ${evidence.taskId}: status → ${fix.newValue}`);
  } else if (fix.field === 'assignee') {
    // Handle both **Assignee:** and ## Assignee: formats
    if (content.match(/^\*\*Assignee:\*\*/m)) {
      content = content.replace(
        /^\*\*Assignee:\*\*\s*.+$/m,
        `**Assignee:** ${fix.newValue}`
      );
    } else if (content.match(/^## Assignee:/m)) {
      content = content.replace(
        /^## Assignee:\s*.+$/m,
        `## Assignee: ${fix.newValue}`
      );
    } else {
      // Add assignee after status line
      content = content.replace(
        /^((?:\*\*Status:\*\*|## Status:)\s*.+)$/m,
        `$1\n**Assignee:** ${fix.newValue}`
      );
    }
    console.log(`  \x1b[32m\u2713\x1b[0m ${evidence.taskId}: assignee → ${fix.newValue}`);
  }

  fs.writeFileSync(task.filePath, content);
}

async function applyJiraFix(jiraApi: JiraClient, jiraKey: string, fix: RecommendedFix): Promise<void> {
  if (fix.field === 'status') {
    await jiraApi.transitionTo(jiraKey, fix.newValue);
    console.log(`  \x1b[32m\u2713\x1b[0m ${jiraKey}: status → ${fix.newValue}`);
  } else if (fix.field === 'assignee') {
    const config = loadConfig();
    const developers = config.developers || {};

    // Find Jira account ID for the assignee
    let accountId: string | null = null;
    for (const [name, dev] of Object.entries(developers)) {
      if (name === fix.newValue && dev && typeof dev === 'object') {
        accountId = dev.jiraAccountId;
        break;
      }
    }

    if (accountId) {
      await jiraApi.assignIssue(jiraKey, accountId);
      console.log(`  \x1b[32m\u2713\x1b[0m ${jiraKey}: assignee → ${fix.newValue}`);
    }
  }
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  try {
    const report = await runAudit();
    displayReport(report);

    if (applyMode && (report.discrepancies.length > 0 || report.doneFileMismatch.inEpicsNotInDone.length > 0)) {
      await applyFixes(report);
    }
  } catch (e) {
    console.error('\x1b[31mAudit failed:\x1b[0m', e);
    process.exit(1);
  }
}

main();
