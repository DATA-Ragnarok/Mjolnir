import { Router } from 'express';
import { googleAuth, getCurrentUser } from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/google', googleAuth);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
