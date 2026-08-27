import { Router } from 'express';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from '../controllers/ApiKeyController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All key management routes require user authentication
router.use(authMiddleware);

router.post('/', createApiKey);
router.get('/', listApiKeys);
router.delete('/:id', revokeApiKey);

export default router;
