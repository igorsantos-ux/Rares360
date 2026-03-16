import { Router } from 'express';
import { ClinicDocumentController } from '../controllers/ClinicDocumentController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas de documentos exigem autenticação e vínculo de clínica
router.use(authMiddleware, tenantMiddleware);

router.get('/', ClinicDocumentController.list);
router.patch('/:id', ClinicDocumentController.update);
router.delete('/:id', ClinicDocumentController.delete);

export default router;
