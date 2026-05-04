import { Router } from 'express';
import multer from 'multer';
import { CoreController } from '../controllers/CoreController.js';
import { PatientController } from '../controllers/PatientController.js';
import { ImportController } from '../controllers/ImportController.js';

import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';
import { validateOwnership } from '../middlewares/validateOwnership.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Middlewares aplicados no server.ts
// router.use(authMiddleware, tenantMiddleware);

router.get('/productivity', CoreController.getProductivity);
router.get('/doctors', CoreController.listDoctors);
router.post('/doctors', CoreController.createDoctor);
router.patch('/doctors/:id', validateOwnership('professional'), CoreController.updateDoctor);
router.delete('/doctors/:id', validateOwnership('professional'), CoreController.deleteDoctor);
router.get('/stock', CoreController.getStock);
router.post('/stock', CoreController.createStock);
router.post('/stock/movement', CoreController.registerMovement);
router.get('/stock/history', CoreController.getStockHistory);

// Pacientes
router.get('/patients', PatientController.list);
router.get('/patients/:id', validateOwnership('patient'), PatientController.getById);
router.get('/patients/:id/dashboard', validateOwnership('patient'), PatientController.getDashboard);
router.get('/patients/:id/history', validateOwnership('patient'), PatientController.getHistory);
router.post('/patients', PatientController.create);
router.patch('/patients/:id', validateOwnership('patient'), PatientController.update);
router.delete('/patients/:id', validateOwnership('patient'), PatientController.delete);
router.post('/patients/bulk-import', upload.single('file'), ImportController.bulkImportPatients);

export default router;
