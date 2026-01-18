/**
 * Media tools for video recording and media library management
 */

import type { ToolDefinition } from '../../shared/types.js';
import {
  StartVideoRecordingSchema,
  StopVideoRecordingSchema,
  AddMediaSchema
} from '../../schemas/media.js';
import { simctl } from '../../shared/executor.js';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';

// Store active recording processes
const activeRecordings = new Map<string, ChildProcess>();

/**
 * Tool: simulator_start_video_recording
 * Start recording simulator screen to video file
 */
export const startVideoRecordingTool: ToolDefinition<typeof StartVideoRecordingSchema> = {
  name: 'simulator_start_video_recording',
  description: 'Start recording the simulator screen to a video file. Use simulator_stop_video_recording to stop.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      outputPath: {
        type: 'string',
        description: 'Output file path for the recorded video'
      },
      codec: {
        type: 'string',
        enum: ['h264', 'hevc'],
        description: 'Video codec to use (default: "hevc")'
      },
      display: {
        type: 'string',
        enum: ['internal', 'external'],
        description: 'Display to record (default: "internal")'
      },
      mask: {
        type: 'string',
        enum: ['ignored', 'alpha', 'black'],
        description: 'Mask to apply to the recording (optional)'
      }
    },
    required: ['outputPath']
  },
  schema: StartVideoRecordingSchema,
  handler: async (args) => {
    try {
      // Check if already recording on this device
      if (activeRecordings.has(args.device)) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  message: 'Recording already in progress for this device',
                  device: args.device,
                  note: 'Use simulator_stop_video_recording first'
                },
                null,
                2
              )
            }
          ],
          isError: true
        };
      }

      // Build simctl command
      const recordArgs = ['io', args.device, 'recordVideo'];

      // Add optional parameters
      if (args.codec) {
        recordArgs.push(`--codec=${args.codec}`);
      }
      if (args.display) {
        recordArgs.push(`--display=${args.display}`);
      }
      if (args.mask) {
        recordArgs.push(`--mask=${args.mask}`);
      }

      recordArgs.push(args.outputPath);

      // Start recording process in background
      const xcrun = spawn('xcrun', ['simctl', ...recordArgs]);

      // Store the process
      activeRecordings.set(args.device, xcrun);

      // Handle process errors
      xcrun.on('error', (error) => {
        activeRecordings.delete(args.device);
        console.error('Recording process error:', error);
      });

      xcrun.on('exit', (code) => {
        activeRecordings.delete(args.device);
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: 'Video recording started',
                device: args.device,
                outputPath: args.outputPath,
                codec: args.codec || 'hevc',
                display: args.display || 'internal',
                note: 'Use simulator_stop_video_recording to stop recording'
              },
              null,
              2
            )
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                message: 'Failed to start video recording',
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
 * Tool: simulator_stop_video_recording
 * Stop the current video recording
 */
export const stopVideoRecordingTool: ToolDefinition<typeof StopVideoRecordingSchema> = {
  name: 'simulator_stop_video_recording',
  description: 'Stop the current video recording and save the file.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      }
    }
  },
  schema: StopVideoRecordingSchema,
  handler: async (args) => {
    try {
      const recordingProcess = activeRecordings.get(args.device);

      if (!recordingProcess) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  message: 'No recording in progress for this device',
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

      // Send SIGINT to gracefully stop recording
      recordingProcess.kill('SIGINT');

      // Wait a moment for the process to exit
      await new Promise((resolve) => setTimeout(resolve, 1000));

      activeRecordings.delete(args.device);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: 'Video recording stopped',
                device: args.device
              },
              null,
              2
            )
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                message: 'Failed to stop video recording',
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
 * Tool: simulator_add_media
 * Add photos, videos, or contacts to the simulator
 */
export const addMediaTool: ToolDefinition<typeof AddMediaSchema> = {
  name: 'simulator_add_media',
  description: 'Add photos, videos, or contacts to the simulator. Files are automatically detected by type.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" (default: "booted")'
      },
      files: {
        type: 'array',
        description: 'Array of file paths to add (photos, videos, contacts)',
        items: {
          type: 'string'
        }
      }
    },
    required: ['files']
  },
  schema: AddMediaSchema,
  handler: async (args) => {
    try {
      // Verify all files exist
      for (const file of args.files) {
        try {
          await fs.access(file);
        } catch {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    message: `File not found: ${file}`,
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
      }

      // Add media files
      const result = await simctl(['addmedia', args.device, ...args.files]);

      if (result.exitCode === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Media files added successfully',
                  device: args.device,
                  filesAdded: args.files.length,
                  files: args.files
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
                  message: 'Failed to add media files',
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
                message: 'Failed to add media files',
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
 * Register all media tools with the tool registry
 */
export function registerMediaTools(registry: Map<string, ToolDefinition>): void {
  registry.set(startVideoRecordingTool.name, startVideoRecordingTool);
  registry.set(stopVideoRecordingTool.name, stopVideoRecordingTool);
  registry.set(addMediaTool.name, addMediaTool);
}
