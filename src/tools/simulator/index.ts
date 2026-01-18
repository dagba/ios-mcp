/**
 * Simulator tools module
 * Exports tool registration function for all simulator-related tools
 */

import type { ToolDefinition } from '../../shared/types.js';
import {
  listDevicesTool,
  bootDeviceTool,
  shutdownDeviceTool,
  getDeviceInfoTool
} from './device.js';
import {
  screenshotTool,
  tapTool,
  swipeTool,
  longPressTool,
  describeUITool,
  describePointTool
} from './ui.js';
import {
  launchAppTool,
  terminateAppTool,
  installAppTool,
  uninstallAppTool,
  openURLTool,
  getLogsTool
} from './apps.js';
import {
  typeTextTool,
  pressHomeTool,
  sendKeysTool
} from './input.js';
import {
  listCrashesTool,
  getCrashTool,
  deleteCrashesTool,
  streamLogsTool,
  inputTextTool,
  pressButtonTool
} from './debug.js';

/**
 * Register all simulator tools with the tool registry
 */
export function registerSimulatorTools(registry: Map<string, ToolDefinition>): void {
  // Device management tools
  registry.set(listDevicesTool.name, listDevicesTool);
  registry.set(bootDeviceTool.name, bootDeviceTool);
  registry.set(shutdownDeviceTool.name, shutdownDeviceTool);
  registry.set(getDeviceInfoTool.name, getDeviceInfoTool);

  // UI interaction tools
  registry.set(screenshotTool.name, screenshotTool);
  registry.set(tapTool.name, tapTool);
  registry.set(swipeTool.name, swipeTool);
  registry.set(longPressTool.name, longPressTool);

  // UI inspection tools (requires fb-idb)
  registry.set(describeUITool.name, describeUITool);
  registry.set(describePointTool.name, describePointTool);

  // App lifecycle tools
  registry.set(launchAppTool.name, launchAppTool);
  registry.set(terminateAppTool.name, terminateAppTool);
  registry.set(installAppTool.name, installAppTool);
  registry.set(uninstallAppTool.name, uninstallAppTool);
  registry.set(openURLTool.name, openURLTool);
  registry.set(getLogsTool.name, getLogsTool);

  // Input simulation tools
  registry.set(typeTextTool.name, typeTextTool);
  registry.set(pressHomeTool.name, pressHomeTool);
  registry.set(sendKeysTool.name, sendKeysTool);

  // Debugging and automation tools (requires fb-idb)
  registry.set(listCrashesTool.name, listCrashesTool);
  registry.set(getCrashTool.name, getCrashTool);
  registry.set(deleteCrashesTool.name, deleteCrashesTool);
  registry.set(streamLogsTool.name, streamLogsTool);
  registry.set(inputTextTool.name, inputTextTool);
  registry.set(pressButtonTool.name, pressButtonTool);
}
