/**
 * Zod schemas for location simulation tools
 */

import { z } from 'zod';

/**
 * Coordinate schema for latitude/longitude pairs
 */
const CoordinateSchema = z.object({
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .describe('Latitude (-90 to 90)'),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .describe('Longitude (-180 to 180)')
});

/**
 * Set location schema
 */
export const SetLocationSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .describe('Latitude (-90 to 90)'),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .describe('Longitude (-180 to 180)')
});

/**
 * Simulate route schema
 */
export const SimulateRouteSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")'),
  waypoints: z
    .array(CoordinateSchema)
    .min(2)
    .describe('Array of coordinate waypoints (minimum 2)'),
  speed: z
    .number()
    .positive()
    .optional()
    .default(20)
    .describe('Speed in meters/second (default: 20 m/s ≈ 45 mph)'),
  updateInterval: z
    .number()
    .positive()
    .optional()
    .describe('Seconds between location updates (optional)'),
  updateDistance: z
    .number()
    .positive()
    .optional()
    .describe('Meters between location updates (optional)')
});

/**
 * List location scenarios schema
 */
export const ListLocationScenariosSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")')
});

/**
 * Clear location schema
 */
export const ClearLocationSchema = z.object({
  device: z
    .string()
    .optional()
    .default('booted')
    .describe('Device UDID or "booted" (default: "booted")')
});
