import { Router } from 'express';
import { CoreController } from '../controllers/CoreController.js';

import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/productivity', CoreController.getProductivity);
router.post('/doctors', CoreController.createDoctor);
router.get('/stock', CoreController.getStock);
router.post('/stock', CoreController.createStock);

export default router;
