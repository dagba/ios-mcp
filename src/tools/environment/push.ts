/**
 * Push notification testing tool
 */

import type { ToolDefinition } from '../../shared/types.js';
import { SendPushNotificationSchema } from '../../schemas/environment.js';
import { simctl } from '../../shared/executor.js';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Tool: simulator_send_push_notification
 * Send a simulated push notification to an app
 */
export const sendPushNotificationTool: ToolDefinition<typeof SendPushNotificationSchema> = {
  name: 'simulator_send_push_notification',
  description: 'Send a simulated push notification to an app. The payload must include an "aps" key with valid Apple Push Notification values.',
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
      payload: {
        type: 'object',
        description: 'JSON payload object (must include "aps" key, max 4096 bytes)'
      }
    },
    required: ['bundleId', 'payload']
  },
  schema: SendPushNotificationSchema,
  handler: async (args) => {
    try {
      // Validate payload has "aps" key
      if (!args.payload.aps) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  message: 'Payload must include an "aps" key',
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

      // Convert payload to JSON string
      const payloadJson = JSON.stringify(args.payload, null, 2);

      // Check size limit (4096 bytes)
      const payloadSize = Buffer.byteLength(payloadJson, 'utf8');
      if (payloadSize > 4096) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  message: `Payload too large: ${payloadSize} bytes (max 4096 bytes)`,
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

      // Write payload to temporary file
      const tempFile = join(tmpdir(), `push-${Date.now()}.json`);
      await fs.writeFile(tempFile, payloadJson, 'utf8');

      try {
        // Send push notification
        const result = await simctl([
          'push',
          args.device,
          args.bundleId,
          tempFile
        ]);

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
                    message: 'Push notification sent successfully',
                    device: args.device,
                    bundleId: args.bundleId,
                    payloadSize: `${payloadSize} bytes`
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
                    message: 'Failed to send push notification',
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
                message: 'Failed to send push notification',
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
