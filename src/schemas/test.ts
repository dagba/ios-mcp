/**
 * Zod schemas for test tool inputs
 */

import { z } from 'zod';

/**
 * Base schema for test execution
 */
const TestBaseSchema = z
  .object({
    workspace: z.string().optional().describe('Path to .xcworkspace file'),
    project: z.string().optional().describe('Path to .xcodeproj file'),
    scheme: z.string().describe('Scheme name to test'),
    configuration: z
      .string()
      .optional()
      .default('Debug')
      .describe('Build configuration'),
    derivedDataPath: z
      .string()
      .optional()
      .describe('Custom derived data path')
  })
  .refine((data) => data.workspace || data.project, {
    message: 'Either workspace or project must be provided'
  });

/**
 * Schema for running tests
 */
export const RunTestsSchema = TestBaseSchema.extend({
  sdk: z
    .string()
    .optional()
    .default('iphonesimulator')
    .describe('SDK to test on'),
  destination: z
    .string()
    .optional()
    .describe('Test destination (e.g., "platform=iOS Simulator,name=iPhone 15 Pro")'),
  onlyTesting: z
    .array(z.string())
    .optional()
    .describe('Array of test identifiers to run (e.g., ["MyAppTests/testExample"])'),
  skipTesting: z
    .array(z.string())
    .optional()
    .describe('Array of test identifiers to skip'),
  enableCodeCoverage: z
    .boolean()
    .optional()
    .default(false)
    .describe('Enable code coverage collection')
});
