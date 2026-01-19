/**
 * Instruments profiling utilities for command building and parsing
 */

/**
 * Template mapping from short names to full Instruments template names
 */
const TEMPLATE_MAPPING: Record<string, string> = {
  time: 'Time Profiler',
  allocations: 'Allocations',
  leaks: 'Leaks'
};

/**
 * Build xctrace record command
 */
export function buildXCTraceCommand(options: {
  device_udid: string;
  bundle_id: string;
  templates: string[];
  output_path: string;
  launch_args?: string[];
  env_vars?: Record<string, string>;
}): string[] {
  const args: string[] = [
    'xcrun',
    'xctrace',
    'record',
    '--device',
    options.device_udid,
    '--launch',
    options.bundle_id
  ];

  // Add templates
  for (const template of options.templates) {
    const fullTemplateName = TEMPLATE_MAPPING[template] || template;
    args.push('--template', fullTemplateName);
  }

  // Add output path
  args.push('--output', options.output_path);

  // Stream app output
  args.push('--target-stdout', '-');

  // Add launch arguments
  if (options.launch_args) {
    for (const arg of options.launch_args) {
      args.push('--launch-arg', arg);
    }
  }

  // Add environment variables
  if (options.env_vars) {
    for (const [key, value] of Object.entries(options.env_vars)) {
      args.push('--env', `${key}=${value}`);
    }
  }

  return args;
}

/**
 * Time Profiler data structure
 */
export interface TimeProfilerData {
  total_cpu_time_ms: number;
  heaviest_stack_trace: string;
  top_10_symbols: Array<{
    symbol: string;
    self_time_ms: number;
    total_time_ms: number;
    percentage: number;
  }>;
}

/**
 * Parse Time Profiler XML export
 */
export function parseTimeProfilerXML(xml: string): TimeProfilerData {
  const symbols: Array<{
    symbol: string;
    self_time_ms: number;
    total_time_ms: number;
  }> = [];

  // Extract rows from XML (simple regex-based parsing)
  const rowRegex = /<row>([\s\S]*?)<\/row>/g;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const rowContent = rowMatch[1];

    const symbolMatch = /<symbol>(.*?)<\/symbol>/.exec(rowContent);
    const selfTimeMatch = /<self-time>(.*?)<\/self-time>/.exec(rowContent);
    const totalTimeMatch = /<total-time>(.*?)<\/total-time>/.exec(rowContent);

    if (symbolMatch && selfTimeMatch && totalTimeMatch) {
      symbols.push({
        symbol: symbolMatch[1],
        self_time_ms: parseFloat(selfTimeMatch[1]),
        total_time_ms: parseFloat(totalTimeMatch[1])
      });
    }
  }

  // Calculate total CPU time
  const total_cpu_time_ms = symbols.reduce(
    (sum, s) => sum + s.total_time_ms,
    0
  );

  // Sort by total time descending
  symbols.sort((a, b) => b.total_time_ms - a.total_time_ms);

  // Take top 10 and calculate percentages
  const top_10_symbols = symbols.slice(0, 10).map((s) => ({
    symbol: s.symbol,
    self_time_ms: s.self_time_ms,
    total_time_ms: s.total_time_ms,
    percentage: total_cpu_time_ms > 0 ? (s.total_time_ms / total_cpu_time_ms) * 100 : 0
  }));

  return {
    total_cpu_time_ms,
    heaviest_stack_trace: top_10_symbols.length > 0 ? top_10_symbols[0].symbol : '',
    top_10_symbols
  };
}

/**
 * Allocations data structure
 */
export interface AllocationsData {
  peak_memory_mb: number;
  total_allocations: number;
  living_allocations: number;
  top_10_allocations: Array<{
    category: string;
    size_mb: number;
    count: number;
    percentage: number;
  }>;
}

/**
 * Parse Allocations XML export
 */
export function parseAllocationsXML(xml: string): AllocationsData {
  const allocations: Array<{
    category: string;
    size_bytes: number;
    count: number;
  }> = [];

  // Extract rows from XML
  const rowRegex = /<row>([\s\S]*?)<\/row>/g;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const rowContent = rowMatch[1];

    const categoryMatch = /<category>(.*?)<\/category>/.exec(rowContent);
    const sizeMatch = /<size>(.*?)<\/size>/.exec(rowContent);
    const countMatch = /<count>(.*?)<\/count>/.exec(rowContent);

    if (categoryMatch && sizeMatch && countMatch) {
      allocations.push({
        category: categoryMatch[1],
        size_bytes: parseInt(sizeMatch[1], 10),
        count: parseInt(countMatch[1], 10)
      });
    }
  }

  // Calculate totals
  const total_size_bytes = allocations.reduce((sum, a) => sum + a.size_bytes, 0);
  const total_allocations = allocations.reduce((sum, a) => sum + a.count, 0);

  // Sort by size descending
  allocations.sort((a, b) => b.size_bytes - a.size_bytes);

  // Take top 10 and convert to MB with percentages
  const top_10_allocations = allocations.slice(0, 10).map((a) => ({
    category: a.category,
    size_mb: a.size_bytes / (1024 * 1024),
    count: a.count,
    percentage: total_size_bytes > 0 ? (a.size_bytes / total_size_bytes) * 100 : 0
  }));

  return {
    peak_memory_mb: total_size_bytes / (1024 * 1024),
    total_allocations,
    living_allocations: total_allocations, // Simplified - actual value would come from trace data
    top_10_allocations
  };
}

/**
 * Leaks data structure
 */
export interface LeaksData {
  total_leaked_mb: number;
  leak_count: number;
  leaks: Array<{
    address: string;
    size_bytes: number;
    type: string;
    stack_trace: string;
  }>;
}

/**
 * Parse leaks command output
 */
export function parseLeaksOutput(output: string): LeaksData {
  const leaks: Array<{
    address: string;
    size_bytes: number;
    type: string;
    stack_trace: string;
  }> = [];

  // Extract leak count and total from header
  const headerMatch = /Process \d+: (\d+) leaks? for (\d+) total leaked bytes/.exec(output);
  const leak_count = headerMatch ? parseInt(headerMatch[1], 10) : 0;
  const total_leaked_bytes = headerMatch ? parseInt(headerMatch[2], 10) : 0;

  if (leak_count === 0) {
    return {
      total_leaked_mb: 0,
      leak_count: 0,
      leaks: []
    };
  }

  // Extract individual leaks
  const leakRegex = /Leak: (0x[0-9a-fA-F]+)\s+size=(\d+)[\s\S]*?\n\s+(.*?)\s+Malloc[\s\S]*?Call stack:([\s\S]*?)(?=\n\nLeak:|$)/g;
  let leakMatch;

  while ((leakMatch = leakRegex.exec(output)) !== null) {
    leaks.push({
      address: leakMatch[1],
      size_bytes: parseInt(leakMatch[2], 10),
      type: leakMatch[3].trim(),
      stack_trace: leakMatch[4].trim()
    });
  }

  return {
    total_leaked_mb: total_leaked_bytes / (1024 * 1024),
    leak_count,
    leaks
  };
}

/**
 * Session information
 */
export interface SessionInfo {
  session_id: string;
  trace_path: string;
  pid: number;
  status: 'recording' | 'completed';
}

/**
 * Stop result
 */
export interface StopResult {
  session_id: string;
  trace_path: string;
  duration_seconds: number;
  file_size_mb: number;
  status: 'completed';
}

/**
 * Trace session manager for tracking active profiling sessions
 */
export class TraceSessionManager {
  private sessions: Map<string, SessionInfo> = new Map();

  /**
   * Generate a unique session ID
   */
  createSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Register a new profiling session
   */
  registerSession(sessionInfo: SessionInfo): void {
    this.sessions.set(sessionInfo.session_id, sessionInfo);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SessionInfo | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): SessionInfo[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Remove session from tracking
   */
  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Check if session exists
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Get number of active sessions
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.sessions.clear();
  }

  /**
   * Get trace path for a session ID
   */
  getTracePath(sessionId: string): string {
    return `/tmp/instruments-traces/${sessionId}/recording.trace`;
  }
}
