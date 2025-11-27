import { Router } from 'express';
import * as quoteController from '../controllers/quoteController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, quoteController.getQuotes);
router.get('/:id', authenticate, quoteController.getQuoteById);
router.post('/', authenticate, quoteController.createQuote);
router.put('/:id', authenticate, quoteController.updateQuote);
router.post('/:id/send', authenticate, quoteController.sendQuote);
router.post('/:id/accept', authenticate, quoteController.acceptQuote);

export default router;
