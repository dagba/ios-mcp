/**
 * Zod schemas for environment control tools
 */

import { z } from 'zod';

/**
 * Status bar override schema
 */
export const StatusBarOverrideSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  time: z
    .string()
    .optional()
    .describe('Time to display (e.g., "9:41" or ISO date string)'),
  dataNetwork: z
    .enum(['hide', 'wifi', '3g', '4g', 'lte', 'lte-a', 'lte+', '5g', '5g+', '5g-uwb', '5g-uc'])
    .optional()
    .describe('Data network type to display'),
  wifiMode: z
    .enum(['searching', 'failed', 'active'])
    .optional()
    .describe('WiFi connection mode'),
  wifiBars: z
    .number()
    .int()
    .min(0)
    .max(3)
    .optional()
    .describe('WiFi signal strength (0-3 bars)'),
  cellularMode: z
    .enum(['notSupported', 'searching', 'failed', 'active'])
    .optional()
    .describe('Cellular connection mode'),
  cellularBars: z
    .number()
    .int()
    .min(0)
    .max(4)
    .optional()
    .describe('Cellular signal strength (0-4 bars)'),
  operatorName: z
    .string()
    .optional()
    .describe('Carrier/operator name to display'),
  batteryState: z
    .enum(['charging', 'charged', 'discharging'])
    .optional()
    .describe('Battery charging state'),
  batteryLevel: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .describe('Battery level percentage (0-100)')
});

/**
 * Status bar list schema
 */
export const StatusBarListSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")')
});

/**
 * Status bar clear schema
 */
export const StatusBarClearSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")')
});

/**
 * Set appearance schema
 */
export const SetAppearanceSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  mode: z
    .enum(['light', 'dark'])
    .describe('Appearance mode to set')
});

/**
 * Get appearance schema
 */
export const GetAppearanceSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")')
});

/**
 * Content size categories
 */
const ContentSizeCategory = z.enum([
  // Standard sizes
  'extra-small',
  'small',
  'medium',
  'large',
  'extra-large',
  'extra-extra-large',
  'extra-extra-extra-large',
  // Accessibility sizes
  'accessibility-medium',
  'accessibility-large',
  'accessibility-extra-large',
  'accessibility-extra-extra-large',
  'accessibility-extra-extra-extra-large'
]);

/**
 * Set content size schema
 */
export const SetContentSizeSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  size: ContentSizeCategory.describe('Content size category to set')
});

/**
 * Get content size schema
 */
export const GetContentSizeSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")')
});

/**
 * Set increase contrast schema
 */
export const SetIncreaseContrastSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  enabled: z
    .boolean()
    .describe('Whether to enable or disable increased contrast mode')
});

/**
 * Privacy service types
 */
const PrivacyService = z.enum([
  'all',
  'calendar',
  'contacts-limited',
  'contacts',
  'location',
  'location-always',
  'photos-add',
  'photos',
  'media-library',
  'microphone',
  'motion',
  'reminders',
  'siri'
]);

/**
 * Grant permission schema
 */
export const GrantPermissionSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  bundleId: z
    .string()
    .describe('Bundle identifier of the target application'),
  service: PrivacyService.describe('Permission service to grant')
});

/**
 * Revoke permission schema
 */
export const RevokePermissionSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  bundleId: z
    .string()
    .describe('Bundle identifier of the target application'),
  service: PrivacyService.describe('Permission service to revoke')
});

/**
 * Reset permissions schema
 */
export const ResetPermissionsSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  bundleId: z
    .string()
    .optional()
    .describe('Bundle identifier (optional - omit to reset all apps)'),
  service: PrivacyService.optional().describe('Service to reset (optional - omit to reset all services)')
});

/**
 * Send push notification schema
 */
export const SendPushNotificationSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  bundleId: z
    .string()
    .describe('Bundle identifier of the target application'),
  payload: z
    .record(z.string(), z.any())
    .describe('JSON payload object (must include "aps" key, max 4096 bytes)')
});
