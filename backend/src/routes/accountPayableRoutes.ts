import { Router } from 'express';
import { AccountPayableController } from '../controllers/AccountPayableController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas de contas a pagar são protegidas
router.use(authMiddleware);
router.use(tenantMiddleware);

// Rota de listagem de contas a pagar
router.get('/', AccountPayableController.list);

// Rota para cadastrar uma nova conta a pagar (à vista ou com parcelas múltiplas)
router.post('/', AccountPayableController.create);

// Rota para atualizar o status de uma parcela
router.patch('/:id/status', AccountPayableController.updateStatus);

// Rota para excluir uma parcela
router.delete('/:id', AccountPayableController.delete);

// Rota para excluir uma série completa (conta pai + todas as parcelas)
router.delete('/series/:id', AccountPayableController.deleteSeries);

export default router;
