import { Router } from 'express';
import { TaskController } from '../controllers/TaskController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/daily', TaskController.getDailyTasks);
router.get('/summary', TaskController.getSummary);
router.patch('/:id/complete', TaskController.completeTask);

export default router;
