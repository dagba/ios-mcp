/**
 * Unit tests for Instruments session management
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { TraceSessionManager } from '../../src/shared/instruments.js';
import type { SessionInfo, StopResult } from '../../src/shared/instruments.js';

describe('TraceSessionManager', () => {
  let manager: TraceSessionManager;

  beforeEach(() => {
    manager = new TraceSessionManager();
  });

  test('generates unique session IDs', () => {
    const session1 = manager.createSessionId();
    const session2 = manager.createSessionId();

    expect(session1).toBeTruthy();
    expect(session2).toBeTruthy();
    expect(session1).not.toBe(session2);
    expect(typeof session1).toBe('string');
    expect(session1.length).toBeGreaterThan(0);
  });

  test('registers session on start', () => {
    const sessionInfo: SessionInfo = {
      session_id: 'test-session-1',
      device_udid: 'ABCD-1234',
      bundle_id: 'com.example.TestApp',
      templates: ['time', 'allocations'],
      trace_path: '/tmp/instruments-traces/test-session-1/recording.trace',
      pid: 12345,
      status: 'recording',
      start_time: new Date()
    };

    manager.registerSession(sessionInfo);

    const session = manager.getSession('test-session-1');
    expect(session).toBeDefined();
    expect(session?.session_id).toBe('test-session-1');
    expect(session?.pid).toBe(12345);
  });

  test('tracks multiple concurrent sessions', () => {
    const session1: SessionInfo = {
      session_id: 'session-1',
      device_udid: 'DEVICE-1',
      bundle_id: 'com.app1',
      templates: ['time'],
      trace_path: '/tmp/trace1.trace',
      pid: 12345,
      status: 'recording',
      start_time: new Date()
    };

    const session2: SessionInfo = {
      session_id: 'session-2',
      device_udid: 'DEVICE-2',
      bundle_id: 'com.app2',
      templates: ['allocations'],
      trace_path: '/tmp/trace2.trace',
      pid: 12346,
      status: 'recording',
      start_time: new Date()
    };

    manager.registerSession(session1);
    manager.registerSession(session2);

    expect(manager.getSession('session-1')).toBeDefined();
    expect(manager.getSession('session-2')).toBeDefined();
    expect(manager.getAllSessions()).toHaveLength(2);
  });

  test('retrieves session by ID', () => {
    const sessionInfo: SessionInfo = {
      session_id: 'retrieve-test',
      device_udid: 'RETRIEVE-DEVICE',
      bundle_id: 'com.retrieve.app',
      templates: ['leaks'],
      trace_path: '/tmp/trace.trace',
      pid: 99999,
      status: 'recording',
      start_time: new Date()
    };

    manager.registerSession(sessionInfo);

    const retrieved = manager.getSession('retrieve-test');
    expect(retrieved?.session_id).toBe('retrieve-test');
    expect(retrieved?.pid).toBe(99999);
  });

  test('returns undefined for non-existent session', () => {
    const session = manager.getSession('does-not-exist');
    expect(session).toBeUndefined();
  });

  test('lists all active sessions', () => {
    expect(manager.getAllSessions()).toHaveLength(0);

    manager.registerSession({
      session_id: 'session-1',
      device_udid: 'LIST-DEVICE-1',
      bundle_id: 'com.list.app1',
      templates: ['time'],
      trace_path: '/tmp/trace1.trace',
      pid: 1001,
      status: 'recording',
      start_time: new Date()
    });

    manager.registerSession({
      session_id: 'session-2',
      device_udid: 'LIST-DEVICE-2',
      bundle_id: 'com.list.app2',
      templates: ['allocations'],
      trace_path: '/tmp/trace2.trace',
      pid: 1002,
      status: 'recording',
      start_time: new Date()
    });

    const sessions = manager.getAllSessions();
    expect(sessions).toHaveLength(2);
    expect(sessions.map(s => s.session_id)).toContain('session-1');
    expect(sessions.map(s => s.session_id)).toContain('session-2');
  });

  test('removes session after stop', () => {
    manager.registerSession({
      session_id: 'remove-test',
      device_udid: 'REMOVE-DEVICE',
      bundle_id: 'com.remove.app',
      templates: ['leaks'],
      trace_path: '/tmp/trace.trace',
      pid: 5555,
      status: 'recording',
      start_time: new Date()
    });

    expect(manager.getSession('remove-test')).toBeDefined();

    manager.removeSession('remove-test');

    expect(manager.getSession('remove-test')).toBeUndefined();
  });

  test('handles removing non-existent session gracefully', () => {
    expect(() => {
      manager.removeSession('does-not-exist');
    }).not.toThrow();
  });

  test('validates trace path format', () => {
    const sessionId = 'test-123';
    const tracePath = manager.getTracePath(sessionId);

    expect(tracePath).toContain('/tmp/instruments-traces/');
    expect(tracePath).toContain(sessionId);
    expect(tracePath).toMatch(/\/recording\.trace$/);
  });

  test('checks if session exists', () => {
    manager.registerSession({
      session_id: 'exists-test',
      device_udid: 'EXISTS-DEVICE',
      bundle_id: 'com.exists.app',
      templates: ['time', 'allocations'],
      trace_path: '/tmp/trace.trace',
      pid: 7777,
      status: 'recording',
      start_time: new Date()
    });

    expect(manager.hasSession('exists-test')).toBe(true);
    expect(manager.hasSession('does-not-exist')).toBe(false);
  });

  test('gets session count', () => {
    expect(manager.getSessionCount()).toBe(0);

    manager.registerSession({
      session_id: 'count-1',
      device_udid: 'COUNT-DEVICE-1',
      bundle_id: 'com.count.app1',
      templates: ['time'],
      trace_path: '/tmp/trace1.trace',
      pid: 1111,
      status: 'recording',
      start_time: new Date()
    });

    expect(manager.getSessionCount()).toBe(1);

    manager.registerSession({
      session_id: 'count-2',
      device_udid: 'COUNT-DEVICE-2',
      bundle_id: 'com.count.app2',
      templates: ['allocations'],
      trace_path: '/tmp/trace2.trace',
      pid: 2222,
      status: 'recording',
      start_time: new Date()
    });

    expect(manager.getSessionCount()).toBe(2);

    manager.removeSession('count-1');

    expect(manager.getSessionCount()).toBe(1);
  });

  test('clears all sessions', () => {
    manager.registerSession({
      session_id: 'clear-1',
      device_udid: 'CLEAR-DEVICE-1',
      bundle_id: 'com.clear.app1',
      templates: ['leaks'],
      trace_path: '/tmp/trace1.trace',
      pid: 3333,
      status: 'recording',
      start_time: new Date()
    });

    manager.registerSession({
      session_id: 'clear-2',
      device_udid: 'CLEAR-DEVICE-2',
      bundle_id: 'com.clear.app2',
      templates: ['time', 'allocations', 'leaks'],
      trace_path: '/tmp/trace2.trace',
      pid: 4444,
      status: 'recording',
      start_time: new Date()
    });

    expect(manager.getSessionCount()).toBe(2);

    manager.clearAllSessions();

    expect(manager.getSessionCount()).toBe(0);
    expect(manager.getAllSessions()).toHaveLength(0);
  });

  describe('ChildProcess management', () => {
    test('stores and retrieves child process reference', () => {
      const mockProcess = { pid: 12345, kill: vi.fn() } as any;

      const sessionInfo: SessionInfo = {
        session_id: 'test-session-cp',
        device_udid: 'ABCD-1234',
        bundle_id: 'com.example.App',
        templates: ['time'],
        trace_path: '/tmp/test.trace',
        pid: 12345,
        status: 'recording',
        start_time: new Date(),
        child_process: mockProcess,
      };

      manager.registerSession(sessionInfo);
      const retrieved = manager.getSession('test-session-cp');

      expect(retrieved?.child_process).toBe(mockProcess);
      expect(retrieved?.child_process?.pid).toBe(12345);
    });

    test('updates session to remove child process on stop', () => {
      const mockProcess = { pid: 12345, kill: vi.fn() } as any;

      const sessionInfo: SessionInfo = {
        session_id: 'test-session-stop',
        device_udid: 'ABCD-1234',
        bundle_id: 'com.example.App',
        templates: ['time'],
        trace_path: '/tmp/test.trace',
        pid: 12345,
        status: 'recording',
        start_time: new Date(),
        child_process: mockProcess,
      };

      manager.registerSession(sessionInfo);

      // Update to stopped state
      const updatedInfo: SessionInfo = {
        ...sessionInfo,
        status: 'stopped',
        end_time: new Date(),
        child_process: undefined,
      };

      manager.registerSession(updatedInfo);
      const retrieved = manager.getSession('test-session-stop');

      expect(retrieved?.status).toBe('stopped');
      expect(retrieved?.child_process).toBeUndefined();
      expect(retrieved?.end_time).toBeDefined();
    });

    test('updateSession modifies existing session', () => {
      const sessionInfo: SessionInfo = {
        session_id: 'test-update',
        device_udid: 'ABCD-1234',
        bundle_id: 'com.example.App',
        templates: ['time'],
        trace_path: '/tmp/test.trace',
        pid: 12345,
        status: 'recording',
        start_time: new Date(),
      };

      manager.registerSession(sessionInfo);

      manager.updateSession('test-update', {
        status: 'stopped',
        end_time: new Date(),
      });

      const updated = manager.getSession('test-update');
      expect(updated?.status).toBe('stopped');
      expect(updated?.end_time).toBeDefined();
      expect(updated?.device_udid).toBe('ABCD-1234'); // Other fields preserved
    });

    test('updateSession throws when session does not exist', () => {
      expect(() => {
        manager.updateSession('nonexistent', { status: 'stopped' });
      }).toThrow('Session nonexistent not found');
    });
  });
});
