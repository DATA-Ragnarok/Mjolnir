import { Router } from 'express';
import {
  startDeviceAuth,
  pollToken,
  lookupCode,
  approveCode,
  denyCode,
  revokeCurrentToken,
  listSessions,
  revokeSession,
} from '../controllers/AgentAuthController.js';
import { authMiddleware } from '../middleware/auth.js';
import { agentAuthMiddleware } from '../middleware/agentAuth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();
const publicLimiter = rateLimit(120, 60 * 1000);

// Public (agent, before it has a token)
router.post('/device', publicLimiter, startDeviceAuth);
router.post('/token', publicLimiter, pollToken);

// Agent token
router.post('/revoke', agentAuthMiddleware, revokeCurrentToken);

// Web user (browser session JWT)
router.get('/lookup', authMiddleware, rateLimit(30, 60 * 1000), lookupCode);
router.post('/approve', authMiddleware, rateLimit(30, 60 * 1000), approveCode);
router.post('/deny', authMiddleware, denyCode);
router.get('/sessions', authMiddleware, listSessions);
router.delete('/sessions/:id', authMiddleware, revokeSession);

export default router;
