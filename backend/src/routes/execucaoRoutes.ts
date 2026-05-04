import { Router } from 'express';
import { ExecucaoController } from '../controllers/ExecucaoController.js';

const router = Router();

router.get('/', ExecucaoController.list);
router.post('/executar', ExecucaoController.executar);

export default router;
