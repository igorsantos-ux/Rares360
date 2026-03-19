import { Router } from 'express';
import { ProcedureController } from '../controllers/ProcedureController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';
const router = Router();
router.use(authMiddleware, tenantMiddleware);
router.get('/pending', ProcedureController.listPending);
router.get('/patient/:patientId', ProcedureController.getByPatient);
router.post('/:id/execute', ProcedureController.execute);
export default router;
