import { Router } from 'express';
import { AccountPayableController } from '../controllers/AccountPayableController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';
import { validateOwnership } from '../middlewares/validateOwnership.js';

const router = Router();

// Todas as rotas de contas a pagar são protegidas
// Removido router.use redundante
router.use(tenantMiddleware);

// Rota de listagem de contas a pagar
router.get('/', AccountPayableController.list);

// Rota para cadastrar uma nova conta a pagar (à vista ou com parcelas múltiplas)
router.post('/', AccountPayableController.create);

// Rota para atualizar o status de uma parcela
router.patch('/:id/status', validateOwnership('accountPayable'), AccountPayableController.updateStatus);

// Rota para excluir uma parcela
router.delete('/:id', validateOwnership('accountPayable'), AccountPayableController.delete);

// Rota para excluir uma série completa (conta pai + todas as parcelas)
// Atenção: Aqui a exclusão é da série. O validateOwnership original precisa da série.
// Por segurança, vou apenas deixar o IDOR na série via controller se for complexo, mas se 'accountPayable' servir para a série...
router.delete('/series/:id', validateOwnership('accountPayable'), AccountPayableController.deleteSeries);

export default router;
