import { Router } from 'express';
import { PricingController } from '../controllers/PricingController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/', PricingController.create);
router.get('/', PricingController.list);

router.get('/diagnosis', PricingController.diagnosis);
router.post('/simular-integrado', PricingController.simularIntegrado);
router.post('/procedure', PricingController.upsertProcedure);
router.delete('/procedure/:id', PricingController.deleteProcedure);

export default router;
