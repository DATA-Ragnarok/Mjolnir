import { Router, Request, Response } from 'express';
import cors from 'cors';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServerService } from '../services/McpServerService.js';

const router = Router();

// Enable permissive CORS for all MCP endpoints so Gemini Web & Claude Web can connect from any origin
router.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'Accept', 'Cache-Control', 'X-Requested-With', 'X-Accel-Buffering'],
  })
);

// Map of active SSE transports by sessionId
const transports = new Map<string, SSEServerTransport>();

// Streamable HTTP transport instance
let streamableTransport: StreamableHTTPServerTransport | null = null;

const getStreamableTransport = async (apiKey?: string | null) => {
  if (!streamableTransport) {
    streamableTransport = new StreamableHTTPServerTransport();
    const server = McpServerService.createServer(apiKey);
    await server.connect(streamableTransport);
  }
  return streamableTransport;
};

const extractApiKey = (req: Request): string | null => {
  const xApiKey = req.headers['x-api-key'];
  if (xApiKey && typeof xApiKey === 'string') return xApiKey;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.split(' ')[1];

  const queryKey = req.query['apiKey'] || req.query['key'] || req.query['token'];
  if (queryKey && typeof queryKey === 'string') return queryKey;

  return null;
};

const getAbsoluteMessageEndpoint = (req: Request): string => {
  const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'mjolnir-dev-server.onrender.com';
  return `${protocol}://${host}/api/mcp/messages`;
};

// SSE Handler (for traditional SSE MCP clients)
const handleSseConnection = async (req: Request, res: Response) => {
  const apiKey = extractApiKey(req);
  const server = McpServerService.createServer(apiKey);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const messageEndpoint = getAbsoluteMessageEndpoint(req);
  const transport = new SSEServerTransport(messageEndpoint, res);

  transports.set(transport.sessionId, transport);

  transport.onclose = () => {
    transports.delete(transport.sessionId);
  };

  req.on('close', () => {
    transports.delete(transport.sessionId);
  });

  await server.connect(transport);
};

// Streamable HTTP / JSON-RPC Handler
const handleJsonRpcOrStreamable = async (req: Request, res: Response) => {
  const apiKey = extractApiKey(req);
  const transport = await getStreamableTransport(apiKey);
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: err.message } });
    }
  }
};

// GET endpoints
router.get(['/sse', '/api/mcp/sse'], handleSseConnection);

router.get(['/', '/mcp', '/api/mcp'], (req: Request, res: Response) => {
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('text/event-stream')) {
    return handleSseConnection(req, res);
  }

  const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'mjolnir-dev-server.onrender.com';
  const baseUrl = `${protocol}://${host}`;

  res.json({
    name: 'Mjolnir Remote MCP Server',
    status: 'online',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    transports: ['sse', 'streamable-http'],
    endpoints: {
      sse: `${baseUrl}/api/mcp/sse`,
      messages: `${baseUrl}/api/mcp/messages`,
      streamable: `${baseUrl}/api/mcp`,
    },
    tools: [
      'mjolnir_list_epics',
      'mjolnir_list_features',
      'mjolnir_list_tasks',
      'mjolnir_list_sprints',
      'mjolnir_list_users',
      'mjolnir_get_current_user',
      'mjolnir_create_task',
      'mjolnir_update_task_status',
    ],
  });
});

// POST endpoints: handles SSE session messages, Streamable HTTP, and JSON-RPC
router.post(['/messages', '/api/mcp/messages'], async (req: Request, res: Response) => {
  const sessionId = req.query['sessionId'] as string;

  if (sessionId) {
    const transport = transports.get(sessionId);
    if (transport) {
      try {
        await transport.handlePostMessage(req, res, req.body);
        return;
      } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Failed to process MCP message' });
      }
    }
  }

  // Fallback to Streamable HTTP transport
  return handleJsonRpcOrStreamable(req, res);
});

// POST to root/mcp/sse: Handles direct JSON-RPC / Streamable HTTP from Gemini or other MCP clients
router.post(['/', '/mcp', '/api/mcp', '/sse', '/api/mcp/sse'], (req: Request, res: Response) => {
  const sessionId = req.query['sessionId'] as string;
  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    return transport.handlePostMessage(req, res, req.body);
  }
  return handleJsonRpcOrStreamable(req, res);
});

export default router;
