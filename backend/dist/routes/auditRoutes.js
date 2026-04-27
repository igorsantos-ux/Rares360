import { Router } from 'express';
import { AuditController } from '../controllers/AuditController.js';
const router = Router();
router.post('/sensitive', AuditController.logSensitiveView);
export default router;
