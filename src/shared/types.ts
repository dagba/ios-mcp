/**
 * Core type definitions used across the iOS Dev MCP Server
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';

/**
 * iOS Simulator Device
 */
export interface Device {
  udid: string;
  name: string;
  state: 'Booted' | 'Shutdown' | 'Shutting Down';
  runtime: string;
  deviceType: string;
  isAvailable: boolean;
}

/**
 * Command execution result
 */
export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

/**
 * MCP Tool Result format
 */
export interface ToolResult {
  content: ToolContent[];
  isError?: boolean;
}

export type ToolContent =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }
  | { type: 'resource'; resource: { uri: string; mimeType?: string; text?: string } };

/**
 * Build settings for xcodebuild operations
 */
export interface BuildSettings {
  workspace?: string;
  project?: string;
  scheme?: string;
  configuration?: string;  // Debug, Release
  sdk?: string;           // iphonesimulator, iphoneos
  destination?: string;   // 'platform=iOS Simulator,name=iPhone 15 Pro'
  derivedDataPath?: string;
  archivePath?: string;
}

/**
 * Test results structure
 */
export interface TestResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  failures: TestFailure[];
  coverage?: CoverageData;
}

export interface TestFailure {
  testCase: string;
  testMethod: string;
  message: string;
  file?: string;
  line?: number;
}

export interface CoverageData {
  lineCoverage: number;
  linesCovered: number;
  linesTotal: number;
  files: FileCoverage[];
}

export interface FileCoverage {
  path: string;
  lineCoverage: number;
  linesCovered: number;
  linesTotal: number;
}

/**
 * Build error/warning from xcodebuild
 */
export interface BuildError {
  file: string;
  line: number;
  column?: number;
  type: 'error' | 'warning';
  message: string;
}

/**
 * Screenshot options
 */
export interface ScreenshotOptions {
  quality?: number;     // JPEG quality 1-100
  maxWidth?: number;    // Max width in pixels
  maxHeight?: number;   // Max height in pixels
}

/**
 * Location coordinates for simulator
 */
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Push notification payload
 */
export interface PushNotificationPayload {
  aps: {
    alert?: string | {
      title?: string;
      subtitle?: string;
      body?: string;
    };
    badge?: number;
    sound?: string;
    'content-available'?: number;
  };
  [key: string]: any;
}

/**
 * Tool definition with handler and schema
 */
export interface ToolDefinition<T extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  inputSchema: Tool['inputSchema'];
  schema: T;
  handler: (args: z.infer<T>) => Promise<ToolResult>;
}

/**
 * Tool registration function signature
 */
export type ToolRegistrationFunction = (registry: Map<string, ToolDefinition>) => void;
