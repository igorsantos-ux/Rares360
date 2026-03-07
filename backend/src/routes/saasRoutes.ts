import { Router } from 'express';
import { SaaSController } from '../controllers/SaaSController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Apenas ADMIN_GLOBAL pode acessar essas rotas
router.use(authMiddleware, roleMiddleware(['ADMIN_GLOBAL']));

router.get('/clinics', SaaSController.listClinics);
router.post('/clinics', SaaSController.createClinic);
router.patch('/clinics/:id', SaaSController.updateClinic);

router.get('/users', SaaSController.listUsers);
router.post('/users', SaaSController.createUser);

router.get('/billing', SaaSController.getBillingSummary);
router.get('/billing/:clinicId/pdf', SaaSController.generateInvoicePDF);
router.get('/billing/:clinicId/xml', SaaSController.generateInvoiceXML);

export default router;
