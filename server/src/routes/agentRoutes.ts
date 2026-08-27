import { Router } from 'express';
import {
  listEpics,
  listUserStories,
  createUserStory,
  updateUserStoryStatus,
  listFeatures,
} from '../controllers/AgentController.js';
import { agentAuthMiddleware, requireScope } from '../middleware/agentAuth.js';

const router = Router();

// All agent routes require API key authentication
router.use(agentAuthMiddleware);

// Epics endpoint
router.get('/epic', requireScope('read:epics'), listEpics);

// Features endpoint
router.get('/feature', requireScope('read:features'), listFeatures);

// User Stories endpoints
router.get('/us', requireScope('read:tasks'), listUserStories);
router.post('/us', requireScope('write:tasks'), createUserStory);
router.patch('/us/:id/status', requireScope('write:tasks'), updateUserStoryStatus);
router.put('/us/:id/status', requireScope('write:tasks'), updateUserStoryStatus);

export default router;
