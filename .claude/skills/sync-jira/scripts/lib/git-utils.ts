/**
 * Git history utilities for task audit
 *
 * Provides functions to search git history for task implementation evidence,
 * correlate authors to canonical names, and check file blame.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { GitEvidence, DeveloperInfo } from './types.js';
import { loadConfig, getTasksDir } from './config.js';

// =============================================================================
// Constants
// =============================================================================

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const CHANGELOG_PATH = path.join(PROJECT_ROOT, 'CHANGELOG.md');

// =============================================================================
// Developer Identity Resolution
// =============================================================================

/**
 * Build a lookup map from git author names to canonical developer names
 */
export function buildGitAuthorMap(): Map<string, string> {
  const config = loadConfig();
  const developers = config.developers || {};
  const authorMap = new Map<string, string>();

  for (const [canonicalName, mapping] of Object.entries(developers)) {
    if (!mapping || typeof mapping !== 'object') continue;

    // Map gitAliases
    if (mapping.gitAliases) {
      for (const alias of mapping.gitAliases) {
        authorMap.set(alias.toLowerCase(), canonicalName);
      }
    }

    // Map githubUsername
    if (mapping.githubUsername) {
      authorMap.set(mapping.githubUsername.toLowerCase(), canonicalName);
    }

    // Map canonical name itself
    authorMap.set(canonicalName.toLowerCase(), canonicalName);
  }

  return authorMap;
}

/**
 * Build a lookup map from task aliases (Tech Lead, Dev A) to canonical names
 */
export function buildTaskAliasMap(): Map<string, string> {
  const config = loadConfig();
  const developers = config.developers || {};
  const aliasMap = new Map<string, string>();

  for (const [canonicalName, mapping] of Object.entries(developers)) {
    if (!mapping || typeof mapping !== 'object') continue;

    // Map taskAliases
    if (mapping.taskAliases) {
      for (const alias of mapping.taskAliases) {
        aliasMap.set(alias.toLowerCase(), canonicalName);
      }
    }

    // Legacy aliases field
    if (mapping.aliases) {
      for (const alias of mapping.aliases) {
        aliasMap.set(alias.toLowerCase(), canonicalName);
      }
    }

    // Map canonical name itself
    aliasMap.set(canonicalName.toLowerCase(), canonicalName);
  }

  return aliasMap;
}

/**
 * Resolve a git author name to canonical developer name
 */
export function resolveGitAuthor(gitAuthor: string): string | null {
  const authorMap = buildGitAuthorMap();
  return authorMap.get(gitAuthor.toLowerCase()) || null;
}

/**
 * Resolve a task assignee (which might be an alias) to canonical name
 */
export function resolveTaskAssignee(assignee: string): string | null {
  if (!assignee || assignee === '-' || assignee.toLowerCase() === 'unassigned') {
    return null;
  }

  const aliasMap = buildTaskAliasMap();
  return aliasMap.get(assignee.toLowerCase()) || assignee;
}

// =============================================================================
// Git History Search
// =============================================================================

/**
 * Search git history for commits referencing a task ID
 */
export function findCommitsForTask(taskId: string): Array<{
  hash: string;
  author: string;
  date: Date;
  message: string;
}> {
  const results: Array<{
    hash: string;
    author: string;
    date: Date;
    message: string;
  }> = [];

  // Search patterns: [TASK-ID], (TASK-ID), TASK-ID in message
  const patterns = [
    taskId,
    `\\[${taskId}\\]`,
    `\\(${taskId}\\)`,
  ];

  for (const pattern of patterns) {
    try {
      const output = execSync(
        `git log --all --format="%H|%an|%aI|%s" --grep="${pattern}" 2>/dev/null`,
        { encoding: 'utf-8', cwd: PROJECT_ROOT, maxBuffer: 10 * 1024 * 1024 }
      );

      for (const line of output.trim().split('\n')) {
        if (!line) continue;
        const [hash, author, dateStr, ...messageParts] = line.split('|');
        const message = messageParts.join('|');

        // Avoid duplicates
        if (!results.some(r => r.hash === hash)) {
          results.push({
            hash,
            author,
            date: new Date(dateStr),
            message,
          });
        }
      }
    } catch {
      // No matches or git error
    }
  }

  // Sort by date descending (most recent first)
  results.sort((a, b) => b.date.getTime() - a.date.getTime());

  return results;
}

/**
 * Search CHANGELOG.md for task ID mentions
 */
export function findChangelogEntries(taskId: string): Array<{
  line: string;
  section?: string;
}> {
  const results: Array<{ line: string; section?: string }> = [];

  try {
    if (!fs.existsSync(CHANGELOG_PATH)) return results;

    const content = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      // Track section headers
      if (line.startsWith('## ')) {
        currentSection = line.slice(3).trim();
      }

      // Check if task ID is mentioned
      if (line.includes(taskId)) {
        results.push({
          line: line.trim(),
          section: currentSection,
        });
      }
    }
  } catch {
    // CHANGELOG not accessible
  }

  return results;
}

/**
 * Get git blame for specific files to find who authored them
 */
export function getBlameForFiles(filePaths: string[]): Map<string, {
  author: string;
  date: Date;
  hash: string;
}> {
  const blameMap = new Map<string, { author: string; date: Date; hash: string }>();

  for (const filePath of filePaths) {
    const fullPath = path.join(PROJECT_ROOT, filePath);

    // Skip if file doesn't exist
    if (!fs.existsSync(fullPath)) continue;

    try {
      // Get the most recent commit for this file
      const output = execSync(
        `git log -1 --format="%H|%an|%aI" -- "${filePath}" 2>/dev/null`,
        { encoding: 'utf-8', cwd: PROJECT_ROOT }
      );

      const line = output.trim();
      if (!line) continue;

      const [hash, author, dateStr] = line.split('|');
      blameMap.set(filePath, {
        author,
        date: new Date(dateStr),
        hash,
      });
    } catch {
      // File not in git or git error
    }
  }

  return blameMap;
}

/**
 * Extract file paths mentioned in a task file
 * Looks for patterns like "File paths:" or common file path patterns
 */
export function extractFilePathsFromTask(taskContent: string): string[] {
  const paths: string[] = [];

  // Look for "File paths:" section
  const filePathsMatch = taskContent.match(/File paths?:\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i);
  if (filePathsMatch) {
    const fileSection = filePathsMatch[1];
    // Extract paths like `path/to/file.ts` or path/to/file.ts
    const pathMatches = fileSection.matchAll(/`([^`]+\.\w+)`|(?:^|\s)((?:apps|packages|src|lib)\/[^\s,]+)/gm);
    for (const match of pathMatches) {
      const filePath = match[1] || match[2];
      if (filePath && !paths.includes(filePath)) {
        paths.push(filePath);
      }
    }
  }

  // Also look for explicit file paths in code blocks
  const codeBlockMatches = taskContent.matchAll(/(?:apps|packages|src|lib)\/[\w\-\/]+\.\w+/g);
  for (const match of codeBlockMatches) {
    if (!paths.includes(match[0])) {
      paths.push(match[0]);
    }
  }

  return paths;
}

// =============================================================================
// Evidence Collection
// =============================================================================

/**
 * Collect all git evidence for a task
 */
export function findGitEvidenceForTask(taskId: string, taskContent?: string): GitEvidence {
  // 1. Search commit messages
  const commits = findCommitsForTask(taskId);

  if (commits.length > 0) {
    const mostRecent = commits[0];
    const canonicalAuthor = resolveGitAuthor(mostRecent.author);

    return {
      implementedBy: canonicalAuthor || mostRecent.author,
      implementedAt: mostRecent.date,
      commitHash: mostRecent.hash,
      commitMessage: mostRecent.message,
      confidence: canonicalAuthor ? 'high' : 'medium',
      source: 'commit-message',
    };
  }

  // 2. Search CHANGELOG
  const changelogEntries = findChangelogEntries(taskId);
  if (changelogEntries.length > 0) {
    return {
      confidence: 'low',
      source: 'changelog',
      commitMessage: changelogEntries[0].line,
    };
  }

  // 3. Check file blame if task content provided
  if (taskContent) {
    const filePaths = extractFilePathsFromTask(taskContent);
    if (filePaths.length > 0) {
      const blameInfo = getBlameForFiles(filePaths);

      // Find the most recent file modification
      let mostRecentFile: string | null = null;
      let mostRecentDate: Date | null = null;

      for (const [file, info] of blameInfo) {
        if (!mostRecentDate || info.date > mostRecentDate) {
          mostRecentDate = info.date;
          mostRecentFile = file;
        }
      }

      if (mostRecentFile && blameInfo.has(mostRecentFile)) {
        const info = blameInfo.get(mostRecentFile)!;
        const canonicalAuthor = resolveGitAuthor(info.author);

        return {
          implementedBy: canonicalAuthor || info.author,
          implementedAt: info.date,
          commitHash: info.hash,
          filesTouched: Array.from(blameInfo.keys()),
          confidence: canonicalAuthor ? 'medium' : 'low',
          source: 'file-blame',
        };
      }
    }
  }

  // No evidence found
  return {
    confidence: 'none',
    source: 'none',
  };
}

// =============================================================================
// Done File Operations
// =============================================================================

/**
 * Get all task IDs from .done file
 */
export function getDoneFileTaskIds(): Set<string> {
  const donePath = path.join(getTasksDir(), '.done');
  const taskIds = new Set<string>();

  try {
    const content = fs.readFileSync(donePath, 'utf-8');
    const matches = content.matchAll(/^([A-Z]+-\d+)/gm);
    for (const match of matches) {
      taskIds.add(match[1]);
    }
  } catch {
    // .done file doesn't exist
  }

  return taskIds;
}

/**
 * Add a task ID to the .done file
 */
export function addToDoneFile(taskId: string): void {
  const donePath = path.join(getTasksDir(), '.done');

  try {
    let content = '';
    if (fs.existsSync(donePath)) {
      content = fs.readFileSync(donePath, 'utf-8');
    }

    // Check if already present as standalone line (not in a comment)
    const linePattern = new RegExp(`^${taskId}$`, 'm');
    if (linePattern.test(content)) return;

    // Add to end
    const newContent = content.trim() + '\n' + taskId + '\n';
    fs.writeFileSync(donePath, newContent);
  } catch (e) {
    console.error(`Failed to add ${taskId} to .done file:`, e);
  }
}

/**
 * Remove a task ID from the .done file
 */
export function removeFromDoneFile(taskId: string): void {
  const donePath = path.join(getTasksDir(), '.done');

  try {
    if (!fs.existsSync(donePath)) return;

    const content = fs.readFileSync(donePath, 'utf-8');
    const lines = content.split('\n').filter(line => !line.startsWith(taskId));
    fs.writeFileSync(donePath, lines.join('\n'));
  } catch (e) {
    console.error(`Failed to remove ${taskId} from .done file:`, e);
  }
}
