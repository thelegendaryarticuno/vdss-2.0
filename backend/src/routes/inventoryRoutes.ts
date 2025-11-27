import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticate, inventoryController.getInventory);
router.get('/:productId', authenticate, inventoryController.getProductInventory);
router.post('/sync', authenticate, authorize(Role.ADMIN, Role.MANAGER), inventoryController.syncInventory);

export default router;
