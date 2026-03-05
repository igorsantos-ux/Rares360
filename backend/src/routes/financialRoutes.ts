import { Router } from 'express';
import { FinancialController } from '../controllers/FinancialController.js';

const router = Router();

router.get('/summary', FinancialController.getSummary);
router.get('/break-even', FinancialController.getBreakEven);
router.get('/evolution', FinancialController.getEvolution);
router.post('/transactions', FinancialController.createTransaction);

export default router;
