#!/usr/bin/env node

/**
 * iOS Development MCP Server
 * Provides comprehensive iOS simulator control and Swift/Xcode development tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import type { ToolDefinition } from './shared/types.js';
import { MCPToolError } from './shared/errors.js';

// Tool registration functions will be imported here as modules are implemented
import { registerSimulatorTools } from './tools/simulator/index.js';
import { registerBuildTools } from './tools/build/index.js';
import { registerTestTools } from './tools/test/index.js';
import { registerEnvironmentTools } from './tools/environment/index.js';
import { registerLocationTools } from './tools/location/index.js';
import { registerMediaTools } from './tools/media/index.js';
import { registerUtilityTools } from './tools/utilities/index.js';
import { registerInstrumentsTools } from './tools/instruments/index.js';
// import { registerProjectTools } from './tools/project/index.js';
// import { registerSPMTools } from './tools/spm/index.js';

/**
 * Create and configure the MCP server
 */
const server = new Server(
  {
    name: 'ios-dev-mcp-server',
    version: '0.5.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

/**
 * Global tool registry
 * Maps tool name to tool definition (schema, handler, etc.)
 */
const toolRegistry = new Map<string, ToolDefinition>();

/**
 * Register all tools
 * This will be called during server initialization
 */
function registerAllTools(): void {
  // Clear registry
  toolRegistry.clear();

  // Register tool modules as they are implemented
  registerSimulatorTools(toolRegistry);
  registerBuildTools(toolRegistry);
  registerTestTools(toolRegistry);
  registerEnvironmentTools(toolRegistry);
  registerLocationTools(toolRegistry);
  registerMediaTools(toolRegistry);
  registerUtilityTools(toolRegistry);
  registerInstrumentsTools(toolRegistry);
  // registerProjectTools(toolRegistry);
  // registerSPMTools(toolRegistry);

  console.error(`Registered ${toolRegistry.size} tools`);
}

/**
 * Handle tool listing requests
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = Array.from(toolRegistry.values()).map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  }));

  return { tools };
});

/**
 * Handle tool execution requests
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Get tool from registry
  const tool = toolRegistry.get(name);

  if (!tool) {
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${name}`
    );
  }

  try {
    // Validate arguments using Zod schema
    const validatedArgs = tool.schema.parse(args ?? {});

    // Execute tool handler
    const result = await tool.handler(validatedArgs);

    // Return in proper MCP format
    return {
      content: result.content,
      isError: result.isError
    };
  } catch (error) {
    // Handle MCP tool errors
    if (error instanceof MCPToolError) {
      const toolResult = error.toToolResult();
      return {
        content: toolResult.content,
        isError: true
      };
    }

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      return {
        content: [
          {
            type: 'text',
            text: `Validation error: ${JSON.stringify(error, null, 2)}`
          }
        ],
        isError: true
      };
    }

    // Handle unexpected errors
    console.error(`Error executing tool ${name}:`, error);

    return {
      content: [
        {
          type: 'text',
          text: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});

/**
 * Main server initialization
 */
async function main(): Promise<void> {
  // Check if running on macOS
  if (process.platform !== 'darwin') {
    console.error('Error: iOS Development MCP Server requires macOS');
    process.exit(1);
  }

  // Register all tools
  registerAllTools();

  // Create stdio transport
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  // Log server start (to stderr so it doesn't interfere with stdio communication)
  console.error('iOS Dev MCP Server running on stdio');
  console.error(`Platform: ${process.platform} ${process.arch}`);
  console.error(`Node: ${process.version}`);
}

/**
 * Start the server
 */
main().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});
