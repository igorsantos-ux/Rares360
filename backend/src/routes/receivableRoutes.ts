import { Router } from 'express';
import { ReceivableController } from '../controllers/ReceivableController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';
import { validateOwnership } from '../middlewares/validateOwnership.js';

const router = Router();

// Todas as rotas de recebíveis são protegidas
router.use(authMiddleware);
router.use(tenantMiddleware);

// Rota de listagem de recebíveis (Pendenciais)
router.get('/', ReceivableController.list);

// Rota para cadastrar um novo recebimento
router.post('/', ReceivableController.create);

// Rota para atualizar o status (Baixa rápida)
router.patch('/:id/status', validateOwnership('receivable'), ReceivableController.updateStatus);

// Rota para excluir um recebimento
router.delete('/:id', validateOwnership('receivable'), ReceivableController.delete);

export default router;
