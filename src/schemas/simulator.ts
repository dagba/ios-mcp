/**
 * Zod schemas for simulator tool inputs
 */

import { z } from 'zod';

/**
 * Device identifier schema (UDID or "booted")
 */
export const DeviceIdentifierSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" for any booted device')
});

/**
 * Boot device schema
 */
export const BootDeviceSchema = z.object({
  device: z.string().describe('Device UDID or name to boot')
});

/**
 * Shutdown device schema
 */
export const ShutdownDeviceSchema = z.object({
  device: z.string().describe('Device UDID to shutdown')
});

/**
 * Get device info schema
 */
export const GetDeviceInfoSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" for any booted device')
});

/**
 * Screenshot schema
 */
export const ScreenshotSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted"'),
  quality: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(80)
    .describe('JPEG quality (1-100)'),
  maxWidth: z
    .number()
    .int()
    .positive()
    .optional()
    .default(800)
    .describe('Maximum width in pixels'),
  maxHeight: z
    .number()
    .int()
    .positive()
    .optional()
    .default(1400)
    .describe('Maximum height in pixels')
});

/**
 * Tap coordinates schema
 */
export const TapSchema = z.object({
  device: z.string().optional().default('booted'),
  x: z.number().describe('X coordinate'),
  y: z.number().describe('Y coordinate')
});

/**
 * Swipe schema
 */
export const SwipeSchema = z.object({
  device: z.string().optional().default('booted'),
  x1: z.number().describe('Start X coordinate'),
  y1: z.number().describe('Start Y coordinate'),
  x2: z.number().describe('End X coordinate'),
  y2: z.number().describe('End Y coordinate'),
  duration: z.number().optional().default(0.3).describe('Swipe duration in seconds')
});

/**
 * Long press schema
 */
export const LongPressSchema = z.object({
  device: z.string().optional().default('booted'),
  x: z.number().describe('X coordinate'),
  y: z.number().describe('Y coordinate'),
  duration: z.number().optional().default(1.0).describe('Press duration in seconds')
});

/**
 * Type text schema
 */
export const TypeTextSchema = z.object({
  device: z.string().optional().default('booted'),
  text: z.string().describe('Text to type')
});

/**
 * Launch app schema
 */
export const LaunchAppSchema = z.object({
  device: z.string().optional().default('booted'),
  bundleId: z.string().describe('App bundle identifier (e.g., com.apple.mobilesafari)')
});

/**
 * Terminate app schema
 */
export const TerminateAppSchema = z.object({
  device: z.string().optional().default('booted'),
  bundleId: z.string().describe('App bundle identifier')
});

/**
 * Install app schema
 */
export const InstallAppSchema = z.object({
  device: z.string().optional().default('booted'),
  appPath: z.string().describe('Path to .app bundle')
});

/**
 * Uninstall app schema
 */
export const UninstallAppSchema = z.object({
  device: z.string().optional().default('booted'),
  bundleId: z.string().describe('App bundle identifier')
});

/**
 * Open URL schema
 */
export const OpenURLSchema = z.object({
  device: z.string().optional().default('booted'),
  url: z.string().url().describe('URL to open')
});

/**
 * Get logs schema
 */
export const GetLogsSchema = z.object({
  device: z.string().optional().default('booted'),
  predicate: z
    .string()
    .optional()
    .describe('Log predicate filter (e.g., "processImagePath CONTAINS \'MyApp\'")'),
  lines: z
    .number()
    .int()
    .positive()
    .optional()
    .default(100)
    .describe('Number of recent lines to return'),
  level: z
    .enum(['debug', 'info', 'default', 'error', 'fault'])
    .optional()
    .describe('Minimum log level')
});

/**
 * Describe UI (accessibility tree) schema
 */
export const DescribeUISchema = z.object({
  device: z.string().optional().default('booted').describe('Device UDID or "booted"'),
  format: z
    .enum(['json', 'compact'])
    .optional()
    .default('compact')
    .describe('Output format: json (full details) or compact (human-readable summary)')
});

/**
 * Describe UI element at point schema
 */
export const DescribePointSchema = z.object({
  device: z.string().optional().default('booted'),
  x: z.number().describe('X coordinate in pixels'),
  y: z.number().describe('Y coordinate in pixels')
});

/**
 * UI tap with idb schema
 */
export const IdbTapSchema = z.object({
  device: z.string().optional().default('booted'),
  x: z.number().describe('X coordinate in pixels'),
  y: z.number().describe('Y coordinate in pixels'),
  duration: z.number().optional().describe('Tap duration in seconds')
});

/**
 * UI swipe with idb schema
 */
export const IdbSwipeSchema = z.object({
  device: z.string().optional().default('booted'),
  x1: z.number().describe('Start X coordinate'),
  y1: z.number().describe('Start Y coordinate'),
  x2: z.number().describe('End X coordinate'),
  y2: z.number().describe('End Y coordinate'),
  delta: z.number().optional().describe('Step size for swipe (pixels per step)')
});

/**
 * Input text schema
 */
export const InputTextSchema = z.object({
  device: z.string().optional().default('booted'),
  text: z.string().describe('Text to input into focused field')
});

/**
 * Press button schema
 */
export const PressButtonSchema = z.object({
  device: z.string().optional().default('booted'),
  button: z.enum(['APPLE_PAY', 'HOME', 'LOCK', 'SIDE_BUTTON', 'SIRI']).describe('Hardware button to press')
});

/**
 * List crashes schema
 */
export const ListCrashesSchema = z.object({
  device: z.string().optional().default('booted'),
  bundleId: z.string().optional().describe('Filter by bundle identifier'),
  before: z.string().optional().describe('Filter crashes before date (ISO 8601)'),
  since: z.string().optional().describe('Filter crashes since date (ISO 8601)')
});

/**
 * Get crash schema
 */
export const GetCrashSchema = z.object({
  device: z.string().optional().default('booted'),
  crashName: z.string().describe('Crash report name/identifier')
});

/**
 * Delete crashes schema
 */
export const DeleteCrashesSchema = z.object({
  device: z.string().optional().default('booted'),
  crashName: z.string().optional().describe('Specific crash to delete'),
  before: z.string().optional().describe('Delete crashes before date'),
  since: z.string().optional().describe('Delete crashes since date'),
  all: z.boolean().optional().default(false).describe('Delete all crashes')
});

/**
 * Start debug server schema
 */
export const StartDebugServerSchema = z.object({
  device: z.string().optional().default('booted'),
  bundleId: z.string().describe('Bundle ID of app to debug')
});

/**
 * Record video schema
 */
export const RecordVideoSchema = z.object({
  device: z.string().optional().default('booted'),
  outputPath: z.string().describe('Output MP4 file path'),
  duration: z.number().optional().describe('Recording duration in seconds (optional, Ctrl+C to stop)')
});

/**
 * Stream logs schema
 */
export const StreamLogsSchema = z.object({
  device: z.string().optional().default('booted'),
  predicate: z.string().optional().describe('Log predicate filter'),
  style: z.enum(['default', 'compact', 'json']).optional().default('default').describe('Log output style')
});
