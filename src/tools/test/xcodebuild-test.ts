/**
 * Xcodebuild test execution tools
 */

import type { ToolDefinition } from '../../shared/types.js';
import { RunTestsSchema } from '../../schemas/test.js';
import { buildXcodebuildCommand } from '../../shared/xcodebuild.js';
import { parseXCResult } from './xcresult-parser.js';
import { execa } from 'execa';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Tool: xcodebuild_test
 * Run tests using xcodebuild
 */
export const runTestsTool: ToolDefinition<typeof RunTestsSchema> = {
  name: 'xcodebuild_test',
  description: 'Run unit and UI tests using xcodebuild. Returns structured test results including pass/fail counts, failures with file/line numbers, and duration.',
  inputSchema: {
    type: 'object',
    properties: {
      workspace: {
        type: 'string',
        description: 'Path to .xcworkspace file'
      },
      project: {
        type: 'string',
        description: 'Path to .xcodeproj file'
      },
      scheme: {
        type: 'string',
        description: 'Scheme name to test'
      },
      sdk: {
        type: 'string',
        description: 'SDK to test on (default: iphonesimulator)'
      },
      configuration: {
        type: 'string',
        description: 'Build configuration (Debug or Release, default: Debug)'
      },
      destination: {
        type: 'string',
        description: 'Test destination (e.g., "platform=iOS Simulator,name=iPhone 15 Pro")'
      },
      onlyTesting: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of test identifiers to run'
      },
      skipTesting: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of test identifiers to skip'
      },
      enableCodeCoverage: {
        type: 'boolean',
        description: 'Enable code coverage collection (default: false)'
      },
      derivedDataPath: {
        type: 'string',
        description: 'Custom derived data path'
      }
    },
    required: ['scheme']
  },
  schema: RunTestsSchema,
  handler: async (args) => {
    // Create temporary directory for xcresult
    const tempDir = await mkdtemp(join(tmpdir(), 'xcresult-'));
    const resultBundlePath = join(tempDir, 'TestResults.xcresult');

    try {
      // Build command for test execution
      const command = buildXcodebuildCommand('test', {
        ...args,
        derivedDataPath: args.derivedDataPath
      });

      // Add result bundle path
      command.push('-resultBundlePath', resultBundlePath);

      // Add code coverage if enabled
      if (args.enableCodeCoverage) {
        command.push('-enableCodeCoverage', 'YES');
      }

      // Add test filtering
      if (args.onlyTesting) {
        for (const test of args.onlyTesting) {
          command.push('-only-testing', test);
        }
      }

      if (args.skipTesting) {
        for (const test of args.skipTesting) {
          command.push('-skip-testing', test);
        }
      }

      // Run tests
      const result = await execa(command[0], command.slice(1), {
        reject: false,
        all: true
      });

      // Parse xcresult bundle
      try {
        // Get xcresult JSON
        const xcresultJson = await execa('xcrun', [
          'xcresulttool',
          'get',
          '--format',
          'json',
          '--path',
          resultBundlePath
        ]);

        // Get test summary
        const summaryResult = await execa('xcrun', [
          'xcresulttool',
          'get',
          '--format',
          'json',
          '--path',
          resultBundlePath,
          'testsSummary'
        ]);

        const testResults = parseXCResult(xcresultJson.stdout, summaryResult.stdout);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: result.exitCode === 0,
                  testResults
                },
                null,
                2
              )
            }
          ],
          isError: result.exitCode !== 0
        };
      } catch (parseError) {
        // If xcresult parsing fails, return basic results
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: result.exitCode === 0,
                  message: result.exitCode === 0 ? 'Tests passed' : 'Tests failed',
                  warning: 'Could not parse detailed test results',
                  exitCode: result.exitCode
                },
                null,
                2
              )
            }
          ],
          isError: result.exitCode !== 0
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                message: 'Failed to execute xcodebuild test',
                error: error instanceof Error ? error.message : String(error)
              },
              null,
              2
            )
          }
        ],
        isError: true
      };
    } finally {
      // Clean up temp directory
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }
};
