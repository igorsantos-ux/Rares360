import { Router } from 'express';
import { TreatmentPlanController } from '../controllers/TreatmentPlanController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas requerem autenticação e contexto de clínica
router.use(authMiddleware);
router.use(tenantMiddleware);

// Listar planos de um paciente
router.get('/', TreatmentPlanController.list);

// Criar novo orçamento
router.post('/', TreatmentPlanController.create);

// Aprovar orçamento (gera financeiro)
router.post('/:id/approve', TreatmentPlanController.approve);

// Marcar item como executado (baixa estoque)
router.post('/items/:itemId/execute', TreatmentPlanController.executeItem);

// Gerar PDF do orçamento
router.get('/:id/pdf', TreatmentPlanController.generatePDF);

// Receber pagamento de parcela
router.post('/receivables/:id/receive', TreatmentPlanController.receivePayment);

export default router;
