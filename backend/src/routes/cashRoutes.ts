import { Router } from 'express';
import { CashController } from '../controllers/CashController.js';

const router = Router();

router.get('/status', CashController.checkStatus);
router.post('/close', CashController.closeDay);

export default router;
