import { Router } from 'express';
import { IntegrationController } from '../controllers/IntegrationController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';
const router = Router();
router.use(authMiddleware);
router.use(tenantMiddleware);
router.get('/', IntegrationController.list);
router.post('/sync', IntegrationController.sync);
export default router;
