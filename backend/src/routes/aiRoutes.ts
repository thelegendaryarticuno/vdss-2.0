import { Router } from 'express';
import * as aiController from '../controllers/aiController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/sales-forecast', authenticate, aiController.getSalesForecast);
router.get('/recommendations', authenticate, aiController.getProductRecommendations);

export default router;
