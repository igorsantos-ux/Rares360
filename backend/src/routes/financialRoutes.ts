import { Router } from 'express';
import { FinancialController } from '../controllers/FinancialController.js';

import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/summary', FinancialController.getSummary);
router.get('/break-even', FinancialController.getBreakEven);
router.get('/evolution', FinancialController.getEvolution);
router.get('/transactions', FinancialController.getTransactions);
router.post('/transactions', FinancialController.createTransaction);

export default router;
