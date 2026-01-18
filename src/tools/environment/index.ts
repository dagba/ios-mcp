/**
 * Environment control tools module
 * Exports tool registration function for all environment-related tools
 */

import type { ToolDefinition } from '../../shared/types.js';
import {
  statusBarOverrideTool,
  statusBarListTool,
  statusBarClearTool
} from './status-bar.js';
import {
  setAppearanceTool,
  getAppearanceTool,
  setContentSizeTool,
  getContentSizeTool,
  setIncreaseContrastTool
} from './appearance.js';
import {
  grantPermissionTool,
  revokePermissionTool,
  resetPermissionsTool
} from './privacy.js';
import {
  sendPushNotificationTool
} from './push.js';

/**
 * Register all environment control tools with the tool registry
 */
export function registerEnvironmentTools(registry: Map<string, ToolDefinition>): void {
  // Status bar tools
  registry.set(statusBarOverrideTool.name, statusBarOverrideTool);
  registry.set(statusBarListTool.name, statusBarListTool);
  registry.set(statusBarClearTool.name, statusBarClearTool);

  // Appearance tools
  registry.set(setAppearanceTool.name, setAppearanceTool);
  registry.set(getAppearanceTool.name, getAppearanceTool);
  registry.set(setContentSizeTool.name, setContentSizeTool);
  registry.set(getContentSizeTool.name, getContentSizeTool);
  registry.set(setIncreaseContrastTool.name, setIncreaseContrastTool);

  // Privacy tools
  registry.set(grantPermissionTool.name, grantPermissionTool);
  registry.set(revokePermissionTool.name, revokePermissionTool);
  registry.set(resetPermissionsTool.name, resetPermissionsTool);

  // Push notification tools
  registry.set(sendPushNotificationTool.name, sendPushNotificationTool);
}
