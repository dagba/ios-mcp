/**
 * Status bar control tools
 */

import type { ToolDefinition } from '../../shared/types.js';
import {
  StatusBarOverrideSchema,
  StatusBarListSchema,
  StatusBarClearSchema
} from '../../schemas/environment.js';
import { simctl } from '../../shared/executor.js';

/**
 * Tool: simulator_status_bar_override
 * Override status bar appearance
 */
export const statusBarOverrideTool: ToolDefinition<typeof StatusBarOverrideSchema> = {
  name: 'simulator_status_bar_override',
  description: 'Override the simulator status bar appearance for demo screenshots and testing. Set time, network indicators, battery level, and carrier name.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      time: {
        type: 'string',
        description: 'Time to display (e.g., "9:41" or ISO date string)'
      },
      dataNetwork: {
        type: 'string',
        enum: ['hide', 'wifi', '3g', '4g', 'lte', 'lte-a', 'lte+', '5g', '5g+', '5g-uwb', '5g-uc'],
        description: 'Data network type to display'
      },
      wifiMode: {
        type: 'string',
        enum: ['searching', 'failed', 'active'],
        description: 'WiFi connection mode'
      },
      wifiBars: {
        type: 'number',
        description: 'WiFi signal strength (0-3 bars)'
      },
      cellularMode: {
        type: 'string',
        enum: ['notSupported', 'searching', 'failed', 'active'],
        description: 'Cellular connection mode'
      },
      cellularBars: {
        type: 'number',
        description: 'Cellular signal strength (0-4 bars)'
      },
      operatorName: {
        type: 'string',
        description: 'Carrier/operator name to display'
      },
      batteryState: {
        type: 'string',
        enum: ['charging', 'charged', 'discharging'],
        description: 'Battery charging state'
      },
      batteryLevel: {
        type: 'number',
        description: 'Battery level percentage (0-100)'
      }
    }
  },
  schema: StatusBarOverrideSchema,
  handler: async (args) => {
    try {
      // Build override command arguments
      const overrideArgs = ['status_bar', args.device, 'override'];

      // Add optional parameters
      if (args.time !== undefined) {
        overrideArgs.push('--time', args.time);
      }

      if (args.dataNetwork !== undefined) {
        overrideArgs.push('--dataNetwork', args.dataNetwork);
      }

      if (args.wifiMode !== undefined) {
        overrideArgs.push('--wifiMode', args.wifiMode);
      }

      if (args.wifiBars !== undefined) {
        overrideArgs.push('--wifiBars', String(args.wifiBars));
      }

      if (args.cellularMode !== undefined) {
        overrideArgs.push('--cellularMode', args.cellularMode);
      }

      if (args.cellularBars !== undefined) {
        overrideArgs.push('--cellularBars', String(args.cellularBars));
      }

      if (args.operatorName !== undefined) {
        overrideArgs.push('--operatorName', args.operatorName);
      }

      if (args.batteryState !== undefined) {
        overrideArgs.push('--batteryState', args.batteryState);
      }

      if (args.batteryLevel !== undefined) {
        overrideArgs.push('--batteryLevel', String(args.batteryLevel));
      }

      // At least one override parameter is required
      if (overrideArgs.length === 3) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  message: 'At least one override parameter is required',
                  device: args.device
                },
                null,
                2
              )
            }
          ],
          isError: true
        };
      }

      const result = await simctl(overrideArgs);

      if (result.exitCode === 0) {
        // Build a summary of applied overrides
        const overrides: Record<string, string | number> = {};
        if (args.time) overrides.time = args.time;
        if (args.dataNetwork) overrides.dataNetwork = args.dataNetwork;
        if (args.wifiMode) overrides.wifiMode = args.wifiMode;
        if (args.wifiBars !== undefined) overrides.wifiBars = args.wifiBars;
        if (args.cellularMode) overrides.cellularMode = args.cellularMode;
        if (args.cellularBars !== undefined) overrides.cellularBars = args.cellularBars;
        if (args.operatorName) overrides.operatorName = args.operatorName;
        if (args.batteryState) overrides.batteryState = args.batteryState;
        if (args.batteryLevel !== undefined) overrides.batteryLevel = args.batteryLevel;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Status bar overrides applied',
                  device: args.device,
                  overrides
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
                  message: 'Failed to override status bar',
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
                message: 'Failed to override status bar',
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
 * Tool: simulator_status_bar_list
 * List current status bar overrides
 */
export const statusBarListTool: ToolDefinition<typeof StatusBarListSchema> = {
  name: 'simulator_status_bar_list',
  description: 'List current status bar overrides on a simulator device.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      }
    }
  },
  schema: StatusBarListSchema,
  handler: async (args) => {
    try {
      const result = await simctl(['status_bar', args.device, 'list']);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  device: args.device,
                  overrides: result.stdout.trim() || 'No overrides currently set'
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
                  message: 'Failed to list status bar overrides',
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
                message: 'Failed to list status bar overrides',
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
 * Tool: simulator_status_bar_clear
 * Clear all status bar overrides
 */
export const statusBarClearTool: ToolDefinition<typeof StatusBarClearSchema> = {
  name: 'simulator_status_bar_clear',
  description: 'Clear all status bar overrides, returning the simulator to its natural state.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      }
    }
  },
  schema: StatusBarClearSchema,
  handler: async (args) => {
    try {
      const result = await simctl(['status_bar', args.device, 'clear']);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Status bar overrides cleared',
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
                  message: 'Failed to clear status bar overrides',
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
                message: 'Failed to clear status bar overrides',
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
