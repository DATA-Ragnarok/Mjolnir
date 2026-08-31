import { Router } from 'express';
import { getApiKey, generateApiKey } from '../controllers/ApiKeyController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getApiKey);
router.post('/', generateApiKey);

export default router;
