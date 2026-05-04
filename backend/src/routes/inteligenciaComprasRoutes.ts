import { Router } from 'express';
import { InteligenciaComprasController } from '../controllers/InteligenciaComprasController.js';
import { cacheResponse } from '../middlewares/cacheMiddleware.js';

const router = Router();

// TTL de 2 minutos = 120 segundos
router.get('/prioridade', cacheResponse({ ttl: 120 }), InteligenciaComprasController.getPrioridade);
router.post('/exportar', InteligenciaComprasController.exportar);

export default router;
