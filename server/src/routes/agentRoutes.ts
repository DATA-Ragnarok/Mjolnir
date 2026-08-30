import { Router } from 'express';
import {
  listEpics,
  listUserStories,
  createUserStory,
  updateUserStoryStatus,
  listFeatures,
  listSprints,
  listUsers,
  getCurrentUser,
} from '../controllers/AgentController.js';
import { agentAuthMiddleware, requireScope } from '../middleware/agentAuth.js';

const router = Router();

// All agent routes require API key authentication
router.use(agentAuthMiddleware);

// Epics endpoint
router.get('/epic', requireScope('read:epics'), listEpics);

// Features endpoint
router.get('/feature', requireScope('read:features'), listFeatures);

// Sprints endpoint
router.get('/sprint', requireScope('read:tasks'), listSprints);
router.get('/sprints', requireScope('read:tasks'), listSprints);

// Users endpoint
router.get('/user', requireScope('read:tasks'), listUsers);
router.get('/users', requireScope('read:tasks'), listUsers);

// Current User (whoami) endpoint
router.get('/me', requireScope('read:tasks'), getCurrentUser);

// User Stories endpoints
router.get('/us', requireScope('read:tasks'), listUserStories);
router.post('/us', requireScope('write:tasks'), createUserStory);
router.patch('/us/:id/status', requireScope('write:tasks'), updateUserStoryStatus);
router.put('/us/:id/status', requireScope('write:tasks'), updateUserStoryStatus);

export default router;
