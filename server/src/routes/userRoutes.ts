import { Router } from 'express';
import { getApprovedUsers } from '../controllers/UserController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/approved', getApprovedUsers);

export default router;
