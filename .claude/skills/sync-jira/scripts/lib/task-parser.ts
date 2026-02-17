/**
 * Local task file parser
 *
 * Parses .tasks/epics/{epic}/{TASK-ID}.md files and extracts structured data.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { LocalTask, TaskStatus, AcceptanceCriterion, RepoEpic } from './types.js';
import { getEpicsDir, getJiraKeyForTask, isTaskDone } from './config.js';

// =============================================================================
// Task File Parser
// =============================================================================

export function parseTaskFile(filePath: string): LocalTask | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.md');
    const epicDir = path.basename(path.dirname(filePath));

    // Extract task ID from filename (e.g., "SEO-001" or "SEO-001-description")
    const idMatch = fileName.match(/^([A-Z]+-\d+)/);
    const id = idMatch?.[1] || fileName;

    // Extract title from first heading
    const titleMatch = content.match(/^#+ (?:\[[A-Z]+-\d+\])?\s*(.+)$/m);
    const title = titleMatch?.[1]?.replace(/^\[.*?\]\s*/, '').trim() || fileName;

    // Parse structured metadata - support both **Field:** and ## Field: formats
    const statusMatch = content.match(/(?:\*\*Status:\*\*|## Status:)\s*(\w+)/i);
    const assigneeMatch = content.match(/(?:\*\*Assignee:\*\*|## Assignee:)\s*(.+)/i);
    const estimateMatch = content.match(/(?:\*\*Estimate:\*\*|## Estimate:)\s*(\d+)/i);
    const priorityMatch = content.match(/(?:\*\*Priority:\*\*|## Priority:)\s*(\w+)/i);
    const jiraMatch = content.match(/(?:\*\*Jira:\*\*|## Jira:)\s*([A-Z]+-\d+)/i);
    const epicMatch = content.match(/(?:\*\*Epic:\*\*|## Epic:)\s*(\w+)/i);

    // Determine status
    let status: TaskStatus = 'ready';
    const rawStatus = (statusMatch?.[1] || '').toLowerCase();
    if (rawStatus === 'done' || rawStatus === 'complete' || rawStatus === 'completed') {
      status = 'done';
    } else if (rawStatus === 'in_progress' || rawStatus === 'in progress' || rawStatus === 'inprogress') {
      status = 'in_progress';
    } else if (rawStatus === 'blocked') {
      status = 'blocked';
    } else if (rawStatus === 'pending') {
      status = 'pending';
    }

    // Check .done file for authoritative "done" status
    if (isTaskDone(id)) {
      status = 'done';
    }

    // Extract Summary section
    const summaryMatch = content.match(/## Summary\s*\n+([\s\S]*?)(?=\n## |$)/);
    const summary = summaryMatch?.[1]?.trim();

    // Extract Requirements section
    const reqMatch = content.match(/## Requirements\s*\n+([\s\S]*?)(?=\n## |$)/);
    const reqText = reqMatch?.[1] || '';
    const requirements = reqText
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(Boolean);

    // Extract Acceptance Criteria section
    const acMatch = content.match(/## Acceptance Criteria\s*\n+([\s\S]*?)(?=\n## |$)/);
    const acText = acMatch?.[1] || '';
    const acceptanceCriteria: AcceptanceCriterion[] = acText
      .split('\n')
      .filter(line => line.trim().match(/^-\s*\[[ x]\]/i))
      .map(line => ({
        text: line.replace(/^-\s*\[[ x]\]\s*/i, '').trim(),
        done: line.includes('[x]') || line.includes('[X]'),
      }))
      .filter(c => c.text);

    // Extract Technical Notes section
    const techMatch = content.match(/## Technical Notes\s*\n+([\s\S]*?)(?=\n## |$)/);
    const technicalNotes = techMatch?.[1]?.trim();

    // Get file modification time
    const stats = fs.statSync(filePath);
    const fileLastModified = stats.mtime.toISOString();

    return {
      id,
      title,
      status,
      assignee: assigneeMatch?.[1]?.trim(),
      estimate: estimateMatch ? parseInt(estimateMatch[1], 10) : undefined,
      priority: priorityMatch?.[1]?.trim() as LocalTask['priority'],
      jiraKey: jiraMatch?.[1] || getJiraKeyForTask(id),
      epicCode: epicMatch?.[1]?.trim() || id.split('-')[0],
      epicDir,
      filePath,
      summary,
      requirements: requirements.length > 0 ? requirements : undefined,
      acceptanceCriteria: acceptanceCriteria.length > 0 ? acceptanceCriteria : undefined,
      technicalNotes,
      fileLastModified,
    };
  } catch (e) {
    console.error(`Error parsing task file ${filePath}:`, e);
    return null;
  }
}

// =============================================================================
// Get All Tasks
// =============================================================================

export function getAllTasks(): Map<string, LocalTask> {
  const tasks = new Map<string, LocalTask>();
  const epicsDir = getEpicsDir();

  if (!fs.existsSync(epicsDir)) {
    console.error('No .tasks/epics directory found');
    return tasks;
  }

  const epicDirs = fs.readdirSync(epicsDir, { withFileTypes: true });
  for (const epicDirEntry of epicDirs) {
    if (!epicDirEntry.isDirectory()) continue;

    const epicPath = path.join(epicsDir, epicDirEntry.name);
    const files = fs.readdirSync(epicPath);

    for (const file of files) {
      // Skip _epic.md and non-md files
      if (file === '_epic.md' || !file.endsWith('.md')) continue;
      // Only process files matching TASKID pattern
      if (!file.match(/^[A-Z]+-\d+/)) continue;

      const task = parseTaskFile(path.join(epicPath, file));
      if (task) {
        tasks.set(task.id, task);
      }
    }
  }

  return tasks;
}

export function getTasksByEpic(epicCode: string): LocalTask[] {
  const tasks: LocalTask[] = [];
  const allTasks = getAllTasks();

  for (const task of allTasks.values()) {
    if (task.epicCode === epicCode) {
      tasks.push(task);
    }
  }

  return tasks.sort((a, b) => a.id.localeCompare(b.id));
}

export function getTaskById(taskId: string): LocalTask | null {
  const allTasks = getAllTasks();
  return allTasks.get(taskId) || null;
}

export function getTaskByJiraKey(jiraKey: string): LocalTask | null {
  const allTasks = getAllTasks();
  for (const task of allTasks.values()) {
    if (task.jiraKey === jiraKey) {
      return task;
    }
  }
  return null;
}

// =============================================================================
// Task File Update
// =============================================================================

export function updateTaskFile(taskId: string, updates: Partial<LocalTask>): boolean {
  const task = getTaskById(taskId);
  if (!task) {
    console.error(`Task ${taskId} not found`);
    return false;
  }

  try {
    let content = fs.readFileSync(task.filePath, 'utf-8');

    // Update status
    if (updates.status) {
      content = content.replace(
        /\*\*Status:\*\*\s*\w+/i,
        `**Status:** ${updates.status}`
      );
    }

    // Update assignee
    if (updates.assignee !== undefined) {
      if (content.includes('**Assignee:**')) {
        content = content.replace(
          /\*\*Assignee:\*\*\s*.*/i,
          `**Assignee:** ${updates.assignee || 'unassigned'}`
        );
      } else {
        // Add after Status line
        content = content.replace(
          /(\*\*Status:\*\*\s*\w+)/i,
          `$1\n**Assignee:** ${updates.assignee || 'unassigned'}`
        );
      }
    }

    // Update Jira key
    if (updates.jiraKey) {
      if (content.includes('**Jira:**')) {
        content = content.replace(
          /\*\*Jira:\*\*\s*.*/i,
          `**Jira:** ${updates.jiraKey}`
        );
      } else {
        // Add after Epic line
        content = content.replace(
          /(\*\*Epic:\*\*\s*.+)/i,
          `$1\n**Jira:** ${updates.jiraKey}`
        );
      }
    }

    // Update estimate
    if (updates.estimate !== undefined) {
      if (content.includes('**Estimate:**')) {
        content = content.replace(
          /\*\*Estimate:\*\*\s*\d*/i,
          `**Estimate:** ${updates.estimate}`
        );
      } else {
        // Add after Status line
        content = content.replace(
          /(\*\*Status:\*\*\s*\w+)/i,
          `$1\n**Estimate:** ${updates.estimate}`
        );
      }
    }

    fs.writeFileSync(task.filePath, content);
    return true;
  } catch (e) {
    console.error(`Error updating task file ${taskId}:`, e);
    return false;
  }
}

// =============================================================================
// Epic Parser
// =============================================================================

export function parseEpicFile(epicPath: string): RepoEpic | null {
  try {
    const content = fs.readFileSync(epicPath, 'utf-8');
    const epicDir = path.dirname(epicPath);

    // Extract epic code
    const codeMatch = content.match(/\*\*Code:\*\*\s*(\w+)/);
    const code = codeMatch?.[1] || path.basename(epicDir).toUpperCase().replace(/-/g, '');

    // Extract name from h1
    const nameMatch = content.match(/^#\s+Epic:\s*(.+)$/m);
    const name = nameMatch?.[1] || code;

    // Extract status
    const statusMatch = content.match(/\*\*Status:\*\*\s*(✅\s*Complete|Complete|In Progress|Ready)/i);
    let status: RepoEpic['status'] = 'Ready';
    if (statusMatch) {
      const s = statusMatch[1].toLowerCase();
      if (s.includes('complete')) status = 'Complete';
      else if (s.includes('progress')) status = 'In Progress';
    }

    // Extract owner
    const ownerMatch = content.match(/\*\*Owner:\*\*\s*(.+)/);
    const owner = ownerMatch?.[1]?.trim() || 'Unassigned';

    // Extract Overview section
    const overviewMatch = content.match(/## Overview\s*\n+([\s\S]*?)(?=\n## |$)/);
    const overview = overviewMatch?.[1]?.trim() || '';

    // Extract Goals section
    const goalsMatch = content.match(/## Goals\s*\n+([\s\S]*?)(?=\n## |$)/);
    const goalsText = goalsMatch?.[1] || '';
    const goals = goalsText
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(Boolean);

    // Extract Exit Criteria section
    const exitMatch = content.match(/## Exit Criteria\s*\n+([\s\S]*?)(?=\n## |$)/);
    const exitText = exitMatch?.[1] || '';
    const exitCriteria: AcceptanceCriterion[] = exitText
      .split('\n')
      .filter(line => line.trim().match(/^-\s*\[[ x]\]/i))
      .map(line => ({
        text: line.replace(/^-\s*\[[ x]\]\s*/i, '').trim(),
        done: line.includes('[x]') || line.includes('[X]'),
      }))
      .filter(c => c.text);

    // Get tasks from individual files in this epic directory
    const tasks: LocalTask[] = [];
    const files = fs.readdirSync(epicDir);
    for (const file of files) {
      if (file === '_epic.md' || !file.endsWith('.md')) continue;
      if (!file.match(/^[A-Z]+-\d+/)) continue;

      const task = parseTaskFile(path.join(epicDir, file));
      if (task) {
        tasks.push(task);
      }
    }

    // Sort tasks by ID
    tasks.sort((a, b) => a.id.localeCompare(b.id));

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return {
      code,
      name,
      status,
      owner,
      totalTasks,
      doneTasks,
      completionPct,
      overview,
      goals,
      exitCriteria,
      tasks,
    };
  } catch (e) {
    console.error(`Error parsing epic file ${epicPath}:`, e);
    return null;
  }
}

export function getAllEpics(): Map<string, RepoEpic> {
  const epics = new Map<string, RepoEpic>();
  const epicsDir = getEpicsDir();

  if (!fs.existsSync(epicsDir)) {
    console.error('No .tasks/epics directory found');
    return epics;
  }

  const dirs = fs.readdirSync(epicsDir, { withFileTypes: true });
  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;

    const epicFile = path.join(epicsDir, dir.name, '_epic.md');
    if (fs.existsSync(epicFile)) {
      const epic = parseEpicFile(epicFile);
      if (epic) {
        epics.set(epic.code, epic);
      }
    }
  }

  return epics;
}

// =============================================================================
// File Path Helpers
// =============================================================================

export function getTaskFilePath(taskId: string): string | null {
  const task = getTaskById(taskId);
  return task?.filePath || null;
}

export function getTaskFileLastModified(taskId: string): string | null {
  const task = getTaskById(taskId);
  return task?.fileLastModified || null;
}
