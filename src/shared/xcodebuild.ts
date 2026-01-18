/**
 * Xcodebuild command utilities
 */

import type { BuildSettings, BuildError } from './types.js';

/**
 * Build an xcodebuild command from settings
 */
export function buildXcodebuildCommand(
  action: string,
  settings: BuildSettings
): string[] {
  if (!settings.workspace && !settings.project) {
    throw new Error('Either workspace or project must be provided');
  }

  const command: string[] = ['xcodebuild', action];

  // Add workspace or project
  if (settings.workspace) {
    command.push('-workspace', settings.workspace);
  } else if (settings.project) {
    command.push('-project', settings.project);
  }

  // Add scheme if provided
  if (settings.scheme) {
    command.push('-scheme', settings.scheme);
  }

  // Add SDK if provided
  if (settings.sdk) {
    command.push('-sdk', settings.sdk);
  }

  // Add configuration if provided
  if (settings.configuration) {
    command.push('-configuration', settings.configuration);
  }

  // Add destination if provided
  if (settings.destination) {
    command.push('-destination', settings.destination);
  }

  // Add derived data path if provided
  if (settings.derivedDataPath) {
    command.push('-derivedDataPath', settings.derivedDataPath);
  }

  // Add archive path if provided
  if (settings.archivePath) {
    command.push('-archivePath', settings.archivePath);
  }

  return command;
}

/**
 * Parse build errors and warnings from xcodebuild output
 * Format: /path/to/file.swift:line:column: error|warning: message
 */
export function parseBuildErrors(output: string): BuildError[] {
  const errors: BuildError[] = [];

  // Regex to match xcodebuild error/warning format
  // Example: /Users/dev/MyApp/ContentView.swift:15:9: error: cannot find 'foo' in scope
  const errorRegex = /^(.+?):(\d+)(?::(\d+))?: (error|warning): (.+)$/gm;

  let match;
  while ((match = errorRegex.exec(output)) !== null) {
    errors.push({
      file: match[1],
      line: parseInt(match[2], 10),
      column: match[3] ? parseInt(match[3], 10) : undefined,
      type: match[4] as 'error' | 'warning',
      message: match[5].trim()
    });
  }

  return errors;
}
