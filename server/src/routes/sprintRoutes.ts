import { Router } from 'express';
import { getAllSprints, createSprint, updateSprint, deleteSprint, triggerSprintMigration } from '../controllers/SprintController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllSprints);
router.post('/', createSprint);
router.put('/:id', updateSprint);
router.delete('/:id', deleteSprint);
router.post('/migrate', triggerSprintMigration);

export default router;
