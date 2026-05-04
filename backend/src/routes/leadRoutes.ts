import { Router } from 'express';
import { LeadController } from '../controllers/LeadController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// ═══ Rota pública — formulário de captação do site ═══
// Rate limiting é feito internamente via Redis (3/hora/IP)
// para retornar 200 silencioso ao invés de 429 (não expor ao spammer)
router.post('/', LeadController.createLead);

// ═══ Rotas protegidas — ADMIN_GLOBAL ═══
router.get('/', authMiddleware, roleMiddleware(['ADMIN_GLOBAL']), LeadController.listLeads);
router.patch('/:id/status', authMiddleware, roleMiddleware(['ADMIN_GLOBAL']), LeadController.updateStatus);
router.patch('/:id/notes', authMiddleware, roleMiddleware(['ADMIN_GLOBAL']), LeadController.updateNotes);
router.patch('/:id', authMiddleware, roleMiddleware(['ADMIN_GLOBAL']), LeadController.updateLead);

export default router;
