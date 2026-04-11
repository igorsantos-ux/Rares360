import { Router } from 'express';
import { GoalController } from '../controllers/GoalController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/summary', GoalController.getSummary);
router.post('/update', GoalController.updateGoal);

export default router;
