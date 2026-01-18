/**
 * Unit tests for media tool schemas
 */

import { describe, test, expect } from 'vitest';
import {
  StartVideoRecordingSchema,
  StopVideoRecordingSchema,
  AddMediaSchema
} from '../../src/schemas/media.js';

describe('StartVideoRecordingSchema', () => {
  test('accepts valid video recording parameters', () => {
    const input = {
      outputPath: '/path/to/video.mov',
      codec: 'h264' as const,
      display: 'internal' as const
    };

    const result = StartVideoRecordingSchema.parse(input);

    expect(result.outputPath).toBe('/path/to/video.mov');
    expect(result.codec).toBe('h264');
    expect(result.display).toBe('internal');
    expect(result.device).toBe('booted');
  });

  test('defaults codec and display', () => {
    const result = StartVideoRecordingSchema.parse({
      outputPath: '/path/to/video.mov'
    });

    expect(result.codec).toBe('hevc');
    expect(result.display).toBe('internal');
  });

  test('accepts hevc codec', () => {
    const result = StartVideoRecordingSchema.parse({
      outputPath: '/path/to/video.mov',
      codec: 'hevc' as const
    });

    expect(result.codec).toBe('hevc');
  });

  test('accepts external display', () => {
    const result = StartVideoRecordingSchema.parse({
      outputPath: '/path/to/video.mov',
      display: 'external' as const
    });

    expect(result.display).toBe('external');
  });

  test('accepts mask parameter', () => {
    const masks = ['ignored', 'alpha', 'black'] as const;

    masks.forEach(mask => {
      const result = StartVideoRecordingSchema.parse({
        outputPath: '/path/to/video.mov',
        mask
      });
      expect(result.mask).toBe(mask);
    });
  });

  test('rejects invalid codec', () => {
    expect(() => StartVideoRecordingSchema.parse({
      outputPath: '/path/to/video.mov',
      codec: 'invalid'
    })).toThrow();
  });

  test('rejects invalid display', () => {
    expect(() => StartVideoRecordingSchema.parse({
      outputPath: '/path/to/video.mov',
      display: 'invalid'
    })).toThrow();
  });

  test('rejects invalid mask', () => {
    expect(() => StartVideoRecordingSchema.parse({
      outputPath: '/path/to/video.mov',
      mask: 'invalid'
    })).toThrow();
  });

  test('requires outputPath', () => {
    expect(() => StartVideoRecordingSchema.parse({})).toThrow();
  });

  test('accepts custom device', () => {
    const result = StartVideoRecordingSchema.parse({
      device: 'ABC123',
      outputPath: '/path/to/video.mov'
    });

    expect(result.device).toBe('ABC123');
  });
});

describe('StopVideoRecordingSchema', () => {
  test('accepts device parameter', () => {
    const result = StopVideoRecordingSchema.parse({ device: 'ABC123' });
    expect(result.device).toBe('ABC123');
  });

  test('defaults to booted', () => {
    const result = StopVideoRecordingSchema.parse({});
    expect(result.device).toBe('booted');
  });
});

describe('AddMediaSchema', () => {
  test('accepts single file', () => {
    const input = {
      files: ['/path/to/photo.jpg']
    };

    const result = AddMediaSchema.parse(input);

    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toBe('/path/to/photo.jpg');
    expect(result.device).toBe('booted');
  });

  test('accepts multiple files', () => {
    const input = {
      files: [
        '/path/to/photo1.jpg',
        '/path/to/photo2.png',
        '/path/to/video.mov',
        '/path/to/contact.vcf'
      ]
    };

    const result = AddMediaSchema.parse(input);

    expect(result.files).toHaveLength(4);
  });

  test('accepts custom device', () => {
    const result = AddMediaSchema.parse({
      device: 'ABC123',
      files: ['/path/to/photo.jpg']
    });

    expect(result.device).toBe('ABC123');
  });

  test('requires at least one file', () => {
    expect(() => AddMediaSchema.parse({ files: [] })).toThrow();
  });

  test('requires files parameter', () => {
    expect(() => AddMediaSchema.parse({})).toThrow();
  });
});
