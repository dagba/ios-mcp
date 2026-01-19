/**
 * Unit tests for Instruments profiling tool schemas
 */

import { describe, test, expect } from 'vitest';
import {
  StartProfilingSchema,
  StopProfilingSchema,
  AnalyzeTraceSchema
} from '../../src/schemas/instruments.js';

describe('StartProfilingSchema', () => {
  test('validates required fields: device_udid and bundle_id', () => {
    const input = {
      device_udid: 'ABCD-1234-5678',
      bundle_id: 'com.example.MyApp'
    };

    const result = StartProfilingSchema.parse(input);

    expect(result.device_udid).toBe('ABCD-1234-5678');
    expect(result.bundle_id).toBe('com.example.MyApp');
  });

  test('applies default templates when not provided', () => {
    const input = {
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.App'
    };

    const result = StartProfilingSchema.parse(input);

    expect(result.templates).toEqual(['time', 'allocations', 'leaks']);
  });

  test('accepts custom templates array', () => {
    const input = {
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.App',
      templates: ['time', 'allocations']
    };

    const result = StartProfilingSchema.parse(input);

    expect(result.templates).toEqual(['time', 'allocations']);
  });

  test('accepts single template', () => {
    const input = {
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.App',
      templates: ['time']
    };

    const result = StartProfilingSchema.parse(input);

    expect(result.templates).toEqual(['time']);
  });

  test('rejects invalid template names', () => {
    const input = {
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.App',
      templates: ['invalid-template']
    };

    expect(() => StartProfilingSchema.parse(input)).toThrow();
  });

  test('rejects empty templates array', () => {
    const input = {
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.App',
      templates: []
    };

    expect(() => StartProfilingSchema.parse(input)).toThrow();
  });

  test('accepts optional launch_args as string array', () => {
    const input = {
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.App',
      launch_args: ['--debug', '--verbose']
    };

    const result = StartProfilingSchema.parse(input);

    expect(result.launch_args).toEqual(['--debug', '--verbose']);
  });

  test('accepts optional env_vars as key-value object', () => {
    const input = {
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.App',
      env_vars: { DEBUG: '1', LOG_LEVEL: 'verbose' }
    };

    const result = StartProfilingSchema.parse(input);

    expect(result.env_vars).toEqual({ DEBUG: '1', LOG_LEVEL: 'verbose' });
  });

  test('requires device_udid field', () => {
    const input = {
      bundle_id: 'com.example.App'
    };

    expect(() => StartProfilingSchema.parse(input)).toThrow();
  });

  test('requires bundle_id field', () => {
    const input = {
      device_udid: 'ABCD-1234'
    };

    expect(() => StartProfilingSchema.parse(input)).toThrow();
  });

  test('rejects non-string launch_args elements', () => {
    const input = {
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.App',
      launch_args: ['--debug', 123]
    };

    expect(() => StartProfilingSchema.parse(input)).toThrow();
  });

  test('accepts all fields combined', () => {
    const input = {
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.App',
      templates: ['time', 'leaks'],
      launch_args: ['--test'],
      env_vars: { FOO: 'bar' }
    };

    const result = StartProfilingSchema.parse(input);

    expect(result.device_udid).toBe('ABCD-1234');
    expect(result.bundle_id).toBe('com.example.App');
    expect(result.templates).toEqual(['time', 'leaks']);
    expect(result.launch_args).toEqual(['--test']);
    expect(result.env_vars).toEqual({ FOO: 'bar' });
  });
});

describe('StopProfilingSchema', () => {
  test('validates required session_id field', () => {
    const input = {
      session_id: 'xyz789'
    };

    const result = StopProfilingSchema.parse(input);

    expect(result.session_id).toBe('xyz789');
  });

  test('requires session_id field', () => {
    const input = {};

    expect(() => StopProfilingSchema.parse(input)).toThrow();
  });

  test('rejects empty session_id', () => {
    const input = {
      session_id: ''
    };

    expect(() => StopProfilingSchema.parse(input)).toThrow();
  });

  test('rejects non-string session_id', () => {
    const input = {
      session_id: 123
    };

    expect(() => StopProfilingSchema.parse(input)).toThrow();
  });
});

describe('AnalyzeTraceSchema', () => {
  test('accepts session_id for analyzing recent session', () => {
    const input = {
      session_id: 'xyz789'
    };

    const result = AnalyzeTraceSchema.parse(input);

    expect(result.session_id).toBe('xyz789');
    expect(result.trace_path).toBeUndefined();
  });

  test('accepts trace_path for analyzing existing trace file', () => {
    const input = {
      trace_path: '/path/to/recording.trace'
    };

    const result = AnalyzeTraceSchema.parse(input);

    expect(result.trace_path).toBe('/path/to/recording.trace');
    expect(result.session_id).toBeUndefined();
  });

  test('accepts optional templates filter array', () => {
    const input = {
      session_id: 'xyz789',
      templates: ['time', 'allocations']
    };

    const result = AnalyzeTraceSchema.parse(input);

    expect(result.templates).toEqual(['time', 'allocations']);
  });

  test('requires either session_id or trace_path', () => {
    const input = {};

    expect(() => AnalyzeTraceSchema.parse(input)).toThrow();
  });

  test('accepts both session_id and trace_path (session_id takes precedence)', () => {
    const input = {
      session_id: 'xyz789',
      trace_path: '/path/to/trace.trace'
    };

    const result = AnalyzeTraceSchema.parse(input);

    expect(result.session_id).toBe('xyz789');
    expect(result.trace_path).toBe('/path/to/trace.trace');
  });

  test('rejects invalid template in filter', () => {
    const input = {
      session_id: 'xyz789',
      templates: ['invalid']
    };

    expect(() => AnalyzeTraceSchema.parse(input)).toThrow();
  });

  test('rejects empty templates filter array', () => {
    const input = {
      session_id: 'xyz789',
      templates: []
    };

    expect(() => AnalyzeTraceSchema.parse(input)).toThrow();
  });
});
