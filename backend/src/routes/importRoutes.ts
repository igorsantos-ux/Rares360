import { Router } from 'express';
import multer from 'multer';
import { ImportController } from '../controllers/ImportController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Rota de diagnóstico (pública temporariamente para debug)
router.get('/diagnostics/db', ImportController.diagnoseDB);

router.use(authMiddleware, tenantMiddleware);

// Rota de importação de transações (Excel)
router.post('/transactions', upload.single('file'), ImportController.importTransactions);

// Nova rota de importação financeira unificada (Billing, Pricing, Equipment)
router.post('/finance', upload.single('file'), ImportController.importFinancialData);

export default router;
