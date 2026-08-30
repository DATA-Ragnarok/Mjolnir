import { Router } from 'express';
import { ApiKeyController } from '../controllers/ApiKeyController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', ApiKeyController.getApiKey);
router.post('/', ApiKeyController.generateApiKey);

export default router;
