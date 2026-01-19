# Instruments Profiling Integration Design

**Date:** 2026-01-18
**Version:** 0.5.0
**Status:** Approved for Implementation

## Overview

Add comprehensive performance profiling capabilities to the iOS Dev MCP Server using Apple's Instruments (xctrace). Enable Claude to profile iOS apps for CPU performance, memory usage, and memory leaks through three new MCP tools covering debugging, automated testing, and analysis workflows.

## Goals

1. **Performance Debugging** - Identify CPU hotspots, memory leaks, and bottlenecks during development
2. **Automated Performance Testing** - Run profiling as part of CI/CD to catch regressions
3. **App Analysis** - Generate performance reports to inform optimization decisions

## Architecture

### Component Structure

```
src/
├── schemas/
│   └── instruments.ts          # Zod schemas for 3 tools
├── shared/
│   └── instruments.ts          # Command builder + parser utilities
├── tools/
│   └── instruments/
│       ├── index.ts            # Tool registration
│       ├── start.ts            # instruments_start_profiling
│       ├── stop.ts             # instruments_stop_profiling
│       └── analyze.ts          # instruments_analyze_trace
└── tests/
    └── unit/
        ├── instruments-schemas.test.ts
        ├── instruments-parser.test.ts
        ├── instruments-tools.test.ts
        └── instruments-session.test.ts
```

### Core Components

#### 1. `src/shared/instruments.ts` - Intelligence Layer

Similar to existing `xcodebuild.ts`, provides:

- **`buildXCTraceCommand()`** - Construct xctrace record commands
- **`exportTraceData()`** - Extract structured data from .trace files
- **`parseTimeProfiler()`** - Parse CPU profiling results to summary
- **`parseAllocations()`** - Parse memory allocation data
- **`parseLeaks()`** - Parse memory leak reports
- **`TraceSessionManager`** - Manages active profiling sessions with PID tracking

#### 2. Session Management

- **Storage:** `/tmp/instruments-traces/{session-id}/`
- **Tracking:** xctrace PIDs for graceful shutdown
- **Cleanup:** Auto-delete after analysis or 24 hours
- **Session ID:** UUID returned from start, required for stop/analyze

#### 3. Template Support

Multi-template profiling in single session:
- Time Profiler (CPU performance)
- Allocations (memory usage)
- Leaks (memory leaks)

All three attach simultaneously for efficiency.

## Tool Interfaces

### Tool 1: `instruments_start_profiling`

**Purpose:** Start profiling session for an iOS app

**Input Schema:**
```typescript
{
  device_udid: string,           // iOS simulator UDID (required)
  bundle_id: string,             // App to profile, e.g., "com.example.MyApp" (required)
  templates?: string[],          // Default: ["time", "allocations", "leaks"]
  launch_args?: string[],        // Optional app launch arguments
  env_vars?: Record<string,string> // Optional environment variables
}
```

**Returns:**
```typescript
{
  session_id: string,            // UUID for this profiling session
  trace_path: string,            // /tmp/instruments-traces/{session_id}/recording.trace
  pid: number,                   // xctrace process ID
  status: "recording"
}
```

### Tool 2: `instruments_stop_profiling`

**Purpose:** Stop active profiling session and finalize trace file

**Input Schema:**
```typescript
{
  session_id: string             // Session ID from start_profiling (required)
}
```

**Returns:**
```typescript
{
  session_id: string,
  trace_path: string,            // Path to completed .trace file
  duration_seconds: number,      // Total recording duration
  file_size_mb: number,          // Trace file size
  status: "completed"
}
```

### Tool 3: `instruments_analyze_trace`

**Purpose:** Parse trace file and return executive summary with top issues

**Input Schema:**
```typescript
{
  session_id?: string,           // Analyze recent session
  trace_path?: string,           // OR analyze existing .trace file
  templates?: string[]           // Which templates to analyze (default: all)
}
```

**Returns:**
```typescript
{
  summary: {
    duration_seconds: number,
    templates_analyzed: string[],
    trace_file_size_mb: number
  },
  time_profiler?: {
    total_cpu_time_ms: number,
    heaviest_stack_trace: string,
    top_10_symbols: Array<{
      symbol: string,              // Function/method name
      self_time_ms: number,        // Time in this function only
      total_time_ms: number,       // Time including callees
      percentage: number           // % of total CPU time
    }>
  },
  allocations?: {
    peak_memory_mb: number,
    total_allocations: number,
    living_allocations: number,
    top_10_allocations: Array<{
      category: string,            // Allocation type (e.g., "Malloc 16 Bytes")
      size_mb: number,             // Total size
      count: number,               // Number of allocations
      percentage: number           // % of total memory
    }>
  },
  leaks?: {
    total_leaked_mb: number,
    leak_count: number,
    leaks: Array<{
      address: string,             // Memory address
      size_bytes: number,
      type: string,                // Object type
      stack_trace: string          // Allocation stack trace
    }>
  }
}
```

### Workflow Example

```typescript
// 1. Start profiling
const start = await instruments_start_profiling({
  device_udid: "ABCD-1234-5678",
  bundle_id: "com.example.MyApp"
});
// → { session_id: "abc123", status: "recording" }

// 2. Exercise the app (manual or automated)
// User interacts with app, reproduces performance issue...

// 3. Stop profiling
const stop = await instruments_stop_profiling({
  session_id: "abc123"
});
// → { duration_seconds: 42.5, file_size_mb: 156.3 }

// 4. Analyze results
const results = await instruments_analyze_trace({
  session_id: "abc123"
});
// → Executive summary with top CPU hotspots, memory allocations, leaks
```

## Implementation Strategy

### Approach: Hybrid with Structured Parsing

Combines reliability of structured data with fallback parsing:

1. **Recording:** Use xctrace CLI for starting/stopping sessions
2. **Export:** Use xctrace export for structured XML/JSON data
3. **Parsing:** Build dedicated parsers with error recovery
4. **Fallbacks:** Handle corrupt/incomplete traces gracefully

**Rationale:** Matches project quality standards, provides reliable parsing that won't break with Xcode updates, follows existing pattern (src/shared/xcodebuild.ts).

### xctrace Command Construction

```typescript
// In src/shared/instruments.ts

function buildXCTraceCommand(options: {
  device_udid: string,
  bundle_id: string,
  templates: string[],
  output_path: string,
  launch_args?: string[],
  env_vars?: Record<string,string>
}): string[] {

  const templateFlags = options.templates.map(t => {
    const mapping = {
      'time': 'Time Profiler',
      'allocations': 'Allocations',
      'leaks': 'Leaks'
    };
    return ['--template', mapping[t]];
  }).flat();

  return [
    'xcrun', 'xctrace', 'record',
    '--device', options.device_udid,
    '--launch', options.bundle_id,
    ...templateFlags,
    '--output', options.output_path,
    '--target-stdout', '-',  // Stream app output
    ...(options.launch_args || []).flatMap(arg => ['--launch-arg', arg]),
    ...(Object.entries(options.env_vars || {}).flatMap(([k,v]) => ['--env', `${k}=${v}`]))
  ];
}
```

### Trace Data Export & Parsing

```typescript
// Export strategies per template

async function exportTimeProfiler(tracePath: string): Promise<TimeProfilerData> {
  // Use: xctrace export --input trace.trace --xpath '/trace-toc/run/data/table[@schema="time-profile"]'
  // Returns XML with call tree, sample counts, time measurements
  const xml = await execCommand([
    'xcrun', 'xctrace', 'export',
    '--input', tracePath,
    '--xpath', '/trace-toc/run/data/table[@schema="time-profile"]'
  ]);
  return parseTimeProfilerXML(xml);
}

async function exportAllocations(tracePath: string): Promise<AllocationsData> {
  // Use: xctrace export --input trace.trace --xpath '/trace-toc/run/data/table[@schema="allocations"]'
  // Returns allocation statistics by type/category
  const xml = await execCommand([
    'xcrun', 'xctrace', 'export',
    '--input', tracePath,
    '--xpath', '/trace-toc/run/data/table[@schema="allocations"]'
  ]);
  return parseAllocationsXML(xml);
}

async function exportLeaks(tracePath: string): Promise<LeaksData> {
  // Use: leaks command on trace file (more reliable than xctrace for leaks)
  // Format: leaks --traceFile=trace.trace --list
  const output = await execCommand([
    'xcrun', 'leaks',
    '--traceFile', tracePath,
    '--list'
  ]);
  return parseLeaksOutput(output);
}
```

### Session Management

```typescript
class TraceSessionManager {
  private sessions = new Map<string, {
    id: string,
    pid: number,
    tracePath: string,
    startTime: Date,
    device: string,
    bundleId: string
  }>();

  async start(options): Promise<SessionInfo> {
    const sessionId = randomUUID();
    const tracePath = `/tmp/instruments-traces/${sessionId}/recording.trace`;

    // Create session directory
    await fs.mkdir(path.dirname(tracePath), { recursive: true });

    // Spawn xctrace as background process
    const process = spawn('xcrun', buildXCTraceCommand({
      ...options,
      output_path: tracePath
    }), {
      detached: true,
      stdio: 'ignore'
    });

    this.sessions.set(sessionId, {
      id: sessionId,
      pid: process.pid!,
      tracePath,
      startTime: new Date(),
      device: options.device_udid,
      bundleId: options.bundle_id
    });

    return {
      session_id: sessionId,
      trace_path: tracePath,
      pid: process.pid!,
      status: 'recording'
    };
  }

  async stop(sessionId: string): Promise<StopResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new InstrumentsError(
        `Session ${sessionId} not found`,
        'SESSION_NOT_FOUND'
      );
    }

    // Send SIGINT to xctrace for graceful shutdown
    process.kill(session.pid, 'SIGINT');

    // Wait for trace file to be written (xctrace needs time to finalize)
    await waitForTraceFile(session.tracePath, 30000);

    const stats = await fs.stat(session.tracePath);
    const duration = (Date.now() - session.startTime.getTime()) / 1000;

    return {
      session_id: sessionId,
      trace_path: session.tracePath,
      duration_seconds: duration,
      file_size_mb: stats.size / (1024 * 1024),
      status: 'completed'
    };
  }

  async analyze(sessionId: string, templates?: string[]): Promise<AnalysisResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new InstrumentsError(
        `Session ${sessionId} not found`,
        'SESSION_NOT_FOUND'
      );
    }

    // Export and parse each template
    const results: AnalysisResult = {
      summary: {
        duration_seconds: 0, // Calculated from trace
        templates_analyzed: templates || ['time', 'allocations', 'leaks'],
        trace_file_size_mb: (await fs.stat(session.tracePath)).size / (1024 * 1024)
      }
    };

    if (!templates || templates.includes('time')) {
      results.time_profiler = await exportTimeProfiler(session.tracePath);
    }

    if (!templates || templates.includes('allocations')) {
      results.allocations = await exportAllocations(session.tracePath);
    }

    if (!templates || templates.includes('leaks')) {
      results.leaks = await exportLeaks(session.tracePath);
    }

    // Clean up session after successful analysis
    this.sessions.delete(sessionId);

    return results;
  }
}
```

## Error Handling

### Error Scenarios

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| **xctrace not available** | Check `xcrun xctrace version` on startup | `InstrumentsError` with hint: "Requires Xcode 12+ Command Line Tools" |
| **Device not booted** | Parse xctrace error "Device not available" | Suggest `simulator_boot` or provide device list |
| **App not installed/running** | xctrace fails with "Failed to launch process" | Suggest `simulator_install_app` or check bundle ID |
| **Profiling session interrupted** | Check PID still alive before stop | Mark session as "failed", clean up partial traces |
| **Trace file too large** (>2GB) | Check file size after stop | Include warning in response, suggest shorter duration |
| **Analysis fails** (corrupt trace) | xctrace export returns non-zero exit code | Return basic file info, suggest manual Instruments.app review |
| **Concurrent sessions on same device** | Track sessions per device | Allow but warn: "Device already being profiled in session X" |

### Error Class

```typescript
export class InstrumentsError extends Error {
  constructor(
    message: string,
    public code:
      | 'XCTRACE_NOT_FOUND'
      | 'DEVICE_NOT_BOOTED'
      | 'APP_NOT_FOUND'
      | 'SESSION_NOT_FOUND'
      | 'TRACE_CORRUPT'
      | 'EXPORT_FAILED',
    public details?: Record<string, unknown>,
    public recovery?: string
  ) {
    super(message);
    this.name = 'InstrumentsError';

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InstrumentsError);
    }
  }
}
```

### Cleanup Strategy

```typescript
// Auto-cleanup old traces
async function cleanupOldTraces(): Promise<void> {
  const traceDir = '/tmp/instruments-traces';

  try {
    const entries = await fs.readdir(traceDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const sessionPath = path.join(traceDir, entry.name);
      const stats = await fs.stat(sessionPath);

      // Delete sessions older than 24 hours
      const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
      if (ageHours > 24) {
        await fs.rm(sessionPath, { recursive: true, force: true });
      }
    }
  } catch (error) {
    // Ignore cleanup errors (directory may not exist yet)
  }
}

// Run cleanup on server startup and every 6 hours
setInterval(cleanupOldTraces, 6 * 60 * 60 * 1000);
```

## Testing Strategy

### Test Coverage Plan (TDD Approach)

**Total: ~65 new tests** following project's 71% coverage standard

#### 1. Schema Tests (`tests/unit/instruments-schemas.test.ts`) - ~15 tests

```typescript
describe('InstrumentsSchemas', () => {
  describe('StartProfilingSchema', () => {
    test('validates required fields: device_udid, bundle_id');
    test('accepts optional templates array');
    test('defaults templates to ["time", "allocations", "leaks"]');
    test('rejects invalid template names');
    test('validates launch_args as string array');
    test('validates env_vars as key-value object');
  });

  describe('StopProfilingSchema', () => {
    test('validates required session_id');
    test('rejects empty session_id');
  });

  describe('AnalyzeTraceSchema', () => {
    test('requires either session_id or trace_path');
    test('validates templates filter array');
    test('rejects both session_id and trace_path missing');
  });
});
```

#### 2. Parser Tests (`tests/unit/instruments-parser.test.ts`) - ~20 tests

```typescript
describe('InstrumentsParser', () => {
  describe('parseTimeProfilerXML', () => {
    test('extracts top symbols from XML export');
    test('calculates self vs total time correctly');
    test('handles empty call tree');
    test('aggregates by symbol name');
    test('returns top 10 sorted by total time');
  });

  describe('parseAllocationsXML', () => {
    test('extracts allocation statistics');
    test('calculates peak memory usage');
    test('groups by allocation category');
    test('handles living vs total allocations');
  });

  describe('parseLeaksOutput', () => {
    test('parses leaks command output format');
    test('extracts leak addresses and sizes');
    test('includes stack traces for each leak');
    test('handles no leaks found');
    test('calculates total leaked bytes');
  });

  describe('buildXCTraceCommand', () => {
    test('constructs basic command with required fields');
    test('includes multiple template flags');
    test('adds launch args when provided');
    test('includes environment variables');
  });
});
```

#### 3. Tool Handler Tests (`tests/unit/instruments-tools.test.ts`) - ~18 tests

```typescript
describe('InstrumentsTools', () => {
  describe('instruments_start_profiling', () => {
    test('creates session with unique ID');
    test('spawns xctrace process');
    test('creates trace directory');
    test('tracks session in manager');
    test('returns session info');
    test('throws when device not found');
  });

  describe('instruments_stop_profiling', () => {
    test('stops active session by ID');
    test('sends SIGINT to xctrace');
    test('waits for trace file completion');
    test('returns duration and file size');
    test('throws when session not found');
    test('handles already-stopped session');
  });

  describe('instruments_analyze_trace', () => {
    test('analyzes trace by session_id');
    test('analyzes trace by file path');
    test('exports and parses all templates');
    test('returns executive summary');
    test('filters by requested templates');
    test('handles corrupt trace files');
    test('cleans up session after analysis');
  });
});
```

#### 4. Session Manager Tests (`tests/unit/instruments-session.test.ts`) - ~12 tests

```typescript
describe('TraceSessionManager', () => {
  test('generates unique session IDs');
  test('tracks multiple concurrent sessions');
  test('prevents duplicate session IDs');
  test('retrieves session by ID');
  test('lists all active sessions');
  test('removes session after stop');
  test('cleans up orphaned sessions on startup');
  test('handles process crash gracefully');
});
```

### TDD Workflow

Following strict RED → GREEN → REFACTOR cycle:

1. **RED:** Write failing schema tests → implement schemas → **GREEN**
2. **RED:** Write failing parser tests → implement parsers → **GREEN**
3. **RED:** Write failing tool tests → implement handlers → **GREEN**
4. **RED:** Write failing session tests → implement manager → **GREEN**
5. **REFACTOR:** Extract common utilities when all tests green

### Mock Strategy

- **Mock** `execCommand()` for xctrace calls (no actual profiling in tests)
- **Mock** filesystem for trace file operations
- **Use fixtures:** XML/text files for parser tests (realistic xctrace output)
- **No mocks** for pure validation (schema tests)

## Integration with Existing Codebase

### 1. Tool Registration

**File:** `src/index.ts`

```typescript
import { instrumentsTools } from './tools/instruments/index.js';

const allTools = [
  ...simulatorTools,
  ...buildTools,
  ...testTools,
  ...environmentTools,
  ...locationTools,
  ...mediaTools,
  ...instrumentsTools,  // Add new category
  // ...
];
```

### 2. Update Documentation

**README.md changes:**
- Update tool count: "23 tools" → "26 tools"
- Move "Performance profiling with Instruments" from "Coming Soon" to "Available Features"
- Add new section under Available Tools

**New README section:**

```markdown
✅ **Performance Profiling** (3 tools)
- `instruments_start_profiling` - Start profiling session with Time Profiler, Allocations, and Leaks
- `instruments_stop_profiling` - Stop profiling and save trace file
- `instruments_analyze_trace` - Analyze trace with executive summary and top issues

**Requirements:** Xcode 12+ Command Line Tools (includes xctrace)

**Example Workflow:**

1. Start profiling session
```json
{
  "device_udid": "ABCD-1234-5678",
  "bundle_id": "com.example.MyApp"
}
→ Returns: { "session_id": "xyz789", "status": "recording" }
```

2. Exercise the app (manual or automated testing)

3. Stop profiling
```json
{ "session_id": "xyz789" }
→ Returns: { "duration_seconds": 42.5, "file_size_mb": 156.3 }
```

4. Analyze results
```json
{ "session_id": "xyz789" }
→ Returns: Executive summary with:
  - Top CPU hotspots (e.g., NetworkManager.parseJSON: 3.2s)
  - Memory allocations (e.g., ImageCache: 34.1 MB peak)
  - Memory leaks (e.g., 2 leaks, 128 KB total)
```
```

**CLAUDE.md updates:**

Add section under "Working with MCP Tools":

```markdown
### Profiling with Instruments

**Tool Pattern:**
1. Start session with `instruments_start_profiling`
2. Exercise app scenario (UI interaction, load testing, etc.)
3. Stop session with `instruments_stop_profiling`
4. Analyze with `instruments_analyze_trace`

**What Gets Profiled:**
- **Time Profiler**: CPU usage, hot functions, call stacks
- **Allocations**: Memory usage, allocation categories, peaks
- **Leaks**: Memory leaks with stack traces

**Best Practices:**
- Profile release builds for accurate performance data
- Keep sessions under 2 minutes for manageable trace sizes
- Use specific scenarios (e.g., "scroll feed 10 times")
- Analyze immediately after stopping (auto-cleanup after 24h)

**Common Workflows:**

1. **Find CPU bottleneck:**
   - Start profiling → reproduce slow operation → stop → analyze
   - Look at `time_profiler.top_10_symbols` for hotspots

2. **Debug memory growth:**
   - Start profiling → exercise feature → stop → analyze
   - Check `allocations.peak_memory_mb` and top allocations

3. **Find memory leaks:**
   - Start profiling → navigate app → stop → analyze
   - Review `leaks.leaks` array for leak sources
```

### 3. Dependencies

**No new dependencies** - uses built-in macOS tools:
- `xcrun xctrace` (included with Xcode Command Line Tools)
- `xcrun leaks` (included with Xcode Command Line Tools)

### 4. Version Bump

- **package.json:** `0.4.0` → `0.5.0` (new feature category)
- **src/index.ts:** Update version in server config
- **Git tag:** `v0.5.0`

## Commit Strategy Reference

**Note:** User will execute these commands manually (not auto-committed)

```bash
# After implementation is complete:

# Commit 1: feat
git add src/schemas/instruments.ts src/shared/instruments.ts src/tools/instruments/
git commit -m "feat: add Instruments profiling with Time Profiler, Allocations, and Leaks"

# Commit 2: test
git add tests/unit/instruments-*.test.ts
git commit -m "test: add 65 unit tests for Instruments profiling tools"

# Commit 3: docs
git add README.md CLAUDE.md
git commit -m "docs: document Instruments profiling tools and workflows"

# Commit 4: chore
git add package.json src/index.ts
git commit -m "chore: bump version to 0.5.0 for Instruments profiling release"
```

## Implementation Checklist

### Phase 1: Foundation (TDD)
- [ ] Write schema tests (15 tests)
- [ ] Implement `src/schemas/instruments.ts`
- [ ] All schema tests pass

### Phase 2: Parsing (TDD)
- [ ] Write parser tests with fixtures (20 tests)
- [ ] Implement `src/shared/instruments.ts` (command builder)
- [ ] Implement parsers (Time Profiler, Allocations, Leaks)
- [ ] All parser tests pass

### Phase 3: Session Management (TDD)
- [ ] Write session manager tests (12 tests)
- [ ] Implement `TraceSessionManager` class
- [ ] Implement cleanup utilities
- [ ] All session tests pass

### Phase 4: Tool Handlers (TDD)
- [ ] Write tool handler tests (18 tests)
- [ ] Implement `src/tools/instruments/start.ts`
- [ ] Implement `src/tools/instruments/stop.ts`
- [ ] Implement `src/tools/instruments/analyze.ts`
- [ ] Implement `src/tools/instruments/index.ts` (registration)
- [ ] All tool tests pass

### Phase 5: Integration
- [ ] Register tools in `src/index.ts`
- [ ] Update README.md (tool count, new section)
- [ ] Update CLAUDE.md (workflows, best practices)
- [ ] Bump version to 0.5.0
- [ ] Verify full test suite passes (34 + 65 = 99 tests)
- [ ] Manual testing with real Xcode project

### Phase 6: Validation
- [ ] Test on multiple Xcode versions (12+)
- [ ] Test with various app types (SwiftUI, UIKit)
- [ ] Test error scenarios (device not booted, app not found, etc.)
- [ ] Verify trace cleanup after 24 hours
- [ ] Verify concurrent session handling

## Success Criteria

1. ✅ All 65 new tests pass (100% of new code)
2. ✅ Overall test coverage remains >70%
3. ✅ Tools work on Xcode 12, 13, 14, 15, 16
4. ✅ Executive summary provides actionable insights
5. ✅ Session cleanup prevents disk bloat
6. ✅ Error messages guide users to solutions
7. ✅ Documentation enables Claude to use tools effectively

## Future Enhancements (Out of Scope)

- Additional Instruments templates (Network, Energy, File Activity)
- Custom profiling duration in `start_profiling`
- Trace comparison (before/after optimization)
- Integration with CI/CD for automated regression detection
- Real device profiling (requires device connection handling)

---

**Approved by:** User
**Implementation Start:** 2026-01-18
**Target Completion:** TBD (solo developer, incremental progress)
