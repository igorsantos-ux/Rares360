import { Router } from 'express';
import { OrcamentoController } from '../controllers/OrcamentoController.js';

const router = Router();

router.get('/kpis',          OrcamentoController.kpis);
router.get('/',              OrcamentoController.list);
router.get('/:id',           OrcamentoController.getById);
router.post('/',             OrcamentoController.create);
router.put('/:id',           OrcamentoController.update);
router.post('/:id/enviar',   OrcamentoController.enviar);
router.post('/:id/aprovar',  OrcamentoController.aprovar);
router.post('/:id/rejeitar', OrcamentoController.rejeitar);

export default router;
