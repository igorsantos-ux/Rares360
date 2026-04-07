import { Router } from 'express';
import { ClinicalEvolutionController } from '../controllers/ClinicalEvolutionController.js';
import { PrescriptionController } from '../controllers/PrescriptionController.js';
import { InventoryUsageController } from '../controllers/InventoryUsageController.js';
import { ProposalController } from '../controllers/ProposalController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';
const router = Router();
router.use(authMiddleware, tenantMiddleware);
// Evoluções Clínicas
router.get('/evolutions', ClinicalEvolutionController.list);
router.post('/evolutions', ClinicalEvolutionController.create);
router.patch('/evolutions/:id', ClinicalEvolutionController.update);
router.post('/evolutions/:id/lock', ClinicalEvolutionController.lock);
// Prescrições
router.get('/prescriptions', PrescriptionController.list);
router.post('/prescriptions', PrescriptionController.create);
router.patch('/prescriptions/:id/print', PrescriptionController.updatePrinted);
// Uso de Insumos (Baixa automática)
router.get('/inventory-usage', InventoryUsageController.listByPatient);
router.post('/inventory-usage', InventoryUsageController.registerUsage);
// Propostas e Orçamentos
router.get('/proposals', ProposalController.list);
router.post('/proposals', ProposalController.create);
router.patch('/proposals/:id/status', ProposalController.updateStatus);
export default router;
