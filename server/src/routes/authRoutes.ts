import { Router } from 'express';
import { googleAuth, getCurrentUser, logout } from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/google', googleAuth);
router.get('/me', authMiddleware, getCurrentUser);
router.post('/logout', authMiddleware, logout);

export default router;
