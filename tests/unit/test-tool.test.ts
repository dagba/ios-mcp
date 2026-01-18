/**
 * Unit tests for test execution tool
 */

import { describe, test, expect } from 'vitest';
import { runTestsTool } from '../../src/tools/test/xcodebuild-test.js';
import { RunTestsSchema } from '../../src/schemas/test.js';

describe('RunTestsSchema', () => {
  test('accepts valid test configuration', () => {
    const input = {
      workspace: '/path/to/MyApp.xcworkspace',
      scheme: 'MyApp',
      destination: 'platform=iOS Simulator,name=iPhone 15 Pro'
    };

    const result = RunTestsSchema.parse(input);

    expect(result.workspace).toBe('/path/to/MyApp.xcworkspace');
    expect(result.scheme).toBe('MyApp');
    expect(result.destination).toBe('platform=iOS Simulator,name=iPhone 15 Pro');
  });

  test('requires either workspace or project', () => {
    const input = {
      scheme: 'MyApp'
    };

    expect(() => RunTestsSchema.parse(input)).toThrow();
  });

  test('applies default values', () => {
    const input = {
      workspace: '/path/to/MyApp.xcworkspace',
      scheme: 'MyApp'
    };

    const result = RunTestsSchema.parse(input);

    expect(result.sdk).toBe('iphonesimulator');
    expect(result.onlyTesting).toBeUndefined();
    expect(result.skipTesting).toBeUndefined();
  });

  test('accepts test filtering options', () => {
    const input = {
      workspace: '/path/to/MyApp.xcworkspace',
      scheme: 'MyApp',
      onlyTesting: ['MyAppTests/testExample'],
      skipTesting: ['MyAppTests/testSlow']
    };

    const result = RunTestsSchema.parse(input);

    expect(result.onlyTesting).toEqual(['MyAppTests/testExample']);
    expect(result.skipTesting).toEqual(['MyAppTests/testSlow']);
  });
});

describe('runTestsTool', () => {
  test('has correct tool definition structure', () => {
    expect(runTestsTool.name).toBe('xcodebuild_test');
    expect(runTestsTool.description).toBeTruthy();
    expect(runTestsTool.inputSchema).toBeDefined();
    expect(runTestsTool.schema).toBeDefined();
    expect(typeof runTestsTool.handler).toBe('function');
  });

  test('input schema includes required fields', () => {
    const schema = runTestsTool.inputSchema;

    expect(schema.type).toBe('object');
    expect(schema.properties).toHaveProperty('workspace');
    expect(schema.properties).toHaveProperty('project');
    expect(schema.properties).toHaveProperty('scheme');
    expect(schema.properties).toHaveProperty('destination');
    expect(schema.properties).toHaveProperty('onlyTesting');
    expect(schema.properties).toHaveProperty('skipTesting');
  });
});
