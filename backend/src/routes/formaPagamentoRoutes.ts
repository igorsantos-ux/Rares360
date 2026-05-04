import { Router } from 'express';
import { FormaPagamentoController } from '../controllers/FormaPagamentoController.js';

const router = Router();

router.get('/',           FormaPagamentoController.list);
router.post('/',          FormaPagamentoController.create);
router.put('/:id',        FormaPagamentoController.update);
router.delete('/:id',     FormaPagamentoController.delete);
router.post('/calcular',  FormaPagamentoController.calcular);

export default router;
