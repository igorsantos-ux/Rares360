import { Router } from 'express';
import { PricingController } from '../controllers/PricingController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireClinicContext } from '../middlewares/requireClinicContext.js';
import multer from 'multer';

const router = Router();
const controller = new PricingController();
const upload = multer({ storage: multer.memoryStorage() });

// Todas as rotas de precificação exigem autenticação e contexto de clínica
router.use(authMiddleware);
router.use(requireClinicContext);

router.get('/', controller.getDiagnosis);
router.get('/config', controller.getConfig);
router.put('/config', controller.updateConfig);
router.patch('/:procedureId/price', controller.updatePrice);
router.post('/import', upload.single('file'), controller.importPrices);

export default router;
