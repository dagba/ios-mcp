/**
 * Trace file cleanup utilities
 */

import fs from 'fs/promises';
import path from 'path';

const TRACES_DIR = '/tmp/instruments-traces';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Clean up trace directories older than 24 hours
 * Runs lazily before starting new profiling sessions
 */
export async function cleanupOldTraces(): Promise<void> {
  try {
    const entries = await fs.readdir(TRACES_DIR);
    const now = Date.now();

    for (const entry of entries) {
      const fullPath = path.join(TRACES_DIR, entry);

      try {
        const stats = await fs.stat(fullPath);

        // Only process directories
        if (!stats.isDirectory()) {
          continue;
        }

        // Check age
        const age = now - stats.mtimeMs;
        if (age > MAX_AGE_MS) {
          await fs.rm(fullPath, { recursive: true, force: true });
        }
      } catch (error) {
        // Skip entries that can't be stat'd or deleted
        continue;
      }
    }
  } catch (error: any) {
    // If traces directory doesn't exist yet, that's fine
    if (error.code === 'ENOENT') {
      return;
    }
    // Other errors are non-fatal, just skip cleanup
  }
}

/**
 * Ensure trace directory exists for a session
 * @throws Error with recovery message if directory cannot be created
 */
export async function ensureTraceDirectory(sessionId: string): Promise<void> {
  const dirPath = path.join(TRACES_DIR, sessionId);

  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      throw new Error(
        `Cannot create ${TRACES_DIR}/, check permissions`
      );
    }
    throw error;
  }
}
