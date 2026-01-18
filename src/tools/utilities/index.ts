/**
 * Utility tools for app containers, clipboard, keychain, and iCloud
 */

import type { ToolDefinition } from '../../shared/types.js';
import {
  GetAppContainerPathSchema,
  ClipboardCopySchema,
  ClipboardPasteSchema,
  ClipboardSyncSchema,
  AddRootCertificateSchema,
  AddCertificateSchema,
  ResetKeychainSchema,
  TriggerICloudSyncSchema
} from '../../schemas/utilities.js';
import { simctl } from '../../shared/executor.js';
import { promises as fs } from 'fs';

/**
 * Tool: simulator_get_app_container_path
 * Get the file system path to an app's container
 */
export const getAppContainerPathTool: ToolDefinition<typeof GetAppContainerPathSchema> = {
  name: 'simulator_get_app_container_path',
  description: 'Get the file system path to an app\'s container. Useful for inspecting app data, documents, or App Groups.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      bundleId: {
        type: 'string',
        description: 'Bundle identifier of the target application'
      },
      container: {
        type: 'string',
        description: 'Container type: "app", "data", "groups", or a group ID (default: "app")'
      }
    },
    required: ['bundleId']
  },
  schema: GetAppContainerPathSchema,
  handler: async (args) => {
    try {
      const containerArgs = ['get_app_container', args.device, args.bundleId];

      if (args.container && args.container !== 'app') {
        containerArgs.push(args.container);
      }

      const result = await simctl(containerArgs);

      if (result.exitCode === 0) {
        const path = result.stdout.trim();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  device: args.device,
                  bundleId: args.bundleId,
                  container: args.container || 'app',
                  path
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
                  message: 'Failed to get app container path',
                  device: args.device,
                  bundleId: args.bundleId,
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
                message: 'Failed to get app container path',
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
 * Tool: simulator_clipboard_copy
 * Copy text to the simulator's clipboard
 */
export const clipboardCopyTool: ToolDefinition<typeof ClipboardCopySchema> = {
  name: 'simulator_clipboard_copy',
  description: 'Copy text to the simulator\'s clipboard. The text will be available for pasting within simulator apps.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      text: {
        type: 'string',
        description: 'Text to copy to the simulator clipboard'
      }
    },
    required: ['text']
  },
  schema: ClipboardCopySchema,
  handler: async (args) => {
    try {
      // simctl pbcopy reads from stdin
      const result = await simctl(['pbcopy', args.device], args.text);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Text copied to clipboard',
                  device: args.device,
                  textLength: args.text.length
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
                  message: 'Failed to copy to clipboard',
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
                message: 'Failed to copy to clipboard',
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
 * Tool: simulator_clipboard_paste
 * Get the current text from the simulator's clipboard
 */
export const clipboardPasteTool: ToolDefinition<typeof ClipboardPasteSchema> = {
  name: 'simulator_clipboard_paste',
  description: 'Get the current text from the simulator\'s clipboard.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      }
    }
  },
  schema: ClipboardPasteSchema,
  handler: async (args) => {
    try {
      const result = await simctl(['pbpaste', args.device]);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  device: args.device,
                  clipboardText: result.stdout
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
                  message: 'Failed to paste from clipboard',
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
                message: 'Failed to paste from clipboard',
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
 * Tool: simulator_clipboard_sync
 * Sync clipboard between two simulators
 */
export const clipboardSyncTool: ToolDefinition<typeof ClipboardSyncSchema> = {
  name: 'simulator_clipboard_sync',
  description: 'Sync the clipboard from one simulator to another.',
  inputSchema: {
    type: 'object',
    properties: {
      sourceDevice: {
        type: 'string',
        description: 'Source device UDID or "booted" (default: "booted")'
      },
      targetDevice: {
        type: 'string',
        description: 'Target device UDID'
      }
    },
    required: ['targetDevice']
  },
  schema: ClipboardSyncSchema,
  handler: async (args) => {
    try {
      const result = await simctl(['pbsync', args.sourceDevice, args.targetDevice]);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Clipboard synced successfully',
                  sourceDevice: args.sourceDevice,
                  targetDevice: args.targetDevice
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
                  message: 'Failed to sync clipboard',
                  sourceDevice: args.sourceDevice,
                  targetDevice: args.targetDevice,
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
                message: 'Failed to sync clipboard',
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
 * Tool: simulator_add_root_certificate
 * Add a trusted root certificate to the simulator
 */
export const addRootCertificateTool: ToolDefinition<typeof AddRootCertificateSchema> = {
  name: 'simulator_add_root_certificate',
  description: 'Add a trusted root certificate to the simulator\'s keychain. Useful for SSL/TLS testing with custom CAs.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      certificatePath: {
        type: 'string',
        description: 'Path to the root certificate file (.pem, .cer, .der)'
      }
    },
    required: ['certificatePath']
  },
  schema: AddRootCertificateSchema,
  handler: async (args) => {
    try {
      // Verify certificate file exists
      await fs.access(args.certificatePath);

      const result = await simctl(['keychain', args.device, 'add-root-cert', args.certificatePath]);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Root certificate added successfully',
                  device: args.device,
                  certificatePath: args.certificatePath
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
                  message: 'Failed to add root certificate',
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
                message: 'Failed to add root certificate',
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
 * Tool: simulator_add_certificate
 * Add a certificate to the simulator's keychain
 */
export const addCertificateTool: ToolDefinition<typeof AddCertificateSchema> = {
  name: 'simulator_add_certificate',
  description: 'Add a certificate to the simulator\'s keychain.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      certificatePath: {
        type: 'string',
        description: 'Path to the certificate file (.pem, .cer, .der)'
      }
    },
    required: ['certificatePath']
  },
  schema: AddCertificateSchema,
  handler: async (args) => {
    try {
      // Verify certificate file exists
      await fs.access(args.certificatePath);

      const result = await simctl(['keychain', args.device, 'add-cert', args.certificatePath]);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Certificate added successfully',
                  device: args.device,
                  certificatePath: args.certificatePath
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
                  message: 'Failed to add certificate',
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
                message: 'Failed to add certificate',
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
 * Tool: simulator_reset_keychain
 * Reset the simulator's keychain
 */
export const resetKeychainTool: ToolDefinition<typeof ResetKeychainSchema> = {
  name: 'simulator_reset_keychain',
  description: 'Reset the simulator\'s keychain, removing all certificates and credentials.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      }
    }
  },
  schema: ResetKeychainSchema,
  handler: async (args) => {
    try {
      const result = await simctl(['keychain', args.device, 'reset']);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Keychain reset successfully',
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
                  message: 'Failed to reset keychain',
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
                message: 'Failed to reset keychain',
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
 * Tool: simulator_trigger_icloud_sync
 * Trigger iCloud sync on the simulator
 */
export const triggerICloudSyncTool: ToolDefinition<typeof TriggerICloudSyncSchema> = {
  name: 'simulator_trigger_icloud_sync',
  description: 'Trigger an iCloud sync on the simulator. Useful for testing iCloud-enabled features.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      }
    }
  },
  schema: TriggerICloudSyncSchema,
  handler: async (args) => {
    try {
      const result = await simctl(['icloud_sync', args.device]);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'iCloud sync triggered',
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
                  message: 'Failed to trigger iCloud sync',
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
                message: 'Failed to trigger iCloud sync',
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
 * Register all utility tools with the tool registry
 */
export function registerUtilityTools(registry: Map<string, ToolDefinition>): void {
  registry.set(getAppContainerPathTool.name, getAppContainerPathTool);
  registry.set(clipboardCopyTool.name, clipboardCopyTool);
  registry.set(clipboardPasteTool.name, clipboardPasteTool);
  registry.set(clipboardSyncTool.name, clipboardSyncTool);
  registry.set(addRootCertificateTool.name, addRootCertificateTool);
  registry.set(addCertificateTool.name, addCertificateTool);
  registry.set(resetKeychainTool.name, resetKeychainTool);
  registry.set(triggerICloudSyncTool.name, triggerICloudSyncTool);
}
