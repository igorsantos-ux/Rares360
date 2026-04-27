import { Router } from 'express';
import { ProcedureController } from '../controllers/ProcedureController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';
const router = Router();
router.use(authMiddleware, tenantMiddleware);
// Catálogo de Procedimentos (CRUD e Precificação)
router.get('/', ProcedureController.list);
router.post('/', ProcedureController.create);
router.get('/:id', ProcedureController.getById);
router.put('/:id', ProcedureController.update);
router.delete('/:id', ProcedureController.delete);
// Execução Clínica (Legado)
router.get('/pending', ProcedureController.listPending);
router.get('/patient/:patientId', ProcedureController.getByPatient);
router.post('/:id/execute', ProcedureController.execute);
export default router;
