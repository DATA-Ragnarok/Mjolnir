import { Router, Request, Response } from 'express';
import cors from 'cors';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { McpServerService } from '../services/McpServerService.js';

const router = Router();

// Enable permissive CORS for all MCP endpoints so Gemini Web & Claude Web can connect from any origin
router.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'Accept', 'Cache-Control'],
  })
);

// Map of active SSE transports by sessionId
const transports = new Map<string, SSEServerTransport>();

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

// SSE Handler
const handleSseConnection = async (req: Request, res: Response) => {
  const apiKey = extractApiKey(req);
  const server = McpServerService.createServer(apiKey);

  // Set SSE response headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx / Cloudflare)
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Provide full absolute endpoint URL for external cloud clients (Gemini Web, Claude Web)
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

// GET /api/mcp/sse
router.get('/sse', handleSseConnection);

// GET /api/mcp (handles both SSE connection and browser probe)
router.get('/', (req: Request, res: Response) => {
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('text/event-stream')) {
    return handleSseConnection(req, res);
  }

  // Return MCP server descriptor for discovery
  const baseUrl = `${(req.headers['x-forwarded-proto'] as string) || req.protocol || 'https'}://${(req.headers['x-forwarded-host'] as string) || req.get('host') || 'mjolnir-dev-server.onrender.com'}`;
  res.json({
    name: 'Mjolnir Remote MCP Server',
    status: 'online',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    transport: 'sse',
    endpoints: {
      sse: `${baseUrl}/api/mcp/sse`,
      messages: `${baseUrl}/api/mcp/messages`,
    },
    tools: [
      'mjolnir_list_epics',
      'mjolnir_list_features',
      'mjolnir_list_tasks',
      'mjolnir_create_task',
      'mjolnir_update_task_status',
    ],
  });
});

// POST /api/mcp/messages
router.post('/messages', async (req: Request, res: Response) => {
  const sessionId = req.query['sessionId'] as string;

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId query parameter' });
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }

  try {
    await transport.handlePostMessage(req, res, req.body);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to process MCP message' });
  }
});

export default router;
