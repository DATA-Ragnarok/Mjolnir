import { Router, Request, Response } from 'express';
import { agentAuthMiddleware } from '../middleware/agentAuth.js';
import { McpServerService } from '../services/McpServerService.js';
import { User as UserType } from '../models/User.js';

const router = Router();

// Apply auth middleware to all MCP endpoints
router.use(agentAuthMiddleware);

const handleSse = (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*'
  });

  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  const user = req.user as UserType;
  const sessionId = McpServerService.createSession(res, user);

  // Send the endpoint event per MCP SSE protocol
  res.write(`event: endpoint\ndata: /api/mcp/messages?sessionId=${sessionId}\n\n`);

  req.on('close', () => {
    McpServerService.removeSession(sessionId);
  });
};

const handleMessages = async (req: Request, res: Response) => {
  const sessionId = (req.query['sessionId'] || req.headers['x-session-id'] || req.body?.sessionId) as string | undefined;
  const user = req.user as UserType;

  try {
    const body = req.body;
    if (Array.isArray(body)) {
      const responses = await Promise.all(
        body.map((item) => McpServerService.handleJsonRpc(item, user, sessionId))
      );
      const filtered = responses.filter(Boolean);
      if (sessionId) {
        for (const item of filtered) {
          McpServerService.sendSseEvent(sessionId, 'message', item);
        }
      }
      return res.json(filtered);
    }

    const rpcResponse = await McpServerService.handleJsonRpc(body, user, sessionId);

    if (rpcResponse === null) {
      // Notification
      return res.status(202).json({ status: 'acknowledged' });
    }

    if (sessionId) {
      McpServerService.sendSseEvent(sessionId, 'message', rpcResponse);
    }

    return res.json(rpcResponse);
  } catch (error: any) {
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id ?? null,
      error: { code: -32000, message: error.message || 'Internal error' }
    });
  }
};

// Support GET for SSE connection on /sse and root /
router.get('/sse', handleSse);
router.get('/', handleSse);

// Support POST for JSON-RPC messages on /messages, /sse, and root /
router.post('/messages', handleMessages);
router.post('/sse', handleMessages);
router.post('/', handleMessages);

export default router;
