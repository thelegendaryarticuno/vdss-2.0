import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, orderController.getOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.post('/', authenticate, orderController.createOrder);
router.put('/:id/status', authenticate, orderController.updateOrderStatus);

export default router;
