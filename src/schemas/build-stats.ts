/**
 * Zod schemas for build statistics tool
 */

import { z } from 'zod';

/**
 * Build stats query schema
 */
export const BuildStatsSchema = z.object({
  project: z
    .string()
    .optional()
    .describe('Filter by project name or path (optional)'),
  scheme: z
    .string()
    .optional()
    .describe('Filter by scheme name (optional)'),
  configuration: z
    .enum(['Debug', 'Release'])
    .optional()
    .describe('Filter by build configuration (optional)'),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .default(20)
    .describe('Number of recent builds to analyze (default: 20)')
});
