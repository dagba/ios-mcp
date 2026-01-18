/**
 * Zod schemas for media-related tools
 */

import { z } from 'zod';

/**
 * Start video recording schema
 */
export const StartVideoRecordingSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  outputPath: z
    .string()
    .describe('Output file path for the recorded video'),
  codec: z
    .enum(['h264', 'hevc'])
    .optional()
    .default('hevc')
    .describe('Video codec to use (default: "hevc")'),
  display: z
    .enum(['internal', 'external'])
    .optional()
    .default('internal')
    .describe('Display to record (default: "internal")'),
  mask: z
    .enum(['ignored', 'alpha', 'black'])
    .optional()
    .describe('Mask to apply to the recording (optional)')
});

/**
 * Stop video recording schema
 */
export const StopVideoRecordingSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")')
});

/**
 * Add media schema
 */
export const AddMediaSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  files: z
    .array(z.string())
    .min(1)
    .describe('Array of file paths to add to the simulator (photos, videos, contacts)')
});
