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
      trace_path: '/tmp/instruments-traces/test-session-1/recording.trace',
      pid: 12345,
      status: 'recording'
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
      trace_path: '/tmp/trace1.trace',
      pid: 12345,
      status: 'recording'
    };

    const session2: SessionInfo = {
      session_id: 'session-2',
      trace_path: '/tmp/trace2.trace',
      pid: 12346,
      status: 'recording'
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
      trace_path: '/tmp/trace.trace',
      pid: 99999,
      status: 'recording'
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
      trace_path: '/tmp/trace1.trace',
      pid: 1001,
      status: 'recording'
    });

    manager.registerSession({
      session_id: 'session-2',
      trace_path: '/tmp/trace2.trace',
      pid: 1002,
      status: 'recording'
    });

    const sessions = manager.getAllSessions();
    expect(sessions).toHaveLength(2);
    expect(sessions.map(s => s.session_id)).toContain('session-1');
    expect(sessions.map(s => s.session_id)).toContain('session-2');
  });

  test('removes session after stop', () => {
    manager.registerSession({
      session_id: 'remove-test',
      trace_path: '/tmp/trace.trace',
      pid: 5555,
      status: 'recording'
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
      trace_path: '/tmp/trace.trace',
      pid: 7777,
      status: 'recording'
    });

    expect(manager.hasSession('exists-test')).toBe(true);
    expect(manager.hasSession('does-not-exist')).toBe(false);
  });

  test('gets session count', () => {
    expect(manager.getSessionCount()).toBe(0);

    manager.registerSession({
      session_id: 'count-1',
      trace_path: '/tmp/trace1.trace',
      pid: 1111,
      status: 'recording'
    });

    expect(manager.getSessionCount()).toBe(1);

    manager.registerSession({
      session_id: 'count-2',
      trace_path: '/tmp/trace2.trace',
      pid: 2222,
      status: 'recording'
    });

    expect(manager.getSessionCount()).toBe(2);

    manager.removeSession('count-1');

    expect(manager.getSessionCount()).toBe(1);
  });

  test('clears all sessions', () => {
    manager.registerSession({
      session_id: 'clear-1',
      trace_path: '/tmp/trace1.trace',
      pid: 3333,
      status: 'recording'
    });

    manager.registerSession({
      session_id: 'clear-2',
      trace_path: '/tmp/trace2.trace',
      pid: 4444,
      status: 'recording'
    });

    expect(manager.getSessionCount()).toBe(2);

    manager.clearAllSessions();

    expect(manager.getSessionCount()).toBe(0);
    expect(manager.getAllSessions()).toHaveLength(0);
  });
});
