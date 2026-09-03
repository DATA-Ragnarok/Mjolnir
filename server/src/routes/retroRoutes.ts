import { Router } from 'express';
import {
  createRetroNote,
  deleteRetroNote,
  getRetroActionItems,
  getRetroBootstrap,
  getRetroNotes,
  getRetroSessionData,
  getRetroStats,
  saveRetroActionItems,
  updateRetroNote,
} from '../controllers/RetroController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/bootstrap', getRetroBootstrap);

router.get('/notes', getRetroNotes);
router.post('/notes', createRetroNote);
router.put('/notes/:id', updateRetroNote);
router.delete('/notes/:id', deleteRetroNote);

router.get('/action-items', getRetroActionItems);
router.put('/action-items/:sprintId', saveRetroActionItems);

router.get('/session/:sprintId', getRetroSessionData);
router.get('/stats/:sprintId', getRetroStats);

export default router;
