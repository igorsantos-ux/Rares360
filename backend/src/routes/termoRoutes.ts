import { Router } from 'express';
import { TermoController } from '../controllers/TermoController.js';

const router = Router();

router.get('/', TermoController.listTermos);
router.post('/', TermoController.createTermo);
router.get('/paciente/:pacienteId', TermoController.listDocumentos);
router.post('/paciente/:pacienteId', TermoController.createDocumento);

export default router;
