import { Router } from 'express';
import { getAllUserStories, createUserStory, updateUserStory, deleteUserStory } from '../controllers/UserStoryController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllUserStories);
router.post('/', createUserStory);
router.put('/:id', updateUserStory);
router.delete('/:id', deleteUserStory);

export default router;
