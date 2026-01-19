/**
 * Unit tests for Instruments profiling tool handlers
 */

import { describe, test, expect } from 'vitest';
import {
  startProfilingTool,
  stopProfilingTool,
  analyzeTraceTool
} from '../../src/tools/instruments/profiling.js';

describe('startProfilingTool', () => {
  test('has correct tool definition structure', () => {
    expect(startProfilingTool.name).toBe('instruments_start_profiling');
    expect(startProfilingTool.description).toBeTruthy();
    expect(startProfilingTool.inputSchema).toBeDefined();
    expect(startProfilingTool.schema).toBeDefined();
    expect(typeof startProfilingTool.handler).toBe('function');
  });

  test('input schema is defined and has properties', () => {
    const schema = startProfilingTool.inputSchema;

    expect(schema).toBeDefined();
    expect(typeof schema).toBe('object');
  });

  test('handler returns session info structure', async () => {
    const result = await startProfilingTool.handler({
      device_udid: 'test-device',
      bundle_id: 'com.example.App'
    });

    expect(result.isError).toBe(false);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toHaveProperty('session_id');
    expect(parsed).toHaveProperty('trace_path');
    expect(parsed).toHaveProperty('pid');
    expect(parsed).toHaveProperty('status');
    expect(parsed.status).toBe('recording');
  });

  test('handler validates input schema', async () => {
    const result = await startProfilingTool.handler({
      // Missing required fields
    } as any);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error');
  });
});

describe('stopProfilingTool', () => {
  test('has correct tool definition structure', () => {
    expect(stopProfilingTool.name).toBe('instruments_stop_profiling');
    expect(stopProfilingTool.description).toBeTruthy();
    expect(stopProfilingTool.inputSchema).toBeDefined();
    expect(stopProfilingTool.schema).toBeDefined();
    expect(typeof stopProfilingTool.handler).toBe('function');
  });

  test('input schema is defined and has properties', () => {
    const schema = stopProfilingTool.inputSchema;

    expect(schema).toBeDefined();
    expect(typeof schema).toBe('object');
  });

  test('handler returns stop result structure', async () => {
    const result = await stopProfilingTool.handler({
      session_id: 'test-session-123'
    });

    expect(result.isError).toBe(false);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toHaveProperty('session_id');
    expect(parsed).toHaveProperty('trace_path');
    expect(parsed).toHaveProperty('duration_seconds');
    expect(parsed).toHaveProperty('file_size_mb');
    expect(parsed).toHaveProperty('status');
    expect(parsed.status).toBe('completed');
  });

  test('handler validates input schema', async () => {
    const result = await stopProfilingTool.handler({
      // Missing session_id
    } as any);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error');
  });
});

describe('analyzeTraceTool', () => {
  test('has correct tool definition structure', () => {
    expect(analyzeTraceTool.name).toBe('instruments_analyze_trace');
    expect(analyzeTraceTool.description).toBeTruthy();
    expect(analyzeTraceTool.inputSchema).toBeDefined();
    expect(analyzeTraceTool.schema).toBeDefined();
    expect(typeof analyzeTraceTool.handler).toBe('function');
  });

  test('input schema is defined and has properties', () => {
    const schema = analyzeTraceTool.inputSchema;

    expect(schema).toBeDefined();
    expect(typeof schema).toBe('object');
  });

  test('handler returns analysis result structure', async () => {
    const result = await analyzeTraceTool.handler({
      session_id: 'test-session-123'
    });

    expect(result.isError).toBe(false);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toHaveProperty('summary');
    expect(parsed).toHaveProperty('time_profiler');
    expect(parsed).toHaveProperty('allocations');
    expect(parsed).toHaveProperty('leaks');

    // Validate summary structure
    expect(parsed.summary).toHaveProperty('duration_seconds');
    expect(parsed.summary).toHaveProperty('templates_analyzed');
    expect(parsed.summary).toHaveProperty('trace_file_size_mb');

    // Validate time_profiler structure
    expect(parsed.time_profiler).toHaveProperty('total_cpu_time_ms');
    expect(parsed.time_profiler).toHaveProperty('heaviest_stack_trace');
    expect(parsed.time_profiler).toHaveProperty('top_10_symbols');

    // Validate allocations structure
    expect(parsed.allocations).toHaveProperty('peak_memory_mb');
    expect(parsed.allocations).toHaveProperty('total_allocations');
    expect(parsed.allocations).toHaveProperty('living_allocations');
    expect(parsed.allocations).toHaveProperty('top_10_allocations');

    // Validate leaks structure
    expect(parsed.leaks).toHaveProperty('total_leaked_mb');
    expect(parsed.leaks).toHaveProperty('leak_count');
    expect(parsed.leaks).toHaveProperty('leaks');
  });

  test('handler accepts session_id', async () => {
    const result = await analyzeTraceTool.handler({
      session_id: 'test-session'
    });

    expect(result.isError).toBe(false);
  });

  test('handler accepts trace_path', async () => {
    const result = await analyzeTraceTool.handler({
      trace_path: '/path/to/trace.trace'
    });

    expect(result.isError).toBe(false);
  });

  test('handler validates input schema requires session_id or trace_path', async () => {
    const result = await analyzeTraceTool.handler({
      // Missing both session_id and trace_path
    } as any);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error');
  });
});
