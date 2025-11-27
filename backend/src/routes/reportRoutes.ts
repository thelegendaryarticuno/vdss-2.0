import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/sales/summary', authenticate, reportController.getSalesSummary);
router.get('/sales/customer/:customerId', authenticate, reportController.getCustomerSalesHistory);

export default router;
