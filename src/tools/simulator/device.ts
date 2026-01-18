/**
 * Simulator device management tools
 */

import type { ToolDefinition, ToolResult, Device } from '../../shared/types.js';
import { simctl, TIMEOUTS } from '../../shared/executor.js';
import {
  listDevices,
  getDevice,
  resolveDevice,
  waitForDeviceState
} from '../../shared/simulator.js';
import { SimulatorError } from '../../shared/errors.js';
import { z } from 'zod';
import {
  DeviceIdentifierSchema,
  BootDeviceSchema,
  ShutdownDeviceSchema,
  GetDeviceInfoSchema
} from '../../schemas/simulator.js';

// Empty schema for tools with no parameters
const EmptySchema = z.object({});

/**
 * Tool: simulator_list_devices
 * List all available iOS simulator devices
 */
export const listDevicesTool: ToolDefinition<typeof EmptySchema> = {
  name: 'simulator_list_devices',
  description: 'List all available iOS simulator devices with their current states',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  schema: EmptySchema,
  handler: async () => {
    const devices = await listDevices();

    // Format device list for display
    const deviceList = devices.map(d => ({
      udid: d.udid,
      name: d.name,
      state: d.state,
      runtime: d.runtime,
      deviceType: d.deviceType
    }));

    const bootedCount = devices.filter(d => d.state === 'Booted').length;
    const totalCount = devices.length;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              summary: `Found ${totalCount} device(s) (${bootedCount} booted)`,
              devices: deviceList
            },
            null,
            2
          )
        }
      ]
    };
  }
};

/**
 * Tool: simulator_boot
 * Boot an iOS simulator device
 */
export const bootDeviceTool: ToolDefinition<typeof BootDeviceSchema> = {
  name: 'simulator_boot',
  description: 'Boot an iOS simulator device by UDID. The device will start in the background.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID to boot'
      }
    },
    required: ['device']
  },
  schema: BootDeviceSchema,
  handler: async (args) => {
    const { device: deviceId } = args;

    // Get device info
    const device = await getDevice(deviceId);

    if (!device) {
      throw new SimulatorError(`Device ${deviceId} not found`, {
        code: 'DEVICE_NOT_FOUND',
        recovery: 'Use simulator_list_devices to see available devices'
      });
    }

    // Check if already booted
    if (device.state === 'Booted') {
      return {
        content: [
          {
            type: 'text',
            text: `Device ${device.name} is already booted`
          }
        ]
      };
    }

    // Boot the device
    const result = await simctl(['boot', deviceId], {
      timeout: TIMEOUTS.BOOT
    });

    if (!result.success) {
      throw new SimulatorError(`Failed to boot device ${device.name}`, {
        code: 'BOOT_FAILED',
        details: {
          udid: deviceId,
          stderr: result.stderr
        },
        recovery: 'Try booting from Simulator.app or check if another simulator is already booted'
      });
    }

    // Wait for device to fully boot
    await waitForDeviceState(deviceId, 'Booted', 30000);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: `Successfully booted ${device.name}`,
              device: {
                udid: device.udid,
                name: device.name,
                state: 'Booted'
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

/**
 * Tool: simulator_shutdown
 * Shutdown an iOS simulator device
 */
export const shutdownDeviceTool: ToolDefinition<typeof ShutdownDeviceSchema> = {
  name: 'simulator_shutdown',
  description: 'Shutdown a running iOS simulator device by UDID',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID to shutdown'
      }
    },
    required: ['device']
  },
  schema: ShutdownDeviceSchema,
  handler: async (args) => {
    const { device: deviceId } = args;

    // Get device info
    const device = await getDevice(deviceId);

    if (!device) {
      throw new SimulatorError(`Device ${deviceId} not found`, {
        code: 'DEVICE_NOT_FOUND',
        recovery: 'Use simulator_list_devices to see available devices'
      });
    }

    // Check if already shutdown
    if (device.state === 'Shutdown') {
      return {
        content: [
          {
            type: 'text',
            text: `Device ${device.name} is already shut down`
          }
        ]
      };
    }

    // Shutdown the device
    const result = await simctl(['shutdown', deviceId], {
      timeout: TIMEOUTS.BOOT // Same timeout as boot
    });

    if (!result.success) {
      throw new SimulatorError(`Failed to shutdown device ${device.name}`, {
        code: 'SHUTDOWN_FAILED',
        details: {
          udid: deviceId,
          stderr: result.stderr
        }
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: `Successfully shut down ${device.name}`,
              device: {
                udid: device.udid,
                name: device.name,
                state: 'Shutdown'
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

/**
 * Tool: simulator_get_info
 * Get detailed information about a specific simulator device
 */
export const getDeviceInfoTool: ToolDefinition<typeof GetDeviceInfoSchema> = {
  name: 'simulator_get_info',
  description: 'Get detailed information about an iOS simulator device',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Device UDID or "booted" for any booted device',
        default: 'booted'
      }
    }
  },
  schema: GetDeviceInfoSchema,
  handler: async (args) => {
    const { device: deviceId } = args;

    // Resolve device (handles "booted")
    const resolvedDeviceId = await resolveDevice(deviceId);

    // Get device info
    const device = await getDevice(resolvedDeviceId);

    if (!device) {
      throw new SimulatorError(`Device ${resolvedDeviceId} not found`, {
        code: 'DEVICE_NOT_FOUND',
        recovery: 'Use simulator_list_devices to see available devices'
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              udid: device.udid,
              name: device.name,
              state: device.state,
              runtime: device.runtime,
              deviceType: device.deviceType,
              isAvailable: device.isAvailable
            },
            null,
            2
          )
        }
      ]
    };
  }
};
