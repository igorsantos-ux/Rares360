import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', authMiddleware, AuthController.me);

export default router;
