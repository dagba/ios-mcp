/**
 * Unit tests for build tool schemas
 */

import { describe, test, expect } from 'vitest';
import {
  BuildForSimulatorSchema,
  CleanBuildSchema,
  ArchiveSchema
} from '../../src/schemas/build.js';
import { BuildStatsSchema } from '../../src/schemas/build-stats.js';

describe('BuildForSimulatorSchema', () => {
  test('accepts valid build configuration with workspace', () => {
    const input = {
      workspace: '/path/to/MyApp.xcworkspace',
      scheme: 'MyApp',
      configuration: 'Debug'
    };

    const result = BuildForSimulatorSchema.parse(input);

    expect(result.workspace).toBe('/path/to/MyApp.xcworkspace');
    expect(result.scheme).toBe('MyApp');
    expect(result.configuration).toBe('Debug');
    expect(result.sdk).toBe('iphonesimulator'); // default
  });

  test('accepts valid build configuration with project', () => {
    const input = {
      project: '/path/to/MyApp.xcodeproj',
      scheme: 'MyApp'
    };

    const result = BuildForSimulatorSchema.parse(input);

    expect(result.project).toBe('/path/to/MyApp.xcodeproj');
    expect(result.scheme).toBe('MyApp');
    expect(result.sdk).toBe('iphonesimulator'); // default
  });

  test('requires either workspace or project', () => {
    const input = {
      scheme: 'MyApp'
    };

    expect(() => BuildForSimulatorSchema.parse(input)).toThrow();
  });

  test('applies default values for optional fields', () => {
    const input = {
      workspace: '/path/to/MyApp.xcworkspace',
      scheme: 'MyApp'
    };

    const result = BuildForSimulatorSchema.parse(input);

    expect(result.sdk).toBe('iphonesimulator');
    expect(result.configuration).toBe('Debug');
  });

  test('accepts custom destination', () => {
    const input = {
      workspace: '/path/to/MyApp.xcworkspace',
      scheme: 'MyApp',
      destination: 'platform=iOS Simulator,name=iPhone 15 Pro'
    };

    const result = BuildForSimulatorSchema.parse(input);

    expect(result.destination).toBe('platform=iOS Simulator,name=iPhone 15 Pro');
  });
});

describe('CleanBuildSchema', () => {
  test('accepts valid clean configuration', () => {
    const input = {
      workspace: '/path/to/MyApp.xcworkspace',
      scheme: 'MyApp'
    };

    const result = CleanBuildSchema.parse(input);

    expect(result.workspace).toBe('/path/to/MyApp.xcworkspace');
    expect(result.scheme).toBe('MyApp');
  });

  test('accepts optional derivedDataPath', () => {
    const input = {
      project: '/path/to/MyApp.xcodeproj',
      scheme: 'MyApp',
      derivedDataPath: '/tmp/DerivedData'
    };

    const result = CleanBuildSchema.parse(input);

    expect(result.derivedDataPath).toBe('/tmp/DerivedData');
  });
});

describe('ArchiveSchema', () => {
  test('requires archivePath for archives', () => {
    const input = {
      workspace: '/path/to/MyApp.xcworkspace',
      scheme: 'MyApp',
      archivePath: '/path/to/MyApp.xcarchive'
    };

    const result = ArchiveSchema.parse(input);

    expect(result.archivePath).toBe('/path/to/MyApp.xcarchive');
    expect(result.sdk).toBe('iphoneos'); // default for archives
  });

  test('validates archivePath is provided', () => {
    const input = {
      workspace: '/path/to/MyApp.xcworkspace',
      scheme: 'MyApp'
    };

    expect(() => ArchiveSchema.parse(input)).toThrow();
  });
});

describe('BuildStatsSchema', () => {
  test('accepts empty object (all filters optional)', () => {
    const input = {};

    const result = BuildStatsSchema.parse(input);

    expect(result.limit).toBe(20); // default value
    expect(result.project).toBeUndefined();
    expect(result.scheme).toBeUndefined();
    expect(result.configuration).toBeUndefined();
  });

  test('accepts project filter', () => {
    const input = {
      project: 'MyApp'
    };

    const result = BuildStatsSchema.parse(input);

    expect(result.project).toBe('MyApp');
    expect(result.limit).toBe(20);
  });

  test('accepts scheme filter', () => {
    const input = {
      scheme: 'MyAppScheme'
    };

    const result = BuildStatsSchema.parse(input);

    expect(result.scheme).toBe('MyAppScheme');
  });

  test('accepts configuration filter with Debug', () => {
    const input = {
      configuration: 'Debug' as const
    };

    const result = BuildStatsSchema.parse(input);

    expect(result.configuration).toBe('Debug');
  });

  test('accepts configuration filter with Release', () => {
    const input = {
      configuration: 'Release' as const
    };

    const result = BuildStatsSchema.parse(input);

    expect(result.configuration).toBe('Release');
  });

  test('rejects invalid configuration value', () => {
    const input = {
      configuration: 'Invalid'
    };

    expect(() => BuildStatsSchema.parse(input)).toThrow();
  });

  test('accepts custom limit', () => {
    const input = {
      limit: 50
    };

    const result = BuildStatsSchema.parse(input);

    expect(result.limit).toBe(50);
  });

  test('rejects non-positive limit', () => {
    const input = {
      limit: 0
    };

    expect(() => BuildStatsSchema.parse(input)).toThrow();
  });

  test('rejects negative limit', () => {
    const input = {
      limit: -5
    };

    expect(() => BuildStatsSchema.parse(input)).toThrow();
  });

  test('accepts all filters combined', () => {
    const input = {
      project: 'MyApp',
      scheme: 'MyAppScheme',
      configuration: 'Release' as const,
      limit: 100
    };

    const result = BuildStatsSchema.parse(input);

    expect(result.project).toBe('MyApp');
    expect(result.scheme).toBe('MyAppScheme');
    expect(result.configuration).toBe('Release');
    expect(result.limit).toBe(100);
  });
});
