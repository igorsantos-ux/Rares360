import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { loginLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.post('/login', loginLimiter, AuthController.login);
router.get('/me', authMiddleware, AuthController.me);
router.patch('/onboarding', authMiddleware, AuthController.completeOnboarding);

// Nova rota de segurança RARES
router.post('/update-password', authMiddleware, AuthController.updatePassword);

// Encerramento de sessão
router.post('/logout', authMiddleware, AuthController.logout);

export default router;
