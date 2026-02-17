/**
 * Timestamp tracker for bidirectional sync
 *
 * Tracks when tasks were last modified locally vs remotely to determine
 * sync direction and detect conflicts.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { TimestampStore, TaskTimestamp, SyncDirection } from './types.js';
import { getTasksDir } from './config.js';

// =============================================================================
// Constants
// =============================================================================

const TIMESTAMPS_FILE = '.jira-timestamps.json';

function getTimestampsPath(): string {
  return path.join(getTasksDir(), TIMESTAMPS_FILE);
}

// =============================================================================
// File Operations
// =============================================================================

let cachedStore: TimestampStore | null = null;

export function loadTimestamps(): TimestampStore {
  if (cachedStore) return cachedStore;

  const filePath = getTimestampsPath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      cachedStore = JSON.parse(content);
      return cachedStore!;
    }
  } catch (e) {
    console.error('Error loading timestamps file:', e);
  }

  // Return empty store
  cachedStore = { tasks: {} };
  return cachedStore;
}

export function saveTimestamps(store: TimestampStore): void {
  const filePath = getTimestampsPath();
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2) + '\n');
  cachedStore = store;
}

export function clearTimestampCache(): void {
  cachedStore = null;
}

// =============================================================================
// Timestamp Operations
// =============================================================================

export function getTaskTimestamp(taskId: string): TaskTimestamp | null {
  const store = loadTimestamps();
  return store.tasks[taskId] || null;
}

export function setTaskTimestamp(taskId: string, timestamp: TaskTimestamp): void {
  const store = loadTimestamps();
  store.tasks[taskId] = timestamp;
  saveTimestamps(store);
}

export function recordLocalUpdate(taskId: string, timestamp: string): void {
  const store = loadTimestamps();
  const existing = store.tasks[taskId];

  store.tasks[taskId] = {
    localUpdated: timestamp,
    remoteUpdated: existing?.remoteUpdated || timestamp,
    lastSynced: existing?.lastSynced || timestamp,
  };

  saveTimestamps(store);
}

export function recordRemoteUpdate(taskId: string, timestamp: string): void {
  const store = loadTimestamps();
  const existing = store.tasks[taskId];

  store.tasks[taskId] = {
    localUpdated: existing?.localUpdated || timestamp,
    remoteUpdated: timestamp,
    lastSynced: existing?.lastSynced || timestamp,
  };

  saveTimestamps(store);
}

export function recordSyncComplete(taskId: string, localTime: string, remoteTime: string): void {
  const now = new Date().toISOString();
  const store = loadTimestamps();

  store.tasks[taskId] = {
    localUpdated: localTime,
    remoteUpdated: remoteTime,
    lastSynced: now,
  };
  store._lastGlobalSync = now;

  saveTimestamps(store);
}

export function recordGlobalSync(): void {
  const store = loadTimestamps();
  store._lastGlobalSync = new Date().toISOString();
  saveTimestamps(store);
}

// =============================================================================
// Sync Direction Detection
// =============================================================================

/**
 * Determine sync direction based on timestamps.
 *
 * @param taskId - Task identifier
 * @param localUpdated - File mtime (ISO string)
 * @param remoteUpdated - Jira updated field (ISO string)
 * @returns Sync direction: 'push', 'pull', 'none', or 'conflict'
 */
export function determineSyncDirection(
  taskId: string,
  localUpdated: string,
  remoteUpdated: string
): SyncDirection {
  const stored = getTaskTimestamp(taskId);

  // No previous sync record - assume local is source of truth
  if (!stored) {
    return 'push';
  }

  const localTime = new Date(localUpdated).getTime();
  const remoteTime = new Date(remoteUpdated).getTime();
  const lastSyncTime = new Date(stored.lastSynced).getTime();
  const storedLocalTime = new Date(stored.localUpdated).getTime();
  const storedRemoteTime = new Date(stored.remoteUpdated).getTime();

  // Check if local changed since last sync
  const localChanged = localTime > storedLocalTime;

  // Check if remote changed since last sync
  const remoteChanged = remoteTime > storedRemoteTime;

  // Both changed = conflict
  if (localChanged && remoteChanged) {
    return 'conflict';
  }

  // Only local changed = push
  if (localChanged && !remoteChanged) {
    return 'push';
  }

  // Only remote changed = pull
  if (!localChanged && remoteChanged) {
    return 'pull';
  }

  // Neither changed = no sync needed
  return 'none';
}

/**
 * Resolve conflict by picking the newer timestamp
 */
export function resolveConflictByNewer(
  localUpdated: string,
  remoteUpdated: string
): 'push' | 'pull' {
  const localTime = new Date(localUpdated).getTime();
  const remoteTime = new Date(remoteUpdated).getTime();
  return localTime > remoteTime ? 'push' : 'pull';
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize timestamp tracking for a task that has no record.
 * Assumes current state is "in sync".
 */
export function initializeTaskTimestamp(
  taskId: string,
  localUpdated: string,
  remoteUpdated: string
): void {
  const now = new Date().toISOString();
  setTaskTimestamp(taskId, {
    localUpdated,
    remoteUpdated,
    lastSynced: now,
  });
}

/**
 * Initialize timestamps for all mapped tasks.
 * Use when setting up bidirectional sync for the first time.
 */
export function initializeAllTimestamps(
  tasks: Array<{ taskId: string; localUpdated: string; remoteUpdated: string }>
): void {
  const store = loadTimestamps();
  const now = new Date().toISOString();

  for (const { taskId, localUpdated, remoteUpdated } of tasks) {
    // Only initialize if not already tracked
    if (!store.tasks[taskId]) {
      store.tasks[taskId] = {
        localUpdated,
        remoteUpdated,
        lastSynced: now,
      };
    }
  }

  store._lastGlobalSync = now;
  saveTimestamps(store);
}

// =============================================================================
// Utilities
// =============================================================================

export function getLastGlobalSync(): string | null {
  const store = loadTimestamps();
  return store._lastGlobalSync || null;
}

export function getAllTaskTimestamps(): Record<string, TaskTimestamp> {
  const store = loadTimestamps();
  return store.tasks;
}

export function removeTaskTimestamp(taskId: string): void {
  const store = loadTimestamps();
  delete store.tasks[taskId];
  saveTimestamps(store);
}
