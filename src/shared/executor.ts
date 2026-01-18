/**
 * Command execution wrapper using execa
 * Provides consistent command execution with timeout management and error handling
 */

import { execa } from 'execa';
import type { CommandResult } from './types.js';
import { ExecutorError } from './errors.js';

/**
 * Options for command execution
 */
export interface ExecuteOptions {
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
  input?: string;
  maxBuffer?: number;
}

/**
 * Standard timeouts for different operation types (milliseconds)
 */
export const TIMEOUTS = {
  LIST: 5000,           // 5s for queries/list operations
  BOOT: 60000,          // 60s for device boot
  INSTALL: 30000,       // 30s for app install
  SCREENSHOT: 10000,    // 10s for screenshot
  BUILD: 300000,        // 5min for builds
  TEST: 600000,         // 10min for tests
  DEFAULT: 60000        // 60s default timeout
} as const;

/**
 * Execute a command using execa
 * Returns structured result with stdout, stderr, exitCode, and success flag
 */
export async function execute(
  command: string,
  args: string[],
  options: {
    timeout?: number;
    cwd?: string;
    env?: Record<string, string | undefined>;
    input?: string;
    encoding?: BufferEncoding;
  } = {}
): Promise<CommandResult> {
  const { execa } = await import('execa');

  try {
    const result = await execa(command, args, {
      timeout: options.timeout || 60000,
      cwd: options.cwd || process.cwd(),
      env: options.env ? { ...process.env, ...options.env } : undefined,
      input: options.input,
      reject: false, // Don't throw on non-zero exit, we'll handle it
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large outputs
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode || 0,
      success: result.exitCode === 0
    };
  } catch (error) {
    // Handle timeout and other execa-specific errors
    if (error instanceof Error) {
      if (error.name === 'ExecaError') {
        const execaError = error as any;
        throw new ExecutorError(
          `Command failed with exit code ${execaError.exitCode || 'unknown'}: ${command} ${args.join(' ')}`,
          `${command} ${args.join(' ')}`,
          error
        );
      }
    }

    throw new ExecutorError(
      `Failed to execute command: ${error instanceof Error ? error.message : String(error)}`,
      `${command} ${args.join(' ')}`
    );
  }
}

/**
 * Execute command and return only stdout (throws on non-zero exit)
 */
export async function executeSimple(
  command: string,
  args: string[],
  options: ExecuteOptions = {}
): Promise<string> {
  const result = await execute(command, args, options);

  if (!result.success) {
    throw new ExecutorError(
      `Command failed: ${command} ${args.join(' ')}\n${result.stderr || result.stdout}`,
      `${command} ${args.join(' ')}`
    );
  }

  return result.stdout;
}

/**
 * Execute xcrun command (convenience wrapper)
 */
export async function xcrun(args: string[], options: ExecuteOptions = {}): Promise<CommandResult> {
  return execute('xcrun', args, options);
}

/**
 * Execute simctl command
 */
export async function simctl(args: string[], inputOrOptions?: string | ExecuteOptions): Promise<CommandResult> {
  // Support both: simctl(args, 'input') and simctl(args, {options})
  const options = typeof inputOrOptions === 'string'
    ? { input: inputOrOptions }
    : inputOrOptions;

  return execute('xcrun', ['simctl', ...args], options);
}

/**
 * Execute xcodebuild command
 */
export async function xcodebuild(args: string[], options?: ExecuteOptions): Promise<CommandResult> {
  return execute('xcodebuild', args, {
    ...options,
    timeout: options?.timeout || 300000 // 5 minutes default for builds
  });
}

/**
 * Execute swift package command
 */
export async function swiftPackage(args: string[], options?: ExecuteOptions): Promise<CommandResult> {
  return execute('swift', ['package', ...args], options);
}

/**
 * Execute idb (iOS Development Bridge) command
 * Used for advanced simulator UI inspection and automation
 *
 * NOTE: idb path resolution:
 * 1. First tries ~/bin/idb (symlink to venv installation)
 * 2. Falls back to 'idb' in PATH (for system installations)
 */
export async function idb(args: string[], options?: ExecuteOptions): Promise<CommandResult> {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const idbPath = `${homeDir}/bin/idb`;

  // Try ~/bin/idb first (venv symlink), fall back to PATH
  const command = require('fs').existsSync(idbPath) ? idbPath : 'idb';
  return execute(command, args, options);
}
