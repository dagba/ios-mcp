/**
 * Unit tests for Instruments validation utilities
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  checkXCTraceAvailable,
  checkLeaksAvailable,
  validateSimulatorState,
  validateInstrumentsSetup
} from '../../src/shared/validation.js';
import { execa } from 'execa';

vi.mock('execa');

describe('Validation Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkXCTraceAvailable', () => {
    test('returns true when xctrace is available', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        exitCode: 0
      } as any);

      const result = await checkXCTraceAvailable();
      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith('which', ['xctrace']);
    });

    test('returns false when xctrace is not available', async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error('Command failed'));

      const result = await checkXCTraceAvailable();
      expect(result).toBe(false);
    });
  });

  describe('checkLeaksAvailable', () => {
    test('returns true when leaks is available', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        exitCode: 0
      } as any);

      const result = await checkLeaksAvailable();
      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith('which', ['leaks']);
    });

    test('returns false when leaks is not available', async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error('Command failed'));

      const result = await checkLeaksAvailable();
      expect(result).toBe(false);
    });
  });

  describe('validateSimulatorState', () => {
    test('passes validation when simulator is booted', async () => {
      const mockOutput = 'iPhone 17 (ABCD-1234) (Booted)';
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: mockOutput,
        stderr: '',
        exitCode: 0
      } as any);

      await expect(validateSimulatorState('ABCD-1234')).resolves.toBeUndefined();
    });

    test('throws SIMULATOR_NOT_FOUND when UDID is invalid', async () => {
      const mockOutput = 'No devices found';
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: mockOutput,
        stderr: '',
        exitCode: 0
      } as any);

      await expect(validateSimulatorState('INVALID-UDID'))
        .rejects.toThrow('Invalid UDID');
    });

    test('throws SIMULATOR_NOT_BOOTED when simulator is shutdown', async () => {
      const mockOutput = 'iPhone 17 (ABCD-1234) (Shutdown)';
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: mockOutput,
        stderr: '',
        exitCode: 0
      } as any);

      await expect(validateSimulatorState('ABCD-1234'))
        .rejects.toThrow('Boot simulator first');
    });
  });

  describe('validateInstrumentsSetup', () => {
    test('passes when all checks succeed', async () => {
      // Mock xctrace check
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        exitCode: 0
      } as any);

      // Mock simulator check
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: 'iPhone 17 (ABCD-1234) (Booted)',
        stderr: '',
        exitCode: 0
      } as any);

      await expect(validateInstrumentsSetup('ABCD-1234')).resolves.toBeUndefined();
    });

    test('throws when xctrace is not available', async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error('Command failed'));

      await expect(validateInstrumentsSetup('ABCD-1234'))
        .rejects.toThrow('xcode-select --install');
    });

    test('throws when simulator UDID is invalid', async () => {
      // Mock xctrace check (passes)
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        exitCode: 0
      } as any);

      // Mock simulator check (UDID not found)
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: 'No devices found',
        stderr: '',
        exitCode: 0
      } as any);

      await expect(validateInstrumentsSetup('INVALID-UDID'))
        .rejects.toThrow('Invalid UDID');
    });

    test('throws when simulator is not booted', async () => {
      // Mock xctrace check (passes)
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        exitCode: 0
      } as any);

      // Mock simulator check (simulator shutdown)
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: 'iPhone 17 (ABCD-1234) (Shutdown)',
        stderr: '',
        exitCode: 0
      } as any);

      await expect(validateInstrumentsSetup('ABCD-1234'))
        .rejects.toThrow('Boot simulator first');
    });
  });
});
