/**
 * Markdown to Atlassian Document Format (ADF) converter
 *
 * Converts task file markdown to Jira's ADF format for rich descriptions.
 */

import type {
  LocalTask,
  AdfDocument,
  AdfNode,
  AdfParagraph,
  AdfHeading,
  AdfBulletList,
  AdfTaskList,
  AdfCodeBlock,
  AdfTextNode,
  AdfInlineNode,
  AdfMark,
} from './types.js';

// =============================================================================
// Main Converter
// =============================================================================

/**
 * Convert a LocalTask to an ADF document for Jira description
 */
export function taskToAdf(task: LocalTask): AdfDocument {
  const content: AdfNode[] = [];

  // Summary section
  if (task.summary) {
    content.push(heading(2, 'Summary'));
    content.push(...markdownToAdfNodes(task.summary));
  }

  // Requirements section
  if (task.requirements && task.requirements.length > 0) {
    content.push(heading(2, 'Requirements'));
    content.push(bulletList(task.requirements.map(req => [text(req)])));
  }

  // Acceptance Criteria section
  if (task.acceptanceCriteria && task.acceptanceCriteria.length > 0) {
    content.push(heading(2, 'Acceptance Criteria'));
    content.push(taskList(
      task.acceptanceCriteria.map(ac => ({
        text: ac.text,
        done: ac.done,
      }))
    ));
  }

  // Technical Notes section
  if (task.technicalNotes) {
    content.push(heading(2, 'Technical Notes'));
    content.push(...markdownToAdfNodes(task.technicalNotes));
  }

  // Footer with repo link
  content.push(rule());
  content.push(paragraph([
    text('📁 ', []),
    text('Repo task: ', [{ type: 'strong' }]),
    text(task.id, [{ type: 'code' }]),
    text(' in ', []),
    text(task.epicDir, [{ type: 'code' }]),
  ]));

  return {
    type: 'doc',
    version: 1,
    content,
  };
}

/**
 * Convert plain markdown text to ADF nodes
 */
export function markdownToAdf(markdown: string): AdfDocument {
  return {
    type: 'doc',
    version: 1,
    content: markdownToAdfNodes(markdown),
  };
}

// =============================================================================
// Markdown Parser
// =============================================================================

function markdownToAdfNodes(markdown: string): AdfNode[] {
  const nodes: AdfNode[] = [];
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Code block
    if (line.trim().startsWith('```')) {
      const { node, endIndex } = parseCodeBlock(lines, i);
      nodes.push(node);
      i = endIndex + 1;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      nodes.push(heading(level, headingMatch[2]));
      i++;
      continue;
    }

    // Bullet list
    if (line.trim().match(/^[-*]\s/)) {
      const { node, endIndex } = parseBulletList(lines, i);
      nodes.push(node);
      i = endIndex + 1;
      continue;
    }

    // Checkbox list
    if (line.trim().match(/^[-*]\s*\[[ x]\]/i)) {
      const { node, endIndex } = parseCheckboxList(lines, i);
      nodes.push(node);
      i = endIndex + 1;
      continue;
    }

    // Numbered list
    if (line.trim().match(/^\d+\.\s/)) {
      const { node, endIndex } = parseNumberedList(lines, i);
      nodes.push(node);
      i = endIndex + 1;
      continue;
    }

    // Horizontal rule
    if (line.trim().match(/^[-*_]{3,}$/)) {
      nodes.push(rule());
      i++;
      continue;
    }

    // Regular paragraph
    const { node, endIndex } = parseParagraph(lines, i);
    nodes.push(node);
    i = endIndex + 1;
  }

  return nodes;
}

// =============================================================================
// Block Parsers
// =============================================================================

function parseCodeBlock(
  lines: string[],
  startIndex: number
): { node: AdfCodeBlock; endIndex: number } {
  const firstLine = lines[startIndex].trim();
  const language = firstLine.replace(/^```/, '').trim() || undefined;

  let endIndex = startIndex + 1;
  const codeLines: string[] = [];

  while (endIndex < lines.length && !lines[endIndex].trim().startsWith('```')) {
    codeLines.push(lines[endIndex]);
    endIndex++;
  }

  return {
    node: codeBlock(codeLines.join('\n'), language),
    endIndex,
  };
}

function parseBulletList(
  lines: string[],
  startIndex: number
): { node: AdfBulletList; endIndex: number } {
  const items: AdfInlineNode[][] = [];
  let i = startIndex;

  while (i < lines.length && lines[i].trim().match(/^[-*]\s/)) {
    const content = lines[i].trim().replace(/^[-*]\s+/, '');
    items.push(parseInlineContent(content));
    i++;
  }

  return {
    node: bulletList(items),
    endIndex: i - 1,
  };
}

function parseCheckboxList(
  lines: string[],
  startIndex: number
): { node: AdfTaskList; endIndex: number } {
  const items: Array<{ text: string; done: boolean }> = [];
  let i = startIndex;

  while (i < lines.length && lines[i].trim().match(/^[-*]\s*\[[ x]\]/i)) {
    const line = lines[i].trim();
    const done = line.includes('[x]') || line.includes('[X]');
    const text = line.replace(/^[-*]\s*\[[ x]\]\s*/i, '');
    items.push({ text, done });
    i++;
  }

  return {
    node: taskList(items),
    endIndex: i - 1,
  };
}

function parseNumberedList(
  lines: string[],
  startIndex: number
): { node: AdfNode; endIndex: number } {
  const items: AdfInlineNode[][] = [];
  let i = startIndex;

  while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
    const content = lines[i].trim().replace(/^\d+\.\s+/, '');
    items.push(parseInlineContent(content));
    i++;
  }

  return {
    node: {
      type: 'orderedList',
      content: items.map(item => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: item }],
      })),
    } as AdfNode,
    endIndex: i - 1,
  };
}

function parseParagraph(
  lines: string[],
  startIndex: number
): { node: AdfParagraph; endIndex: number } {
  let i = startIndex;
  const paragraphLines: string[] = [];

  // Collect lines until we hit an empty line or special syntax
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) break;
    if (line.trim().startsWith('#')) break;
    if (line.trim().match(/^[-*]\s/)) break;
    if (line.trim().match(/^\d+\.\s/)) break;
    if (line.trim().startsWith('```')) break;
    if (line.trim().match(/^[-*_]{3,}$/)) break;

    paragraphLines.push(line);
    i++;
  }

  const text = paragraphLines.join(' ');
  return {
    node: paragraph(parseInlineContent(text)),
    endIndex: i - 1,
  };
}

// =============================================================================
// Inline Parser
// =============================================================================

function parseInlineContent(text: string): AdfInlineNode[] {
  const nodes: AdfInlineNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Code (backticks)
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      nodes.push({ type: 'text', text: codeMatch[1], marks: [{ type: 'code' }] });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold (**text**)
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      nodes.push({ type: 'text', text: boldMatch[1], marks: [{ type: 'strong' }] });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic (*text* or _text_)
    const italicMatch = remaining.match(/^[*_]([^*_]+)[*_]/);
    if (italicMatch) {
      nodes.push({ type: 'text', text: italicMatch[1], marks: [{ type: 'em' }] });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Link [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      nodes.push({
        type: 'text',
        text: linkMatch[1],
        marks: [{ type: 'link', attrs: { href: linkMatch[2] } }],
      });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Plain text - consume until next special character
    const plainMatch = remaining.match(/^[^`*_\[]+/);
    if (plainMatch) {
      nodes.push({ type: 'text', text: plainMatch[0] });
      remaining = remaining.slice(plainMatch[0].length);
      continue;
    }

    // Consume single special character as plain text
    nodes.push({ type: 'text', text: remaining[0] });
    remaining = remaining.slice(1);
  }

  return nodes;
}

// =============================================================================
// Node Builders
// =============================================================================

function text(content: string, marks?: AdfMark[]): AdfTextNode {
  const node: AdfTextNode = { type: 'text', text: content };
  if (marks && marks.length > 0) {
    node.marks = marks;
  }
  return node;
}

function paragraph(content: AdfInlineNode[]): AdfParagraph {
  return { type: 'paragraph', content };
}

function heading(level: 1 | 2 | 3 | 4 | 5 | 6, content: string): AdfHeading {
  return {
    type: 'heading',
    attrs: { level },
    content: [{ type: 'text', text: content }],
  };
}

function bulletList(items: AdfInlineNode[][]): AdfBulletList {
  return {
    type: 'bulletList',
    content: items.map(item => ({
      type: 'listItem',
      content: [{ type: 'paragraph', content: item }],
    })),
  };
}

function taskList(items: Array<{ text: string; done: boolean }>): AdfTaskList {
  return {
    type: 'taskList',
    attrs: { localId: `tasklist-${Date.now()}` },
    content: items.map((item, i) => ({
      type: 'taskItem',
      attrs: {
        localId: `task-${Date.now()}-${i}`,
        state: item.done ? 'DONE' : 'TODO',
      },
      content: [{ type: 'text', text: item.text }],
    })),
  };
}

function codeBlock(content: string, language?: string): AdfCodeBlock {
  const node: AdfCodeBlock = {
    type: 'codeBlock',
    content: [{ type: 'text', text: content }],
  };
  if (language) {
    node.attrs = { language };
  }
  return node;
}

function rule(): AdfNode {
  return { type: 'rule' };
}

// =============================================================================
// Export Helpers
// =============================================================================

export { paragraph, heading, bulletList, taskList, codeBlock, text };
