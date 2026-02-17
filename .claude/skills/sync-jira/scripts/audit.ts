#!/usr/bin/env npx tsx
/**
 * Audit - Compare local task content vs Jira descriptions
 *
 * Identifies tasks that have rich local content but minimal Jira descriptions.
 *
 * Usage:
 *   npx tsx .claude/skills/sync-jira/scripts/audit.ts
 *   npx tsx .claude/skills/sync-jira/scripts/audit.ts --verbose
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __scriptDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__scriptDir, '../../../../.env.local') });

import { JiraClient } from './lib/jira-api.js';
import { requireJiraConfig, getProjectKey } from './lib/config.js';
import { getAllTasks } from './lib/task-parser.js';
import type { LocalTask } from './lib/types.js';

// =============================================================================
// Types
// =============================================================================

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    description: any;
    status: { name: string };
  };
}

interface AuditResult {
  key: string;
  taskId: string | null;
  summary: string;
  status: string;
  jiraContent: {
    paragraphs: number;
    bullets: number;
    hasCode: boolean;
    isEmpty: boolean;
  };
  localContent: {
    hasSummary: boolean;
    hasRequirements: boolean;
    hasAcceptance: boolean;
    hasTechnical: boolean;
  } | null;
  needsUpdate: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

function countAdfContent(adf: any): AuditResult['jiraContent'] {
  if (!adf || !adf.content) {
    return { paragraphs: 0, bullets: 0, hasCode: false, isEmpty: true };
  }

  let paragraphs = 0;
  let bullets = 0;
  let hasCode = false;

  function walk(node: any) {
    if (!node) return;
    if (node.type === 'paragraph') paragraphs++;
    if (node.type === 'bulletList' || node.type === 'orderedList') bullets++;
    if (node.type === 'codeBlock') hasCode = true;
    if (node.content) node.content.forEach(walk);
  }

  adf.content.forEach(walk);
  return { paragraphs, bullets, hasCode, isEmpty: paragraphs === 0 };
}

function getLocalContent(task: LocalTask): AuditResult['localContent'] {
  return {
    hasSummary: !!task.summary,
    hasRequirements: (task.requirements?.length || 0) > 0,
    hasAcceptance: (task.acceptanceCriteria?.length || 0) > 0,
    hasTechnical: !!task.technicalNotes,
  };
}

// =============================================================================
// Fetch All Stories
// =============================================================================

async function fetchAllStories(client: JiraClient): Promise<JiraIssue[]> {
  const projectKey = getProjectKey();
  const allIssues: JiraIssue[] = [];
  let nextPageToken: string | undefined;

  process.stdout.write('Fetching stories from Jira');

  do {
    const response = await client.searchIssuesPaginated(
      `project = ${projectKey} AND issuetype = Story ORDER BY key ASC`,
      ['summary', 'description', 'status'],
      100,
      nextPageToken
    );

    allIssues.push(...response.issues);
    nextPageToken = response.nextPageToken;
    process.stdout.write('.');

    if (response.isLast) break;
  } while (nextPageToken);

  console.log(` ${allIssues.length} found\n`);
  return allIssues;
}

// =============================================================================
// Main Audit Function
// =============================================================================

export async function auditDescriptions(options: { verbose?: boolean } = {}): Promise<AuditResult[]> {
  const jiraConfig = requireJiraConfig();
  const client = new JiraClient(jiraConfig);

  // Fetch all stories from Jira
  const stories = await fetchAllStories(client);

  // Get all local tasks
  const localTasks = getAllTasks();

  // Build audit results
  const results: AuditResult[] = [];

  for (const story of stories) {
    // Extract task ID from summary like "[SEO-001] Title"
    const match = story.fields.summary.match(/^\[([A-Z]+-\d+)\]/);
    const taskId = match ? match[1] : null;

    const jiraContent = countAdfContent(story.fields.description);
    const localTask = taskId ? localTasks.get(taskId) : undefined;
    const localContent = localTask ? getLocalContent(localTask) : null;

    // Check if local has rich content but Jira is minimal
    const jiraIsMinimal = jiraContent.paragraphs <= 2 && jiraContent.bullets === 0;
    const localHasRichContent = localContent && (
      localContent.hasSummary ||
      localContent.hasRequirements ||
      localContent.hasAcceptance ||
      localContent.hasTechnical
    );

    results.push({
      key: story.key,
      taskId,
      summary: story.fields.summary,
      status: story.fields.status.name,
      jiraContent,
      localContent,
      needsUpdate: !!(jiraIsMinimal && localHasRichContent),
    });
  }

  // Sort by key
  results.sort((a, b) => {
    const aNum = parseInt(a.key.replace(/[A-Z]+-/, ''));
    const bNum = parseInt(b.key.replace(/[A-Z]+-/, ''));
    return aNum - bNum;
  });

  return results;
}

// =============================================================================
// Print Report
// =============================================================================

export function printAuditReport(results: AuditResult[], verbose = false): void {
  const needsUpdate = results.filter(r => r.needsUpdate);
  const withFull = needsUpdate.filter(r =>
    r.localContent?.hasSummary &&
    r.localContent?.hasRequirements &&
    r.localContent?.hasAcceptance
  );
  const withPartial = needsUpdate.filter(r => !withFull.includes(r));

  console.log('='.repeat(80));
  console.log('DESCRIPTION AUDIT REPORT');
  console.log('='.repeat(80));

  if (needsUpdate.length === 0) {
    console.log('\n✅ All tasks with local content already have rich Jira descriptions!\n');
    return;
  }

  console.log(`\nFound ${needsUpdate.length} task(s) with rich local content but minimal Jira description:\n`);

  if (withFull.length > 0) {
    console.log(`📋 FULL CONTENT (${withFull.length} tasks) - Summary + Requirements + Acceptance Criteria:\n`);
    for (const task of withFull) {
      const sections: string[] = [];
      if (task.localContent?.hasSummary) sections.push('S');
      if (task.localContent?.hasRequirements) sections.push('R');
      if (task.localContent?.hasAcceptance) sections.push('AC');
      if (task.localContent?.hasTechnical) sections.push('TN');

      if (verbose) {
        console.log(`   ${task.key.padEnd(8)} [${task.taskId}] [${sections.join('+')}]`);
        console.log(`            ${task.summary.slice(0, 60)}`);
      } else {
        console.log(`   ${task.key.padEnd(8)} [${task.taskId?.padEnd(12) || 'unknown'.padEnd(12)}] ${task.summary.slice(0, 50)}`);
      }
    }
  }

  if (withPartial.length > 0) {
    console.log(`\n📝 PARTIAL CONTENT (${withPartial.length} tasks):\n`);
    for (const task of withPartial) {
      const sections: string[] = [];
      if (task.localContent?.hasSummary) sections.push('Summary');
      if (task.localContent?.hasRequirements) sections.push('Req');
      if (task.localContent?.hasAcceptance) sections.push('AC');
      if (task.localContent?.hasTechnical) sections.push('Tech');
      console.log(`   ${task.key.padEnd(8)} [${task.taskId}] (${sections.join(', ')})`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total stories in Jira:        ${results.length}`);
  console.log(`Need description update:      ${needsUpdate.length}`);
  console.log(`  - Full content available:   ${withFull.length}`);
  console.log(`  - Partial content:          ${withPartial.length}`);
  console.log(`\nTo sync descriptions, run:`);
  console.log(`  npx tsx index.ts descriptions --apply\n`);
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  npx tsx audit.ts [options]

Options:
  --verbose, -v    Show detailed output for each task
  --help, -h       Show this help

Description:
  Compares local task files with Jira stories to identify which tasks
  have rich content locally (Summary, Requirements, Acceptance Criteria,
  Technical Notes) but only minimal descriptions in Jira.

  Use this before running 'descriptions --apply' to see what will be synced.
`);
    return;
  }

  const results = await auditDescriptions({ verbose });
  printAuditReport(results, verbose);
}

// Only run if executed directly
const isMainModule = process.argv[1]?.includes('audit');
if (isMainModule) {
  main().catch(console.error);
}
