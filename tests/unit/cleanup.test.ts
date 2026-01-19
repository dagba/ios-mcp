/**
 * Unit tests for trace cleanup utilities
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { cleanupOldTraces, ensureTraceDirectory } from '../../src/shared/cleanup.js';
import fs from 'fs/promises';
import path from 'path';

vi.mock('fs/promises');

describe('Cleanup Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cleanupOldTraces', () => {
    test('deletes directories older than 24 hours', async () => {
      const now = Date.now();
      const oneDayAgo = now - (25 * 60 * 60 * 1000); // 25 hours ago

      vi.mocked(fs.readdir).mockResolvedValueOnce(['session-old', 'session-new'] as any);
      vi.mocked(fs.stat).mockResolvedValueOnce({
        isDirectory: () => true,
        mtimeMs: oneDayAgo
      } as any);
      vi.mocked(fs.stat).mockResolvedValueOnce({
        isDirectory: () => true,
        mtimeMs: now
      } as any);
      vi.mocked(fs.rm).mockResolvedValueOnce(undefined);

      await cleanupOldTraces();

      expect(fs.rm).toHaveBeenCalledWith(
        path.join('/tmp/instruments-traces', 'session-old'),
        { recursive: true, force: true }
      );
      expect(fs.rm).toHaveBeenCalledTimes(1); // Only old one deleted
    });

    test('handles missing traces directory gracefully', async () => {
      vi.mocked(fs.readdir).mockRejectedValueOnce({ code: 'ENOENT' });

      await expect(cleanupOldTraces()).resolves.toBeUndefined();
      expect(fs.rm).not.toHaveBeenCalled();
    });

    test('skips files (only processes directories)', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce(['session-dir', 'file.txt'] as any);
      vi.mocked(fs.stat).mockResolvedValueOnce({
        isDirectory: () => true,
        mtimeMs: Date.now()
      } as any);
      vi.mocked(fs.stat).mockResolvedValueOnce({
        isDirectory: () => false,
        mtimeMs: Date.now()
      } as any);

      await cleanupOldTraces();

      expect(fs.rm).not.toHaveBeenCalled();
    });
  });

  describe('ensureTraceDirectory', () => {
    test('creates directory when it does not exist', async () => {
      vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined as any);

      await ensureTraceDirectory('session-123');

      expect(fs.mkdir).toHaveBeenCalledWith(
        '/tmp/instruments-traces/session-123',
        { recursive: true }
      );
    });

    test('throws TRACE_DIR_FAILED on permission error', async () => {
      vi.mocked(fs.mkdir).mockRejectedValueOnce({ code: 'EACCES' });

      await expect(ensureTraceDirectory('session-123'))
        .rejects.toThrow('Cannot create /tmp/instruments-traces/');
    });

    test('succeeds when directory already exists', async () => {
      vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined as any);

      await expect(ensureTraceDirectory('session-existing')).resolves.toBeUndefined();
    });

    test('throws TRACE_DIR_FAILED on EPERM error', async () => {
      vi.mocked(fs.mkdir).mockRejectedValueOnce({ code: 'EPERM' });

      await expect(ensureTraceDirectory('session-456'))
        .rejects.toThrow('Cannot create /tmp/instruments-traces/');
    });
  });
});
