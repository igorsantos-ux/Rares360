import { Router } from 'express';
import { HistoryController } from '../controllers/HistoryController.js';

import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/summary', HistoryController.getYearlySummary);
router.get('/procedures', HistoryController.getDetailedProcedures);
router.get('/weekly', HistoryController.getWeeklyAnalysis);

export default router;
