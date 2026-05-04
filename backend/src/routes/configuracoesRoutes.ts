import { Router } from 'express';
import { ConfiguracoesController } from '../controllers/ConfiguracoesController.js';
import { tenantMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas precisam de tenant
router.use(tenantMiddleware);

// Globais (Equiparação e Custos)
router.get('/globais', ConfiguracoesController.getGlobais);
router.put('/globais', ConfiguracoesController.updateGlobais);

// Impostos Emissão
router.get('/impostos-emissao', ConfiguracoesController.getImpostosEmissao);
router.post('/impostos-emissao', ConfiguracoesController.saveImpostosEmissao);

// Regras Repasse Médico
router.get('/regras-repasse', ConfiguracoesController.getRegrasRepasse);
router.post('/regras-repasse', ConfiguracoesController.createRegraRepasse);
router.delete('/regras-repasse/:id', ConfiguracoesController.deleteRegraRepasse);

// Regras Comissão Equipe
router.get('/regras-comissao', ConfiguracoesController.getRegrasComissao);
router.post('/regras-comissao', ConfiguracoesController.createRegraComissao);
router.delete('/regras-comissao/:id', ConfiguracoesController.deleteRegraComissao);

export default router;
