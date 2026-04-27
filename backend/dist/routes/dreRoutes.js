import { Router } from 'express';
import { DreController } from '../controllers/DreController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';
const router = Router();
// Todas as rotas baseadas na clínica do usuário/impersonate
router.use(authMiddleware);
router.use(tenantMiddleware);
// Relatório Base
router.post('/report', DreController.getReport);
// Insight de Performance via IA
router.post('/ai-insights', DreController.getAiInsights);
// Exportar DRE para Executivo
router.post('/export-pdf', DreController.exportPdf);
export default router;
