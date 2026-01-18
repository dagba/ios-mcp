/**
 * Unit tests for build tracker utility
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import {
  trackBuild,
  getBuildStats,
  clearBuildHistory
} from '../../src/shared/build-tracker.js';
import type { BuildRecord } from '../../src/shared/build-tracker.js';

const BUILD_TRACKER_DIR = join(homedir(), '.ios-mcp');
const BUILD_TRACKER_FILE = join(BUILD_TRACKER_DIR, 'build-times.json');
const BACKUP_FILE = BUILD_TRACKER_FILE + '.backup';

describe('Build Tracker', () => {
  // Backup existing data before tests
  beforeEach(async () => {
    try {
      const data = await fs.readFile(BUILD_TRACKER_FILE, 'utf-8');
      await fs.writeFile(BACKUP_FILE, data);
    } catch {
      // No existing file to backup
    }
    // Clear for clean test state
    await clearBuildHistory();
  });

  // Restore data after tests
  afterEach(async () => {
    try {
      const data = await fs.readFile(BACKUP_FILE, 'utf-8');
      await fs.writeFile(BUILD_TRACKER_FILE, data);
      await fs.unlink(BACKUP_FILE);
    } catch {
      // No backup to restore
    }
  });

  describe('trackBuild', () => {
    test('creates tracking file on first build', async () => {
      const record: BuildRecord = {
        timestamp: new Date().toISOString(),
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Debug',
        duration: 10.5,
        success: true,
        warnings: 0,
        errors: 0
      };

      await trackBuild(record);

      const data = await fs.readFile(BUILD_TRACKER_FILE, 'utf-8');
      const records = JSON.parse(data);

      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject(record);
    });

    test('appends multiple build records', async () => {
      const record1: BuildRecord = {
        timestamp: new Date().toISOString(),
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Debug',
        duration: 10.5,
        success: true,
        warnings: 0,
        errors: 0
      };

      const record2: BuildRecord = {
        timestamp: new Date().toISOString(),
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Release',
        duration: 12.3,
        success: true,
        warnings: 2,
        errors: 0
      };

      await trackBuild(record1);
      await trackBuild(record2);

      const data = await fs.readFile(BUILD_TRACKER_FILE, 'utf-8');
      const records = JSON.parse(data);

      expect(records).toHaveLength(2);
      expect(records[0]).toMatchObject(record1);
      expect(records[1]).toMatchObject(record2);
    });

    test('limits to 500 most recent builds', async () => {
      // Add 505 builds
      for (let i = 0; i < 505; i++) {
        await trackBuild({
          timestamp: new Date().toISOString(),
          project: 'TestApp',
          scheme: 'TestScheme',
          configuration: 'Debug',
          duration: 10,
          success: true,
          warnings: 0,
          errors: 0
        });
      }

      const data = await fs.readFile(BUILD_TRACKER_FILE, 'utf-8');
      const records = JSON.parse(data);

      expect(records).toHaveLength(500);
    });
  });

  describe('getBuildStats', () => {
    test('returns empty stats when no builds tracked', async () => {
      const stats = await getBuildStats({});

      expect(stats.totalBuilds).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.insights).toContain('No build data available yet. Build a project to start tracking.');
    });

    test('calculates basic statistics correctly', async () => {
      // Track 3 successful builds
      await trackBuild({
        timestamp: new Date().toISOString(),
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Debug',
        duration: 10,
        success: true,
        warnings: 0,
        errors: 0
      });

      await trackBuild({
        timestamp: new Date().toISOString(),
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Debug',
        duration: 20,
        success: true,
        warnings: 1,
        errors: 0
      });

      await trackBuild({
        timestamp: new Date().toISOString(),
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Debug',
        duration: 30,
        success: false,
        warnings: 2,
        errors: 5
      });

      const stats = await getBuildStats({});

      expect(stats.totalBuilds).toBe(3);
      expect(stats.successRate).toBe((2 / 3) * 100);
      expect(stats.averageDuration).toBe(20);
      expect(stats.medianDuration).toBe(20);
      expect(stats.minDuration).toBe(10);
      expect(stats.maxDuration).toBe(30);
    });

    test('filters by project name', async () => {
      await trackBuild({
        timestamp: new Date().toISOString(),
        project: 'App1',
        scheme: 'Scheme1',
        configuration: 'Debug',
        duration: 10,
        success: true,
        warnings: 0,
        errors: 0
      });

      await trackBuild({
        timestamp: new Date().toISOString(),
        project: 'App2',
        scheme: 'Scheme2',
        configuration: 'Debug',
        duration: 20,
        success: true,
        warnings: 0,
        errors: 0
      });

      const stats = await getBuildStats({ project: 'App1' });

      expect(stats.totalBuilds).toBe(1);
      expect(stats.averageDuration).toBe(10);
    });

    test('filters by scheme', async () => {
      await trackBuild({
        timestamp: new Date().toISOString(),
        project: 'TestApp',
        scheme: 'SchemeA',
        configuration: 'Debug',
        duration: 10,
        success: true,
        warnings: 0,
        errors: 0
      });

      await trackBuild({
        timestamp: new Date().toISOString(),
        project: 'TestApp',
        scheme: 'SchemeB',
        configuration: 'Debug',
        duration: 20,
        success: true,
        warnings: 0,
        errors: 0
      });

      const stats = await getBuildStats({ scheme: 'SchemeB' });

      expect(stats.totalBuilds).toBe(1);
      expect(stats.averageDuration).toBe(20);
    });

    test('filters by configuration', async () => {
      await trackBuild({
        timestamp: new Date().toISOString(),
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Debug',
        duration: 10,
        success: true,
        warnings: 0,
        errors: 0
      });

      await trackBuild({
        timestamp: new Date().toISOString(),
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Release',
        duration: 20,
        success: true,
        warnings: 0,
        errors: 0
      });

      const stats = await getBuildStats({ configuration: 'Release' });

      expect(stats.totalBuilds).toBe(1);
      expect(stats.averageDuration).toBe(20);
    });

    test('limits number of builds analyzed', async () => {
      // Track 25 builds
      for (let i = 0; i < 25; i++) {
        await trackBuild({
          timestamp: new Date().toISOString(),
          project: 'TestApp',
          scheme: 'TestScheme',
          configuration: 'Debug',
          duration: 10,
          success: true,
          warnings: 0,
          errors: 0
        });
      }

      const stats = await getBuildStats({ limit: 10 });

      expect(stats.recentBuilds).toHaveLength(10);
    });

    test('detects improving trend', async () => {
      // Add 6 builds: older ones slower, newer ones faster
      const timestamps = [
        new Date(Date.now() - 6000).toISOString(),
        new Date(Date.now() - 5000).toISOString(),
        new Date(Date.now() - 4000).toISOString(),
        new Date(Date.now() - 3000).toISOString(),
        new Date(Date.now() - 2000).toISOString(),
        new Date(Date.now() - 1000).toISOString()
      ];

      // Older builds (slower)
      await trackBuild({
        timestamp: timestamps[0],
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Debug',
        duration: 30,
        success: true,
        warnings: 0,
        errors: 0
      });

      await trackBuild({
        timestamp: timestamps[1],
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Debug',
        duration: 28,
        success: true,
        warnings: 0,
        errors: 0
      });

      await trackBuild({
        timestamp: timestamps[2],
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Debug',
        duration: 26,
        success: true,
        warnings: 0,
        errors: 0
      });

      // Newer builds (faster)
      await trackBuild({
        timestamp: timestamps[3],
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Debug',
        duration: 15,
        success: true,
        warnings: 0,
        errors: 0
      });

      await trackBuild({
        timestamp: timestamps[4],
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Debug',
        duration: 14,
        success: true,
        warnings: 0,
        errors: 0
      });

      await trackBuild({
        timestamp: timestamps[5],
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Debug',
        duration: 13,
        success: true,
        warnings: 0,
        errors: 0
      });

      const stats = await getBuildStats({});

      expect(stats.trend).toBe('improving');
    });

    test('generates insight for low success rate', async () => {
      // 2 success, 8 failures = 20% success rate
      for (let i = 0; i < 10; i++) {
        await trackBuild({
          timestamp: new Date().toISOString(),
          project: 'TestApp',
          scheme: 'TestScheme',
          configuration: 'Debug',
          duration: 10,
          success: i < 2, // Only first 2 succeed
          warnings: 0,
          errors: i < 2 ? 0 : 5
        });
      }

      const stats = await getBuildStats({});

      expect(stats.successRate).toBe(20);
      expect(stats.insights.some(i => i.includes('Low success rate'))).toBe(true);
    });

    test('generates insight for perfect success rate', async () => {
      for (let i = 0; i < 5; i++) {
        await trackBuild({
          timestamp: new Date().toISOString(),
          project: 'TestApp',
          scheme: 'TestScheme',
          configuration: 'Debug',
          duration: 10,
          success: true,
          warnings: 0,
          errors: 0
        });
      }

      const stats = await getBuildStats({});

      expect(stats.successRate).toBe(100);
      expect(stats.insights.some(i => i.includes('Perfect success rate'))).toBe(true);
    });

    test('generates insight for fast builds', async () => {
      await trackBuild({
        timestamp: new Date().toISOString(),
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Debug',
        duration: 5, // Under 10 seconds
        success: true,
        warnings: 0,
        errors: 0
      });

      const stats = await getBuildStats({});

      expect(stats.insights.some(i => i.includes('Fast builds'))).toBe(true);
    });

    test('generates insight for slow builds', async () => {
      await trackBuild({
        timestamp: new Date().toISOString(),
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Debug',
        duration: 120, // Over 60 seconds
        success: true,
        warnings: 0,
        errors: 0
      });

      const stats = await getBuildStats({});

      expect(stats.insights.some(i => i.includes('Slow builds'))).toBe(true);
    });
  });

  describe('clearBuildHistory', () => {
    test('removes tracking file', async () => {
      // Track a build first
      await trackBuild({
        timestamp: new Date().toISOString(),
        project: 'TestApp',
        scheme: 'TestScheme',
        configuration: 'Debug',
        duration: 10,
        success: true,
        warnings: 0,
        errors: 0
      });

      // Verify file exists
      let fileExists = true;
      try {
        await fs.access(BUILD_TRACKER_FILE);
      } catch {
        fileExists = false;
      }
      expect(fileExists).toBe(true);

      // Clear history
      await clearBuildHistory();

      // Verify file is removed
      fileExists = true;
      try {
        await fs.access(BUILD_TRACKER_FILE);
      } catch {
        fileExists = false;
      }
      expect(fileExists).toBe(false);
    });

    test('does not throw when file does not exist', async () => {
      await expect(clearBuildHistory()).resolves.not.toThrow();
    });
  });
});
