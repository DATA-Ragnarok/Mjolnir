import { Router } from 'express';
import { getAllFeatures, createFeature, updateFeature, deleteFeature } from '../controllers/FeatureController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllFeatures);
router.post('/', createFeature);
router.put('/:id', updateFeature);
router.delete('/:id', deleteFeature);

export default router;
