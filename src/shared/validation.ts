/**
 * Pre-flight validation utilities for Instruments profiling
 */

import { execa } from 'execa';
import { SimulatorError, ValidationError } from './errors.js';

/**
 * Check if xctrace command is available
 */
export async function checkXCTraceAvailable(): Promise<boolean> {
  try {
    await execa('which', ['xctrace']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if leaks command is available
 */
export async function checkLeaksAvailable(): Promise<boolean> {
  try {
    await execa('which', ['leaks']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that simulator exists and is booted
 * @throws SimulatorError with recovery message if validation fails
 */
export async function validateSimulatorState(udid: string): Promise<void> {
  try {
    const result = await execa('xcrun', ['simctl', 'list', 'devices']);
    const output = result.stdout;

    // Check if UDID exists in output
    if (!output.includes(udid)) {
      throw new SimulatorError('Device not found', {
        code: 'SIMULATOR_NOT_FOUND',
        details: { udid },
        recovery: 'List simulators: `xcrun simctl list devices`'
      });
    }

    // Check if simulator is booted
    const udidLine = output.split('\n').find(line => line.includes(udid));
    if (!udidLine || !udidLine.includes('(Booted)')) {
      throw new SimulatorError('Simulator is not booted', {
        code: 'SIMULATOR_NOT_BOOTED',
        details: { udid, state: 'Shutdown' },
        recovery: `Boot simulator first: \`xcrun simctl boot ${udid}\``
      });
    }
  } catch (error) {
    if (error instanceof SimulatorError) {
      throw error;
    }
    throw new SimulatorError('Device not found', {
      code: 'SIMULATOR_NOT_FOUND',
      details: { udid },
      recovery: 'List simulators: `xcrun simctl list devices`'
    });
  }
}

/**
 * Combined pre-flight validation for starting profiling
 * @throws ValidationError or SimulatorError with recovery message if any check fails
 */
export async function validateInstrumentsSetup(udid: string): Promise<void> {
  // Check xctrace availability
  const hasXCTrace = await checkXCTraceAvailable();
  if (!hasXCTrace) {
    throw new ValidationError(
      'xctrace command not found. Install Xcode Command Line Tools: `xcode-select --install`',
      'xctrace'
    );
  }

  // Validate simulator state
  await validateSimulatorState(udid);
}
