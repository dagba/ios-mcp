/**
 * Simulator app lifecycle and management tools
 */

import type { ToolDefinition } from '../../shared/types.js';
import { simctl, TIMEOUTS } from '../../shared/executor.js';
import { resolveDevice } from '../../shared/simulator.js';
import { SimulatorError } from '../../shared/errors.js';
import {
  LaunchAppSchema,
  TerminateAppSchema,
  InstallAppSchema,
  UninstallAppSchema,
  OpenURLSchema,
  GetLogsSchema
} from '../../schemas/simulator.js';
import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Launch an app on the simulator
 */
export const launchAppTool: ToolDefinition<typeof LaunchAppSchema> = {
  name: 'simulator_launch_app',
  description:
    'Launch an iOS app on the simulator by bundle identifier. ' +
    'The app must already be installed on the simulator.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      bundleId: {
        type: 'string',
        description: 'App bundle identifier (e.g., com.apple.mobilesafari, com.mycompany.myapp)'
      }
    },
    required: ['bundleId']
  },
  schema: LaunchAppSchema,
  handler: async (args) => {
    const { device: deviceId, bundleId } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      // Launch the app and capture the process ID
      const result = await simctl(['launch', resolvedDevice, bundleId], {
        timeout: TIMEOUTS.DEFAULT
      });

      if (!result.success) {
        throw new SimulatorError(
          `Failed to launch app ${bundleId}`,
          {
            details: {
              device: resolvedDevice,
              bundleId,
              stderr: result.stderr
            },
            recovery: 'Verify the app is installed and the bundle ID is correct'
          }
        );
      }

      // Extract process ID from output (format: "AppName: PID")
      const pidMatch = result.stdout.match(/:\s*(\d+)/);
      const pid = pidMatch ? pidMatch[1] : undefined;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                bundleId,
                device: resolvedDevice,
                pid,
                message: `Launched ${bundleId} successfully${pid ? ` (PID: ${pid})` : ''}`
              },
              null,
              2
            )
          }
        ]
      };
    } catch (error) {
      if (error instanceof SimulatorError) {
        return error.toToolResult();
      }
      throw error;
    }
  }
};

/**
 * Terminate a running app on the simulator
 */
export const terminateAppTool: ToolDefinition<typeof TerminateAppSchema> = {
  name: 'simulator_terminate_app',
  description:
    'Terminate a running iOS app on the simulator by bundle identifier. ' +
    'Similar to force-quitting an app.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      bundleId: {
        type: 'string',
        description: 'App bundle identifier to terminate'
      }
    },
    required: ['bundleId']
  },
  schema: TerminateAppSchema,
  handler: async (args) => {
    const { device: deviceId, bundleId } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      const result = await simctl(['terminate', resolvedDevice, bundleId], {
        timeout: TIMEOUTS.DEFAULT
      });

      if (!result.success) {
        // Note: simctl returns non-zero if app is not running, which is okay
        const notRunning = result.stderr.includes('No matching processes');
        if (notRunning) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    bundleId,
                    device: resolvedDevice,
                    message: `App ${bundleId} was not running`
                  },
                  null,
                  2
                )
              }
            ]
          };
        }

        throw new SimulatorError(
          `Failed to terminate app ${bundleId}`,
          {
            details: {
              device: resolvedDevice,
              bundleId,
              stderr: result.stderr
            }
          }
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                bundleId,
                device: resolvedDevice,
                message: `Terminated ${bundleId} successfully`
              },
              null,
              2
            )
          }
        ]
      };
    } catch (error) {
      if (error instanceof SimulatorError) {
        return error.toToolResult();
      }
      throw error;
    }
  }
};

/**
 * Install an app on the simulator
 */
export const installAppTool: ToolDefinition<typeof InstallAppSchema> = {
  name: 'simulator_install_app',
  description:
    'Install an iOS app (.app bundle) on the simulator. ' +
    'Provide the path to the .app bundle (typically in DerivedData or build output).',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      appPath: {
        type: 'string',
        description: 'Absolute or relative path to .app bundle'
      }
    },
    required: ['appPath']
  },
  schema: InstallAppSchema,
  handler: async (args) => {
    const { device: deviceId, appPath } = args;

    try {
      // Resolve and validate app path
      const resolvedPath = resolve(appPath);
      if (!existsSync(resolvedPath)) {
        throw new SimulatorError(
          `App bundle not found at path: ${resolvedPath}`,
          {
            details: {
              appPath: resolvedPath
            },
            recovery: 'Verify the path is correct and the app has been built'
          }
        );
      }

      if (!resolvedPath.endsWith('.app')) {
        throw new SimulatorError(
          'Invalid app bundle: path must end with .app',
          {
            details: {
              appPath: resolvedPath
            },
            recovery: 'Provide path to the .app bundle directory'
          }
        );
      }

      const resolvedDevice = await resolveDevice(deviceId);

      const result = await simctl(['install', resolvedDevice, resolvedPath], {
        timeout: TIMEOUTS.INSTALL
      });

      if (!result.success) {
        throw new SimulatorError(
          'Failed to install app',
          {
            details: {
              device: resolvedDevice,
              appPath: resolvedPath,
              stderr: result.stderr
            },
            recovery: 'Verify the app bundle is valid and built for the simulator'
          }
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                device: resolvedDevice,
                appPath: resolvedPath,
                message: 'App installed successfully'
              },
              null,
              2
            )
          }
        ]
      };
    } catch (error) {
      if (error instanceof SimulatorError) {
        return error.toToolResult();
      }
      throw error;
    }
  }
};

/**
 * Uninstall an app from the simulator
 */
export const uninstallAppTool: ToolDefinition<typeof UninstallAppSchema> = {
  name: 'simulator_uninstall_app',
  description:
    'Uninstall an iOS app from the simulator by bundle identifier. ' +
    'Removes the app and all its data.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      bundleId: {
        type: 'string',
        description: 'App bundle identifier to uninstall'
      }
    },
    required: ['bundleId']
  },
  schema: UninstallAppSchema,
  handler: async (args) => {
    const { device: deviceId, bundleId } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      const result = await simctl(['uninstall', resolvedDevice, bundleId], {
        timeout: TIMEOUTS.DEFAULT
      });

      if (!result.success) {
        // Check if app was not installed
        const notInstalled = result.stderr.includes('not installed');
        if (notInstalled) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    bundleId,
                    device: resolvedDevice,
                    message: `App ${bundleId} was not installed`
                  },
                  null,
                  2
                )
              }
            ]
          };
        }

        throw new SimulatorError(
          `Failed to uninstall app ${bundleId}`,
          {
            details: {
              device: resolvedDevice,
              bundleId,
              stderr: result.stderr
            }
          }
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                bundleId,
                device: resolvedDevice,
                message: `Uninstalled ${bundleId} successfully`
              },
              null,
              2
            )
          }
        ]
      };
    } catch (error) {
      if (error instanceof SimulatorError) {
        return error.toToolResult();
      }
      throw error;
    }
  }
};

/**
 * Open a URL on the simulator
 */
export const openURLTool: ToolDefinition<typeof OpenURLSchema> = {
  name: 'simulator_open_url',
  description:
    'Open a URL on the simulator. This can open web URLs in Safari, ' +
    'deep links to apps (myapp://), or universal links.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      url: {
        type: 'string',
        description: 'URL to open (http://, https://, or custom scheme)'
      }
    },
    required: ['url']
  },
  schema: OpenURLSchema,
  handler: async (args) => {
    const { device: deviceId, url } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      const result = await simctl(['openurl', resolvedDevice, url], {
        timeout: TIMEOUTS.DEFAULT
      });

      if (!result.success) {
        throw new SimulatorError(
          'Failed to open URL',
          {
            details: {
              device: resolvedDevice,
              url,
              stderr: result.stderr
            },
            recovery: 'Verify the URL format is correct'
          }
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                device: resolvedDevice,
                url,
                message: `Opened URL: ${url}`
              },
              null,
              2
            )
          }
        ]
      };
    } catch (error) {
      if (error instanceof SimulatorError) {
        return error.toToolResult();
      }
      throw error;
    }
  }
};

/**
 * Get recent logs from the simulator
 */
export const getLogsTool: ToolDefinition<typeof GetLogsSchema> = {
  name: 'simulator_get_logs',
  description:
    'Get recent log entries from the simulator. Can filter by process name, ' +
    'bundle ID, or log level. Useful for debugging app behavior.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      predicate: {
        type: 'string',
        description:
          'Optional predicate filter (e.g., "processImagePath CONTAINS \'MyApp\'" or ' +
          '"subsystem == \'com.mycompany.myapp\'")'
      },
      lines: {
        type: 'number',
        description: 'Number of recent lines to return (default: 100)'
      },
      level: {
        type: 'string',
        enum: ['debug', 'info', 'default', 'error', 'fault'],
        description: 'Minimum log level to include'
      }
    }
  },
  schema: GetLogsSchema,
  handler: async (args) => {
    const { device: deviceId, predicate, lines = 100, level } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      // Build log command arguments
      const logArgs = ['spawn', resolvedDevice, 'log', 'show', '--style', 'compact'];

      if (predicate) {
        logArgs.push('--predicate', predicate);
      }

      if (level) {
        logArgs.push('--level', level);
      }

      // Get logs (note: log show returns recent logs, not streaming)
      const result = await simctl(logArgs, {
        timeout: TIMEOUTS.DEFAULT
      });

      if (!result.success) {
        throw new SimulatorError(
          'Failed to retrieve logs',
          {
            details: {
              device: resolvedDevice,
              stderr: result.stderr
            },
            recovery: 'Check if the simulator is booted and the predicate syntax is correct'
          }
        );
      }

      // Get last N lines
      const logLines = result.stdout.split('\n').filter((line) => line.trim());
      const recentLines = logLines.slice(-lines);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                device: resolvedDevice,
                totalLines: logLines.length,
                returnedLines: recentLines.length,
                filters: {
                  predicate: predicate || 'none',
                  level: level || 'all',
                  lines
                },
                logs: recentLines.join('\n')
              },
              null,
              2
            )
          }
        ]
      };
    } catch (error) {
      if (error instanceof SimulatorError) {
        return error.toToolResult();
      }
      throw error;
    }
  }
};
