import { Router } from 'express';
import { SaaSController, upload } from '../controllers/SaaSController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Apenas ADMIN_GLOBAL pode acessar essas rotas
router.use(authMiddleware, roleMiddleware(['ADMIN_GLOBAL']));

router.get('/clinics', SaaSController.listClinics);
router.post('/clinics/upload-logo', upload.single('file'), SaaSController.uploadLogo);
router.post('/clinics', SaaSController.createClinic);
router.patch('/clinics/:id', SaaSController.updateClinic);
router.delete('/clinics/:id', SaaSController.deleteClinic);
router.post('/impersonate/:clinicId', SaaSController.impersonateClinic);

router.get('/users', SaaSController.listUsers);
router.post('/users', SaaSController.createUser);
router.patch('/users/:id', SaaSController.updateUser);
router.delete('/users/:id', SaaSController.deleteUser);

router.get('/billing', SaaSController.getBillingSummary);
router.post('/billing/generate', SaaSController.generateMonthlyInvoices);
router.get('/billing/:clinicId/invoices', SaaSController.getClinicInvoices);
router.get('/billing/:clinicId/pdf', SaaSController.generateInvoicePDF);
router.get('/billing/:clinicId/xml', SaaSController.generateInvoiceXML);

export default router;
