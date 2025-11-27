import { Router } from 'express';
import * as productController from '../controllers/productController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticate, productController.getProducts);
router.get('/:id', authenticate, productController.getProductById);
router.post('/', authenticate, authorize(Role.ADMIN, Role.MANAGER), productController.createProduct);
router.put('/:id', authenticate, authorize(Role.ADMIN, Role.MANAGER), productController.updateProduct);
router.delete('/:id', authenticate, authorize(Role.ADMIN, Role.MANAGER), productController.deleteProduct);

export default router;
