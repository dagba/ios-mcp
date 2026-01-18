/**
 * Simulator input simulation tools
 */

import type { ToolDefinition } from '../../shared/types.js';
import { simctl, TIMEOUTS } from '../../shared/executor.js';
import { resolveDevice } from '../../shared/simulator.js';
import { SimulatorError } from '../../shared/errors.js';
import { TypeTextSchema, DeviceIdentifierSchema } from '../../schemas/simulator.js';

/**
 * Type text into the simulator
 */
export const typeTextTool: ToolDefinition<typeof TypeTextSchema> = {
  name: 'simulator_type_text',
  description:
    'Type text into the currently focused text field on the iOS simulator. ' +
    'The text field must be active (keyboard visible) before typing.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      text: {
        type: 'string',
        description: 'Text to type into the focused text field'
      }
    },
    required: ['text']
  },
  schema: TypeTextSchema,
  handler: async (args) => {
    const { device: deviceId, text } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      // Use simctl io to type text
      const result = await simctl(['io', resolvedDevice, 'text', text], {
        timeout: TIMEOUTS.DEFAULT
      });

      if (!result.success) {
        throw new SimulatorError(
          'Failed to type text',
          {
            details: {
              device: resolvedDevice,
              text,
              stderr: result.stderr
            },
            recovery: 'Ensure a text field is focused (keyboard visible) before typing'
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
                text,
                length: text.length,
                message: `Typed ${text.length} character(s)`
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
 * Press the home button
 */
export const pressHomeTool: ToolDefinition<typeof DeviceIdentifierSchema> = {
  name: 'simulator_press_home',
  description:
    'Press the home button on the iOS simulator. This will close the current app ' +
    'and return to the home screen.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      }
    }
  },
  schema: DeviceIdentifierSchema,
  handler: async (args) => {
    const { device: deviceId } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      // Simulate home button press using AppleScript via simctl
      const result = await simctl(['io', resolvedDevice, 'pressButton', 'home'], {
        timeout: TIMEOUTS.DEFAULT
      });

      if (!result.success) {
        throw new SimulatorError(
          'Failed to press home button',
          {
            details: {
              device: resolvedDevice,
              stderr: result.stderr
            },
            recovery: 'Ensure the simulator is booted and responsive'
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
                button: 'home',
                message: 'Pressed home button'
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
 * Send keyboard input (hardware keyboard)
 */
export const sendKeysTool: ToolDefinition<typeof TypeTextSchema> = {
  name: 'simulator_send_keys',
  description:
    'Send hardware keyboard input to the simulator. Useful for shortcuts like ' +
    'Command+H (home), Command+Shift+H (app switcher), or Command+L (lock). ' +
    'Note: This simulates physical keyboard input, not on-screen keyboard typing.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      text: {
        type: 'string',
        description:
          'Keys to send. For special keys, use descriptions like "home", "lock", etc. ' +
          'For shortcuts, describe them like "cmd-h" or "cmd-shift-h"'
      }
    },
    required: ['text']
  },
  schema: TypeTextSchema,
  handler: async (args) => {
    const { device: deviceId, text } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      // Map common shortcuts to their button equivalents
      const keyMap: Record<string, string[]> = {
        'cmd-h': ['pressButton', 'home'],
        'cmd-shift-h': ['pressButton', 'appSwitcher'],
        'cmd-l': ['pressButton', 'lock'],
        home: ['pressButton', 'home'],
        lock: ['pressButton', 'lock'],
        'app-switcher': ['pressButton', 'appSwitcher'],
        siri: ['pressButton', 'siri']
      };

      const normalizedKey = text.toLowerCase().trim();
      const command = keyMap[normalizedKey];

      if (command) {
        // Use pressButton for mapped keys
        const result = await simctl(['io', resolvedDevice, ...command], {
          timeout: TIMEOUTS.DEFAULT
        });

        if (!result.success) {
          throw new SimulatorError(
            `Failed to send key: ${text}`,
            {
              details: {
                device: resolvedDevice,
                key: text,
                stderr: result.stderr
              },
              recovery: 'Ensure the simulator is booted and the key combination is supported'
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
                  key: text,
                  action: command[1],
                  message: `Sent key: ${text}`
                },
                null,
                2
              )
            }
          ]
        };
      } else {
        // For unmapped text, just type it as keyboard input
        const result = await simctl(['io', resolvedDevice, 'text', text], {
          timeout: TIMEOUTS.DEFAULT
        });

        if (!result.success) {
          throw new SimulatorError(
            'Failed to send keyboard input',
            {
              details: {
                device: resolvedDevice,
                text,
                stderr: result.stderr
              },
              recovery:
                'Use predefined shortcuts (cmd-h, cmd-l, home, lock, siri) or ensure text field is focused'
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
                  text,
                  message: `Sent keyboard input: ${text}`
                },
                null,
                2
              )
            }
          ]
        };
      }
    } catch (error) {
      if (error instanceof SimulatorError) {
        return error.toToolResult();
      }
      throw error;
    }
  }
};
