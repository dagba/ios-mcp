/**
 * Zod schemas for utility tools
 */

import { z } from 'zod';

/**
 * Get app container path schema
 */
export const GetAppContainerPathSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  bundleId: z
    .string()
    .describe('Bundle identifier of the target application'),
  container: z
    .enum(['app', 'data', 'groups'])
    .or(z.string())
    .optional()
    .default('app')
    .describe('Container type: "app", "data", "groups", or a group ID (default: "app")')
});

/**
 * Clipboard copy schema
 */
export const ClipboardCopySchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  text: z
    .string()
    .describe('Text to copy to the simulator clipboard')
});

/**
 * Clipboard paste schema
 */
export const ClipboardPasteSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")')
});

/**
 * Clipboard sync schema
 */
export const ClipboardSyncSchema = z.object({
  sourceDevice: z
    .string()
    .optional()
    .default('booted')
    .describe('Source device UDID or "booted" (default: "booted")'),
  targetDevice: z
    .string()
    .describe('Target device UDID')
});

/**
 * Add root certificate schema
 */
export const AddRootCertificateSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  certificatePath: z
    .string()
    .describe('Path to the root certificate file (.pem, .cer, .der)')
});

/**
 * Add certificate schema
 */
export const AddCertificateSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  certificatePath: z
    .string()
    .describe('Path to the certificate file (.pem, .cer, .der)')
});

/**
 * Reset keychain schema
 */
export const ResetKeychainSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")')
});

/**
 * Trigger iCloud sync schema
 */
export const TriggerICloudSyncSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")')
});
