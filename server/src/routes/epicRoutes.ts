import { Router } from 'express';
import { getAllEpics, createEpic, updateEpic, deleteEpic } from '../controllers/EpicController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllEpics);
router.post('/', createEpic);
router.put('/:id', updateEpic);
router.delete('/:id', deleteEpic);

export default router;
