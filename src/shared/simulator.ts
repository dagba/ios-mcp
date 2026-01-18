/**
 * Shared simulator utilities and device management
 */

import { simctl, TIMEOUTS } from './executor.js';
import { SimulatorError } from './errors.js';
import type { Device } from './types.js';

/**
 * Parse simctl device list JSON output
 */
interface SimctlDeviceListOutput {
  devices: {
    [runtime: string]: Array<{
      udid: string;
      name: string;
      state: string;
      isAvailable: boolean;
      deviceTypeIdentifier: string;
    }>;
  };
}

/**
 * Get all available iOS simulator devices
 */
export async function listDevices(): Promise<Device[]> {
  const result = await simctl(['list', 'devices', '-j'], {
    timeout: TIMEOUTS.LIST
  });

  if (!result.success) {
    throw new SimulatorError('Failed to list devices', {
      code: 'LIST_DEVICES_FAILED',
      details: { stderr: result.stderr }
    });
  }

  try {
    const data: SimctlDeviceListOutput = JSON.parse(result.stdout);
    const devices: Device[] = [];

    for (const [runtime, deviceList] of Object.entries(data.devices)) {
      // Skip non-iOS runtimes (watchOS, tvOS, etc.)
      if (!runtime.includes('iOS')) {
        continue;
      }

      for (const device of deviceList) {
        if (device.isAvailable) {
          devices.push({
            udid: device.udid,
            name: device.name,
            state: normalizeState(device.state),
            runtime: runtime.replace('com.apple.CoreSimulator.SimRuntime.', '').replace(/-/g, ' '),
            deviceType: device.deviceTypeIdentifier.split('.').pop() || device.deviceTypeIdentifier,
            isAvailable: device.isAvailable
          });
        }
      }
    }

    return devices;
  } catch (error) {
    throw new SimulatorError('Failed to parse device list', {
      code: 'PARSE_ERROR',
      details: { error: error instanceof Error ? error.message : String(error) },
      recovery: 'Ensure Xcode and simulators are properly installed'
    });
  }
}

/**
 * Get the first booted device
 */
export async function getBootedDevice(): Promise<string | null> {
  const devices = await listDevices();
  const booted = devices.find(d => d.state === 'Booted');
  return booted?.udid || null;
}

/**
 * Check if a device exists
 */
export async function deviceExists(udid: string): Promise<boolean> {
  const devices = await listDevices();
  return devices.some(d => d.udid === udid);
}

/**
 * Get device by UDID
 */
export async function getDevice(udid: string): Promise<Device | null> {
  const devices = await listDevices();
  return devices.find(d => d.udid === udid) || null;
}

/**
 * Smart device resolution
 * - If device is "booted" or undefined, returns first booted device
 * - If device is a UDID, validates it exists and returns it
 * - Throws if no suitable device found
 */
export async function resolveDevice(device?: string): Promise<string> {
  // If no device specified or "booted", find first booted device
  if (!device || device.toLowerCase() === 'booted') {
    const booted = await getBootedDevice();

    if (!booted) {
      const devices = await listDevices();
      throw new SimulatorError('No booted device found', {
        code: 'NO_BOOTED_DEVICE',
        details: {
          availableDevices: devices.map(d => ({
            udid: d.udid,
            name: d.name,
            state: d.state
          }))
        },
        recovery: 'Boot a simulator first using simulator_boot or boot one from Simulator.app'
      });
    }

    return booted;
  }

  // Verify device exists
  const exists = await deviceExists(device);
  if (!exists) {
    const devices = await listDevices();
    throw new SimulatorError(`Device ${device} not found`, {
      code: 'DEVICE_NOT_FOUND',
      details: {
        requestedDevice: device,
        availableDevices: devices.map(d => ({
          udid: d.udid,
          name: d.name,
          state: d.state
        }))
      },
      recovery: 'Use simulator_list_devices to see available devices and their UDIDs'
    });
  }

  return device;
}

/**
 * Verify device is booted (boots it if needed when autoboot is true)
 */
export async function ensureDeviceBooted(udid: string, autoBoot = false): Promise<void> {
  const device = await getDevice(udid);

  if (!device) {
    throw new SimulatorError(`Device ${udid} not found`, {
      code: 'DEVICE_NOT_FOUND',
      recovery: 'Use simulator_list_devices to see available devices'
    });
  }

  if (device.state === 'Booted') {
    return; // Already booted
  }

  if (!autoBoot) {
    throw new SimulatorError(`Device ${device.name} is not booted (state: ${device.state})`, {
      code: 'DEVICE_NOT_BOOTED',
      details: { udid, state: device.state, name: device.name },
      recovery: 'Boot the device first using simulator_boot'
    });
  }

  // Auto-boot the device
  const result = await simctl(['boot', udid], { timeout: TIMEOUTS.BOOT });

  if (!result.success) {
    throw new SimulatorError(`Failed to boot device ${device.name}`, {
      code: 'BOOT_FAILED',
      details: { udid, stderr: result.stderr },
      recovery: 'Try booting the device manually from Simulator.app'
    });
  }
}

/**
 * Normalize device state strings
 */
function normalizeState(state: string): 'Booted' | 'Shutdown' | 'Shutting Down' {
  const normalized = state.trim();

  if (normalized === 'Booted') return 'Booted';
  if (normalized === 'Shutdown') return 'Shutdown';
  if (normalized === 'Shutting Down') return 'Shutting Down';

  // Default to Shutdown for unknown states
  return 'Shutdown';
}

/**
 * Wait for device to reach a specific state
 */
export async function waitForDeviceState(
  udid: string,
  targetState: Device['state'],
  timeoutMs = 30000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const device = await getDevice(udid);

    if (!device) {
      throw new SimulatorError(`Device ${udid} not found`, {
        code: 'DEVICE_NOT_FOUND'
      });
    }

    if (device.state === targetState) {
      return;
    }

    // Wait 500ms before checking again
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new SimulatorError(`Timeout waiting for device to reach state: ${targetState}`, {
    code: 'STATE_TIMEOUT',
    details: { udid, targetState, timeoutMs }
  });
}
