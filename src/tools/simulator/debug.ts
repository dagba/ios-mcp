/**
 * Simulator debugging and automation tools
 * Provides crash log management, log streaming, text input, and hardware button simulation
 */

import type { ToolDefinition, ToolResult } from '../../shared/types.js';
import { idb, TIMEOUTS } from '../../shared/executor.js';
import { resolveDevice } from '../../shared/simulator.js';
import { SimulatorError } from '../../shared/errors.js';
import {
  ListCrashesSchema,
  GetCrashSchema,
  DeleteCrashesSchema,
  StreamLogsSchema,
  InputTextSchema,
  PressButtonSchema
} from '../../schemas/simulator.js';

/**
 * Tool: simulator_list_crashes
 * List crash reports from the simulator with optional filtering
 */
export const listCrashesTool: ToolDefinition<typeof ListCrashesSchema> = {
  name: 'simulator_list_crashes',
  description: 'List crash reports from the iOS simulator. Supports filtering by bundle ID, date range. Returns crash names, timestamps, and bundle IDs.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" for any booted device',
        default: 'booted'
      },
      bundleId: {
        type: 'string',
        description: 'Filter crashes by app bundle identifier (e.g., com.example.MyApp)'
      },
      before: {
        type: 'string',
        description: 'Filter crashes before this date (ISO 8601 format: 2024-01-15T10:30:00Z)'
      },
      since: {
        type: 'string',
        description: 'Filter crashes since this date (ISO 8601 format: 2024-01-15T10:30:00Z)'
      }
    }
  },
  schema: ListCrashesSchema,
  handler: async (args) => {
    const { device: deviceId, bundleId, before, since } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      const idbArgs = ['crash', 'list', '--udid', resolvedDevice, '--json'];

      if (bundleId) {
        idbArgs.push('--bundle-id', bundleId);
      }
      if (before) {
        idbArgs.push('--before', before);
      }
      if (since) {
        idbArgs.push('--since', since);
      }

      const result = await idb(idbArgs, { timeout: TIMEOUTS.DEFAULT });

      if (!result.success) {
        if (result.stderr.includes('command not found') || result.stderr.includes('idb: not found')) {
          throw new SimulatorError(
            'fb-idb is not installed. Install with: brew install idb-companion',
            {
              code: 'IDB_NOT_INSTALLED',
              details: { stderr: result.stderr },
              recovery: 'Install idb using: brew install idb-companion && brew services start idb_companion'
            }
          );
        }

        throw new SimulatorError(
          `Failed to list crashes: ${result.stderr}`,
          {
            code: 'LIST_CRASHES_FAILED',
            details: { stderr: result.stderr, exitCode: result.exitCode }
          }
        );
      }

      // Parse JSON response
      let crashes: any[];
      try {
        crashes = JSON.parse(result.stdout);
      } catch (e) {
        crashes = [];
      }

      // Format output
      const summary = crashes.length === 0
        ? 'No crash reports found.'
        : `Found ${crashes.length} crash report(s):\n\n` +
          crashes.map((crash, idx) => {
            const name = crash.name || 'unknown';
            const bundle = crash.bundle_id || 'unknown';
            const timestamp = crash.crash_date || 'unknown';
            return `${idx + 1}. ${name}\n   Bundle: ${bundle}\n   Date: ${timestamp}`;
          }).join('\n\n');

      return {
        content: [{ type: 'text', text: summary }],
        isError: false
      };
    } catch (error) {
      if (error instanceof SimulatorError) {
        throw error;
      }
      throw new SimulatorError(
        `Unexpected error listing crashes: ${error instanceof Error ? error.message : String(error)}`,
        {
          code: 'LIST_CRASHES_UNEXPECTED_ERROR',
          details: { error: String(error) }
        }
      );
    }
  }
};

/**
 * Tool: simulator_get_crash
 * Retrieve detailed crash report with full stacktrace
 */
export const getCrashTool: ToolDefinition<typeof GetCrashSchema> = {
  name: 'simulator_get_crash',
  description: 'Retrieve a specific crash report from the iOS simulator. Returns full crash log with stacktrace, exception type, and crash reason.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" for any booted device',
        default: 'booted'
      },
      crashName: {
        type: 'string',
        description: 'Crash report name/identifier from simulator_list_crashes'
      }
    },
    required: ['crashName']
  },
  schema: GetCrashSchema,
  handler: async (args) => {
    const { device: deviceId, crashName } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      const result = await idb(
        ['crash', 'show', crashName, '--udid', resolvedDevice],
        { timeout: TIMEOUTS.DEFAULT }
      );

      if (!result.success) {
        if (result.stderr.includes('command not found') || result.stderr.includes('idb: not found')) {
          throw new SimulatorError(
            'fb-idb is not installed. Install with: brew install idb-companion',
            {
              code: 'IDB_NOT_INSTALLED',
              details: { stderr: result.stderr },
              recovery: 'Install idb using: brew install idb-companion && brew services start idb_companion'
            }
          );
        }

        if (result.stderr.includes('not found') || result.stderr.includes('No such')) {
          throw new SimulatorError(
            `Crash report not found: ${crashName}`,
            {
              code: 'CRASH_NOT_FOUND',
              details: { crashName, stderr: result.stderr },
              recovery: 'Use simulator_list_crashes to see available crash reports'
            }
          );
        }

        throw new SimulatorError(
          `Failed to retrieve crash: ${result.stderr}`,
          {
            code: 'GET_CRASH_FAILED',
            details: { crashName, stderr: result.stderr, exitCode: result.exitCode }
          }
        );
      }

      return {
        content: [{ type: 'text', text: `Crash Report: ${crashName}\n\n${result.stdout}` }],
        isError: false
      };
    } catch (error) {
      if (error instanceof SimulatorError) {
        throw error;
      }
      throw new SimulatorError(
        `Unexpected error retrieving crash: ${error instanceof Error ? error.message : String(error)}`,
        {
          code: 'GET_CRASH_UNEXPECTED_ERROR',
          details: { crashName, error: String(error) }
        }
      );
    }
  }
};

/**
 * Tool: simulator_stream_logs
 * Stream real-time logs from the simulator (blocking operation - runs until stopped)
 */
export const streamLogsTool: ToolDefinition<typeof StreamLogsSchema> = {
  name: 'simulator_stream_logs',
  description: 'Stream real-time logs from the iOS simulator. This is a blocking operation - logs will stream until manually stopped. Supports filtering by predicate and output style formatting.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" for any booted device',
        default: 'booted'
      },
      predicate: {
        type: 'string',
        description: 'Log predicate filter (e.g., "processImagePath CONTAINS \'MyApp\'" or "subsystem == \'com.example.myapp\'")'
      },
      style: {
        type: 'string',
        enum: ['default', 'compact', 'json'],
        description: 'Log output style: default (full), compact (minimal), or json (structured)',
        default: 'default'
      }
    }
  },
  schema: StreamLogsSchema,
  handler: async (args) => {
    const { device: deviceId, predicate, style } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      const idbArgs = ['log', '--udid', resolvedDevice];

      if (predicate) {
        idbArgs.push('--', predicate);
      }

      if (style && style !== 'default') {
        idbArgs.push('--style', style);
      }

      const result = await idb(idbArgs, { timeout: TIMEOUTS.TEST });

      if (!result.success) {
        if (result.stderr.includes('command not found') || result.stderr.includes('idb: not found')) {
          throw new SimulatorError(
            'fb-idb is not installed. Install with: brew install idb-companion',
            {
              code: 'IDB_NOT_INSTALLED',
              details: { stderr: result.stderr },
              recovery: 'Install idb using: brew install idb-companion && brew services start idb_companion'
            }
          );
        }

        throw new SimulatorError(
          `Failed to stream logs: ${result.stderr}`,
          {
            code: 'STREAM_LOGS_FAILED',
            details: { predicate, stderr: result.stderr, exitCode: result.exitCode }
          }
        );
      }

      return {
        content: [{ type: 'text', text: result.stdout }],
        isError: false
      };
    } catch (error) {
      if (error instanceof SimulatorError) {
        throw error;
      }
      throw new SimulatorError(
        `Unexpected error streaming logs: ${error instanceof Error ? error.message : String(error)}`,
        {
          code: 'STREAM_LOGS_UNEXPECTED_ERROR',
          details: { error: String(error) }
        }
      );
    }
  }
};

/**
 * Tool: simulator_input_text
 * Input text into the currently focused field on the simulator
 */
export const inputTextTool: ToolDefinition<typeof InputTextSchema> = {
  name: 'simulator_input_text',
  description: 'Input text into the currently focused text field on the iOS simulator. The target field must already be focused before calling this tool.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" for any booted device',
        default: 'booted'
      },
      text: {
        type: 'string',
        description: 'Text to input into the focused field'
      }
    },
    required: ['text']
  },
  schema: InputTextSchema,
  handler: async (args) => {
    const { device: deviceId, text } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      const result = await idb(
        ['ui', 'text', text, '--udid', resolvedDevice],
        { timeout: TIMEOUTS.DEFAULT }
      );

      if (!result.success) {
        if (result.stderr.includes('command not found') || result.stderr.includes('idb: not found')) {
          throw new SimulatorError(
            'fb-idb is not installed. Install with: brew install idb-companion',
            {
              code: 'IDB_NOT_INSTALLED',
              details: { stderr: result.stderr },
              recovery: 'Install idb using: brew install idb-companion && brew services start idb_companion'
            }
          );
        }

        if (result.stderr.includes('No focused text field') || result.stderr.includes('not focused')) {
          throw new SimulatorError(
            'No text field is currently focused. Tap a text field first.',
            {
              code: 'NO_FOCUSED_FIELD',
              details: { text, stderr: result.stderr },
              recovery: 'Use simulator_tap or simulator_describe_ui to find and tap a text field first'
            }
          );
        }

        throw new SimulatorError(
          `Failed to input text: ${result.stderr}`,
          {
            code: 'INPUT_TEXT_FAILED',
            details: { text, stderr: result.stderr, exitCode: result.exitCode }
          }
        );
      }

      return {
        content: [{ type: 'text', text: `Successfully input text: "${text}"` }],
        isError: false
      };
    } catch (error) {
      if (error instanceof SimulatorError) {
        throw error;
      }
      throw new SimulatorError(
        `Unexpected error inputting text: ${error instanceof Error ? error.message : String(error)}`,
        {
          code: 'INPUT_TEXT_UNEXPECTED_ERROR',
          details: { text, error: String(error) }
        }
      );
    }
  }
};

/**
 * Tool: simulator_press_button
 * Simulate hardware button presses (Home, Lock, Siri, etc.)
 */
export const pressButtonTool: ToolDefinition<typeof PressButtonSchema> = {
  name: 'simulator_press_button',
  description: 'Simulate hardware button presses on the iOS simulator. Supports HOME, LOCK, SIDE_BUTTON, SIRI, and APPLE_PAY buttons.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" for any booted device',
        default: 'booted'
      },
      button: {
        type: 'string',
        enum: ['APPLE_PAY', 'HOME', 'LOCK', 'SIDE_BUTTON', 'SIRI'],
        description: 'Hardware button to press: APPLE_PAY, HOME, LOCK, SIDE_BUTTON, or SIRI'
      }
    },
    required: ['button']
  },
  schema: PressButtonSchema,
  handler: async (args) => {
    const { device: deviceId, button } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      const result = await idb(
        ['ui', 'button', button, '--udid', resolvedDevice],
        { timeout: TIMEOUTS.DEFAULT }
      );

      if (!result.success) {
        if (result.stderr.includes('command not found') || result.stderr.includes('idb: not found')) {
          throw new SimulatorError(
            'fb-idb is not installed. Install with: brew install idb-companion',
            {
              code: 'IDB_NOT_INSTALLED',
              details: { stderr: result.stderr },
              recovery: 'Install idb using: brew install idb-companion && brew services start idb_companion'
            }
          );
        }

        if (result.stderr.includes('not supported') || result.stderr.includes('unavailable')) {
          throw new SimulatorError(
            `Button ${button} is not supported on this device`,
            {
              code: 'BUTTON_NOT_SUPPORTED',
              details: { button, stderr: result.stderr },
              recovery: 'Check device capabilities - some buttons (e.g., HOME) are not available on newer devices without physical home buttons'
            }
          );
        }

        throw new SimulatorError(
          `Failed to press button: ${result.stderr}`,
          {
            code: 'PRESS_BUTTON_FAILED',
            details: { button, stderr: result.stderr, exitCode: result.exitCode }
          }
        );
      }

      return {
        content: [{ type: 'text', text: `Successfully pressed ${button} button` }],
        isError: false
      };
    } catch (error) {
      if (error instanceof SimulatorError) {
        throw error;
      }
      throw new SimulatorError(
        `Unexpected error pressing button: ${error instanceof Error ? error.message : String(error)}`,
        {
          code: 'PRESS_BUTTON_UNEXPECTED_ERROR',
          details: { button, error: String(error) }
        }
      );
    }
  }
};

/**
 * Tool: simulator_delete_crashes
 * Delete crash reports from the simulator
 */
export const deleteCrashesTool: ToolDefinition<typeof DeleteCrashesSchema> = {
  name: 'simulator_delete_crashes',
  description: 'Delete crash reports from the iOS simulator. Can delete specific crashes, crashes in a date range, or all crashes.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" for any booted device',
        default: 'booted'
      },
      crashName: {
        type: 'string',
        description: 'Specific crash name to delete (from simulator_list_crashes)'
      },
      before: {
        type: 'string',
        description: 'Delete crashes before this date (ISO 8601 format)'
      },
      since: {
        type: 'string',
        description: 'Delete crashes since this date (ISO 8601 format)'
      },
      all: {
        type: 'boolean',
        description: 'Delete all crashes (use with caution)',
        default: false
      }
    }
  },
  schema: DeleteCrashesSchema,
  handler: async (args) => {
    const { device: deviceId, crashName, before, since, all } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      const idbArgs = ['crash', 'delete', '--udid', resolvedDevice];

      if (crashName) {
        idbArgs.push('--name', crashName);
      } else if (all) {
        idbArgs.push('--all');
      } else {
        if (before) {
          idbArgs.push('--before', before);
        }
        if (since) {
          idbArgs.push('--since', since);
        }
      }

      const result = await idb(idbArgs, { timeout: TIMEOUTS.DEFAULT });

      if (!result.success) {
        if (result.stderr.includes('command not found') || result.stderr.includes('idb: not found')) {
          throw new SimulatorError(
            'fb-idb is not installed. Install with: brew install idb-companion',
            {
              code: 'IDB_NOT_INSTALLED',
              details: { stderr: result.stderr },
              recovery: 'Install idb using: brew install idb-companion && brew services start idb_companion'
            }
          );
        }

        throw new SimulatorError(
          `Failed to delete crashes: ${result.stderr}`,
          {
            code: 'DELETE_CRASHES_FAILED',
            details: { stderr: result.stderr, exitCode: result.exitCode }
          }
        );
      }

      const message = crashName
        ? `Successfully deleted crash: ${crashName}`
        : all
        ? 'Successfully deleted all crash reports'
        : 'Successfully deleted crash reports matching criteria';

      return {
        content: [{ type: 'text', text: message }],
        isError: false
      };
    } catch (error) {
      if (error instanceof SimulatorError) {
        throw error;
      }
      throw new SimulatorError(
        `Unexpected error deleting crashes: ${error instanceof Error ? error.message : String(error)}`,
        {
          code: 'DELETE_CRASHES_UNEXPECTED_ERROR',
          details: { error: String(error) }
        }
      );
    }
  }
};
