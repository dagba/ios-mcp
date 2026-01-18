/**
 * Unit tests for utility tool schemas
 */

import { describe, test, expect } from 'vitest';
import {
  GetAppContainerPathSchema,
  ClipboardCopySchema,
  ClipboardPasteSchema,
  ClipboardSyncSchema,
  AddRootCertificateSchema,
  AddCertificateSchema,
  ResetKeychainSchema,
  TriggerICloudSyncSchema
} from '../../src/schemas/utilities.js';

describe('GetAppContainerPathSchema', () => {
  test('accepts valid app container request', () => {
    const input = {
      bundleId: 'com.example.app'
    };

    const result = GetAppContainerPathSchema.parse(input);

    expect(result.bundleId).toBe('com.example.app');
    expect(result.container).toBe('app');
    expect(result.device).toBe('booted');
  });

  test('accepts all container types', () => {
    const containers = ['app', 'data', 'groups'] as const;

    containers.forEach(container => {
      const result = GetAppContainerPathSchema.parse({
        bundleId: 'com.example.app',
        container
      });
      expect(result.container).toBe(container);
    });
  });

  test('accepts group ID as container', () => {
    const result = GetAppContainerPathSchema.parse({
      bundleId: 'com.example.app',
      container: 'group.com.example.shared'
    });

    expect(result.container).toBe('group.com.example.shared');
  });

  test('accepts custom device', () => {
    const result = GetAppContainerPathSchema.parse({
      device: 'ABC123',
      bundleId: 'com.example.app'
    });

    expect(result.device).toBe('ABC123');
  });

  test('requires bundleId', () => {
    expect(() => GetAppContainerPathSchema.parse({})).toThrow();
  });
});

describe('ClipboardCopySchema', () => {
  test('accepts valid text', () => {
    const input = {
      text: 'Hello, world!'
    };

    const result = ClipboardCopySchema.parse(input);

    expect(result.text).toBe('Hello, world!');
    expect(result.device).toBe('booted');
  });

  test('accepts empty text', () => {
    const result = ClipboardCopySchema.parse({ text: '' });
    expect(result.text).toBe('');
  });

  test('accepts multiline text', () => {
    const multiline = 'Line 1\nLine 2\nLine 3';
    const result = ClipboardCopySchema.parse({ text: multiline });
    expect(result.text).toBe(multiline);
  });

  test('accepts custom device', () => {
    const result = ClipboardCopySchema.parse({
      device: 'ABC123',
      text: 'Test'
    });

    expect(result.device).toBe('ABC123');
  });

  test('requires text parameter', () => {
    expect(() => ClipboardCopySchema.parse({})).toThrow();
  });
});

describe('ClipboardPasteSchema', () => {
  test('accepts device parameter', () => {
    const result = ClipboardPasteSchema.parse({ device: 'ABC123' });
    expect(result.device).toBe('ABC123');
  });

  test('defaults to booted', () => {
    const result = ClipboardPasteSchema.parse({});
    expect(result.device).toBe('booted');
  });
});

describe('ClipboardSyncSchema', () => {
  test('accepts valid sync request', () => {
    const input = {
      targetDevice: 'DEF456'
    };

    const result = ClipboardSyncSchema.parse(input);

    expect(result.sourceDevice).toBe('booted');
    expect(result.targetDevice).toBe('DEF456');
  });

  test('accepts custom source device', () => {
    const result = ClipboardSyncSchema.parse({
      sourceDevice: 'ABC123',
      targetDevice: 'DEF456'
    });

    expect(result.sourceDevice).toBe('ABC123');
    expect(result.targetDevice).toBe('DEF456');
  });

  test('requires targetDevice', () => {
    expect(() => ClipboardSyncSchema.parse({})).toThrow();
  });
});

describe('AddRootCertificateSchema', () => {
  test('accepts valid certificate path', () => {
    const input = {
      certificatePath: '/path/to/cert.pem'
    };

    const result = AddRootCertificateSchema.parse(input);

    expect(result.certificatePath).toBe('/path/to/cert.pem');
    expect(result.device).toBe('booted');
  });

  test('accepts various certificate formats', () => {
    const formats = ['.pem', '.cer', '.der'];

    formats.forEach(format => {
      const result = AddRootCertificateSchema.parse({
        certificatePath: `/path/to/cert${format}`
      });
      expect(result.certificatePath).toBe(`/path/to/cert${format}`);
    });
  });

  test('accepts custom device', () => {
    const result = AddRootCertificateSchema.parse({
      device: 'ABC123',
      certificatePath: '/path/to/cert.pem'
    });

    expect(result.device).toBe('ABC123');
  });

  test('requires certificatePath', () => {
    expect(() => AddRootCertificateSchema.parse({})).toThrow();
  });
});

describe('AddCertificateSchema', () => {
  test('accepts valid certificate path', () => {
    const input = {
      certificatePath: '/path/to/cert.pem'
    };

    const result = AddCertificateSchema.parse(input);

    expect(result.certificatePath).toBe('/path/to/cert.pem');
    expect(result.device).toBe('booted');
  });

  test('accepts custom device', () => {
    const result = AddCertificateSchema.parse({
      device: 'ABC123',
      certificatePath: '/path/to/cert.pem'
    });

    expect(result.device).toBe('ABC123');
  });

  test('requires certificatePath', () => {
    expect(() => AddCertificateSchema.parse({})).toThrow();
  });
});

describe('ResetKeychainSchema', () => {
  test('accepts device parameter', () => {
    const result = ResetKeychainSchema.parse({ device: 'ABC123' });
    expect(result.device).toBe('ABC123');
  });

  test('defaults to booted', () => {
    const result = ResetKeychainSchema.parse({});
    expect(result.device).toBe('booted');
  });
});

describe('TriggerICloudSyncSchema', () => {
  test('accepts device parameter', () => {
    const result = TriggerICloudSyncSchema.parse({ device: 'ABC123' });
    expect(result.device).toBe('ABC123');
  });

  test('defaults to booted', () => {
    const result = TriggerICloudSyncSchema.parse({});
    expect(result.device).toBe('booted');
  });
});
