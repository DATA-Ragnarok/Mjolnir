import { Router } from 'express';
import {
  listUserStories,
  getUserStory,
  createUserStory,
  updateUserStoryStatus,
  methodNotAllowed,
  listEpics,
  listFeatures,
  listSprints,
  listUsers,
  getCurrentUser
} from '../controllers/AgentController.js';
import { agentAuthMiddleware } from '../middleware/agentAuth.js';

const router = Router();

router.use(agentAuthMiddleware);

router.get('/us', listUserStories);
router.get('/us/:id', getUserStory);
router.post('/us', createUserStory);
router.patch('/us/:id/status', updateUserStoryStatus);

router.put('/us/:id', methodNotAllowed);
router.delete('/us/:id', methodNotAllowed);
router.delete('/us', methodNotAllowed);
router.patch('/us/:id', methodNotAllowed);

router.get('/epic', listEpics);
router.get('/feature', listFeatures);
router.get('/sprints', listSprints);
router.get('/users', listUsers);
router.get('/me', getCurrentUser);

export default router;
