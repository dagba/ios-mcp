/**
 * Unit tests for debugging tool schemas
 */

import { describe, test, expect } from 'vitest';
import {
  ListCrashesSchema,
  GetCrashSchema,
  DeleteCrashesSchema,
  StreamLogsSchema,
  InputTextSchema,
  PressButtonSchema
} from '../../src/schemas/simulator.js';

describe('ListCrashesSchema', () => {
  test('accepts minimal valid configuration with defaults', () => {
    const input = {};

    const result = ListCrashesSchema.parse(input);

    expect(result.device).toBe('booted');
    expect(result.bundleId).toBeUndefined();
    expect(result.before).toBeUndefined();
    expect(result.since).toBeUndefined();
  });

  test('accepts bundle ID filter', () => {
    const input = {
      bundleId: 'com.example.MyApp'
    };

    const result = ListCrashesSchema.parse(input);

    expect(result.bundleId).toBe('com.example.MyApp');
    expect(result.device).toBe('booted');
  });

  test('accepts date filters', () => {
    const input = {
      before: '2024-01-15T10:30:00Z',
      since: '2024-01-01T00:00:00Z'
    };

    const result = ListCrashesSchema.parse(input);

    expect(result.before).toBe('2024-01-15T10:30:00Z');
    expect(result.since).toBe('2024-01-01T00:00:00Z');
  });

  test('accepts device UDID override', () => {
    const input = {
      device: 'ABC-123-XYZ'
    };

    const result = ListCrashesSchema.parse(input);

    expect(result.device).toBe('ABC-123-XYZ');
  });

  test('accepts all parameters together', () => {
    const input = {
      device: 'my-device',
      bundleId: 'com.test.App',
      before: '2024-12-31T23:59:59Z',
      since: '2024-01-01T00:00:00Z'
    };

    const result = ListCrashesSchema.parse(input);

    expect(result.device).toBe('my-device');
    expect(result.bundleId).toBe('com.test.App');
    expect(result.before).toBe('2024-12-31T23:59:59Z');
    expect(result.since).toBe('2024-01-01T00:00:00Z');
  });
});

describe('GetCrashSchema', () => {
  test('requires crashName parameter', () => {
    const input = {};

    expect(() => GetCrashSchema.parse(input)).toThrow();
  });

  test('accepts valid crashName with defaults', () => {
    const input = {
      crashName: 'MyApp-2024-01-15-123456.crash'
    };

    const result = GetCrashSchema.parse(input);

    expect(result.crashName).toBe('MyApp-2024-01-15-123456.crash');
    expect(result.device).toBe('booted');
  });

  test('accepts device UDID override', () => {
    const input = {
      device: 'custom-device',
      crashName: 'crash-report.ips'
    };

    const result = GetCrashSchema.parse(input);

    expect(result.device).toBe('custom-device');
    expect(result.crashName).toBe('crash-report.ips');
  });

  test('rejects missing crashName', () => {
    const input = {
      device: 'booted'
    };

    expect(() => GetCrashSchema.parse(input)).toThrow();
  });
});

describe('DeleteCrashesSchema', () => {
  test('accepts minimal valid configuration with defaults', () => {
    const input = {};

    const result = DeleteCrashesSchema.parse(input);

    expect(result.device).toBe('booted');
    expect(result.all).toBe(false);
    expect(result.crashName).toBeUndefined();
  });

  test('accepts specific crash name', () => {
    const input = {
      crashName: 'specific-crash.ips'
    };

    const result = DeleteCrashesSchema.parse(input);

    expect(result.crashName).toBe('specific-crash.ips');
    expect(result.all).toBe(false);
  });

  test('accepts all flag', () => {
    const input = {
      all: true
    };

    const result = DeleteCrashesSchema.parse(input);

    expect(result.all).toBe(true);
  });

  test('accepts date range filters', () => {
    const input = {
      before: '2024-12-31T23:59:59Z',
      since: '2024-01-01T00:00:00Z'
    };

    const result = DeleteCrashesSchema.parse(input);

    expect(result.before).toBe('2024-12-31T23:59:59Z');
    expect(result.since).toBe('2024-01-01T00:00:00Z');
  });

  test('accepts device UDID override', () => {
    const input = {
      device: 'my-device',
      all: true
    };

    const result = DeleteCrashesSchema.parse(input);

    expect(result.device).toBe('my-device');
    expect(result.all).toBe(true);
  });
});

describe('StreamLogsSchema', () => {
  test('accepts minimal valid configuration with defaults', () => {
    const input = {};

    const result = StreamLogsSchema.parse(input);

    expect(result.device).toBe('booted');
    expect(result.style).toBe('default');
    expect(result.predicate).toBeUndefined();
  });

  test('accepts predicate filter', () => {
    const input = {
      predicate: 'processImagePath CONTAINS "MyApp"'
    };

    const result = StreamLogsSchema.parse(input);

    expect(result.predicate).toBe('processImagePath CONTAINS "MyApp"');
  });

  test('accepts compact style', () => {
    const input = {
      style: 'compact' as const
    };

    const result = StreamLogsSchema.parse(input);

    expect(result.style).toBe('compact');
  });

  test('accepts json style', () => {
    const input = {
      style: 'json' as const
    };

    const result = StreamLogsSchema.parse(input);

    expect(result.style).toBe('json');
  });

  test('accepts default style explicitly', () => {
    const input = {
      style: 'default' as const
    };

    const result = StreamLogsSchema.parse(input);

    expect(result.style).toBe('default');
  });

  test('rejects invalid style', () => {
    const input = {
      style: 'invalid'
    };

    expect(() => StreamLogsSchema.parse(input)).toThrow();
  });

  test('accepts all parameters together', () => {
    const input = {
      device: 'my-device',
      predicate: 'subsystem == "com.example.app"',
      style: 'json' as const
    };

    const result = StreamLogsSchema.parse(input);

    expect(result.device).toBe('my-device');
    expect(result.predicate).toBe('subsystem == "com.example.app"');
    expect(result.style).toBe('json');
  });
});

describe('InputTextSchema', () => {
  test('requires text parameter', () => {
    const input = {};

    expect(() => InputTextSchema.parse(input)).toThrow();
  });

  test('accepts valid text with defaults', () => {
    const input = {
      text: 'Hello World'
    };

    const result = InputTextSchema.parse(input);

    expect(result.text).toBe('Hello World');
    expect(result.device).toBe('booted');
  });

  test('accepts empty text string', () => {
    const input = {
      text: ''
    };

    const result = InputTextSchema.parse(input);

    expect(result.text).toBe('');
  });

  test('accepts special characters', () => {
    const input = {
      text: 'test@example.com!#$%^&*()'
    };

    const result = InputTextSchema.parse(input);

    expect(result.text).toBe('test@example.com!#$%^&*()');
  });

  test('accepts device UDID override', () => {
    const input = {
      device: 'custom-device',
      text: 'test input'
    };

    const result = InputTextSchema.parse(input);

    expect(result.device).toBe('custom-device');
    expect(result.text).toBe('test input');
  });

  test('rejects non-string text', () => {
    const input = {
      text: 123
    };

    expect(() => InputTextSchema.parse(input)).toThrow();
  });
});

describe('PressButtonSchema', () => {
  test('requires button parameter', () => {
    const input = {};

    expect(() => PressButtonSchema.parse(input)).toThrow();
  });

  test('accepts HOME button', () => {
    const input = {
      button: 'HOME' as const
    };

    const result = PressButtonSchema.parse(input);

    expect(result.button).toBe('HOME');
    expect(result.device).toBe('booted');
  });

  test('accepts LOCK button', () => {
    const input = {
      button: 'LOCK' as const
    };

    const result = PressButtonSchema.parse(input);

    expect(result.button).toBe('LOCK');
  });

  test('accepts SIRI button', () => {
    const input = {
      button: 'SIRI' as const
    };

    const result = PressButtonSchema.parse(input);

    expect(result.button).toBe('SIRI');
  });

  test('accepts SIDE_BUTTON', () => {
    const input = {
      button: 'SIDE_BUTTON' as const
    };

    const result = PressButtonSchema.parse(input);

    expect(result.button).toBe('SIDE_BUTTON');
  });

  test('accepts APPLE_PAY button', () => {
    const input = {
      button: 'APPLE_PAY' as const
    };

    const result = PressButtonSchema.parse(input);

    expect(result.button).toBe('APPLE_PAY');
  });

  test('rejects invalid button', () => {
    const input = {
      button: 'INVALID_BUTTON'
    };

    expect(() => PressButtonSchema.parse(input)).toThrow();
  });

  test('accepts device UDID override', () => {
    const input = {
      device: 'my-device',
      button: 'HOME' as const
    };

    const result = PressButtonSchema.parse(input);

    expect(result.device).toBe('my-device');
    expect(result.button).toBe('HOME');
  });

  test('rejects missing button with device only', () => {
    const input = {
      device: 'booted'
    };

    expect(() => PressButtonSchema.parse(input)).toThrow();
  });
});
