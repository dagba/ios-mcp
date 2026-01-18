/**
 * Unit tests for UI inspection tool schemas
 */

import { describe, test, expect } from 'vitest';
import { DescribeUISchema, DescribePointSchema } from '../../src/schemas/simulator.js';

describe('DescribeUISchema', () => {
  test('accepts minimal valid configuration with defaults', () => {
    const input = {};

    const result = DescribeUISchema.parse(input);

    expect(result.device).toBe('booted'); // default
    expect(result.format).toBe('compact'); // default
  });

  test('accepts device UDID override', () => {
    const input = {
      device: 'A1B2C3D4-5678-90AB-CDEF-1234567890AB'
    };

    const result = DescribeUISchema.parse(input);

    expect(result.device).toBe('A1B2C3D4-5678-90AB-CDEF-1234567890AB');
    expect(result.format).toBe('compact'); // still default
  });

  test('accepts json format', () => {
    const input = {
      format: 'json'
    };

    const result = DescribeUISchema.parse(input);

    expect(result.device).toBe('booted');
    expect(result.format).toBe('json');
  });

  test('accepts compact format explicitly', () => {
    const input = {
      format: 'compact'
    };

    const result = DescribeUISchema.parse(input);

    expect(result.format).toBe('compact');
  });

  test('rejects invalid format', () => {
    const input = {
      format: 'invalid'
    };

    expect(() => DescribeUISchema.parse(input)).toThrow();
  });

  test('accepts all valid parameters together', () => {
    const input = {
      device: 'my-device-udid',
      format: 'json'
    };

    const result = DescribeUISchema.parse(input);

    expect(result.device).toBe('my-device-udid');
    expect(result.format).toBe('json');
  });
});

describe('DescribePointSchema', () => {
  test('requires x and y coordinates', () => {
    const input = {};

    expect(() => DescribePointSchema.parse(input)).toThrow();
  });

  test('accepts valid coordinates with defaults', () => {
    const input = {
      x: 150,
      y: 300
    };

    const result = DescribePointSchema.parse(input);

    expect(result.x).toBe(150);
    expect(result.y).toBe(300);
    expect(result.device).toBe('booted'); // default
  });

  test('accepts device UDID override', () => {
    const input = {
      device: 'ABC-123-XYZ',
      x: 100,
      y: 200
    };

    const result = DescribePointSchema.parse(input);

    expect(result.device).toBe('ABC-123-XYZ');
    expect(result.x).toBe(100);
    expect(result.y).toBe(200);
  });

  test('accepts zero coordinates', () => {
    const input = {
      x: 0,
      y: 0
    };

    const result = DescribePointSchema.parse(input);

    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  test('accepts negative coordinates', () => {
    const input = {
      x: -50,
      y: -100
    };

    const result = DescribePointSchema.parse(input);

    expect(result.x).toBe(-50);
    expect(result.y).toBe(-100);
  });

  test('accepts floating point coordinates', () => {
    const input = {
      x: 150.5,
      y: 300.75
    };

    const result = DescribePointSchema.parse(input);

    expect(result.x).toBe(150.5);
    expect(result.y).toBe(300.75);
  });

  test('rejects missing x coordinate', () => {
    const input = {
      y: 100
    };

    expect(() => DescribePointSchema.parse(input)).toThrow();
  });

  test('rejects missing y coordinate', () => {
    const input = {
      x: 100
    };

    expect(() => DescribePointSchema.parse(input)).toThrow();
  });

  test('rejects non-numeric x coordinate', () => {
    const input = {
      x: 'not a number',
      y: 100
    };

    expect(() => DescribePointSchema.parse(input)).toThrow();
  });

  test('rejects non-numeric y coordinate', () => {
    const input = {
      x: 100,
      y: 'not a number'
    };

    expect(() => DescribePointSchema.parse(input)).toThrow();
  });
});
