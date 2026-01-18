/**
 * Zod schemas for build tool inputs
 */

import { z } from 'zod';

/**
 * Base schema for workspace or project
 */
const WorkspaceOrProjectSchema = z
  .object({
    workspace: z.string().optional().describe('Path to .xcworkspace file'),
    project: z.string().optional().describe('Path to .xcodeproj file'),
    scheme: z.string().describe('Scheme name to build'),
    configuration: z
      .string()
      .optional()
      .default('Debug')
      .describe('Build configuration (Debug or Release)'),
    derivedDataPath: z
      .string()
      .optional()
      .describe('Custom derived data path')
  })
  .refine((data) => data.workspace || data.project, {
    message: 'Either workspace or project must be provided'
  });

/**
 * Schema for building for simulator
 */
export const BuildForSimulatorSchema = WorkspaceOrProjectSchema.extend({
  sdk: z
    .string()
    .optional()
    .default('iphonesimulator')
    .describe('SDK to build for'),
  destination: z
    .string()
    .optional()
    .describe('Destination specifier (e.g., "platform=iOS Simulator,name=iPhone 15 Pro")')
});

/**
 * Schema for clean build
 */
export const CleanBuildSchema = WorkspaceOrProjectSchema.extend({
  // Clean uses same base schema, no additional fields needed
});

/**
 * Schema for archive (distribution build)
 */
export const ArchiveSchema = WorkspaceOrProjectSchema.extend({
  sdk: z
    .string()
    .optional()
    .default('iphoneos')
    .describe('SDK to build for'),
  archivePath: z.string().describe('Path where archive will be saved')
});
