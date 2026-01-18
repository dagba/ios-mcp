/**
 * Unit tests for build tool
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { buildForSimulatorTool, cleanBuildTool } from '../../src/tools/build/xcodebuild-build.js';
import type { BuildSettings } from '../../src/shared/types.js';

describe('buildForSimulatorTool', () => {
  test('has correct tool definition structure', () => {
    expect(buildForSimulatorTool.name).toBe('xcodebuild_build');
    expect(buildForSimulatorTool.description).toBeTruthy();
    expect(buildForSimulatorTool.inputSchema).toBeDefined();
    expect(buildForSimulatorTool.schema).toBeDefined();
    expect(typeof buildForSimulatorTool.handler).toBe('function');
  });

  test('input schema includes required fields', () => {
    const schema = buildForSimulatorTool.inputSchema;

    expect(schema.type).toBe('object');
    expect(schema.properties).toHaveProperty('workspace');
    expect(schema.properties).toHaveProperty('project');
    expect(schema.properties).toHaveProperty('scheme');
    expect(schema.properties).toHaveProperty('sdk');
    expect(schema.properties).toHaveProperty('configuration');
  });
});

describe('cleanBuildTool', () => {
  test('has correct tool definition structure', () => {
    expect(cleanBuildTool.name).toBe('xcodebuild_clean');
    expect(cleanBuildTool.description).toBeTruthy();
    expect(cleanBuildTool.inputSchema).toBeDefined();
    expect(cleanBuildTool.schema).toBeDefined();
    expect(typeof cleanBuildTool.handler).toBe('function');
  });

  test('input schema includes required fields', () => {
    const schema = cleanBuildTool.inputSchema;

    expect(schema.type).toBe('object');
    expect(schema.properties).toHaveProperty('workspace');
    expect(schema.properties).toHaveProperty('project');
    expect(schema.properties).toHaveProperty('scheme');
  });
});
