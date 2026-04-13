import { Router } from 'express';
import multer from 'multer';
import { ImportController } from '../controllers/ImportController.js';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Rota de diagnóstico (pública temporariamente para debug)
router.get('/diagnostics/db', ImportController.diagnoseDB);

router.use(authMiddleware, tenantMiddleware);

// Novas rotas de gestão de lotes
router.get('/', ImportController.listImportBatches);
router.delete('/:batchId', ImportController.deleteImportBatch);

// Rota de importação de pacientes
router.post('/patients', upload.single('file'), ImportController.bulkImportPatients);

// Rota de importação de transações (Excel)
router.post('/transactions', upload.single('file'), ImportController.importTransactions);

// Nova rota de importação financeira unificada (Billing, Pricing, Equipment)
router.post('/finance', upload.single('file'), ImportController.importFinancialData);

// Nova rota de importação de Contas a Pagar
router.post('/payables', upload.single('file'), ImportController.importPayables);

export default router;
