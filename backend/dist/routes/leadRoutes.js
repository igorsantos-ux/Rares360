import { Router } from 'express';
import { LeadController } from '../controllers/LeadController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';
const router = Router();
// Rota pública para criação de lead (formulário de contato)
router.post('/', LeadController.createLead);
// Rotas protegidas para ADMIN_GLOBAL
router.get('/', authMiddleware, roleMiddleware(['ADMIN_GLOBAL']), LeadController.listLeads);
router.patch('/:id/status', authMiddleware, roleMiddleware(['ADMIN_GLOBAL']), LeadController.updateStatus);
router.patch('/:id/notes', authMiddleware, roleMiddleware(['ADMIN_GLOBAL']), LeadController.updateNotes);
export default router;
