/**
 * Location simulation tools
 */

import type { ToolDefinition } from '../../shared/types.js';
import {
  SetLocationSchema,
  SimulateRouteSchema,
  ListLocationScenariosSchema,
  ClearLocationSchema
} from '../../schemas/location.js';
import { simctl } from '../../shared/executor.js';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Tool: simulator_set_location
 * Set a specific GPS location for the simulator
 */
export const setLocationTool: ToolDefinition<typeof SetLocationSchema> = {
  name: 'simulator_set_location',
  description: 'Set a specific GPS location for the simulator. Use this to test location-based features without physically moving.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      latitude: {
        type: 'number',
        description: 'Latitude (-90 to 90)'
      },
      longitude: {
        type: 'number',
        description: 'Longitude (-180 to 180)'
      }
    },
    required: ['latitude', 'longitude']
  },
  schema: SetLocationSchema,
  handler: async (args) => {
    try {
      const result = await simctl([
        'location',
        args.device,
        'set',
        String(args.latitude),
        String(args.longitude)
      ]);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Location set successfully',
                  device: args.device,
                  latitude: args.latitude,
                  longitude: args.longitude
                },
                null,
                2
              )
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  message: 'Failed to set location',
                  device: args.device,
                  error: result.stderr
                },
                null,
                2
              )
            }
          ],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                message: 'Failed to set location',
                error: error instanceof Error ? error.message : String(error)
              },
              null,
              2
            )
          }
        ],
        isError: true
      };
    }
  }
};

/**
 * Tool: simulator_simulate_route
 * Simulate movement along a route with waypoints
 */
export const simulateRouteTool: ToolDefinition<typeof SimulateRouteSchema> = {
  name: 'simulator_simulate_route',
  description: 'Simulate movement along a route defined by waypoints. Perfect for testing navigation apps or location tracking.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      waypoints: {
        type: 'array',
        description: 'Array of coordinate waypoints (minimum 2)',
        items: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' }
          },
          required: ['latitude', 'longitude']
        }
      },
      speed: {
        type: 'number',
        description: 'Speed in meters/second (default: 20 m/s ≈ 45 mph)'
      },
      updateInterval: {
        type: 'number',
        description: 'Seconds between location updates (optional)'
      },
      updateDistance: {
        type: 'number',
        description: 'Meters between location updates (optional)'
      }
    },
    required: ['waypoints']
  },
  schema: SimulateRouteSchema,
  handler: async (args) => {
    try {
      // Create GPX file with waypoints
      const gpxContent = generateGPX(args.waypoints, args.speed);
      const tempFile = join(tmpdir(), `route-${Date.now()}.gpx`);
      await fs.writeFile(tempFile, gpxContent, 'utf8');

      try {
        // Start location simulation with GPX file
        const simctlArgs = ['location', args.device, 'start', tempFile];

        // Add optional parameters
        if (args.updateInterval !== undefined) {
          simctlArgs.push('--speed', String(args.updateInterval));
        }
        if (args.updateDistance !== undefined) {
          simctlArgs.push('--distance', String(args.updateDistance));
        }

        const result = await simctl(simctlArgs);

        // Clean up temp file
        await fs.unlink(tempFile);

        if (result.exitCode === 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    message: 'Route simulation started',
                    device: args.device,
                    waypoints: args.waypoints.length,
                    speed: `${args.speed} m/s`,
                    note: 'Use simulator_clear_location to stop the simulation'
                  },
                  null,
                  2
                )
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    message: 'Failed to start route simulation',
                    device: args.device,
                    error: result.stderr
                  },
                  null,
                  2
                )
              }
            ],
            isError: true
          };
        }
      } catch (error) {
        // Clean up temp file on error
        try {
          await fs.unlink(tempFile);
        } catch {
          // Ignore cleanup errors
        }
        throw error;
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                message: 'Failed to simulate route',
                error: error instanceof Error ? error.message : String(error)
              },
              null,
              2
            )
          }
        ],
        isError: true
      };
    }
  }
};

/**
 * Tool: simulator_list_location_scenarios
 * List available location scenarios
 */
export const listLocationScenariosTool: ToolDefinition<typeof ListLocationScenariosSchema> = {
  name: 'simulator_list_location_scenarios',
  description: 'List available predefined location scenarios (e.g., City Run, City Bicycle Ride, Freeway Drive).',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      }
    }
  },
  schema: ListLocationScenariosSchema,
  handler: async (args) => {
    try {
      const result = await simctl(['location', args.device, 'list']);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  device: args.device,
                  scenarios: result.stdout
                },
                null,
                2
              )
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  message: 'Failed to list location scenarios',
                  device: args.device,
                  error: result.stderr
                },
                null,
                2
              )
            }
          ],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                message: 'Failed to list location scenarios',
                error: error instanceof Error ? error.message : String(error)
              },
              null,
              2
            )
          }
        ],
        isError: true
      };
    }
  }
};

/**
 * Tool: simulator_clear_location
 * Clear/stop location simulation
 */
export const clearLocationTool: ToolDefinition<typeof ClearLocationSchema> = {
  name: 'simulator_clear_location',
  description: 'Stop location simulation and clear any set location or running route.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      }
    }
  },
  schema: ClearLocationSchema,
  handler: async (args) => {
    try {
      const result = await simctl(['location', args.device, 'clear']);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Location simulation cleared',
                  device: args.device
                },
                null,
                2
              )
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  message: 'Failed to clear location',
                  device: args.device,
                  error: result.stderr
                },
                null,
                2
              )
            }
          ],
          isError: true
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                message: 'Failed to clear location',
                error: error instanceof Error ? error.message : String(error)
              },
              null,
              2
            )
          }
        ],
        isError: true
      };
    }
  }
};

/**
 * Helper function to generate GPX file content
 */
function generateGPX(
  waypoints: Array<{ latitude: number; longitude: number }>,
  speed: number = 20
): string {
  const waypointElements = waypoints
    .map(
      (wp, index) => `    <wpt lat="${wp.latitude}" lon="${wp.longitude}">
      <name>Waypoint ${index + 1}</name>
    </wpt>`
    )
    .join('\n');

  const trackPoints = waypoints
    .map(
      (wp) => `      <trkpt lat="${wp.latitude}" lon="${wp.longitude}">
        <ele>0</ele>
      </trkpt>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="ios-dev-mcp-server">
  <metadata>
    <name>Simulated Route</name>
    <desc>Speed: ${speed} m/s</desc>
  </metadata>
${waypointElements}
  <trk>
    <name>Route</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
}

/**
 * Register all location tools with the tool registry
 */
export function registerLocationTools(registry: Map<string, ToolDefinition>): void {
  registry.set(setLocationTool.name, setLocationTool);
  registry.set(simulateRouteTool.name, simulateRouteTool);
  registry.set(listLocationScenariosTool.name, listLocationScenariosTool);
  registry.set(clearLocationTool.name, clearLocationTool);
}
