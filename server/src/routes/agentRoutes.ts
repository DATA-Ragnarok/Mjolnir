import { Router } from 'express';
import { AgentController } from '../controllers/AgentController.js';
import { agentAuthMiddleware } from '../middleware/agentAuth.js';

const router = Router();

// Apply agent authentication middleware to all agent endpoints
router.use(agentAuthMiddleware);

// User Story (Task) operations
router.get('/us', AgentController.listUserStories);
router.get('/us/:id', AgentController.getUserStory);
router.post('/us', AgentController.createUserStory);
router.patch('/us/:id/status', AgentController.updateUserStoryStatus);

// Explicitly disallow destructive or unauthorized modifications for agents
router.put('/us/:id', AgentController.methodNotAllowed);
router.delete('/us/:id', AgentController.methodNotAllowed);
router.delete('/us', AgentController.methodNotAllowed);
router.patch('/us/:id', (req, res) => {
  // If not accessing /status specifically, redirect to methodNotAllowed
  return AgentController.methodNotAllowed(req, res);
});

// Read-only discovery endpoints
router.get('/epic', AgentController.listEpics);
router.get('/feature', AgentController.listFeatures);
router.get('/sprints', AgentController.listSprints);
router.get('/users', AgentController.listUsers);
router.get('/me', AgentController.getCurrentUser);

export default router;
