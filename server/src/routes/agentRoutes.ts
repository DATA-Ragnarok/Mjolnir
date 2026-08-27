import { Router } from 'express';
import {
  listUserStories,
  createUserStory,
  listFeatures,
} from '../controllers/AgentController.js';
import { agentAuthMiddleware, requireScope } from '../middleware/agentAuth.js';

const router = Router();

// All agent routes require API key authentication
router.use(agentAuthMiddleware);

// User Stories endpoints
router.get('/us', requireScope('read:tasks'), listUserStories);
router.post('/us', requireScope('write:tasks'), createUserStory);

// Features endpoint
router.get('/feature', requireScope('read:features'), listFeatures);

export default router;
