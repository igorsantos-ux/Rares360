import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController.js';

import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Middlewares aplicados no server.ts
// router.use(authMiddleware, tenantMiddleware);

router.get('/insights', AnalyticsController.getInsights);

export default router;
