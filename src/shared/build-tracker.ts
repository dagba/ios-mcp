/**
 * Build time tracking and analytics
 */

import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

/**
 * Build time record
 */
export interface BuildRecord {
  timestamp: string;
  project: string;
  scheme?: string;
  configuration: 'Debug' | 'Release';
  duration: number; // seconds
  success: boolean;
  warnings: number;
  errors: number;
}

/**
 * Build statistics
 */
export interface BuildStats {
  totalBuilds: number;
  successRate: number;
  averageDuration: number;
  medianDuration: number;
  minDuration: number;
  maxDuration: number;
  trend: 'improving' | 'stable' | 'degrading';
  trendPercentage: number;
  recentBuilds: BuildRecord[];
  insights: string[];
}

const BUILD_TRACKER_DIR = join(homedir(), '.ios-mcp');
const BUILD_TRACKER_FILE = join(BUILD_TRACKER_DIR, 'build-times.json');

/**
 * Ensure tracker directory exists
 */
async function ensureTrackerDir(): Promise<void> {
  try {
    await fs.mkdir(BUILD_TRACKER_DIR, { recursive: true });
  } catch (error) {
    // Ignore if exists
  }
}

/**
 * Load build records from storage
 */
async function loadRecords(): Promise<BuildRecord[]> {
  try {
    const data = await fs.readFile(BUILD_TRACKER_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return []; // File doesn't exist yet
  }
}

/**
 * Save build records to storage
 */
async function saveRecords(records: BuildRecord[]): Promise<void> {
  await ensureTrackerDir();
  await fs.writeFile(BUILD_TRACKER_FILE, JSON.stringify(records, null, 2));
}

/**
 * Track a new build
 */
export async function trackBuild(record: BuildRecord): Promise<void> {
  const records = await loadRecords();
  records.push(record);

  // Keep last 500 builds max to prevent unbounded growth
  if (records.length > 500) {
    records.splice(0, records.length - 500);
  }

  await saveRecords(records);
}

/**
 * Calculate median of numbers
 */
function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculate average of numbers
 */
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Get build statistics with insights
 */
export async function getBuildStats(filters: {
  project?: string;
  scheme?: string;
  configuration?: 'Debug' | 'Release';
  limit?: number;
}): Promise<BuildStats> {
  const allRecords = await loadRecords();

  // Apply filters
  let records = allRecords;

  if (filters.project) {
    records = records.filter(r =>
      r.project.includes(filters.project!) ||
      r.project.endsWith(filters.project!)
    );
  }

  if (filters.scheme) {
    records = records.filter(r => r.scheme === filters.scheme);
  }

  if (filters.configuration) {
    records = records.filter(r => r.configuration === filters.configuration);
  }

  // Sort by timestamp (most recent first)
  records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Limit number of builds
  const limit = filters.limit || 20;
  const recentBuilds = records.slice(0, limit);

  if (recentBuilds.length === 0) {
    return {
      totalBuilds: 0,
      successRate: 0,
      averageDuration: 0,
      medianDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      trend: 'stable',
      trendPercentage: 0,
      recentBuilds: [],
      insights: ['No build data available yet. Build a project to start tracking.']
    };
  }

  // Calculate basic stats
  const durations = recentBuilds.map(r => r.duration);
  const successfulBuilds = recentBuilds.filter(r => r.success).length;

  const stats: BuildStats = {
    totalBuilds: recentBuilds.length,
    successRate: (successfulBuilds / recentBuilds.length) * 100,
    averageDuration: average(durations),
    medianDuration: median(durations),
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    trend: 'stable',
    trendPercentage: 0,
    recentBuilds,
    insights: []
  };

  // Calculate trend (compare recent half vs older half)
  if (recentBuilds.length >= 6) {
    const midPoint = Math.floor(recentBuilds.length / 2);
    const recentHalf = recentBuilds.slice(0, midPoint);
    const olderHalf = recentBuilds.slice(midPoint);

    const recentAvg = average(recentHalf.map(r => r.duration));
    const olderAvg = average(olderHalf.map(r => r.duration));

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    stats.trendPercentage = Math.abs(change);

    if (change < -5) {
      stats.trend = 'improving';
      stats.insights.push(`✅ Build times improving: ${Math.abs(change).toFixed(1)}% faster than earlier builds`);
    } else if (change > 5) {
      stats.trend = 'degrading';
      stats.insights.push(`⚠️ Build times slowing down: ${change.toFixed(1)}% slower than earlier builds`);
    } else {
      stats.trend = 'stable';
      stats.insights.push(`✓ Build times stable with <5% variation`);
    }
  }

  // Generate insights
  if (stats.successRate < 80) {
    stats.insights.push(`⚠️ Low success rate: ${stats.successRate.toFixed(1)}% - investigate build failures`);
  } else if (stats.successRate === 100) {
    stats.insights.push(`✅ Perfect success rate: all ${stats.totalBuilds} builds succeeded`);
  }

  if (stats.averageDuration < 10) {
    stats.insights.push(`⚡ Fast builds: averaging ${stats.averageDuration.toFixed(1)}s`);
  } else if (stats.averageDuration > 60) {
    stats.insights.push(`🐌 Slow builds: averaging ${(stats.averageDuration / 60).toFixed(1)} minutes - consider optimization`);
  }

  const rangeDiff = stats.maxDuration - stats.minDuration;
  if (rangeDiff > stats.averageDuration) {
    stats.insights.push(`📊 High variance: build times range from ${stats.minDuration.toFixed(1)}s to ${stats.maxDuration.toFixed(1)}s`);
  }

  // Warning/error trends
  const totalWarnings = recentBuilds.reduce((sum, r) => sum + r.warnings, 0);
  const totalErrors = recentBuilds.reduce((sum, r) => sum + r.errors, 0);

  if (totalWarnings > recentBuilds.length * 5) {
    stats.insights.push(`⚠️ High warning count: averaging ${(totalWarnings / recentBuilds.length).toFixed(0)} warnings per build`);
  }

  if (totalErrors > 0 && stats.successRate === 100) {
    // Errors that were fixed
    stats.insights.push(`✓ All errors resolved in recent builds`);
  }

  return stats;
}

/**
 * Clear all build tracking data
 */
export async function clearBuildHistory(): Promise<void> {
  try {
    await fs.unlink(BUILD_TRACKER_FILE);
  } catch (error) {
    // File doesn't exist, nothing to clear
  }
}
