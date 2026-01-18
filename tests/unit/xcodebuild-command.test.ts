/**
 * Unit tests for xcodebuild command builder
 *
 * Tests follow the AAA (Arrange-Act-Assert) pattern:
 * - Arrange: Set up test data and dependencies
 * - Act: Execute the method under test
 * - Assert: Verify the expected results
 */

import { describe, test, expect } from 'vitest';
import { buildXcodebuildCommand } from '../../src/shared/xcodebuild.js';
import type { BuildSettings } from '../../src/shared/types.js';

describe('buildXcodebuildCommand', () => {
  describe('workspace builds', () => {
    test('test_buildCommand_withWorkspaceAndBasicSettings_shouldReturnCorrectCommandArray', () => {
      // Arrange
      const settings: BuildSettings = {
        workspace: '/path/to/MyApp.xcworkspace',
        scheme: 'MyApp',
        sdk: 'iphonesimulator',
        configuration: 'Debug'
      };
      const expectedCommand = [
        'xcodebuild',
        'build',
        '-workspace',
        '/path/to/MyApp.xcworkspace',
        '-scheme',
        'MyApp',
        '-sdk',
        'iphonesimulator',
        '-configuration',
        'Debug'
      ];

      // Act
      const command = buildXcodebuildCommand('build', settings);

      // Assert
      expect(command).toEqual(expectedCommand);
      expect(command[0]).toBe('xcodebuild'); // Verify command starts with xcodebuild
      expect(command[1]).toBe('build'); // Verify action is correct
    });
  });

  describe('project builds', () => {
    test('test_buildCommand_withProjectInsteadOfWorkspace_shouldUseProjectFlag', () => {
      // Arrange
      const settings: BuildSettings = {
        project: '/path/to/MyApp.xcodeproj',
        scheme: 'MyApp',
        sdk: 'iphonesimulator'
      };
      const expectedCommand = [
        'xcodebuild',
        'build',
        '-project',
        '/path/to/MyApp.xcodeproj',
        '-scheme',
        'MyApp',
        '-sdk',
        'iphonesimulator'
      ];

      // Act
      const command = buildXcodebuildCommand('build', settings);

      // Assert
      expect(command).toEqual(expectedCommand);
      expect(command).toContain('-project'); // Should use -project flag
      expect(command).not.toContain('-workspace'); // Should NOT use -workspace flag
    });
  });

  describe('optional parameters', () => {
    test('test_buildCommand_withDestination_shouldIncludeDestinationParameter', () => {
      // Arrange
      const settings: BuildSettings = {
        workspace: '/path/to/MyApp.xcworkspace',
        scheme: 'MyApp',
        destination: 'platform=iOS Simulator,name=iPhone 15 Pro'
      };
      const expectedDestination = 'platform=iOS Simulator,name=iPhone 15 Pro';

      // Act
      const command = buildXcodebuildCommand('test', settings);

      // Assert
      expect(command).toContain('-destination');
      expect(command).toContain(expectedDestination);

      // Verify destination comes after -destination flag
      const destinationIndex = command.indexOf('-destination');
      expect(command[destinationIndex + 1]).toBe(expectedDestination);
    });

    test('test_buildCommand_withDerivedDataPath_shouldIncludeDerivedDataPathParameter', () => {
      // Arrange
      const settings: BuildSettings = {
        project: '/path/to/MyApp.xcodeproj',
        scheme: 'MyApp',
        derivedDataPath: '/tmp/DerivedData'
      };
      const expectedPath = '/tmp/DerivedData';

      // Act
      const command = buildXcodebuildCommand('build', settings);

      // Assert
      expect(command).toContain('-derivedDataPath');
      expect(command).toContain(expectedPath);

      // Verify path comes after -derivedDataPath flag
      const pathIndex = command.indexOf('-derivedDataPath');
      expect(command[pathIndex + 1]).toBe(expectedPath);
    });

    test('test_buildCommand_withArchivePath_shouldIncludeArchivePathParameter', () => {
      // Arrange
      const settings: BuildSettings = {
        workspace: '/path/to/MyApp.xcworkspace',
        scheme: 'MyApp',
        archivePath: '/path/to/MyApp.xcarchive'
      };
      const expectedArchivePath = '/path/to/MyApp.xcarchive';

      // Act
      const command = buildXcodebuildCommand('archive', settings);

      // Assert
      expect(command).toContain('-archivePath');
      expect(command).toContain(expectedArchivePath);
    });
  });

  describe('validation', () => {
    test('test_buildCommand_withoutWorkspaceOrProject_shouldThrowError', () => {
      // Arrange
      const invalidSettings: BuildSettings = {
        scheme: 'MyApp'
      };
      const expectedErrorMessage = 'Either workspace or project must be provided';

      // Act & Assert
      expect(() => buildXcodebuildCommand('build', invalidSettings))
        .toThrow(expectedErrorMessage);
    });

    test('test_buildCommand_withBothWorkspaceAndProject_shouldPreferWorkspace', () => {
      // Arrange
      const settings: BuildSettings = {
        workspace: '/path/to/MyApp.xcworkspace',
        project: '/path/to/MyApp.xcodeproj',
        scheme: 'MyApp'
      };

      // Act
      const command = buildXcodebuildCommand('build', settings);

      // Assert
      expect(command).toContain('-workspace'); // Workspace should be included
      expect(command).not.toContain('-project'); // Project should be ignored
    });
  });

  describe('different actions', () => {
    test('test_buildCommand_withTestAction_shouldUseTestInCommand', () => {
      // Arrange
      const settings: BuildSettings = {
        workspace: '/path/to/MyApp.xcworkspace',
        scheme: 'MyApp'
      };

      // Act
      const command = buildXcodebuildCommand('test', settings);

      // Assert
      expect(command[1]).toBe('test'); // Second element should be the action
    });

    test('test_buildCommand_withCleanAction_shouldUseCleanInCommand', () => {
      // Arrange
      const settings: BuildSettings = {
        workspace: '/path/to/MyApp.xcworkspace',
        scheme: 'MyApp'
      };

      // Act
      const command = buildXcodebuildCommand('clean', settings);

      // Assert
      expect(command[1]).toBe('clean'); // Second element should be the action
    });
  });
});
