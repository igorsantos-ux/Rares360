import { Router } from 'express';
import { GoalController } from '../controllers/GoalController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Middlewares aplicados no server.ts
// router.use(authMiddleware, tenantMiddleware);

router.get('/summary', GoalController.getSummary);
router.get('/list/:monthYear', GoalController.getMonthlyList);
router.post('/save', GoalController.saveGoal);
router.delete('/:id', GoalController.deleteGoal);

export default router;
