/**
 * Appearance and accessibility control tools
 */

import type { ToolDefinition } from '../../shared/types.js';
import {
  SetAppearanceSchema,
  GetAppearanceSchema,
  SetContentSizeSchema,
  GetContentSizeSchema,
  SetIncreaseContrastSchema
} from '../../schemas/environment.js';
import { simctl } from '../../shared/executor.js';

/**
 * Tool: simulator_set_appearance
 * Set the simulator appearance mode (light/dark)
 */
export const setAppearanceTool: ToolDefinition<typeof SetAppearanceSchema> = {
  name: 'simulator_set_appearance',
  description: 'Set the simulator appearance mode to light or dark. Useful for testing app appearance in different modes.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      mode: {
        type: 'string',
        enum: ['light', 'dark'],
        description: 'Appearance mode to set'
      }
    },
    required: ['mode']
  },
  schema: SetAppearanceSchema,
  handler: async (args) => {
    try {
      const result = await simctl(['ui', args.device, 'appearance', args.mode]);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Appearance set to ${args.mode} mode`,
                  device: args.device,
                  mode: args.mode
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
                  message: 'Failed to set appearance',
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
                message: 'Failed to set appearance',
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
 * Tool: simulator_get_appearance
 * Get the current simulator appearance mode
 */
export const getAppearanceTool: ToolDefinition<typeof GetAppearanceSchema> = {
  name: 'simulator_get_appearance',
  description: 'Get the current simulator appearance mode (light, dark, unsupported, or unknown).',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      }
    }
  },
  schema: GetAppearanceSchema,
  handler: async (args) => {
    try {
      const result = await simctl(['ui', args.device, 'appearance']);

      if (result.exitCode === 0) {
        const mode = result.stdout.trim();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  device: args.device,
                  mode
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
                  message: 'Failed to get appearance',
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
                message: 'Failed to get appearance',
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
 * Tool: simulator_set_content_size
 * Set the preferred content size category (Dynamic Type)
 */
export const setContentSizeTool: ToolDefinition<typeof SetContentSizeSchema> = {
  name: 'simulator_set_content_size',
  description: 'Set the preferred content size category for Dynamic Type testing. Test your app with different text sizes for accessibility.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      size: {
        type: 'string',
        enum: [
          'extra-small',
          'small',
          'medium',
          'large',
          'extra-large',
          'extra-extra-large',
          'extra-extra-extra-large',
          'accessibility-medium',
          'accessibility-large',
          'accessibility-extra-large',
          'accessibility-extra-extra-large',
          'accessibility-extra-extra-extra-large'
        ],
        description: 'Content size category to set'
      }
    },
    required: ['size']
  },
  schema: SetContentSizeSchema,
  handler: async (args) => {
    try {
      const result = await simctl(['ui', args.device, 'content_size', args.size]);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Content size set to ${args.size}`,
                  device: args.device,
                  size: args.size
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
                  message: 'Failed to set content size',
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
                message: 'Failed to set content size',
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
 * Tool: simulator_get_content_size
 * Get the current preferred content size category
 */
export const getContentSizeTool: ToolDefinition<typeof GetContentSizeSchema> = {
  name: 'simulator_get_content_size',
  description: 'Get the current preferred content size category (Dynamic Type setting).',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      }
    }
  },
  schema: GetContentSizeSchema,
  handler: async (args) => {
    try {
      const result = await simctl(['ui', args.device, 'content_size']);

      if (result.exitCode === 0) {
        const size = result.stdout.trim();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  device: args.device,
                  size
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
                  message: 'Failed to get content size',
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
                message: 'Failed to get content size',
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
 * Tool: simulator_set_increase_contrast
 * Enable or disable increased contrast mode
 */
export const setIncreaseContrastTool: ToolDefinition<typeof SetIncreaseContrastSchema> = {
  name: 'simulator_set_increase_contrast',
  description: 'Enable or disable increased contrast mode for accessibility testing.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      enabled: {
        type: 'boolean',
        description: 'Whether to enable or disable increased contrast mode'
      }
    },
    required: ['enabled']
  },
  schema: SetIncreaseContrastSchema,
  handler: async (args) => {
    try {
      const mode = args.enabled ? 'enabled' : 'disabled';
      const result = await simctl(['ui', args.device, 'increase_contrast', mode]);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Increased contrast ${mode}`,
                  device: args.device,
                  enabled: args.enabled
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
                  message: 'Failed to set increased contrast',
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
                message: 'Failed to set increased contrast',
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
