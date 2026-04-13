import { Router } from 'express';
import multer from 'multer';
import { CoreController } from '../controllers/CoreController.js';
import { PatientController } from '../controllers/PatientController.js';
import { ImportController } from '../controllers/ImportController.js';

import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware, tenantMiddleware);

router.get('/productivity', CoreController.getProductivity);
router.get('/doctors', CoreController.listDoctors);
router.post('/doctors', CoreController.createDoctor);
router.patch('/doctors/:id', CoreController.updateDoctor);
router.delete('/doctors/:id', CoreController.deleteDoctor);
router.get('/stock', CoreController.getStock);
router.post('/stock', CoreController.createStock);
router.post('/stock/movement', CoreController.registerMovement);
router.get('/stock/history', CoreController.getStockHistory);

// Pacientes
router.get('/patients', PatientController.list);
router.get('/patients/:id', PatientController.getById);
router.get('/patients/:id/dashboard', PatientController.getDashboard);
router.get('/patients/:id/history', PatientController.getHistory);
router.post('/patients', PatientController.create);
router.patch('/patients/:id', PatientController.update);
router.delete('/patients/:id', PatientController.delete);
router.post('/patients/bulk-import', upload.single('file'), ImportController.bulkImportPatients);

export default router;
