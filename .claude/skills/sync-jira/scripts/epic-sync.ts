#!/usr/bin/env npx tsx
/**
 * Epic Description Sync
 *
 * Syncs epic descriptions with progress tracking from local _epic.md files to Jira.
 *
 * Usage:
 *   npx tsx epic-sync.ts                    # Preview all epics
 *   npx tsx epic-sync.ts --apply            # Sync all epics
 *   npx tsx epic-sync.ts --epic=INFRA       # Sync specific epic
 *   npx tsx epic-sync.ts --epic=INFRA --apply
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __scriptDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__scriptDir, '../../../../.env.local') });

import fs from 'fs';
import path from 'path';
import { JiraClient } from './lib/jira-api.js';
import { requireJiraConfig, loadConfig } from './lib/config.js';
import { getAllTasks } from './lib/task-parser.js';
import type { AdfDocument, AdfNode, LocalTask } from './lib/types.js';

// =============================================================================
// Types
// =============================================================================

interface EpicInfo {
  code: string;
  name: string;
  owner: string;
  status: string;
  overview: string;
  goals: string[];
  exitCriteria: Array<{ text: string; done: boolean }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    assignee: string;
    estimate?: number;
  }>;
  filePath: string;
}

interface EpicSyncResult {
  epicCode: string;
  jiraKey: string;
  action: 'updated' | 'skipped' | 'error';
  progress: { done: number; total: number };
  error?: string;
}

// =============================================================================
// Epic Parser
// =============================================================================

function parseEpicFile(filePath: string): EpicInfo | null {
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract code
  const codeMatch = content.match(/\*\*Code:\*\*\s*(\w+)/);
  const code = codeMatch?.[1] || path.basename(path.dirname(filePath)).toUpperCase();

  // Extract name from title
  const nameMatch = content.match(/^#\s+Epic:\s*(.+)/m);
  const name = nameMatch?.[1] || code;

  // Extract owner
  const ownerMatch = content.match(/\*\*Owner:\*\*\s*(.+)/);
  const owner = ownerMatch?.[1]?.trim() || 'Unassigned';

  // Extract status
  const statusMatch = content.match(/\*\*Status:\*\*\s*(\w+)/);
  const status = statusMatch?.[1] || 'Ready';

  // Extract overview (text after ## Overview until next ##)
  const overviewMatch = content.match(/## Overview\s+([\s\S]*?)(?=\n##|\n\*\*|$)/);
  const overview = overviewMatch?.[1]?.trim() || '';

  // Extract goals (bullet list after ## Goals)
  const goalsMatch = content.match(/## Goals\s+([\s\S]*?)(?=\n##|$)/);
  const goalsText = goalsMatch?.[1] || '';
  const goals = goalsText
    .split('\n')
    .filter(line => line.trim().match(/^[-*]\s/))
    .map(line => line.replace(/^[-*]\s+/, '').trim());

  // Extract exit criteria (checkbox list after ## Exit Criteria)
  const exitMatch = content.match(/## Exit Criteria\s+([\s\S]*?)(?=\n##|$)/);
  const exitText = exitMatch?.[1] || '';
  const exitCriteria = exitText
    .split('\n')
    .filter(line => line.trim().match(/^[-*]\s*\[[ x]\]/i))
    .map(line => ({
      text: line.replace(/^[-*]\s*\[[ x]\]\s*/i, '').trim(),
      done: line.includes('[x]') || line.includes('[X]'),
    }));

  // Extract tasks from table
  const tableMatch = content.match(/\|\s*ID\s*\|[\s\S]*?\n((?:\|.*\n?)+)/);
  const tasks: EpicInfo['tasks'] = [];

  if (tableMatch) {
    const rows = tableMatch[1].split('\n').filter(row => row.trim() && !row.includes('---'));
    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 4) {
        tasks.push({
          id: cells[0],
          title: cells[1],
          status: cells[2].toLowerCase(),
          assignee: cells[3],
          estimate: cells[4] ? parseInt(cells[4], 10) : undefined,
        });
      }
    }
  }

  return {
    code,
    name,
    owner,
    status,
    overview,
    goals,
    exitCriteria,
    tasks,
    filePath,
  };
}

function getAllEpics(): Map<string, EpicInfo> {
  const epicsDir = path.resolve('.tasks/epics');
  const epics = new Map<string, EpicInfo>();

  if (!fs.existsSync(epicsDir)) return epics;

  const dirs = fs.readdirSync(epicsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const dir of dirs) {
    const epicFile = path.join(epicsDir, dir, '_epic.md');
    const epic = parseEpicFile(epicFile);
    if (epic) {
      epics.set(epic.code, epic);
    }
  }

  return epics;
}

// =============================================================================
// Progress Calculator
// =============================================================================

function calculateProgress(epicCode: string, epicTasks: EpicInfo['tasks']): { done: number; total: number } {
  // Get actual task statuses from task files (more accurate than epic table)
  // Match by task ID prefix (e.g., API-001 starts with API)
  const allTasks = getAllTasks();
  const tasksInEpic = Array.from(allTasks.values()).filter(t =>
    t.id.startsWith(`${epicCode}-`) || t.epicCode === epicCode
  );

  if (tasksInEpic.length > 0) {
    const done = tasksInEpic.filter(t => t.status === 'done').length;
    return { done, total: tasksInEpic.length };
  }

  // Fallback to epic table tasks
  const done = epicTasks.filter(t => t.status === 'done').length;
  return { done, total: epicTasks.length };
}

function getTasksWithStatus(epicCode: string): Array<{ id: string; title: string; status: string; assignee: string }> {
  const allTasks = getAllTasks();
  return Array.from(allTasks.values())
    .filter(t => t.id.startsWith(`${epicCode}-`) || t.epicCode === epicCode)
    .map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      assignee: t.assignee || '-',
    }));
}

// =============================================================================
// ADF Builder for Epics
// =============================================================================

function epicToAdf(epic: EpicInfo, progress: { done: number; total: number }): AdfDocument {
  const content: AdfNode[] = [];
  const progressPct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const statusEmoji = progressPct === 100 ? '✅' : progressPct > 50 ? '🔄' : '📋';

  // Status & Progress header
  content.push({
    type: 'panel',
    attrs: { panelType: progressPct === 100 ? 'success' : 'info' },
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: `${statusEmoji} Status: `, marks: [{ type: 'strong' }] },
          { type: 'text', text: progressPct === 100 ? 'Done' : epic.status },
          { type: 'text', text: '  |  ' },
          { type: 'text', text: 'Progress: ', marks: [{ type: 'strong' }] },
          { type: 'text', text: `${progress.done}/${progress.total} (${progressPct}%)` },
        ],
      },
    ],
  } as AdfNode);

  // Overview
  if (epic.overview) {
    content.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Overview' }] });
    content.push({ type: 'paragraph', content: [{ type: 'text', text: epic.overview }] });
  }

  // Goals
  if (epic.goals.length > 0) {
    content.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Goals' }] });
    content.push({
      type: 'bulletList',
      content: epic.goals.map(goal => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: goal }] }],
      })),
    } as AdfNode);
  }

  // Tasks table
  const tasks = getTasksWithStatus(epic.code);
  if (tasks.length > 0) {
    content.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Tasks' }] });
    content.push(buildTaskTable(tasks));
  }

  // Exit Criteria
  if (epic.exitCriteria.length > 0) {
    content.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Exit Criteria' }] });
    content.push({
      type: 'taskList',
      attrs: { localId: `epic-${epic.code}-exit` },
      content: epic.exitCriteria.map((ec, i) => ({
        type: 'taskItem',
        attrs: { localId: `ec-${i}`, state: ec.done ? 'DONE' : 'TODO' },
        content: [{ type: 'text', text: ec.text }],
      })),
    } as AdfNode);
  }

  // Footer
  content.push({ type: 'rule' });
  content.push({
    type: 'paragraph',
    content: [
      { type: 'text', text: '📁 ', marks: [] },
      { type: 'text', text: 'Epic: ', marks: [{ type: 'strong' }] },
      { type: 'text', text: epic.code, marks: [{ type: 'code' }] },
      { type: 'text', text: ' | Last synced: ' },
      { type: 'text', text: new Date().toISOString().split('T')[0] },
    ],
  });

  return { type: 'doc', version: 1, content };
}

function buildTaskTable(tasks: Array<{ id: string; title: string; status: string; assignee: string }>): AdfNode {
  const statusEmoji = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done': return '✅';
      case 'in_progress': return '🔄';
      case 'blocked': return '🚫';
      default: return '📋';
    }
  };

  return {
    type: 'table',
    attrs: { isNumberColumnEnabled: false, layout: 'default' },
    content: [
      // Header row
      {
        type: 'tableRow',
        content: [
          { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ID', marks: [{ type: 'strong' }] }] }] },
          { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Title', marks: [{ type: 'strong' }] }] }] },
          { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Status', marks: [{ type: 'strong' }] }] }] },
          { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Assignee', marks: [{ type: 'strong' }] }] }] },
        ],
      },
      // Data rows
      ...tasks.map(task => ({
        type: 'tableRow',
        content: [
          { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: task.id }] }] },
          { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: task.title }] }] },
          { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: `${statusEmoji(task.status)} ${task.status}` }] }] },
          { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: task.assignee }] }] },
        ],
      })),
    ],
  } as AdfNode;
}

// =============================================================================
// Sync Logic
// =============================================================================

export interface EpicSyncOptions {
  apply: boolean;
  epicCode?: string;
}

export async function syncEpics(options: EpicSyncOptions): Promise<EpicSyncResult[]> {
  const results: EpicSyncResult[] = [];
  const jiraConfig = requireJiraConfig();
  const client = new JiraClient(jiraConfig);
  const mapping = loadConfig();

  // Get all epics
  const allEpics = getAllEpics();

  // Find Jira epic mappings
  const epicToJira = new Map<string, { jiraKey: string; jiraName: string }>();
  for (const epicMapping of mapping.mapping) {
    for (const repoEpic of epicMapping.repoEpics) {
      epicToJira.set(repoEpic, { jiraKey: epicMapping.jiraKey, jiraName: epicMapping.jiraName });
    }
  }

  // If filtering by epic code, find the Jira epic it belongs to
  let targetJiraKey: string | undefined;
  if (options.epicCode) {
    const jiraMapping = epicToJira.get(options.epicCode);
    if (!jiraMapping) {
      console.error(`Epic ${options.epicCode} not found or has no Jira mapping`);
      return results;
    }
    targetJiraKey = jiraMapping.jiraKey;
  }

  // Group ALL epics by Jira epic (many repo epics can map to one Jira epic)
  const jiraEpicGroups = new Map<string, { jiraKey: string; jiraName: string; repoEpics: EpicInfo[] }>();
  for (const [code, epic] of allEpics) {
    const jiraMapping = epicToJira.get(code);
    if (!jiraMapping) {
      if (!options.epicCode) {
        console.log(`  ⚠️  [${code}] No Jira mapping found`);
      }
      continue;
    }

    // If filtering, only include epics that belong to the target Jira epic
    if (targetJiraKey && jiraMapping.jiraKey !== targetJiraKey) {
      continue;
    }

    const existing = jiraEpicGroups.get(jiraMapping.jiraKey);
    if (existing) {
      existing.repoEpics.push(epic);
    } else {
      jiraEpicGroups.set(jiraMapping.jiraKey, {
        jiraKey: jiraMapping.jiraKey,
        jiraName: jiraMapping.jiraName,
        repoEpics: [epic],
      });
    }
  }

  console.log(`\n📊 Syncing ${jiraEpicGroups.size} Jira epic(s)...\n`);

  for (const [jiraKey, group] of jiraEpicGroups) {
    // Calculate combined progress for all repo epics
    let totalDone = 0;
    let totalTasks = 0;

    for (const epic of group.repoEpics) {
      const progress = calculateProgress(epic.code, epic.tasks);
      totalDone += progress.done;
      totalTasks += progress.total;
    }

    const progressPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
    const epicCodes = group.repoEpics.map(e => e.code).join(', ');

    // Determine target status based on progress
    let targetStatus: string;
    if (progressPct === 100) {
      targetStatus = 'Done';
    } else if (progressPct > 0) {
      targetStatus = 'In Progress';
    } else {
      targetStatus = 'To Do';
    }

    // Get current status
    let currentStatus = 'Unknown';
    try {
      const issue = await client.getIssue(jiraKey, ['status']);
      currentStatus = issue.fields.status?.name || 'Unknown';
    } catch {
      // Ignore, will show Unknown
    }

    const statusChange = currentStatus !== targetStatus ? ` (${currentStatus} → ${targetStatus})` : '';

    if (!options.apply) {
      console.log(`  [${jiraKey}] ${group.jiraName}`);
      console.log(`      Epics: ${epicCodes}`);
      console.log(`      Progress: ${totalDone}/${totalTasks} (${progressPct}%)`);
      if (statusChange) {
        console.log(`      Status: ${currentStatus} → ${targetStatus}`);
      }
      results.push({
        epicCode: epicCodes,
        jiraKey,
        action: 'skipped',
        progress: { done: totalDone, total: totalTasks },
      });
      continue;
    }

    try {
      // Build combined ADF for multi-epic Jira epics
      const description = buildCombinedEpicAdf(group.repoEpics, { done: totalDone, total: totalTasks });

      await client.updateIssue(jiraKey, {
        fields: { description },
      });

      // Transition status if needed
      let transitioned = false;
      if (currentStatus !== targetStatus) {
        transitioned = await client.transitionTo(jiraKey, targetStatus);
      }

      const statusMsg = transitioned ? ` [${currentStatus} → ${targetStatus}]` : '';
      console.log(`  ✅ [${jiraKey}] ${group.jiraName} — ${totalDone}/${totalTasks} (${progressPct}%)${statusMsg}`);
      results.push({
        epicCode: epicCodes,
        jiraKey,
        action: 'updated',
        progress: { done: totalDone, total: totalTasks },
      });
    } catch (e) {
      console.error(`  ❌ [${jiraKey}] ${group.jiraName}: ${e}`);
      results.push({
        epicCode: epicCodes,
        jiraKey,
        action: 'error',
        progress: { done: totalDone, total: totalTasks },
        error: `${e}`,
      });
    }
  }

  // Summary
  const updated = results.filter(r => r.action === 'updated').length;
  const failed = results.filter(r => r.action === 'error').length;
  console.log(`\n📊 Summary: ${updated} updated, ${failed} failed\n`);

  return results;
}

function buildCombinedEpicAdf(epics: EpicInfo[], totalProgress: { done: number; total: number }): AdfDocument {
  const content: AdfNode[] = [];
  const progressPct = totalProgress.total > 0 ? Math.round((totalProgress.done / totalProgress.total) * 100) : 0;
  const statusEmoji = progressPct === 100 ? '✅' : progressPct > 50 ? '🔄' : '📋';

  // Status & Progress header
  content.push({
    type: 'panel',
    attrs: { panelType: progressPct === 100 ? 'success' : 'info' },
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: `${statusEmoji} Status: `, marks: [{ type: 'strong' }] },
          { type: 'text', text: progressPct === 100 ? 'Done' : progressPct > 0 ? 'In Progress' : 'To Do' },
          { type: 'text', text: '  |  ' },
          { type: 'text', text: 'Progress: ', marks: [{ type: 'strong' }] },
          { type: 'text', text: `${totalProgress.done}/${totalProgress.total} (${progressPct}%)` },
        ],
      },
    ],
  } as AdfNode);

  // Per-epic sections
  for (const epic of epics) {
    const epicProgress = calculateProgress(epic.code, epic.tasks);
    const epicPct = epicProgress.total > 0 ? Math.round((epicProgress.done / epicProgress.total) * 100) : 0;

    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: `${epic.code}: ${epic.name} (${epicPct}%)` }],
    });

    // Overview
    if (epic.overview) {
      content.push({ type: 'paragraph', content: [{ type: 'text', text: epic.overview }] });
    }

    // Goals as bullet list
    if (epic.goals.length > 0) {
      content.push({
        type: 'bulletList',
        content: epic.goals.map(goal => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: goal }] }],
        })),
      } as AdfNode);
    }

    // Tasks table
    const tasks = getTasksWithStatus(epic.code);
    if (tasks.length > 0) {
      content.push(buildTaskTable(tasks));
    }

    // Exit criteria
    if (epic.exitCriteria.length > 0) {
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Exit Criteria' }],
      });
      content.push({
        type: 'taskList',
        attrs: { localId: `epic-${epic.code}-exit` },
        content: epic.exitCriteria.map((ec, i) => ({
          type: 'taskItem',
          attrs: { localId: `ec-${epic.code}-${i}`, state: ec.done ? 'DONE' : 'TODO' },
          content: [{ type: 'text', text: ec.text }],
        })),
      } as AdfNode);
    }
  }

  // Footer
  content.push({ type: 'rule' });
  content.push({
    type: 'paragraph',
    content: [
      { type: 'text', text: '📁 ', marks: [] },
      { type: 'text', text: 'Epics: ', marks: [{ type: 'strong' }] },
      { type: 'text', text: epics.map(e => e.code).join(', '), marks: [{ type: 'code' }] },
      { type: 'text', text: ' | Last synced: ' },
      { type: 'text', text: new Date().toISOString().split('T')[0] },
    ],
  });

  return { type: 'doc', version: 1, content };
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Epic Description Sync - Updates Jira epic descriptions with progress

Usage:
  npx tsx epic-sync.ts [options]

Options:
  --apply           Apply changes (default is preview mode)
  --epic <code>     Sync specific epic only (e.g., --epic=INFRA)

What gets synced:
  - Status panel with progress percentage
  - Overview section
  - Goals as bullet list
  - Tasks table with status and assignee
  - Exit criteria as checklist
  - Sync timestamp in footer

Examples:
  npx tsx epic-sync.ts                    # Preview all epics
  npx tsx epic-sync.ts --apply            # Sync all epics
  npx tsx epic-sync.ts --epic=INFRA       # Preview specific epic
  npx tsx epic-sync.ts --epic=INFRA --apply
`);
    process.exit(0);
  }

  const options: EpicSyncOptions = {
    apply: args.includes('--apply'),
  };

  // Epic filter
  const epicArg = args.find(a => a.startsWith('--epic='));
  if (epicArg) {
    options.epicCode = epicArg.split('=')[1];
  } else {
    const epicIdx = args.indexOf('--epic');
    if (epicIdx !== -1 && args[epicIdx + 1] && !args[epicIdx + 1].startsWith('--')) {
      options.epicCode = args[epicIdx + 1];
    }
  }

  await syncEpics(options);

  if (!options.apply) {
    console.log('💡 Use --apply to sync these epics to Jira\n');
  }
}

// Only run if executed directly
const isMainModule = process.argv[1]?.includes('epic-sync');
if (isMainModule) {
  main().catch(console.error);
}
