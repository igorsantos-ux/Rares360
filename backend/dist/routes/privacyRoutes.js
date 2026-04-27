/**
 * Rotas de Privacidade LGPD — Direitos dos Titulares
 */
import { Router } from 'express';
import { PrivacyController } from '../controllers/PrivacyController.js';
const router = Router();
// Art. 18, II — Direito de acesso
router.get('/my-data', PrivacyController.getMyData);
// Art. 18, VI — Direito à eliminação (anonimização)
router.delete('/my-data', PrivacyController.anonymizeMyData);
// Art. 18, III — Direito à correção
router.post('/data-correction', PrivacyController.requestCorrection);
// Art. 18, V — Direito à portabilidade
router.get('/data-portability', PrivacyController.exportPortableData);
// Consentimento
router.get('/consent-status', PrivacyController.getConsentStatus);
router.post('/consent', PrivacyController.registerConsent);
// Art. 48 — Registro de incidentes (apenas ADMIN_GLOBAL)
router.post('/incident', PrivacyController.reportIncident);
export default router;
