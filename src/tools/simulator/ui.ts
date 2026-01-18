/**
 * Simulator UI interaction and screenshot tools
 */

import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import sharp from 'sharp';
import type { ToolDefinition, ToolResult, ScreenshotOptions } from '../../shared/types.js';
import { simctl, idb, TIMEOUTS } from '../../shared/executor.js';
import { resolveDevice } from '../../shared/simulator.js';
import { SimulatorError } from '../../shared/errors.js';
import {
  ScreenshotSchema,
  TapSchema,
  SwipeSchema,
  LongPressSchema,
  DescribeUISchema,
  DescribePointSchema
} from '../../schemas/simulator.js';

/**
 * Tool: simulator_screenshot
 * Capture a screenshot from the iOS simulator with automatic compression
 */
export const screenshotTool: ToolDefinition<typeof ScreenshotSchema> = {
  name: 'simulator_screenshot',
  description: 'Capture a screenshot from the iOS simulator. Automatically compresses to JPEG for optimal LLM processing (typically 80% smaller than PNG).',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" for any booted device',
        default: 'booted'
      },
      quality: {
        type: 'number',
        description: 'JPEG quality (1-100)',
        default: 80,
        minimum: 1,
        maximum: 100
      },
      maxWidth: {
        type: 'number',
        description: 'Maximum width in pixels',
        default: 800,
        minimum: 100
      },
      maxHeight: {
        type: 'number',
        description: 'Maximum height in pixels',
        default: 1400,
        minimum: 100
      }
    }
  },
  schema: ScreenshotSchema,
  handler: async (args) => {
    const { device: deviceId, quality, maxWidth, maxHeight } = args;

    // Resolve device
    const resolvedDevice = await resolveDevice(deviceId);

    // Create temporary file for screenshot
    const tmpFile = join(tmpdir(), `ios-screenshot-${Date.now()}.png`);

    try {
      // Capture screenshot using simctl
      const result = await simctl(['io', resolvedDevice, 'screenshot', tmpFile], {
        timeout: TIMEOUTS.SCREENSHOT
      });

      if (!result.success) {
        throw new SimulatorError('Failed to capture screenshot', {
          code: 'SCREENSHOT_FAILED',
          details: {
            device: resolvedDevice,
            stderr: result.stderr
          },
          recovery: 'Ensure the simulator is booted and visible'
        });
      }

      // Compress screenshot using sharp
      const compressed = await compressScreenshot(tmpFile, {
        quality,
        maxWidth,
        maxHeight
      });

      // Return as base64 image
      return {
        content: [
          {
            type: 'image',
            data: compressed.base64,
            mimeType: 'image/jpeg'
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                size: `${compressed.width}x${compressed.height}`,
                originalSize: `${compressed.originalWidth}x${compressed.originalHeight}`,
                compressionRatio: `${Math.round((1 - compressed.sizeBytes / compressed.originalSizeBytes) * 100)}% smaller`,
                sizeKB: Math.round(compressed.sizeBytes / 1024),
                quality
              },
              null,
              2
            )
          }
        ]
      };
    } finally {
      // Clean up temp file
      try {
        await unlink(tmpFile);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }
};

/**
 * Tool: simulator_tap
 * Tap at specific coordinates on the simulator screen
 */
export const tapTool: ToolDefinition<typeof TapSchema> = {
  name: 'simulator_tap',
  description: 'Tap at specific x,y coordinates on the iOS simulator screen. Coordinates are in pixels from top-left corner.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted"',
        default: 'booted'
      },
      x: {
        type: 'number',
        description: 'X coordinate in pixels'
      },
      y: {
        type: 'number',
        description: 'Y coordinate in pixels'
      }
    },
    required: ['x', 'y']
  },
  schema: TapSchema,
  handler: async (args) => {
    const { device: deviceId, x, y } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      // Execute tap using idb
      const result = await idb(
        ['ui', 'tap', x.toString(), y.toString(), '--udid', resolvedDevice],
        { timeout: TIMEOUTS.DEFAULT }
      );

      if (!result.success) {
        if (result.stderr.includes('command not found') || result.stderr.includes('idb: not found')) {
          throw new SimulatorError(
            'fb-idb is not installed. Install with: brew install idb-companion',
            {
              code: 'IDB_NOT_INSTALLED',
              details: { stderr: result.stderr },
              recovery: 'Install idb using: brew install idb-companion && brew services start idb_companion\nAlternatively, build from source: https://github.com/facebook/idb'
            }
          );
        }

        throw new SimulatorError('Failed to execute tap', {
          code: 'TAP_FAILED',
          details: {
            device: resolvedDevice,
            coordinates: { x, y },
            stderr: result.stderr
          },
          recovery: 'Ensure coordinates are within screen bounds and the simulator is responsive'
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                action: 'tap',
                coordinates: { x, y },
                device: resolvedDevice
              },
              null,
              2
            )
          }
        ]
      };
    } catch (error) {
      if (error instanceof SimulatorError) {
        throw error;
      }
      throw new SimulatorError(
        `Unexpected error executing tap: ${error instanceof Error ? error.message : String(error)}`,
        {
          code: 'TAP_UNEXPECTED_ERROR',
          details: { x, y, error: String(error) }
        }
      );
    }
  }
};

/**
 * Tool: simulator_swipe
 * Swipe gesture from one point to another
 */
export const swipeTool: ToolDefinition<typeof SwipeSchema> = {
  name: 'simulator_swipe',
  description: 'Perform a swipe gesture on the iOS simulator from start coordinates to end coordinates. Useful for scrolling, dismissing, or navigating.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted"',
        default: 'booted'
      },
      x1: {
        type: 'number',
        description: 'Start X coordinate in pixels'
      },
      y1: {
        type: 'number',
        description: 'Start Y coordinate in pixels'
      },
      x2: {
        type: 'number',
        description: 'End X coordinate in pixels'
      },
      y2: {
        type: 'number',
        description: 'End Y coordinate in pixels'
      },
      duration: {
        type: 'number',
        description: 'Swipe duration in seconds',
        default: 0.3,
        minimum: 0.1,
        maximum: 10
      }
    },
    required: ['x1', 'y1', 'x2', 'y2']
  },
  schema: SwipeSchema,
  handler: async (args) => {
    const { device: deviceId, x1, y1, x2, y2, duration } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      // Execute swipe using idb
      const result = await idb(
        [
          'ui',
          'swipe',
          x1.toString(),
          y1.toString(),
          x2.toString(),
          y2.toString(),
          '--duration',
          duration.toString(),
          '--udid',
          resolvedDevice
        ],
        { timeout: TIMEOUTS.DEFAULT }
      );

      if (!result.success) {
        if (result.stderr.includes('command not found') || result.stderr.includes('idb: not found')) {
          throw new SimulatorError(
            'fb-idb is not installed. Install with: brew install idb-companion',
            {
              code: 'IDB_NOT_INSTALLED',
              details: { stderr: result.stderr },
              recovery: 'Install idb using: brew install idb-companion && brew services start idb_companion\nAlternatively, build from source: https://github.com/facebook/idb'
            }
          );
        }

        throw new SimulatorError('Failed to execute swipe', {
          code: 'SWIPE_FAILED',
          details: {
            device: resolvedDevice,
            start: { x: x1, y: y1 },
            end: { x: x2, y: y2 },
            duration,
            stderr: result.stderr
          },
          recovery: 'Ensure coordinates are within screen bounds and the simulator is responsive'
        });
      }

      // Calculate swipe direction
      const deltaX = x2 - x1;
      const deltaY = y2 - y1;
      const direction =
        Math.abs(deltaX) > Math.abs(deltaY)
          ? deltaX > 0 ? 'right' : 'left'
          : deltaY > 0 ? 'down' : 'up';

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                action: 'swipe',
                direction,
                start: { x: x1, y: y1 },
                end: { x: x2, y: y2 },
                distance: Math.round(Math.sqrt(deltaX ** 2 + deltaY ** 2)),
                duration,
                device: resolvedDevice
              },
              null,
              2
            )
          }
        ]
      };
    } catch (error) {
      if (error instanceof SimulatorError) {
        throw error;
      }
      throw new SimulatorError(
        `Unexpected error executing swipe: ${error instanceof Error ? error.message : String(error)}`,
        {
          code: 'SWIPE_UNEXPECTED_ERROR',
          details: { x1, y1, x2, y2, duration, error: String(error) }
        }
      );
    }
  }
};

/**
 * Tool: simulator_long_press
 * Long press at specific coordinates
 */
export const longPressTool: ToolDefinition<typeof LongPressSchema> = {
  name: 'simulator_long_press',
  description: 'Perform a long press (tap and hold) at specific coordinates on the iOS simulator. Useful for context menus, drag operations, or special interactions.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted"',
        default: 'booted'
      },
      x: {
        type: 'number',
        description: 'X coordinate in pixels'
      },
      y: {
        type: 'number',
        description: 'Y coordinate in pixels'
      },
      duration: {
        type: 'number',
        description: 'Press duration in seconds',
        default: 1.0,
        minimum: 0.5,
        maximum: 10
      }
    },
    required: ['x', 'y']
  },
  schema: LongPressSchema,
  handler: async (args) => {
    const { device: deviceId, x, y, duration } = args;

    try {
      const resolvedDevice = await resolveDevice(deviceId);

      // Execute long press using idb (tap with duration)
      const result = await idb(
        ['ui', 'tap', x.toString(), y.toString(), '--duration', duration.toString(), '--udid', resolvedDevice],
        { timeout: TIMEOUTS.DEFAULT + duration * 1000 }
      );

      if (!result.success) {
        if (result.stderr.includes('command not found') || result.stderr.includes('idb: not found')) {
          throw new SimulatorError(
            'fb-idb is not installed. Install with: brew install idb-companion',
            {
              code: 'IDB_NOT_INSTALLED',
              details: { stderr: result.stderr },
              recovery: 'Install idb using: brew install idb-companion && brew services start idb_companion\nAlternatively, build from source: https://github.com/facebook/idb'
            }
          );
        }

        throw new SimulatorError('Failed to execute long press', {
          code: 'LONG_PRESS_FAILED',
          details: {
            device: resolvedDevice,
            coordinates: { x, y },
            duration,
            stderr: result.stderr
          },
          recovery: 'Ensure coordinates are within screen bounds and the simulator is responsive'
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                action: 'long_press',
                coordinates: { x, y },
                duration,
                device: resolvedDevice
              },
              null,
              2
            )
          }
        ]
      };
    } catch (error) {
      if (error instanceof SimulatorError) {
        throw error;
      }
      throw new SimulatorError(
        `Unexpected error executing long press: ${error instanceof Error ? error.message : String(error)}`,
        {
          code: 'LONG_PRESS_UNEXPECTED_ERROR',
          details: { x, y, duration, error: String(error) }
        }
      );
    }
  }
};

/**
 * Compress screenshot for optimal LLM consumption
 * Converts PNG to JPEG with quality control and size constraints
 */
async function compressScreenshot(
  pngPath: string,
  options: ScreenshotOptions
): Promise<{
  base64: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  sizeBytes: number;
  originalSizeBytes: number;
}> {
  const { quality = 80, maxWidth = 800, maxHeight = 1400 } = options;

  // Read original image
  const image = sharp(pngPath);
  const metadata = await image.metadata();

  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;
  const originalSizeBytes = metadata.size || 0;

  // Calculate new dimensions maintaining aspect ratio
  let newWidth = originalWidth;
  let newHeight = originalHeight;

  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    const widthRatio = maxWidth / originalWidth;
    const heightRatio = maxHeight / originalHeight;
    const ratio = Math.min(widthRatio, heightRatio);

    newWidth = Math.round(originalWidth * ratio);
    newHeight = Math.round(originalHeight * ratio);
  }

  // Resize and convert to JPEG
  const jpegBuffer = await image
    .resize(newWidth, newHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality })
    .toBuffer();

  return {
    base64: jpegBuffer.toString('base64'),
    width: newWidth,
    height: newHeight,
    originalWidth,
    originalHeight,
    sizeBytes: jpegBuffer.length,
    originalSizeBytes
  };
}

/**
 * Tool: simulator_describe_ui
 * Get full accessibility tree of the current screen
 * Requires fb-idb to be installed (brew install idb-companion)
 */
export const describeUITool: ToolDefinition<typeof DescribeUISchema> = {
  name: 'simulator_describe_ui',
  description:
    'Get the full accessibility tree (UI hierarchy) of the current simulator screen. Returns all UI elements with their labels, roles, bounds, and states. Requires fb-idb (install: brew install idb-companion).',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted"',
        default: 'booted'
      },
      format: {
        type: 'string',
        enum: ['json', 'compact'],
        description: 'Output format: json (full details) or compact (human-readable summary)',
        default: 'compact'
      }
    }
  },
  schema: DescribeUISchema,
  handler: async (args) => {
    const { device: deviceId, format } = args;

    // Resolve device
    const resolvedDevice = await resolveDevice(deviceId);

    // Execute idb ui describe-all
    const result = await idb(['ui', 'describe-all', '--udid', resolvedDevice], {
      timeout: TIMEOUTS.DEFAULT
    });

    if (!result.success) {
      // Check if idb is not installed
      if (result.stderr.includes('command not found') || result.stderr.includes('idb: not found')) {
        throw new SimulatorError(
          'fb-idb is not installed. Install with: brew install idb-companion',
          {
            code: 'IDB_NOT_INSTALLED',
            details: { stderr: result.stderr },
            recovery: 'Install fb-idb: brew install idb-companion\nThen restart your terminal'
          }
        );
      }

      throw new SimulatorError('Failed to describe UI', {
        code: 'UI_DESCRIBE_FAILED',
        details: {
          device: resolvedDevice,
          stderr: result.stderr
        },
        recovery: 'Ensure the simulator is booted and an app is running'
      });
    }

    // Parse JSON output from idb
    let uiData;
    try {
      uiData = JSON.parse(result.stdout);
    } catch (error) {
      throw new SimulatorError('Failed to parse UI accessibility data', {
        code: 'UI_PARSE_FAILED',
        details: { stderr: result.stderr },
        recovery: 'Ensure idb is properly installed and the simulator is running'
      });
    }

    // Format output based on requested format
    if (format === 'json') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                device: resolvedDevice,
                elementCount: Array.isArray(uiData) ? uiData.length : 0,
                elements: uiData
              },
              null,
              2
            )
          }
        ]
      };
    }

    // Compact format - human-readable summary
    const elements = Array.isArray(uiData) ? uiData : [];
    const summary = elements
      .map((el: any, idx: number) => {
        const label = el.AXLabel || el.AXValue || '(no label)';
        const role = el.AXRole || el.role || 'unknown';
        const frame = el.AXFrame
          ? `[${el.AXFrame.X},${el.AXFrame.Y} ${el.AXFrame.Width}x${el.AXFrame.Height}]`
          : '';
        const enabled = el.AXEnabled !== false ? '' : ' [DISABLED]';

        return `${idx + 1}. ${role}: "${label}" ${frame}${enabled}`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `UI Accessibility Tree (${elements.length} elements):\n\n${summary}\n\nTip: Use format='json' for full details including custom actions, traits, and hierarchy.`
        }
      ]
    };
  }
};

/**
 * Tool: simulator_describe_point
 * Get accessibility info for UI element at specific coordinates
 * Requires fb-idb to be installed (brew install idb-companion)
 */
export const describePointTool: ToolDefinition<typeof DescribePointSchema> = {
  name: 'simulator_describe_point',
  description:
    'Get accessibility information for the UI element at specific x,y coordinates. Returns element details like label, role, bounds, and state. Useful for inspecting what exists at a point before tapping. Requires fb-idb.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted"',
        default: 'booted'
      },
      x: {
        type: 'number',
        description: 'X coordinate in pixels'
      },
      y: {
        type: 'number',
        description: 'Y coordinate in pixels'
      }
    },
    required: ['x', 'y']
  },
  schema: DescribePointSchema,
  handler: async (args) => {
    const { device: deviceId, x, y } = args;

    // Resolve device
    const resolvedDevice = await resolveDevice(deviceId);

    // Execute idb ui describe-point
    const result = await idb(
      ['ui', 'describe-point', x.toString(), y.toString(), '--udid', resolvedDevice],
      {
        timeout: TIMEOUTS.DEFAULT
      }
    );

    if (!result.success) {
      // Check if idb is not installed
      if (result.stderr.includes('command not found') || result.stderr.includes('idb: not found')) {
        throw new SimulatorError(
          'fb-idb is not installed. Install with: brew install idb-companion',
          {
            code: 'IDB_NOT_INSTALLED',
            details: { stderr: result.stderr },
            recovery: 'Install fb-idb: brew install idb-companion\nThen restart your terminal'
          }
        );
      }

      throw new SimulatorError('Failed to describe UI element at point', {
        code: 'UI_DESCRIBE_POINT_FAILED',
        details: {
          device: resolvedDevice,
          coordinates: { x, y },
          stderr: result.stderr
        },
        recovery: 'Ensure coordinates are within screen bounds and an app is running'
      });
    }

    // Parse JSON output from idb
    let elementData;
    try {
      elementData = JSON.parse(result.stdout);
    } catch (error) {
      throw new SimulatorError('Failed to parse UI element data', {
        code: 'UI_ELEMENT_PARSE_FAILED',
        details: { stderr: result.stderr },
        recovery: 'Ensure coordinates point to a valid UI element'
      });
    }

    // Format output
    const label = elementData.AXLabel || elementData.AXValue || '(no label)';
    const role = elementData.AXRole || elementData.role || 'unknown';
    const frame = elementData.AXFrame
      ? `[${elementData.AXFrame.X},${elementData.AXFrame.Y} ${elementData.AXFrame.Width}x${elementData.AXFrame.Height}]`
      : 'unknown';
    const enabled = elementData.AXEnabled !== false;
    const traits = elementData.AXTraits || [];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              coordinates: { x, y },
              element: {
                label,
                role,
                frame,
                enabled,
                traits,
                fullDetails: elementData
              }
            },
            null,
            2
          )
        }
      ]
    };
  }
};
