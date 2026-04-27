import { Router } from 'express';
import { CashController } from '../controllers/CashController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Middlewares aplicados no server.ts
// router.use(authMiddleware, tenantMiddleware);

router.get('/status', CashController.checkStatus);
router.post('/close', CashController.closeDay);

export default router;
