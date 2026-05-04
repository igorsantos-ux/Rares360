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

// Middleware para desabilitar cache em rotas de dados dinâmicos (evita 304 sem corpo)
const noCache = (req: any, res: any, next: any) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};

router.get('/', noCache, controller.getDiagnosis);
router.get('/config', noCache, controller.getConfig);
router.put('/config', controller.updateConfig);
router.patch('/:procedureId/price', controller.updatePrice);
router.post('/procedure', controller.upsertProcedure);
router.post('/import', upload.single('file'), controller.importPrices);

export default router;
