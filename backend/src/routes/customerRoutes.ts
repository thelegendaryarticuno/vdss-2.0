import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticate, customerController.getCustomers);
router.get('/:id', authenticate, customerController.getCustomerById);
router.post('/', authenticate, authorize(Role.ADMIN, Role.MANAGER), customerController.createCustomer);
router.put('/:id', authenticate, authorize(Role.ADMIN, Role.MANAGER), customerController.updateCustomer);
router.delete('/:id', authenticate, authorize(Role.ADMIN, Role.MANAGER), customerController.deleteCustomer);

export default router;
