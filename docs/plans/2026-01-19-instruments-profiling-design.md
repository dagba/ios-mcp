# Instruments Profiling Implementation Design

**Date:** 2026-01-19
**Status:** Validated
**Version:** 0.5.0

## Overview

Full production implementation of Instruments profiling with xctrace integration, providing Time Profiler, Allocations, and Leaks analysis for iOS apps running in the simulator.

## Goals

1. **Complete tool handlers** - Replace placeholder implementations with real xctrace integration
2. **Process lifecycle management** - Clean background process control with graceful shutdown
3. **Robust error handling** - Pre-flight validation with actionable recovery messages
4. **Production-ready** - Full test coverage, documentation, and edge case handling

## Architecture

### Three MCP Tools

#### 1. `instruments_start_profiling`

**Purpose:** Start background profiling session

**Flow:**
1. Validate input with `StartProfilingSchema`
2. Run `validateInstrumentsSetup(device_udid)` (pre-flight checks)
3. Perform lazy cleanup of old traces (>24 hours)
4. Generate session_id: `session-${Date.now()}-${randomHash}`
5. Create directory: `/tmp/instruments-traces/{session_id}/`
6. Build xctrace command with `buildXCTraceCommand()`
7. Spawn xctrace with execa (detached: false, cleanup: false)
8. Store session in `TraceSessionManager` with ChildProcess reference
9. Return immediately: `{ session_id, trace_path, pid, status: 'recording' }`

**Non-blocking:** Returns as soon as xctrace spawns

#### 2. `instruments_stop_profiling`

**Purpose:** Gracefully stop profiling and finalize trace file

**Flow:**
1. Validate input with `StopProfilingSchema`
2. Get session from `TraceSessionManager` by session_id
3. Check `session.status === 'recording'` (error if not)
4. Send `session.childProcess.kill('SIGINT')` (graceful signal)
5. Wait for process exit with timeout (10 seconds)
6. If timeout: send SIGKILL, mark `status='failed'`
7. Verify .trace file exists at `session.tracePath`
8. Calculate duration: `endTime - startTime`
9. Update session: `status='stopped'`, endTime, remove childProcess
10. Return: `{ session_id, trace_path, duration, status }`

**Does NOT export/parse data** - that's `analyze_trace`'s job

#### 3. `instruments_analyze_trace`

**Purpose:** On-demand export and analysis of trace data

**Flow:**
1. Validate input with `AnalyzeTraceSchema`
2. Determine trace_path (from session_id OR direct path parameter)
3. Verify .trace file exists and is readable
4. For each template in `session.templates`:
   - Run: `xctrace export --input trace_path --xpath <query> --output temp.xml`
   - Parse XML with template-specific parser
   - Generate executive summary (top 10 items)
5. Return combined results: `{ time_profiler?, allocations?, leaks? }`

**Can be called multiple times** on the same trace

### Data Flow

```
start → xctrace spawns → ChildProcess stored in SessionManager
                          ↓
                       (profiling)
                          ↓
stop → SIGINT sent → xctrace finalizes .trace file
                          ↓
analyze → xctrace export → XML parsed → summaries returned
```

## Process Management

### SessionInfo Enhancement

Add ChildProcess reference to existing `SessionInfo` interface:

```typescript
interface SessionInfo {
  sessionId: string;
  deviceUdid: string;
  bundleId: string;
  templates: TemplateType[];
  tracePath: string;
  pid: number;
  status: 'recording' | 'stopped' | 'failed';
  startTime: Date;
  endTime?: Date;
  childProcess?: ChildProcess;  // NEW: Store process reference
}
```

### Lifecycle States

| State | Description |
|-------|-------------|
| `recording` | xctrace process running, actively profiling |
| `stopped` | SIGINT sent, xctrace finalized trace file successfully |
| `failed` | xctrace crashed, SIGKILL sent, or other errors |

### Graceful Shutdown

**Primary path (SIGINT):**
1. Send `childProcess.kill('SIGINT')`
2. Wait up to 10 seconds for process exit
3. Verify .trace file exists and is complete
4. Update session status to 'stopped'
5. Remove childProcess reference (keep session metadata)

**Fallback handling:**
- If SIGINT doesn't work in 10 seconds → send SIGKILL (force), mark failed
- If .trace file is missing/incomplete → status='failed', provide recovery hints
- If childProcess is null/undefined → check PID with `ps`, attempt kill by PID

## Pre-flight Validation

### New Utilities (src/shared/validation.ts)

```typescript
// Check xctrace availability
async function checkXCTraceAvailable(): Promise<boolean>

// Check leaks command (used for leak detection)
async function checkLeaksAvailable(): Promise<boolean>

// Verify simulator is booted and ready
async function validateSimulatorState(udid: string): Promise<void>

// Combined pre-flight check for start_profiling
async function validateInstrumentsSetup(udid: string): Promise<void>
```

### Error Handling Matrix

| Error Condition | Error Code | Recovery Message |
|----------------|------------|------------------|
| xctrace not found | `XCTRACE_NOT_FOUND` | "Install Xcode Command Line Tools: `xcode-select --install`" |
| leaks not found | `LEAKS_NOT_FOUND` | "leaks command unavailable, install full Xcode from App Store" |
| Simulator not booted | `SIMULATOR_NOT_BOOTED` | "Boot simulator first: `xcrun simctl boot {udid}`" |
| Simulator not found | `SIMULATOR_NOT_FOUND` | "Invalid UDID. List simulators: `xcrun simctl list devices`" |
| Trace directory creation failed | `TRACE_DIR_FAILED` | "Cannot create /tmp/instruments-traces/, check permissions" |
| Bundle ID not installed | `APP_NOT_FOUND` | "App not installed. Install with `xcrun simctl install`" |

### When Validation Runs

- **start_profiling**: Full validation (xctrace, simulator, directory)
- **stop_profiling**: Check session exists, process still tracked
- **analyze_trace**: Check trace file exists, xctrace available for export

## Trace File Management

### Storage

- **Location:** `/tmp/instruments-traces/{session_id}/recording.trace`
- **Structure:** Each session gets its own directory
- **Lifetime:** 24-hour TTL with lazy cleanup

### Lazy Cleanup Strategy

**When:** On `start_profiling` before creating new session directory

**How:**
1. Scan `/tmp/instruments-traces/` for all subdirectories
2. Check directory modification time
3. Delete directories older than 24 hours (recursively)
4. Continue with new session creation

**Why lazy:**
- No background daemon needed
- Cleanup happens naturally when system is active
- First session after 24+ hours takes slightly longer (acceptable trade-off)

## Implementation Dependencies

### External Commands

- **xctrace** - Recording and exporting trace data (from Xcode CLT)
- **leaks** - Memory leak detection (from Xcode)
- **xcrun simctl** - Simulator state validation

### Node.js Packages

- **execa** - Process spawning (already in package.json)
- **fs.promises** - File operations (Node.js built-in)
- **path** - Path manipulation (Node.js built-in)

### Existing Code

- `buildXCTraceCommand()` - Command builder (src/shared/instruments.ts)
- `parseTimeProfilerXML()` - CPU profiling parser
- `parseAllocationsXML()` - Memory allocation parser
- `parseLeaksOutput()` - Memory leak parser
- `TraceSessionManager` - Session tracking (enhance with ChildProcess)

## Testing Strategy

### Unit Tests to Update

1. **Process management tests** (tests/unit/instruments-session.test.ts)
   - Add tests for ChildProcess storage/retrieval
   - Test graceful shutdown with SIGINT
   - Test fallback with SIGKILL

2. **Tool handler tests** (tests/unit/instruments-tools.test.ts)
   - Test start_profiling spawns xctrace correctly
   - Test stop_profiling sends proper signals
   - Test analyze_trace calls xctrace export
   - Mock execa to avoid spawning real processes

3. **Validation tests** (new: tests/unit/validation.test.ts)
   - Test xctrace/leaks availability checks
   - Test simulator state validation
   - Test error messages for each failure mode

4. **Cleanup tests** (tests/unit/instruments-session.test.ts)
   - Test lazy cleanup deletes old directories
   - Test cleanup preserves recent directories
   - Test cleanup handles missing directories gracefully

### Integration Testing

**Manual verification:**
1. Start profiling on booted simulator
2. Run app for 30 seconds
3. Stop profiling
4. Analyze trace file
5. Verify top 10 CPU/memory results are reasonable

## Documentation Updates

### README.md

Add new section under "Build & Test Tools":

```markdown
### Instruments Profiling

Profile iOS apps with Time Profiler, Allocations, and Leaks detection.

**Tools:**
- `instruments_start_profiling` - Start profiling session
- `instruments_stop_profiling` - Stop recording and finalize trace
- `instruments_analyze_trace` - Export and analyze trace data

**Requirements:**
- Xcode Command Line Tools (xctrace)
- Full Xcode installation (leaks command)
- Booted iOS simulator

**Example workflow:**
[Include complete example with all three tools]
```

### CLAUDE.md

Update "Instruments Profiling Implementation" section:
- Change status from "Placeholder" to "Production Ready"
- Document the validated design decisions
- Add troubleshooting section for common issues

## Implementation Checklist

- [ ] Create `src/shared/validation.ts` with pre-flight checks
- [ ] Enhance `TraceSessionManager` to store ChildProcess
- [ ] Implement `start_profiling` handler with xctrace spawn
- [ ] Implement `stop_profiling` handler with graceful shutdown
- [ ] Implement `analyze_trace` handler with xctrace export
- [ ] Add lazy cleanup logic to start_profiling
- [ ] Write/update unit tests (target: >80% coverage)
- [ ] Manual testing with real simulator
- [ ] Update README.md with tool documentation
- [ ] Update CLAUDE.md implementation status

## Risk Mitigation

### Known Risks

1. **xctrace may hang on SIGINT**
   - Mitigation: 10-second timeout with SIGKILL fallback

2. **Trace files can be 100MB+**
   - Mitigation: 24-hour cleanup, clear error if disk full

3. **xctrace export can be slow (>30 seconds)**
   - Mitigation: Document expected wait time, show progress if possible

4. **Multiple profiling sessions on same device**
   - Mitigation: One session per device enforcement (error if already recording)

5. **Server restart loses ChildProcess references**
   - Mitigation: Document as known limitation, provide manual cleanup command

## Success Criteria

- [ ] All three tools work end-to-end with real simulator
- [ ] All 300+ tests pass (including new tests)
- [ ] Error messages are actionable for common failure modes
- [ ] README documentation is complete with examples
- [ ] Trace cleanup prevents disk exhaustion
- [ ] No memory leaks in SessionManager

## Timeline

**Estimated Implementation:** 4-6 hours
- Validation utilities: 1 hour
- Tool handlers: 2 hours
- Tests: 1-2 hours
- Documentation: 1 hour

## References

- [xctrace man page](https://keith.github.io/xcode-man-pages/xctrace.1.html)
- [Instruments Documentation](https://developer.apple.com/library/archive/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/)
- Existing parser implementations: src/shared/instruments.ts
- Session management: TraceSessionManager class
