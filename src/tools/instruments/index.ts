/**
 * Instruments profiling tools module
 * Exports tool registration function for all profiling-related tools
 */

import type { ToolDefinition } from '../../shared/types.js';
import {
  startProfilingTool,
  stopProfilingTool,
  analyzeTraceTool
} from './profiling.js';

/**
 * Register all Instruments profiling tools with the tool registry
 */
export function registerInstrumentsTools(registry: Map<string, ToolDefinition>): void {
  registry.set(startProfilingTool.name, startProfilingTool);
  registry.set(stopProfilingTool.name, stopProfilingTool);
  registry.set(analyzeTraceTool.name, analyzeTraceTool);
}

/**
 * Export all Instruments tools for direct import
 */
export const instrumentsTools = [
  startProfilingTool,
  stopProfilingTool,
  analyzeTraceTool
];
