/**
 * Privacy and permissions management tools
 */

import type { ToolDefinition } from '../../shared/types.js';
import {
  GrantPermissionSchema,
  RevokePermissionSchema,
  ResetPermissionsSchema
} from '../../schemas/environment.js';
import { simctl } from '../../shared/executor.js';

/**
 * Tool: simulator_grant_permission
 * Grant privacy permission to an app without prompting
 */
export const grantPermissionTool: ToolDefinition<typeof GrantPermissionSchema> = {
  name: 'simulator_grant_permission',
  description: 'Grant a privacy permission to an app without prompting. Useful for automated testing and skipping permission dialogs.',
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
      service: {
        type: 'string',
        enum: [
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
        ],
        description: 'Permission service to grant'
      }
    },
    required: ['bundleId', 'service']
  },
  schema: GrantPermissionSchema,
  handler: async (args) => {
    try {
      const result = await simctl([
        'privacy',
        args.device,
        'grant',
        args.service,
        args.bundleId
      ]);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Granted ${args.service} permission to ${args.bundleId}`,
                  device: args.device,
                  bundleId: args.bundleId,
                  service: args.service
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
                  message: 'Failed to grant permission',
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
                message: 'Failed to grant permission',
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
 * Tool: simulator_revoke_permission
 * Revoke privacy permission from an app
 */
export const revokePermissionTool: ToolDefinition<typeof RevokePermissionSchema> = {
  name: 'simulator_revoke_permission',
  description: 'Revoke a privacy permission from an app, denying all use of the service.',
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
      service: {
        type: 'string',
        enum: [
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
        ],
        description: 'Permission service to revoke'
      }
    },
    required: ['bundleId', 'service']
  },
  schema: RevokePermissionSchema,
  handler: async (args) => {
    try {
      const result = await simctl([
        'privacy',
        args.device,
        'revoke',
        args.service,
        args.bundleId
      ]);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Revoked ${args.service} permission from ${args.bundleId}`,
                  device: args.device,
                  bundleId: args.bundleId,
                  service: args.service
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
                  message: 'Failed to revoke permission',
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
                message: 'Failed to revoke permission',
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
 * Tool: simulator_reset_permissions
 * Reset privacy permissions, prompting on next use
 */
export const resetPermissionsTool: ToolDefinition<typeof ResetPermissionsSchema> = {
  name: 'simulator_reset_permissions',
  description: 'Reset privacy permissions to default state, prompting on next use. Useful for testing first-run experience.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      bundleId: {
        type: 'string',
        description: 'Bundle identifier (optional - omit to reset all apps)'
      },
      service: {
        type: 'string',
        enum: [
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
        ],
        description: 'Service to reset (optional - omit to reset all services)'
      }
    }
  },
  schema: ResetPermissionsSchema,
  handler: async (args) => {
    try {
      // Build command arguments
      const cmdArgs = ['privacy', args.device, 'reset'];

      if (args.service) {
        cmdArgs.push(args.service);
      } else {
        cmdArgs.push('all');
      }

      if (args.bundleId) {
        cmdArgs.push(args.bundleId);
      }

      const result = await simctl(cmdArgs);

      if (result.exitCode === 0) {
        const scope = args.bundleId
          ? `for ${args.bundleId}`
          : 'for all apps';
        const serviceScope = args.service || 'all services';

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Reset ${serviceScope} permissions ${scope}`,
                  device: args.device,
                  bundleId: args.bundleId,
                  service: args.service
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
                  message: 'Failed to reset permissions',
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
                message: 'Failed to reset permissions',
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
