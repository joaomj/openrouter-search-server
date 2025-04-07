import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type CallToolRequest, // Import the type for the request parameter
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface SearchParams {
  query: string;
}

// Define Tool Input Schema according to MCP SDK v1.8+
const WebSearchInputSchema = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: 'Search query'
    }
  },
  required: ['query']
} as const; // Use 'as const' for stricter typing if needed

// Define Tool Output Schema (optional but good practice)
const WebSearchOutputSchema = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          link: { type: 'string' },
          snippet: { type: 'string' }
        },
        required: ['title', 'link', 'snippet']
      }
    }
  },
  required: ['results']
} as const;

// Type guard for validating input arguments
const isValidSearchArgs = (args: any): args is { query: string } =>
  typeof args === 'object' && args !== null && typeof args.query === 'string';


// Initialize Server
const server = new Server(
  { name: 'openrouter-search-server', version: '1.0.0' },
  { capabilities: { resources: {}, tools: {} } }
);

// --- Tool Listing Handler ---
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'web_search',
      description: 'Perform a web search using OpenRouter API and Google Gemini Pro',
      inputSchema: WebSearchInputSchema,
      // outputSchema: WebSearchOutputSchema // Optional
    },
  ],
}));

// --- Tool Call Handler ---
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  if (request.params.name !== 'web_search') {
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
  }

  if (!isValidSearchArgs(request.params.arguments)) {
    throw new McpError(ErrorCode.InvalidParams, 'Invalid input: query parameter is missing or not a string.');
  }

  const { query } = request.params.arguments;

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new McpError(ErrorCode.InternalError, 'OPENROUTER_API_KEY environment variable is not set.');
    }

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'google/gemini-2.5-pro-exp-03-25:free:online', // Updated model name
        messages: [{
          role: 'user',
          content: query
        }]
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          // Recommended headers by OpenRouter
          'HTTP-Referer': 'http://localhost', // Replace with your actual site URL or app name
          'X-Title': 'MCP OpenRouter Search', // Replace with your app name
        },
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        console.error('Unexpected API response structure:', response.data);
        throw new McpError(ErrorCode.InternalError, 'Unexpected response format from OpenRouter API');
      }

      const rawContent: string = response.data.choices[0].message.content;

      // Return the raw content directly as the result
      return {
        content: [{ type: 'text', text: rawContent }],
      };

    } catch (error: any) {
      console.error('Search error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
      // Use McpError for structured errors
      throw new McpError(ErrorCode.InternalError, `Failed to perform search: ${errorMessage}`);
      // Note: Returning error content directly is also possible but McpError is preferred
      // return { content: [{ type: 'text', text: `Failed to perform search: ${errorMessage}` }], isError: true };
    }
  }
);

// --- Server Startup ---
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OpenRouter Search MCP server running on stdio'); // Log to stderr
}

run().catch(console.error);
