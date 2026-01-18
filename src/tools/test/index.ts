/**
 * Test tools module
 * Exports tool registration function for all test-related tools
 */

import type { ToolDefinition } from '../../shared/types.js';
import { runTestsTool } from './xcodebuild-test.js';

/**
 * Register all test tools with the tool registry
 */
export function registerTestTools(registry: Map<string, ToolDefinition>): void {
  registry.set(runTestsTool.name, runTestsTool);
}
