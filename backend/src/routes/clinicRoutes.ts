import { Router } from 'express';
import { ClinicController } from '../controllers/ClinicController.js';
import { roleMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// As rotas de clínica são protegidas pelo Middleware em server.ts
// Mas o Controller precisa lidar com os dados específicos do tenant

router.get('/all', roleMiddleware(['ADMIN_GLOBAL']), ClinicController.listAll);
router.get('/me', ClinicController.getMe);
router.patch('/me', ClinicController.updateMe);

export default router;
