import { Router } from 'express';
import { authMiddleware, tenantMiddleware } from '../middlewares/authMiddleware.js';
import { PGEService } from '../services/PGEService.js';
const router = Router();
router.use(authMiddleware, tenantMiddleware);
// PGE - Inteligência de Compras
router.get('/pge', async (req, res) => {
    try {
        const clinicId = req.clinicId;
        const data = await PGEService.calculatePGE(clinicId);
        res.json(data);
    }
    catch (error) {
        console.error('Erro PGE:', error);
        res.status(500).json({ error: 'Falha ao calcular inteligência de compras.' });
    }
});
export default router;
