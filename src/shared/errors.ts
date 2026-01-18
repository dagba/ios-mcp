/**
 * Error handling system for iOS Dev MCP Server
 * Provides structured error responses compatible with MCP tool format
 */

import type { ToolResult } from './types.js';

/**
 * Base error class for all MCP tool errors
 * Provides toToolResult() method for consistent error formatting
 */
export class MCPToolError extends Error {
  code: string;
  details?: Record<string, any>;
  recovery?: string;

  constructor(
    message: string,
    options?: {
      code?: string;
      details?: Record<string, any>;
      recovery?: string;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = options?.code || 'UNKNOWN_ERROR';
    this.details = options?.details;
    this.recovery = options?.recovery;

    if (options?.cause) {
      this.cause = options.cause;
    }

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to MCP ToolResult format
   */
  toToolResult(): ToolResult {
    const errorText = [
      `Error: ${this.message}`,
      this.code !== 'UNKNOWN_ERROR' ? `Code: ${this.code}` : '',
      this.recovery ? `\nSuggestion: ${this.recovery}` : '',
      this.details ? `\nDetails: ${JSON.stringify(this.details, null, 2)}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: errorText
        }
      ],
      isError: true
    };
  }
}

/**
 * Command execution errors (execa failures, timeout, etc.)
 */
export class ExecutorError extends MCPToolError {
  constructor(message: string, command: string, cause?: unknown) {
    super(message, {
      code: 'EXECUTOR_ERROR',
      details: { command },
      recovery: 'Check that the command is valid and accessible',
      cause
    });
  }
}

/**
 * iOS Simulator related errors
 */
export class SimulatorError extends MCPToolError {
  constructor(message: string, options?: {
    code?: string;
    details?: Record<string, any>;
    recovery?: string;
  }) {
    super(message, {
      code: options?.code || 'SIMULATOR_ERROR',
      details: options?.details,
      recovery: options?.recovery || 'Check simulator status with simulator_list_devices'
    });
  }
}

/**
 * Build/xcodebuild related errors
 */
export class BuildError extends MCPToolError {
  constructor(message: string, options?: {
    code?: string;
    details?: Record<string, any>;
    recovery?: string;
  }) {
    super(message, {
      code: options?.code || 'BUILD_ERROR',
      details: options?.details,
      recovery: options?.recovery || 'Check build logs for detailed error information'
    });
  }
}

/**
 * Test execution errors
 */
export class TestError extends MCPToolError {
  constructor(message: string, options?: {
    code?: string;
    details?: Record<string, any>;
    recovery?: string;
  }) {
    super(message, {
      code: options?.code || 'TEST_ERROR',
      details: options?.details,
      recovery: options?.recovery || 'Check test logs for failure details'
    });
  }
}

/**
 * Xcode project manipulation errors
 */
export class ProjectError extends MCPToolError {
  constructor(message: string, options?: {
    code?: string;
    details?: Record<string, any>;
    recovery?: string;
  }) {
    super(message, {
      code: options?.code || 'PROJECT_ERROR',
      details: options?.details,
      recovery: options?.recovery || 'Verify project structure and permissions'
    });
  }
}

/**
 * Swift Package Manager errors
 */
export class SPMError extends MCPToolError {
  constructor(message: string, options?: {
    code?: string;
    details?: Record<string, any>;
    recovery?: string;
  }) {
    super(message, {
      code: options?.code || 'SPM_ERROR',
      details: options?.details,
      recovery: options?.recovery || 'Try running spm_resolve_packages or spm_reset_cache'
    });
  }
}

/**
 * Validation errors (invalid parameters, etc.)
 */
export class ValidationError extends MCPToolError {
  constructor(message: string, field?: string) {
    super(message, {
      code: 'VALIDATION_ERROR',
      details: field ? { field } : undefined,
      recovery: 'Check parameter values and types'
    });
  }
}
