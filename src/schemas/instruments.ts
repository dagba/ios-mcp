/**
 * Zod schemas for Instruments profiling tool inputs
 */

import { z } from 'zod';

/**
 * Valid Instruments template types
 */
const TemplateType = z.enum(['time', 'allocations', 'leaks'], {
  message: 'Template must be one of: time, allocations, leaks'
});

/**
 * Schema for starting a profiling session
 */
export const StartProfilingSchema = z.object({
  device_udid: z
    .string()
    .min(1)
    .describe('iOS simulator UDID'),
  bundle_id: z
    .string()
    .min(1)
    .describe('App bundle identifier (e.g., com.example.MyApp)'),
  templates: z
    .array(TemplateType)
    .min(1, 'At least one template must be specified')
    .optional()
    .default(['time', 'allocations', 'leaks'])
    .describe('Profiling templates to use'),
  launch_args: z
    .array(z.string())
    .optional()
    .describe('Optional app launch arguments'),
  env_vars: z
    .record(z.string(), z.string())
    .optional()
    .describe('Optional environment variables')
});

/**
 * Schema for stopping a profiling session
 */
export const StopProfilingSchema = z.object({
  session_id: z
    .string()
    .min(1, 'session_id cannot be empty')
    .describe('Session ID from start_profiling')
});

/**
 * Schema for analyzing a trace file
 */
export const AnalyzeTraceSchema = z
  .object({
    session_id: z
      .string()
      .optional()
      .describe('Session ID from start_profiling'),
    trace_path: z
      .string()
      .optional()
      .describe('Path to existing .trace file'),
    templates: z
      .array(TemplateType)
      .min(1, 'At least one template must be specified')
      .optional()
      .describe('Which templates to analyze (default: all)')
  })
  .refine((data) => data.session_id || data.trace_path, {
    message: 'Either session_id or trace_path must be provided'
  });

/**
 * Inferred TypeScript types from schemas
 */
export type StartProfilingInput = z.infer<typeof StartProfilingSchema>;
export type StopProfilingInput = z.infer<typeof StopProfilingSchema>;
export type AnalyzeTraceInput = z.infer<typeof AnalyzeTraceSchema>;
