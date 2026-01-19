/**
 * Unit tests for Instruments profiling parsers and command builders
 */

import { describe, test, expect } from 'vitest';
import {
  buildXCTraceCommand,
  parseTimeProfilerXML,
  parseAllocationsXML,
  parseLeaksOutput
} from '../../src/shared/instruments.js';

describe('buildXCTraceCommand', () => {
  test('constructs basic command with required fields', () => {
    const command = buildXCTraceCommand({
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.App',
      templates: ['time'],
      output_path: '/tmp/trace.trace'
    });

    expect(command).toContain('xcrun');
    expect(command).toContain('xctrace');
    expect(command).toContain('record');
    expect(command).toContain('--device');
    expect(command).toContain('ABCD-1234');
    expect(command).toContain('--launch');
    expect(command).toContain('com.example.App');
    expect(command).toContain('--template');
    expect(command).toContain('Time Profiler');
    expect(command).toContain('--output');
    expect(command).toContain('/tmp/trace.trace');
  });

  test('includes multiple template flags', () => {
    const command = buildXCTraceCommand({
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.App',
      templates: ['time', 'allocations', 'leaks'],
      output_path: '/tmp/trace.trace'
    });

    expect(command).toContain('--template');
    expect(command).toContain('Time Profiler');
    expect(command).toContain('Allocations');
    expect(command).toContain('Leaks');
  });

  test('adds launch args when provided', () => {
    const command = buildXCTraceCommand({
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.App',
      templates: ['time'],
      output_path: '/tmp/trace.trace',
      launch_args: ['--debug', '--verbose']
    });

    expect(command).toContain('--launch-arg');
    expect(command).toContain('--debug');
    expect(command).toContain('--verbose');
  });

  test('includes environment variables', () => {
    const command = buildXCTraceCommand({
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.App',
      templates: ['time'],
      output_path: '/tmp/trace.trace',
      env_vars: { DEBUG: '1', LOG_LEVEL: 'verbose' }
    });

    expect(command).toContain('--env');
    expect(command).toContain('DEBUG=1');
    expect(command).toContain('LOG_LEVEL=verbose');
  });

  test('includes target stdout flag', () => {
    const command = buildXCTraceCommand({
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.App',
      templates: ['time'],
      output_path: '/tmp/trace.trace'
    });

    expect(command).toContain('--target-stdout');
    expect(command).toContain('-');
  });

  test('returns array of string arguments', () => {
    const command = buildXCTraceCommand({
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.App',
      templates: ['time'],
      output_path: '/tmp/trace.trace'
    });

    expect(Array.isArray(command)).toBe(true);
    expect(command.every(arg => typeof arg === 'string')).toBe(true);
  });
});

describe('parseTimeProfilerXML', () => {
  test('extracts top symbols from XML export', () => {
    const xml = `<?xml version="1.0"?>
<trace-query>
  <row>
    <symbol>MyViewController.loadData()</symbol>
    <self-time>3200</self-time>
    <total-time>8500</total-time>
  </row>
  <row>
    <symbol>NetworkManager.parseJSON(_:)</symbol>
    <self-time>2800</self-time>
    <total-time>2800</total-time>
  </row>
  <row>
    <symbol>ImageCache.decode(_:)</symbol>
    <self-time>1500</self-time>
    <total-time>1500</total-time>
  </row>
</trace-query>`;

    const result = parseTimeProfilerXML(xml);

    expect(result.total_cpu_time_ms).toBeGreaterThan(0);
    expect(result.top_10_symbols).toBeDefined();
    expect(result.top_10_symbols.length).toBeGreaterThan(0);
    expect(result.top_10_symbols[0].symbol).toBe('MyViewController.loadData()');
    expect(result.top_10_symbols[0].self_time_ms).toBe(3200);
    expect(result.top_10_symbols[0].total_time_ms).toBe(8500);
  });

  test('calculates percentages correctly', () => {
    const xml = `<?xml version="1.0"?>
<trace-query>
  <row>
    <symbol>FunctionA</symbol>
    <self-time>5000</self-time>
    <total-time>10000</total-time>
  </row>
  <row>
    <symbol>FunctionB</symbol>
    <self-time>2500</self-time>
    <total-time>5000</total-time>
  </row>
</trace-query>`;

    const result = parseTimeProfilerXML(xml);

    expect(result.top_10_symbols[0].percentage).toBeCloseTo(66.67, 1);
    expect(result.top_10_symbols[1].percentage).toBeCloseTo(33.33, 1);
  });

  test('handles empty call tree', () => {
    const xml = `<?xml version="1.0"?>
<trace-query>
</trace-query>`;

    const result = parseTimeProfilerXML(xml);

    expect(result.total_cpu_time_ms).toBe(0);
    expect(result.top_10_symbols).toEqual([]);
    expect(result.heaviest_stack_trace).toBe('');
  });

  test('sorts symbols by total time descending', () => {
    const xml = `<?xml version="1.0"?>
<trace-query>
  <row>
    <symbol>SlowFunction</symbol>
    <self-time>100</self-time>
    <total-time>1000</total-time>
  </row>
  <row>
    <symbol>FastFunction</symbol>
    <self-time>50</self-time>
    <total-time>50</total-time>
  </row>
  <row>
    <symbol>MediumFunction</symbol>
    <self-time>200</self-time>
    <total-time>500</total-time>
  </row>
</trace-query>`;

    const result = parseTimeProfilerXML(xml);

    expect(result.top_10_symbols[0].symbol).toBe('SlowFunction');
    expect(result.top_10_symbols[1].symbol).toBe('MediumFunction');
    expect(result.top_10_symbols[2].symbol).toBe('FastFunction');
  });

  test('limits to top 10 symbols', () => {
    const rows = Array.from({ length: 20 }, (_, i) => `
      <row>
        <symbol>Function${i}</symbol>
        <self-time>${1000 - i * 10}</self-time>
        <total-time>${2000 - i * 10}</total-time>
      </row>
    `).join('');

    const xml = `<?xml version="1.0"?>
<trace-query>${rows}</trace-query>`;

    const result = parseTimeProfilerXML(xml);

    expect(result.top_10_symbols.length).toBe(10);
  });
});

describe('parseAllocationsXML', () => {
  test('extracts allocation statistics', () => {
    const xml = `<?xml version="1.0"?>
<trace-query>
  <row>
    <category>Malloc 16 Bytes</category>
    <size>35651584</size>
    <count>2228224</count>
  </row>
  <row>
    <category>Malloc 32 Bytes</category>
    <size>16777216</size>
    <count>524288</count>
  </row>
</trace-query>`;

    const result = parseAllocationsXML(xml);

    expect(result.peak_memory_mb).toBeGreaterThan(0);
    expect(result.total_allocations).toBeGreaterThan(0);
    expect(result.top_10_allocations).toBeDefined();
    expect(result.top_10_allocations.length).toBe(2);
    expect(result.top_10_allocations[0].category).toBe('Malloc 16 Bytes');
  });

  test('calculates memory in megabytes correctly', () => {
    const xml = `<?xml version="1.0"?>
<trace-query>
  <row>
    <category>Test Category</category>
    <size>10485760</size>
    <count>100</count>
  </row>
</trace-query>`;

    const result = parseAllocationsXML(xml);

    expect(result.top_10_allocations[0].size_mb).toBe(10);
  });

  test('calculates percentages of total memory', () => {
    const xml = `<?xml version="1.0"?>
<trace-query>
  <row>
    <category>Big Allocation</category>
    <size>20971520</size>
    <count>100</count>
  </row>
  <row>
    <category>Small Allocation</category>
    <size>10485760</size>
    <count>50</count>
  </row>
</trace-query>`;

    const result = parseAllocationsXML(xml);

    expect(result.top_10_allocations[0].percentage).toBeCloseTo(66.67, 1);
    expect(result.top_10_allocations[1].percentage).toBeCloseTo(33.33, 1);
  });

  test('handles empty allocations', () => {
    const xml = `<?xml version="1.0"?>
<trace-query>
</trace-query>`;

    const result = parseAllocationsXML(xml);

    expect(result.peak_memory_mb).toBe(0);
    expect(result.total_allocations).toBe(0);
    expect(result.living_allocations).toBe(0);
    expect(result.top_10_allocations).toEqual([]);
  });

  test('sorts allocations by size descending', () => {
    const xml = `<?xml version="1.0"?>
<trace-query>
  <row>
    <category>Medium</category>
    <size>5242880</size>
    <count>10</count>
  </row>
  <row>
    <category>Large</category>
    <size>10485760</size>
    <count>5</count>
  </row>
  <row>
    <category>Small</category>
    <size>1048576</size>
    <count>20</count>
  </row>
</trace-query>`;

    const result = parseAllocationsXML(xml);

    expect(result.top_10_allocations[0].category).toBe('Large');
    expect(result.top_10_allocations[1].category).toBe('Medium');
    expect(result.top_10_allocations[2].category).toBe('Small');
  });
});

describe('parseLeaksOutput', () => {
  test('parses leaks command output format', () => {
    const output = `Process 12345: 2 leaks for 256 total leaked bytes.

Leak: 0x600001234000  size=128  zone: MallocStackLoggingLiteZone
    NSConcreteData  Malloc  Foundation
    Call stack:
      0x1234567890 (MyApp + 123456)
      0x1234567891 (MyApp + 123457)

Leak: 0x600001235000  size=128  zone: MallocStackLoggingLiteZone
    UIImage  Malloc  UIKit
    Call stack:
      0x2234567890 (MyApp + 223456)
      0x2234567891 (MyApp + 223457)
`;

    const result = parseLeaksOutput(output);

    expect(result.leak_count).toBe(2);
    expect(result.total_leaked_mb).toBeCloseTo(0.000244, 5);
    expect(result.leaks).toBeDefined();
    expect(result.leaks.length).toBe(2);
    expect(result.leaks[0].address).toBe('0x600001234000');
    expect(result.leaks[0].size_bytes).toBe(128);
    expect(result.leaks[0].type).toContain('NSConcreteData');
  });

  test('extracts stack traces for each leak', () => {
    const output = `Process 12345: 1 leaks for 64 total leaked bytes.

Leak: 0x600001234000  size=64  zone: MallocStackLoggingLiteZone
    MyCustomClass  Malloc  MyApp
    Call stack:
      0x1111111111 (MyApp + 111111) MyClass.init()
      0x2222222222 (MyApp + 222222) main
`;

    const result = parseLeaksOutput(output);

    expect(result.leaks[0].stack_trace).toContain('MyClass.init()');
    expect(result.leaks[0].stack_trace).toContain('main');
  });

  test('handles no leaks found', () => {
    const output = 'Process 12345: 0 leaks for 0 total leaked bytes.\n';

    const result = parseLeaksOutput(output);

    expect(result.leak_count).toBe(0);
    expect(result.total_leaked_mb).toBe(0);
    expect(result.leaks).toEqual([]);
  });

  test('calculates total leaked bytes correctly', () => {
    const output = `Process 12345: 3 leaks for 1536 total leaked bytes.

Leak: 0x600001234000  size=512  zone: MallocStackLoggingLiteZone
    LeakType1  Malloc  MyApp

Leak: 0x600001235000  size=512  zone: MallocStackLoggingLiteZone
    LeakType2  Malloc  MyApp

Leak: 0x600001236000  size=512  zone: MallocStackLoggingLiteZone
    LeakType3  Malloc  MyApp
`;

    const result = parseLeaksOutput(output);

    expect(result.leak_count).toBe(3);
    expect(result.total_leaked_mb).toBeCloseTo(0.0015, 4);
  });

  test('handles malformed output gracefully', () => {
    const output = 'Some random text that is not leaks output';

    const result = parseLeaksOutput(output);

    expect(result.leak_count).toBe(0);
    expect(result.total_leaked_mb).toBe(0);
    expect(result.leaks).toEqual([]);
  });
});
