/**
 * Shared TypeScript interfaces for sync-jira skill
 */

// =============================================================================
// Local Task Representation
// =============================================================================

export type TaskStatus = 'ready' | 'pending' | 'in_progress' | 'blocked' | 'done';

export interface LocalTask {
  id: string;                    // SEO-001
  title: string;
  status: TaskStatus;
  assignee?: string;
  estimate?: number;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  jiraKey?: string;              // CC-106
  epicCode: string;              // SEO
  epicDir: string;               // seo-system
  filePath: string;              // Full path to task file

  // Rich content
  summary?: string;
  requirements?: string[];
  acceptanceCriteria?: AcceptanceCriterion[];
  technicalNotes?: string;

  // Timestamps
  fileLastModified?: string;     // File system mtime (ISO)
}

export interface AcceptanceCriterion {
  text: string;
  done: boolean;
}

// =============================================================================
// Jira Task Representation
// =============================================================================

export interface JiraTask {
  key: string;                   // CC-106
  summary: string;
  status: string;                // "To Do", "In Progress", "Done"
  assignee?: JiraUser;
  storyPoints?: number;
  labels: string[];
  description?: AdfDocument;
  updated: string;               // ISO timestamp from Jira

  // Parent linkage
  parentKey?: string;            // Epic key
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
}

export interface JiraTransition {
  id: string;
  name: string;
  to: { name: string };
}

// =============================================================================
// Atlassian Document Format (ADF)
// =============================================================================

export interface AdfDocument {
  type: 'doc';
  version: 1;
  content: AdfNode[];
}

export type AdfNode =
  | AdfParagraph
  | AdfHeading
  | AdfBulletList
  | AdfOrderedList
  | AdfTaskList
  | AdfCodeBlock
  | AdfRule
  | AdfPanel;

export interface AdfParagraph {
  type: 'paragraph';
  content?: AdfInlineNode[];
}

export interface AdfHeading {
  type: 'heading';
  attrs: { level: 1 | 2 | 3 | 4 | 5 | 6 };
  content?: AdfInlineNode[];
}

export interface AdfBulletList {
  type: 'bulletList';
  content: AdfListItem[];
}

export interface AdfOrderedList {
  type: 'orderedList';
  content: AdfListItem[];
}

export interface AdfListItem {
  type: 'listItem';
  content: AdfNode[];
}

export interface AdfTaskList {
  type: 'taskList';
  attrs: { localId: string };
  content: AdfTaskItem[];
}

export interface AdfTaskItem {
  type: 'taskItem';
  attrs: { localId: string; state: 'TODO' | 'DONE' };
  content: AdfInlineNode[];
}

export interface AdfCodeBlock {
  type: 'codeBlock';
  attrs?: { language?: string };
  content?: AdfTextNode[];
}

export interface AdfRule {
  type: 'rule';
}

export interface AdfPanel {
  type: 'panel';
  attrs: { panelType: 'info' | 'note' | 'success' | 'warning' | 'error' };
  content: AdfNode[];
}

export type AdfInlineNode = AdfTextNode | AdfHardBreak;

export interface AdfTextNode {
  type: 'text';
  text: string;
  marks?: AdfMark[];
}

export interface AdfHardBreak {
  type: 'hardBreak';
}

export type AdfMark =
  | { type: 'strong' }
  | { type: 'em' }
  | { type: 'code' }
  | { type: 'link'; attrs: { href: string } };

// =============================================================================
// Sync Types
// =============================================================================

export type SyncDirection = 'push' | 'pull' | 'none' | 'conflict';

export type SyncAction = 'created' | 'updated' | 'deleted' | 'skipped' | 'conflict';

export interface SyncResult {
  taskId: string;
  jiraKey?: string;
  action: SyncAction;
  direction: SyncDirection;
  changes?: string[];
  error?: string;
  conflictInfo?: ConflictInfo;
}

export interface ConflictInfo {
  fields: ConflictField[];
  localUpdated: string;
  remoteUpdated: string;
  lastSynced?: string;
}

export interface ConflictField {
  field: string;
  localValue: unknown;
  remoteValue: unknown;
}

export type ConflictResolution = 'local' | 'remote' | 'prompt' | 'newer' | 'skip';

export interface SyncOptions {
  apply: boolean;
  direction?: 'auto' | 'push' | 'pull';
  taskId?: string;
  epicKey?: string;
  force?: boolean;
  resolveConflicts?: ConflictResolution;
}

// =============================================================================
// Timestamp Tracking
// =============================================================================

export interface TaskTimestamp {
  localUpdated: string;          // File mtime (ISO)
  remoteUpdated: string;         // Jira updated field (ISO)
  lastSynced: string;            // When we last synced (ISO)
}

export interface TimestampStore {
  _lastGlobalSync?: string;
  tasks: Record<string, TaskTimestamp>;
}

// =============================================================================
// Developer Mapping
// =============================================================================

export interface DeveloperInfo {
  jiraAccountId: string;
  githubUsername?: string;
  gitAliases?: string[];     // Git author names (from git log)
  taskAliases?: string[];    // Task file aliases (Tech Lead, Dev A, etc.)
  aliases?: string[];        // Legacy field for backward compatibility
}

// Can be either new format (object) or old format (string)
export type DeveloperMapping = DeveloperInfo | string | null;

// =============================================================================
// Audit Types
// =============================================================================

export interface GitEvidence {
  implementedBy?: string;      // Canonical name from git author
  implementedAt?: Date;        // Commit date
  commitHash?: string;
  commitMessage?: string;
  filesTouched?: string[];     // Files mentioned in task that were modified
  confidence: 'high' | 'medium' | 'low' | 'none';
  source: 'commit-message' | 'changelog' | 'file-blame' | 'none';
}

export interface TaskEvidence {
  taskId: string;
  localStatus: string;
  localAssignee?: string;
  jiraKey?: string;
  jiraStatus?: string;
  jiraAssignee?: string;
  gitEvidence: GitEvidence;
  discrepancies: string[];
  recommendedFixes: RecommendedFix[];
}

export interface RecommendedFix {
  target: 'local' | 'jira' | 'done-file';
  field: string;
  currentValue?: string;
  newValue: string;
  reason: string;
}

export interface AuditReport {
  totalTasks: number;
  consistent: number;
  discrepancies: TaskEvidence[];
  missingEvidence: TaskEvidence[];
  doneFileMismatch: {
    inDoneNotInEpics: string[];
    inEpicsNotInDone: string[];
  };
}

export interface DeveloperMap {
  [name: string]: DeveloperMapping;
}

// =============================================================================
// Configuration
// =============================================================================

export interface EpicMapping {
  jiraKey: string;
  jiraName: string;
  repoEpics: string[];
  owner?: string | null;
  notes?: string;
  verified?: boolean;
  createdAt?: string;
}

export interface PendingEpic {
  jiraName: string;
  repoEpics: string[];
  owner?: string | null;
  notes?: string;
}

export interface StatusMapping {
  ready: string;
  pending: string;
  in_progress: string;
  blocked: string;
  done: string;
}

export interface MappingFile {
  _comment?: string;
  _project?: string;
  _lastSync?: string;

  developers?: DeveloperMap;
  taskMappings?: Record<string, string>;
  statusMapping?: StatusMapping;

  mapping: EpicMapping[];
  pendingEpics?: PendingEpic[];
}

// =============================================================================
// Jira API Types
// =============================================================================

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface CreateIssueFields {
  project: { key: string };
  summary: string;
  issuetype: { name: string };
  description?: AdfDocument;
  parent?: { key: string };
  assignee?: { accountId: string };
  labels?: string[];
  // Custom fields
  [key: string]: unknown;
}

export interface IssueUpdate {
  fields?: Partial<CreateIssueFields>;
  update?: {
    labels?: Array<{ add?: string; remove?: string }>;
  };
}

// =============================================================================
// Epic Aggregation
// =============================================================================

export interface RepoEpic {
  code: string;
  name: string;
  status: 'Complete' | 'In Progress' | 'Ready';
  owner: string;
  totalTasks: number;
  doneTasks: number;
  completionPct: number;
  overview: string;
  goals: string[];
  exitCriteria: AcceptanceCriterion[];
  tasks: LocalTask[];
}

export interface AggregatedEpic {
  jiraKey: string;
  jiraName: string;
  repoEpics: RepoEpic[];
  totalTasks: number;
  doneTasks: number;
  completionPct: number;
  status: 'Done' | 'In Progress' | 'To Do';
  owners: string[];
}
