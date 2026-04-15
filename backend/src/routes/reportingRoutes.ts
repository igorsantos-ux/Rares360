import { Router } from 'express';
import { ReportingController } from '../controllers/ReportingController.js';

import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/dashboard-kpis', ReportingController.getDashboardKPIs);
router.get('/dashboard', ReportingController.getDashboardData);
router.get('/cash-flow', ReportingController.getCashFlow);
router.get('/dre', ReportingController.getDRE);
router.get('/billing-analytics', ReportingController.getBillingAnalytics);
router.get('/drill-down', ReportingController.getDrillDown);
router.get('/goals', ReportingController.getGoals);
router.post('/smart-goal', ReportingController.postSmartGoal);

export default router;
