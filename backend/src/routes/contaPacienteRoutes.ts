import { Router } from 'express';
import { ContaPacienteController } from '../controllers/ContaPacienteController.js';

const router = Router();

router.get('/kpis',                       ContaPacienteController.kpis);
router.get('/',                           ContaPacienteController.list);
router.get('/:id',                        ContaPacienteController.getById);
router.post('/:contaId/parcelas/:parcelaId/pagar', ContaPacienteController.pagarParcela);

export default router;
